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

// 프로필 저장/업데이트
app.put('/', async (c) => {
  const userId = await requireUserId(c);
  if (!userId) return c.text('Unauthorized', 401);

  let body;
  try { 
    body = await c.req.json(); 
  } catch { 
    return c.text('Bad Request', 400); 
  }

  // 데이터 검증 및 정제
  const nickname = (body.nickname || '').toString().trim().slice(0, 30);
  const age = Number(body.age) || null;
  const gender = ['female', 'male', 'other'].includes(body.gender) ? body.gender : null;
  const lat = typeof body.lat === 'number' ? body.lat : null;
  const lng = typeof body.lng === 'number' ? body.lng : null;
  const accuracy = typeof body.accuracy === 'number' ? body.accuracy : null;
  const crew_choice = ['have', 'create', 'browse'].includes(body.crew_choice) ? body.crew_choice : null;

  // 필수 필드 검증
  if (!nickname || !age || !gender) {
    return c.text('nickname/age/gender required', 400);
  }

  // 지역 인증 여부 판단
  const region_verified = lat !== null && lng !== null;

  const sb = getSupabase(c);
  const { data, error } = await sb
    .from('users')
    .update({
      nickname,
      age,
      gender,
      lat,
      lng,
      // accuracy, // 임시로 주석 처리
      region_verified,
      crew_choice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, nickname, age, gender, region_verified, lat, lng, crew_choice')
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return c.text('DB error: ' + error.message, 500);
  }

  return c.json({ ok: true, user: data });
});

// 프로필 조회
app.get('/', async (c) => {
  const userId = await requireUserId(c);
  if (!userId) return c.text('Unauthorized', 401);

  const sb = getSupabase(c);
  const { data, error } = await sb
    .from('users')
    .select('id, nickname, age, gender, region_verified, lat, lng, crew_choice')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    return c.text('DB error: ' + error.message, 500);
  }

  return c.json({ ok: true, user: data });
});

export default app;
