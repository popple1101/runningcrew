import { Hono } from 'hono'
import { getSupabase } from '../../core/db.js'
import { signJWT, signState, verifyState } from '../../core/jwt.js'

const KAUTH = 'https://kauth.kakao.com'
const KAPI = 'https://kapi.kakao.com'

const app = new Hono()

app.get('/', async (c) => {
  const redirect = c.req.query('redirect') || '/'
  const state = await signState({ redirect }, c.env)
  const params = new URLSearchParams({
    client_id: c.env.KAKAO_CLIENT_ID,
    redirect_uri: c.env.KAKAO_REDIRECT_URI,
    response_type: 'code',
    // MVP면 email은 빼도 됨: 'profile_nickname'
    scope: 'profile_nickname account_email',
    state
  })
  return c.redirect(`${KAUTH}/oauth/authorize?${params.toString()}`)
})

app.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return c.text('Bad Request', 400)

  let parsed
  try {
    parsed = await verifyState(state, c.env)
  } catch {
    return c.text('Invalid state', 400)
  }
  const redirectPath = parsed.redirect || '/'

  // ── 토큰 교환
  const tokenRes = await fetch(`${KAUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: c.env.KAKAO_CLIENT_ID,
      redirect_uri: c.env.KAKAO_REDIRECT_URI, // 카카오 콘솔과 정확히 일치해야 함
      code,
      ...(c.env.KAKAO_CLIENT_SECRET ? { client_secret: c.env.KAKAO_CLIENT_SECRET } : {})
    })
  })
  if (!tokenRes.ok) return c.text('Token exchange failed', 500)
  const token = await tokenRes.json()

  // ── 사용자 정보
  const meRes = await fetch(`${KAPI}/v2/user/me`, {
    headers: { Authorization: `Bearer ${token.access_token}` }
  })
  if (!meRes.ok) return c.text('User info failed', 500)
  const me = await meRes.json()

  const provider = 'kakao'
  const provider_sub = String(me.id)
  const nickname = me.kakao_account?.profile?.nickname || 'Runner'
  const email = me.kakao_account?.email || null
  const photo_url =
    me.kakao_account?.profile?.thumbnail_image_url ||
    me.kakao_account?.profile?.profile_image_url ||
    null

  // ── DB upsert
  try {
    const supa = getSupabase(c)
    const { data: user, error } = await supa
      .from('users')
      .upsert(
        { provider, provider_sub, nickname, email, photo_url },
        { onConflict: 'provider_sub' }
      )
      .select('*')
      .eq('provider_sub', provider_sub)
      .single()
    if (error) return c.text(`DB Error: ${error.message}`, 500)

    // ── 세션 쿠키
    const jwt = await signJWT(
      { sub: user.id, nickname: user.nickname },
      c.env,
      60 * 60 * 24 * 30
    )

    const hostname = new URL(c.req.url).hostname
    const isLocal = hostname === '127.0.0.1' || hostname === 'localhost'

    const cookie = [
      `rc_session=${jwt}`,
      'Path=/',
      'HttpOnly',
      isLocal ? 'SameSite=Lax' : 'SameSite=None',
      !isLocal ? 'Secure' : '',
      `Max-Age=${60 * 60 * 24 * 30}`
    ].filter(Boolean).join('; ')

    return new Response(null, {
      status: 302,
      headers: {
        'Set-Cookie': cookie,
        Location: redirectPath
      }
    })
  } catch (e) {
    return c.text(`DB Error: ${e.message || e}`, 500)
  }
})

export default app
