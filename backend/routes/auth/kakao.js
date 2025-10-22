// routes/auth/kakao.js
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { signState, verifyState, signJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const KAUTH = 'https://kauth.kakao.com' // 인증/토큰
const KAPI  = 'https://kapi.kakao.com'  // 사용자 API

const app = new Hono()

/**
 * 시작: /auth/kakao?redirect=<프론트로 돌아갈 URL>
 * - state에 redirect를 서명해서 넣음
 */
app.get('/', async (c) => {
  const redirect = c.req.query('redirect') || '/'
  const state = await signState({ redirect }, c.env)

  const authUrl = new URL('/oauth/authorize', KAUTH)
  authUrl.searchParams.set('client_id', c.env.KAKAO_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', c.env.KAKAO_REDIRECT_URI) // 백엔드 콜백(예: http://localhost:8787/auth/kakao/callback)
  authUrl.searchParams.set('response_type', 'code')
  // 이메일/프로필 범위 (미동의시 email은 null로 옴)
  authUrl.searchParams.set('scope', 'profile_nickname profile_image account_email')
  authUrl.searchParams.set('state', state)

  return c.redirect(authUrl.toString(), 302)
})

/**
 * 콜백: 카카오가 code/state를 들고 호출
 */
app.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const stateToken = url.searchParams.get('state')
  if (!code || !stateToken) return c.text('Bad Request: missing code/state', 400)

  // state 검증
  let state
  try { state = await verifyState(stateToken, c.env) }
  catch { return c.text('Unauthorized: bad state', 401) }

  // 토큰 교환 (kauth)
  const form = new URLSearchParams()
  form.set('grant_type', 'authorization_code')
  form.set('client_id', c.env.KAKAO_CLIENT_ID)
  if (c.env.KAKAO_CLIENT_SECRET) form.set('client_secret', c.env.KAKAO_CLIENT_SECRET)
  form.set('redirect_uri', c.env.KAKAO_REDIRECT_URI) // authorize 시와 "완전히 동일"해야 함
  form.set('code', code)

  const tok = await fetch(`${KAUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form
  })

  const tokBody = await tok.text()
  if (!tok.ok) {
    console.error('Kakao token error:', tok.status, tokBody)
    return c.text(`Kakao token error: ${tok.status} ${tokBody}`, 502)
  }

  let access_token
  try {
    ;({ access_token } = JSON.parse(tokBody))
  } catch (e) {
    console.error('Kakao token parse error:', tokBody)
    return c.text('Kakao token parse error', 502)
  }

  // 사용자 정보 (kapi)
  const meRes = await fetch(`${KAPI}/v2/user/me`, {
    headers: { Authorization: `Bearer ${access_token}` }
  })
  const meBody = await meRes.text()
  if (!meRes.ok) {
    console.error('Kakao me error:', meRes.status, meBody)
    return c.text(`Kakao me error: ${meRes.status} ${meBody}`, 502)
  }

  let me
  try {
    me = JSON.parse(meBody)
  } catch {
    console.error('Kakao me parse error:', meBody)
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

  // DB upsert (너의 스키마에 맞춤)
  const supa = getSupabase(c)
  const row = {
    provider: 'kakao',
    provider_sub: kakaoId,            // 유니크
    nickname,
    email,
    photo_url,
    last_login_at: new Date().toISOString(),
  }

  // DB upsert 및 ID 반환
  const { data: user, error } = await supa
    .from('users')
    .upsert(row, { onConflict: 'provider_sub' })
    .select('id')
    .single()
  
  if (error) {
    console.error('DB upsert error:', error)
    return c.text('DB error: ' + error.message, 500)
  }

  // 세션 쿠키 발급 (user.id를 문자열로 변환)
  const jwt = await signJWT({ sub: String(user.id), nickname }, c.env, 60 * 60 * 24 * 30)
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  setCookie(c, 'rc_session', jwt, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: !isLocal,               // 로컬은 false, 배포 true
    maxAge: 60 * 60 * 24 * 30,      // 30일
  })

  // 프론트로 이동 (state.redirect)
  const dest = state.redirect || '/'
  return c.redirect(dest, 302)
})

export default app
