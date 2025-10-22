// routes/auth/logout.js
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'

const app = new Hono()
app.post('/', (c) => {
  deleteCookie(c, 'rc_session', { path: '/', secure: true, httpOnly: true, sameSite: 'Lax' })
  return c.json({ ok: true })
})
export default app
