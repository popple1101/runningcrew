// routes/auth/session.js
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const app = new Hono()

app.get('/', async (c) => {
  // 1) 토큰: Authorization > rc_session 쿠키
  const auth = c.req.header('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : auth?.split(' ')[1]
  const token = bearer || getCookie(c, 'rc_session')
  if (!token) return c.text('Unauthorized: no token', 401)

  // 2) JWT 검증
  let payload
  try {
    payload = await verifyJWT(token, c.env) // { sub, provider? }
  } catch (e) {
    return c.text('Unauthorized: jwt error - ' + e.message, 401)
  }

  // 3) 필수 env
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return c.text('Server misconfig: SUPABASE env missing', 500)
  }

  // 4) DB 조회: provider + provider_sub(=payload.sub)로 조회
  const supa = getSupabase(c)

  // 기본 provider는 kakao로 가정
  const provider = (payload.provider || 'kakao').toString()
  const providerSub = String(payload.sub)

  const { data, error } = await supa
    .from('users')
    .select('id, provider, provider_sub, nickname, email, photo_url')
    .eq('provider', provider)
    .eq('provider_sub', providerSub)
    .single()

  // "없음"은 204로 응답(프론트 getMe가 null 처리)
  if (error?.code === 'PGRST116') return c.body(null, 204)
  if (error) return c.text('DB Error: ' + error.message, 500)

  // 5) 성공
  return c.json({ user: data ?? null })
})

export default app
