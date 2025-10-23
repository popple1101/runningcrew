// src/lib/api.js

// 개발(dev)은 '/api' 프록시, 배포(prod)에서만 풀 URL 사용
export const API =
  import.meta.env.PROD && import.meta.env.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE
    : '/api'

export async function getMe() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API}/me`, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!res.ok || res.status === 204) return null;

    const text = await res.text();
    if (!text) return null;

    let data;
    try { data = JSON.parse(text); } catch { return null; }

    return data?.user ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 로그아웃 helper
export async function postLogout() {
  try {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {}
}

// 회원가입
export async function postSignup(email, password, nickname) {
  const r = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, nickname }),
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(errorText);
  }
  return r.json();
}

// 로그인
export async function postLogin(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(errorText);
  }
  return r.json();
}

// 프로필 저장/업데이트
export async function putProfile(payload) {
  const r = await fetch(`${API}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(errorText);
  }
  return r.json();
}

// 프로필 조회
export async function getProfile() {
  const r = await fetch(`${API}/profile`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(errorText);
  }
  return r.json();
}

// 프로필 완성 여부 검증
export function isProfileComplete(user) {
  if (!user) return false;
  
  // 필수 필드 검증
  const hasBasicInfo = !!(
    user.nickname &&
    user.age &&
    user.gender
  );
  
  // 지역 인증 검증
  const hasLocation = !!(
    user.region_verified === true ||
    (user.lat && user.lng)
  );
  
  return hasBasicInfo && hasLocation;
}
