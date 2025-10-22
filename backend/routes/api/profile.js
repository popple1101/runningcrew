// routes/api/profile.js
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import * as jose from 'jose';
import { getSupabase } from '../../core/db.js';

const app = new Hono();

// 인증 헬퍼
async function requireUserId(c) {
  const token = getCookie(c, 'rc_session');
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(c.env.AUTH_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: c.env.JWT_ISSUER,
      audience: c.env.JWT_AUDIENCE,
    });
    return String(payload.sub);
  } catch {
    return null;
  }
}

// 프로필 저장/업서트
app.put('/', async (c) => {
  const userId = await requireUserId(c);
  if (!userId) return c.text('Unauthorized', 401);

  let body;
  try { body = await c.req.json(); }
  catch { return c.text('Bad Request', 400); }

  const nickname = (body.nickname || '').toString().trim().slice(0, 30);
  const age = Number(body.age) || null;
  const gender = ['female', 'male', 'other'].includes(body.gender) ? body.gender : null;
  const lat = typeof body.lat === 'number' ? body.lat : null;
  const lng = typeof body.lng === 'number' ? body.lng : null;
  const accuracy = typeof body.accuracy === 'number' ? body.accuracy : null;

  if (!nickname || !age || !gender) {
    return c.text('nickname/age/gender required', 400);
  }

  const region_verified = lat !== null && lng !== null; // 간단 기준(좌표 있으면 통과)

  const sb = getSupabase(c);
  const { data, error } = await sb
    .from('users')
    .update({
      nickname,
      age,
      gender,
      lat,
      lng,
      accuracy,
      region_verified,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, nickname, age, gender, region_verified, lat, lng, accuracy')
    .single();

  if (error) return c.text('DB error: ' + error.message, 500);
  return c.json({ ok: true, user: data });
});

export default app;
