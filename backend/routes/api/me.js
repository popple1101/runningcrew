// routes/api/me.js
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as jose from 'jose'
import { getSupabase } from '../../core/db.js'

const app = new Hono()

async function requireUserId(c) {
  const token = getCookie(c, 'rc_session')
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(c.env.AUTH_SECRET)
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: c.env.JWT_ISSUER,
      audience: c.env.JWT_AUDIENCE,
    })
    return String(payload.sub)
  } catch {
    return null
  }
}

// GET /api/me → { user } | 204
app.get('/', async (c) => {
  const uid = await requireUserId(c)
  if (!uid) return c.body(null, 204)

  const sb = getSupabase(c)
  const { data, error } = await sb
    .from('users')
    .select('id,nickname,age,gender,photo_url,provider,provider_sub,region_verified,lat,lng')
    .eq('id', uid)
    .single()

  if (error) return c.text('DB error: ' + error.message, 500)
  return c.json({ user: data })
})

export default app
