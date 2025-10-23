// src/routes/auth/kakao.js
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { signState, verifyState, signJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const KAUTH = 'https://kauth.kakao.com'
const KAPI  = 'https://kapi.kakao.com'

const app = new Hono()

/**
 * 콜백 URL은 '항상' 동일한 기준으로 생성 (로컬/배포 오동작 방지)
 * - 1순위: AUTH_ORIGIN (env)
 * - 2순위: http://127.0.0.1:8787 (로컬 기본값)
 */
const getAuthOrigin = (c) => c.env.AUTH_ORIGIN || 'http://127.0.0.1:8787'
const pickKakaoCallback = (c) =>
  (c.env.KAKAO_REDIRECT_URI && /\/auth\/kakao\/callback$/.test(c.env.KAKAO_REDIRECT_URI))
    ? c.env.KAKAO_REDIRECT_URI
    : `${getAuthOrigin(c)}/auth/kakao/callback`

/**
 * 시작: Kakao authorize로 리다이렉트
 * GET /auth/kakao?redirect=<후속 이동 URL>
 */
app.get('/', async (c) => {
  const redirect = c.req.query('redirect') || '/'
  const state = await signState({ redirect }, c.env)

  const callbackUrl = pickKakaoCallback(c)
  console.log('[Kakao Auth] Using redirect_uri:', callbackUrl)

  const authUrl = new URL('/oauth/authorize', KAUTH)
  authUrl.searchParams.set('client_id', c.env.KAKAO_CLIENT_ID) // REST API 키
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('response_type', 'code')
  // 필요 동의항목: 이메일/프로필
  authUrl.searchParams.set('scope', 'profile_nickname profile_image account_email')
  authUrl.searchParams.set('state', state)

  return c.redirect(authUrl.toString(), 302)
})

/**
 * 콜백: Kakao → 우리 서버
 * GET /auth/kakao/callback?code=...&state=...
 */
app.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const stateToken = url.searchParams.get('state')
  if (!code || !stateToken) {
    return c.text('Bad Request: missing code/state', 400)
  }

  // state 검증
  let state
  try {
    state = await verifyState(stateToken, c.env) // { redirect }
    console.log('[Kakao Callback] State verified:', state)
  } catch (err) {
    console.error('[Kakao Callback] State verification failed:', err.message)
    return c.text('Unauthorized: bad state', 401)
  }

  // 토큰 교환
  const callbackUrl = pickKakaoCallback(c)
  console.log('[Kakao Callback] Using redirect_uri:', callbackUrl)
  console.log('[Kakao Callback] Received code:', code.substring(0, 20) + '...')

  const form = new URLSearchParams()
  form.set('grant_type', 'authorization_code')
  form.set('client_id', c.env.KAKAO_CLIENT_ID) // REST API 키
  if (c.env.KAKAO_CLIENT_SECRET) {
    // 카카오 앱에서 Client Secret 사용 설정했다면 필수
    form.set('client_secret', c.env.KAKAO_CLIENT_SECRET)
  }
  form.set('redirect_uri', callbackUrl) // authorize 때와 '완전히 동일'
  form.set('code', code)

  const tRes = await fetch(`${KAUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form
  })
  const tokBody = await tRes.text()
  if (!tRes.ok) {
    // KOE320 등 상세 반환
    console.error('[Kakao Token] Error:', tRes.status, tokBody)
    return c.text(`Kakao token error: ${tRes.status} ${tokBody}`, 502)
  }

  let tokJson
  try {
    tokJson = JSON.parse(tokBody)
  } catch {
    return c.text('Kakao token parse error', 502)
  }
  const { access_token } = tokJson || {}
  if (!access_token) {
    console.error('[Kakao Token] Missing access_token:', tokJson)
    return c.text('Kakao token error: no access_token', 502)
  }

  // 사용자 정보 조회
  console.log('[Kakao Callback] Fetching user info...')
  const meRes = await fetch(`${KAPI}/v2/user/me`, {
    headers: { Authorization: `Bearer ${access_token}` }
  })
  const meBody = await meRes.text()
  if (!meRes.ok) {
    console.error('[Kakao Me] Error:', meRes.status, meBody)
    return c.text(`Kakao me error: ${meRes.status} ${meBody}`, 502)
  }

  let me
  try {
    me = JSON.parse(meBody)
  } catch (err) {
    console.error('[Kakao Me] Parse error:', err.message)
    return c.text('Kakao me parse error', 502)
  }

  const kakaoId = String(me.id)
  const nickname =
    me.kakao_account?.profile?.nickname?.trim() ||
    me.properties?.nickname?.trim() ||
    'Runner'
  const email = me.kakao_account?.email || null
  const photo_url =
    me.kakao_account?.profile?.profile_image_url ||
    me.properties?.profile_image ||
    null

  console.log('[Kakao Callback] User info:', { kakaoId, nickname, email: email ?? undefined })

  // DB upsert
  console.log('[Kakao Callback] Upserting to DB...')
  const supa = getSupabase(c)
  
  // users 테이블 upsert (provider + provider_sub 기준)
  const row = {
    provider: 'kakao',
    provider_sub: kakaoId,
    nickname,
    email,
    photo_url,
    last_login_at: new Date().toISOString(),
  }
  
  // 기존 사용자 확인
  const { data: existing } = await supa
    .from('users')
    .select('id')
    .eq('provider', 'kakao')
    .eq('provider_sub', kakaoId)
    .maybeSingle()

  let user
  if (existing) {
    // 기존 사용자 업데이트
    const { data: updated, error } = await supa
      .from('users')
      .update({
        nickname,
        email,
        photo_url,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single()
    
    if (error) {
      console.error('[Kakao Callback] Update error:', error)
      return c.text('DB error: ' + error.message, 500)
    }
    user = updated
  } else {
    // 새 사용자 생성
    const { data: created, error } = await supa
      .from('users')
      .insert(row)
      .select('id')
      .single()
    
    if (error) {
      console.error('[Kakao Callback] Insert error:', error)
      return c.text('DB error: ' + error.message, 500)
    }
    user = created
  }

  console.log('[Kakao Callback] DB upsert success, user ID:', user.id)

  // 세션 쿠키 설정 (로컬/배포 분기)
  const jwt = await signJWT({ sub: user.id, nickname }, c.env, 60 * 60 * 24 * 30) // 30일 (UUID는 이미 문자열)
  const host = new URL(c.req.url).hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  setCookie(c, 'rc_session', jwt, {
    path: '/',
    httpOnly: true,
    sameSite: isLocal ? 'Lax' : 'None', // Cross-site에선 None 필요
    secure: isLocal ? false : true,     // 로컬 HTTP에서는 Secure=false 이어야 저장됨
    maxAge: 60 * 60 * 24 * 30,
  })
  console.log('[Kakao Callback] Cookie set with SameSite:', isLocal ? 'Lax' : 'None')

  // 최종 리다이렉트
  const fallback = c.env.APP_REDIRECT_DEFAULT || 'https://popple1101.github.io/runningcrew/app'
  const dest =
    (state?.redirect && /^https?:\/\//.test(state.redirect))
      ? state.redirect
      : fallback

  return c.redirect(dest, 302)
})

export default app
