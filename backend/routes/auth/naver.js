// routes/auth/naver.js
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { signState, verifyState, signJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const AUTH   = 'https://nid.naver.com/oauth2.0/authorize'
const TOKEN  = 'https://nid.naver.com/oauth2.0/token'
const ME     = 'https://openapi.naver.com/v1/nid/me'

const app = new Hono()

/**
 * 시작: /auth/naver?redirect=<프론트로 돌아갈 URL>
 * - state에 redirect를 서명해서 넣음
 */
app.get('/', async (c) => {
  const redirect = c.req.query('redirect') || '/'
  const state = await signState({ redirect }, c.env)

  const url = new URL(AUTH)
  url.searchParams.set('client_id', c.env.NAVER_CLIENT_ID)
  url.searchParams.set('redirect_uri', c.env.NAVER_REDIRECT_URI) // 예: http://localhost:8787/auth/naver/callback
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state) // 필수

  return c.redirect(url.toString(), 302)
})

/**
 * 콜백: 네이버가 code/state를 들고 호출
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

  // 토큰 교환
  const form = new URLSearchParams()
  form.set('grant_type', 'authorization_code')
  form.set('client_id', c.env.NAVER_CLIENT_ID)
  if (c.env.NAVER_CLIENT_SECRET) form.set('client_secret', c.env.NAVER_CLIENT_SECRET)
  form.set('redirect_uri', c.env.NAVER_REDIRECT_URI) // authorize 시와 완전히 동일
  form.set('code', code)
  form.set('state', stateToken)

  const tok = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form
  })
  const tokBody = await tok.text()
  if (!tok.ok) {
    console.error('Naver token error:', tok.status, tokBody)
    return c.text(`Naver token error: ${tok.status} ${tokBody}`, 502)
  }

  let access_token
  try { ;({ access_token } = JSON.parse(tokBody)) }
  catch {
    console.error('Naver token parse error:', tokBody)
    return c.text('Naver token parse error', 502)
  }

  // 사용자 정보
  const meRes = await fetch(ME, {
    headers: { Authorization: `Bearer ${access_token}` }
  })
  const meBody = await meRes.text()
  if (!meRes.ok) {
    console.error('Naver me error:', meRes.status, meBody)
    return c.text(`Naver me error: ${meRes.status} ${meBody}`, 502)
  }

  let payload
  try { payload = JSON.parse(meBody) }
  catch {
    console.error('Naver me parse error:', meBody)
    return c.text('Naver me parse error', 502)
  }
  if (payload.resultcode !== '00') {
    console.error('Naver result not ok:', payload)
    return c.text('Naver profile fetch failed', 502)
  }

  const resp = payload.response || {}
  const naverId = String(resp.id)
  const nickname = (resp.nickname || resp.name || 'Runner').trim()
  const email = resp.email || null
  const photo_url = resp.profile_image || null

  // DB upsert (카카오와 동일 스키마)
  const supa = getSupabase(c)
  const row = {
    provider: 'naver',
    provider_sub: naverId,          // 유니크
    nickname,
    email,
    photo_url,
    last_login_at: new Date().toISOString(),
  }

  const { data: user, error } = await supa
    .from('users')
    .upsert(row, { onConflict: 'provider_sub' })
    .select('id')
    .single()

  if (error) {
    console.error('DB upsert error:', error)
    return c.text('DB error: ' + error.message, 500)
  }

  // 세션 쿠키 발급 (DB user.id 기준)
  const jwt = await signJWT({ sub: String(user.id), nickname }, c.env, 60 * 60 * 24 * 30)
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  setCookie(c, 'rc_session', jwt, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: !isLocal,
    maxAge: 60 * 60 * 24 * 30,
  })

  // 프론트로 이동
  const dest = state.redirect || '/'
  return c.redirect(dest, 302)
})

export default app

