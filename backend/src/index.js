import { Hono } from 'hono'
import kakaoRoute from '../routes/auth/kakao.js'
import sessionRoute from '../routes/auth/session.js'
import naver from '../routes/auth/naver.js'
import profile from '../routes/api/profile.js';

const app = new Hono()

app.get('/', (c) => c.json({ ok: true, name: 'RunCrew API' }))
app.route('/auth/naver', naver)
app.route('/auth/kakao', kakaoRoute)
app.route('/me', sessionRoute)
app.route('/api/profile', profile);

export default app
