// routes/auth/naver.js
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { signState, verifyState, signJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const AUTH  = 'https://nid.naver.com/oauth2.0/authorize'
const TOKEN = 'https://nid.naver.com/oauth2.0/token'
const ME    = 'https://openapi.naver.com/v1/nid/me'

const app = new Hono()

// 1) 콜백 URL은 '항상' 같은 기준으로 생성 (배포/로컬 불일치 방지)
const getAuthOrigin = (c) => c.env.AUTH_ORIGIN || 'http://127.0.0.1:8787'
const pickNaverCallback = (c) =>
  (c.env.NAVER_REDIRECT_URI && /\/auth\/naver\/callback$/.test(c.env.NAVER_REDIRECT_URI))
    ? c.env.NAVER_REDIRECT_URI
    : `${getAuthOrigin(c)}/auth/naver/callback`

// 2) 시작: 네이버로 리다이렉트
//    예) GET /auth/naver?redirect=https://popple1101.github.io/runningcrew/app
app.get('/', async (c) => {
  const redirect = c.req.query('redirect') || '/'
  const state = await signState({ redirect }, c.env)

  const callbackUrl = pickNaverCallback(c)
  const url = new URL(AUTH)
  url.searchParams.set('client_id', c.env.NAVER_CLIENT_ID)
  url.searchParams.set('redirect_uri', callbackUrl)        // authorize와 token 교환 모두 '동일 값'
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)                     // 필수
  // (선택) 동의항목 명시: 이메일/프로필
  url.searchParams.set('scope', 'profile email')

  return c.redirect(url.toString(), 302)
})

// 3) 콜백: 네이버 → 우리 서버
app.get('/callback', async (c) => {
  const u = new URL(c.req.url)
  const code = u.searchParams.get('code')
  const stateToken = u.searchParams.get('state')
  if (!code || !stateToken) return c.text('Bad Request: missing code/state', 400)

  // state 검증
  let state
  try {
    state = await verifyState(stateToken, c.env) // { redirect }
  } catch {
    return c.text('Unauthorized: bad state', 401)
  }

  // 토큰 교환 (authorize 때 redirect_uri와 '완전히 동일'해야 함)
  const callbackUrl = pickNaverCallback(c)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: c.env.NAVER_CLIENT_ID,
    redirect_uri: callbackUrl,
    code,
    state: stateToken,
  })
  if (c.env.NAVER_CLIENT_SECRET) {
    body.set('client_secret', c.env.NAVER_CLIENT_SECRET) // 보통 필수
  }

  const tRes = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body
  })
  const tText = await tRes.text()
  if (!tRes.ok) {
    console.error('[Naver Token] Error:', tRes.status, tText)
    return c.text(`Naver token error: ${tRes.status} ${tText}`, 502)
  }

  let tokenJson
  try { tokenJson = JSON.parse(tText) } catch { return c.text('Naver token parse error', 502) }
  const { access_token } = tokenJson || {}
  if (!access_token) return c.text('Naver token error: no access_token', 502)

  // 사용자 정보
  const meRes = await fetch(ME, { headers: { Authorization: `Bearer ${access_token}` } })
  const meText = await meRes.text()
  if (!meRes.ok) {
    console.error('[Naver Me] Error:', meRes.status, meText)
    return c.text(`Naver me error: ${meRes.status} ${meText}`, 502)
  }

  let me
  try { me = JSON.parse(meText) } catch { return c.text('Naver me parse error', 502) }
  if (me.resultcode !== '00') {
    console.error('[Naver Me] Result not ok:', me)
    return c.text('Naver profile fetch failed', 502)
  }

  const r = me.response || {}
  const naverId = String(r.id)
  const nickname = (r.nickname || r.name || 'Runner').trim()
  const email = r.email || null
  const photo_url = r.profile_image || null

  // DB upsert
  const supa = getSupabase(c)
  const row = {
    provider: 'naver',
    provider_sub: naverId,
    nickname, email, photo_url,
    last_login_at: new Date().toISOString(),
  }
  const { data: user, error } = await supa.from('users')
    .upsert(row, { onConflict: 'provider_sub' })
    .select('id')
    .single()
  if (error) return c.text('DB error: ' + error.message, 500)

  // 세션 쿠키 (배포=Cross-Site → None+Secure)
  const jwt = await signJWT({ sub: String(user.id), nickname }, c.env, 60 * 60 * 24 * 30)
  const host = new URL(c.req.url).hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  setCookie(c, 'rc_session', jwt, {
    path: '/',
    httpOnly: true,
    sameSite: isLocal ? 'Lax' : 'None',
    secure: isLocal ? false : true,   // 배포(HTTPS)에서만 true
    maxAge: 60 * 60 * 24 * 30,
  })

  // 최종 리다이렉트 (state.redirect가 절대경로면 그리로)
  const fallback = c.env.APP_REDIRECT_DEFAULT || 'https://popple1101.github.io/runningcrew/app'
  const dest = (state?.redirect && /^https?:\/\//.test(state.redirect)) ? state.redirect : fallback

  // (선택) 프론트가 쿼리 토큰을 원하면 아래 1줄 추가
  // new URL(dest).searchParams.set('t', jwt)

  return c.redirect(dest, 302)
})

export default app
