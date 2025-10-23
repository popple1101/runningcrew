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
    return payload.sub; // UUID 문자열
  } catch {
    return null;
  }
}

// 프로필 저장/업데이트 (온보딩)
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
  const gender = ['male', 'female', 'other'].includes(body.gender) ? body.gender : 'unknown';
  const lat = typeof body.lat === 'number' ? body.lat : null;
  const lng = typeof body.lng === 'number' ? body.lng : null;
  const region_verified = lat !== null && lng !== null;
  const crew_choice = ['have', 'create', 'browse'].includes(body.crew_choice) ? body.crew_choice : null;
  const bio = (body.bio || '').toString().trim().slice(0, 500);

  // 필수 필드 검증
  if (!nickname || !age || !gender) {
    return c.text('nickname/age/gender required', 400);
  }

  const sb = getSupabase(c);
  
  // profiles 테이블 upsert
  const profileRow = {
    user_id: userId,
    nickname,
    age,
    gender,
    bio,
    lat,
    lng,
    region_verified,
    crew_choice,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('profiles')
    .upsert(profileRow, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('Profile upsert error:', error);
    return c.text('DB error: ' + error.message, 500);
  }

  // users 테이블의 nickname도 업데이트 (일관성)
  await sb
    .from('users')
    .update({ nickname })
    .eq('id', userId);

  return c.json({ ok: true, profile: data });
});

// 프로필 조회
app.get('/', async (c) => {
  const userId = await requireUserId(c);
  if (!userId) return c.text('Unauthorized', 401);

  const sb = getSupabase(c);
  
  // users + profiles 조회
  const { data: user } = await sb
    .from('users')
    .select('id, nickname, email, photo_url')
    .eq('id', userId)
    .maybeSingle();

  const { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!user) {
    return c.text('User not found', 404);
  }

  return c.json({
    ok: true,
    user: {
      ...user,
      ...(profile || {}),
    },
  });
});

export default app;
