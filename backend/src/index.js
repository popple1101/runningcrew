import { Hono } from 'hono'
import kakaoRoute from '../routes/auth/kakao.js'
import sessionRoute from '../routes/auth/session.js'

const app = new Hono()

app.get('/', (c) => c.json({ ok: true, name: 'RunCrew API' }))

app.route('/auth/kakao', kakaoRoute)
app.route('/me', sessionRoute)

export default app
