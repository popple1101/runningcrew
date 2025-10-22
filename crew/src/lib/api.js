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

// 선택: 로그아웃 helper (AuthContext에서 쓰기 편하게)
export async function postLogout() {
  try {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {}
}
// === 아래 내용만 파일 맨 아래에 추가 ===

// 온보딩 저장
// 온보딩 저장
export async function putProfile(payload) {
  const r = await fetch(`${API}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}


// 프로필 완성 여부(백엔드 속성명은 상황 맞춰 조정)
export function isProfileComplete(user) {
  if (!user) return false;
  // 예시: nickname/age/gender + region_verified 필요
  const ok =
    !!user.nickname &&
    !!user.age &&
    !!user.gender &&
    (user.region_verified === true || user.regionVerified === true);
  return ok;
}
