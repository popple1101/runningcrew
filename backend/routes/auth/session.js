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
    console.log('Session - JWT payload:', payload)
  } catch (e) {
    console.log('Session - JWT verification failed:', e.message)
    return c.text('Unauthorized: jwt error - ' + e.message, 401)
  }

  // 3) 필수 env
  console.log('Session - SUPABASE_URL:', c.env.SUPABASE_URL ? 'present' : 'missing')
  console.log('Session - SUPABASE_SERVICE_ROLE_KEY:', c.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing')
  
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return c.text('Server misconfig: SUPABASE env missing', 500)
  }

  // 4) DB 조회: user.id로 직접 조회
  const supa = getSupabase(c)
  const userId = String(payload.sub)

  console.log('Session - Attempting DB query for userId:', userId)
  
  const { data, error } = await supa
    .from('users')
    .select('id, provider, provider_sub, nickname, email, photo_url')
    .eq('id', userId)
    .single()

  console.log('Session - DB query result:', { data, error, userId })

  // "없음"은 204로 응답(프론트 getMe가 null 처리)
  if (error?.code === 'PGRST116') return c.body(null, 204)
  if (error) return c.text('DB Error: ' + error.message, 500)

  // 5) 성공
  return c.json({ user: data ?? null })
})

export default app
