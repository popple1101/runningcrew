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
    payload = await verifyJWT(token, c.env) // { sub: UUID }
    console.log('Session - JWT payload:', payload)
  } catch (e) {
    console.log('Session - JWT verification failed:', e.message)
    return c.text('Unauthorized: jwt error - ' + e.message, 401)
  }

  // 3) 필수 env 확인
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return c.text('Server misconfig: SUPABASE env missing', 500)
  }

  // 4) DB 조회: users 테이블 기본 정보 + profiles 테이블 온보딩 정보 LEFT JOIN
  const supa = getSupabase(c)
  const userId = payload.sub // UUID 문자열

  console.log('Session - Attempting DB query for userId:', userId)
  
  // users 테이블 조회
  const { data: user, error: userError } = await supa
    .from('users')
    .select('id, provider, provider_sub, nickname, email, photo_url')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('Session - User query error:', userError)
    return c.text('DB Error: ' + userError.message, 500)
  }

  if (!user) {
    console.log('Session - User not found')
    return c.body(null, 204)
  }

  // profiles 테이블 조회 (온보딩 정보)
  const { data: profile } = await supa
    .from('profiles')
    .select('nickname, age, gender, bio, lat, lng, region_verified, crew_choice')
    .eq('user_id', userId)
    .maybeSingle()

  // 5) 성공 - users + profiles 병합
  const result = {
    ...user,
    // profiles가 있으면 병합 (온보딩 완료)
    ...(profile || {}),
  }

  console.log('Session - Success:', result)

  return c.json({ user: result })
})

export default app
