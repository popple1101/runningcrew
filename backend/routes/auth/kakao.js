import { Hono } from 'hono'
import { setSessionCookie } from '../../core/cookies.js'
import { signState, verifyState, signJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const KAUTH = 'https://kauth.kakao.com'
const KAPI  = 'https://kapi.kakao.com'
const app = new Hono()

// ✅ provider-safe 콜백 URL 생성기 (환경변수 잘못돼도 방어)
const makeCallback = (c) => {
  const origin = new URL(c.req.url).origin
  return `${origin}/auth/kakao/callback`
}
const pickKakaoCallback = (c) => {
  const envVal = c.env.KAKAO_REDIRECT_URI
  // env가 있고 kakao 경로면 우선, 아니면 자동 생성
  return (envVal && /\/auth\/kakao\/callback$/.test(envVal)) ? envVal : makeCallback(c)
}

// 시작
app.get('/', async (c) => {
  const redirect = c.req.query('redirect') || '/'
  const state = await signState({ redirect }, c.env)

  const authUrl = new URL('/oauth/authorize', KAUTH)
  authUrl.searchParams.set('client_id', c.env.KAKAO_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', pickKakaoCallback(c))   // ✨ 여기
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'profile_nickname profile_image account_email')
  authUrl.searchParams.set('state', state)

  return c.redirect(authUrl.toString(), 302)
})

// 콜백
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
  form.set('client_id', c.env.KAKAO_CLIENT_ID)
  if (c.env.KAKAO_CLIENT_SECRET) form.set('client_secret', c.env.KAKAO_CLIENT_SECRET)
  form.set('redirect_uri', pickKakaoCallback(c))                    // ✨ 여기
  form.set('code', code)

  const tok = await fetch(`${KAUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form
  })
  const tokBody = await tok.text()
  if (!tok.ok) return c.text(`Kakao token error: ${tok.status} ${tokBody}`, 502)

  let access_token
  try { ;({ access_token } = JSON.parse(tokBody)) } catch { return c.text('Kakao token parse error', 502) }

  // 사용자 정보
  const meRes = await fetch(`${KAPI}/v2/user/me`, { headers: { Authorization: `Bearer ${access_token}` } })
  const meBody = await meRes.text()
  if (!meRes.ok) return c.text(`Kakao me error: ${meRes.status} ${meBody}`, 502)

  let me
  try { me = JSON.parse(meBody) } catch { return c.text('Kakao me parse error', 502) }

  const kakaoId = String(me.id)
  const nickname =
    me.kakao_account?.profile?.nickname?.trim() ||
    me.properties?.nickname?.trim() || 'Runner'
  const email = me.kakao_account?.email || null
  const photo_url =
    me.kakao_account?.profile?.profile_image_url ||
    me.properties?.profile_image || null

  // DB upsert
  const supa = getSupabase(c)
  const row = { provider: 'kakao', provider_sub: kakaoId, nickname, email, photo_url, last_login_at: new Date().toISOString() }
  const { data: user, error } = await supa.from('users').upsert(row, { onConflict: 'provider_sub' }).select('id').single()
  if (error) return c.text('DB error: ' + error.message, 500)

  // 세션 쿠키
  const jwt = await signJWT({ sub: String(user.id), nickname }, c.env, 60 * 60 * 24 * 30)
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  setSessionCookie(c, jwt)  // core/cookies.js가 prod에서 SameSite:'None', Secure:true로 셋업함

  // 최종 리다이렉트
  const fallback = c.env.APP_REDIRECT_DEFAULT || 'https://popple1101.github.io/runningcrew/app'
  const dest = (state?.redirect && /^https?:\/\//.test(state.redirect)) ? state.redirect : fallback
  return c.redirect(dest, 302)
})

export default app
