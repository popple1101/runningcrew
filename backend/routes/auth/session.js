// routes/auth/session.js
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'     // ✅ 쿠키 유틸 추가
import { verifyJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const app = new Hono()

app.get('/', async (c) => {
  // 1) 토큰 꺼내기: Authorization 헤더 > rc_session 쿠키
  const auth = c.req.header('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : auth?.split(' ')[1]
  const token = bearer || getCookie(c, 'rc_session')

  if (!token) return c.text('Unauthorized: no token', 401)

  // 2) JWT 검증
  let payload
  try {
    payload = await verifyJWT(token, c.env)
  } catch (e) {
    return c.text('Unauthorized: jwt error - ' + e.message, 401)
  }

  // 3) 환경변수 체크
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return c.text('Server misconfig: SUPABASE env missing', 500)
  }

  // 4) DB 조회
  const supa = getSupabase(c)
  const { data, error } = await supa
    .from('users')
    .select('id,nickname,photo_url')
    .eq('id', payload.sub)
    .single()

  if (error) return c.text('DB Error: ' + error.message, 500)

  // 5) 성공
  return c.json({ user: data ?? null })
})

export default app
