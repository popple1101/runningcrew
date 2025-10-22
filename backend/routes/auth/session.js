import { Hono } from 'hono'
import { verifyJWT } from '../../core/jwt.js'
import { getSupabase } from '../../core/db.js'

const app = new Hono()

app.get('/', async (c) => {
  const token = c.req.header('authorization')?.split(' ')[1] || c.req.cookie('rc_session')
  if (!token) return c.text('Unauthorized', 401)
  try {
    const payload = await verifyJWT(token, c.env)
    const supa = getSupabase(c)
    const { data } = await supa
      .from('users')
      .select('id,nickname,photo_url')
      .eq('id', payload.sub)
      .single()
    return c.json({ user: data })
  } catch {
    return c.text('Unauthorized', 401)
  }
})

export default app
