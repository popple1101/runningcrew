// src/lib/api.js

// === BASE URL 결정 (prod: 풀 URL, dev: /api 프록시) ===
const PROD = import.meta.env.PROD;
const API_BASE = (
  PROD && import.meta.env.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE
    : "/api"
).replace(/\/+$/, ""); // 끝 슬래시 제거

// 내부 유틸: 경로 조인
const join = (base, path) =>
  `${base}/${String(path || "").replace(/^\/+/, "")}`;

// 공통 fetch 래퍼 (쿠키 포함 + JSON 자동 처리 + 타임아웃)
async function request(path, {
  method = "GET",
  json,
  headers = {},
  timeout = 8000,
  ...rest
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const init = {
    method,
    credentials: "include", // ✅ 쿠키 포함 필수
    cache: "no-store",
    headers: { ...headers },
    signal: controller.signal,
    ...rest,
  };

  if (json !== undefined) {
    init.headers["Content-Type"] =
      init.headers["Content-Type"] || "application/json";
    init.body = JSON.stringify(json);
  }

  const url = join(API_BASE, path);
  try {
    const res = await fetch(url, init);

    // 204 or empty → null
    if (res.status === 204) return null;

    const text = await res.text();
    const hasBody = text && text.trim().length > 0;

    if (!res.ok) {
      // 서버가 문자열 에러를 내려주면 그대로 노출
      throw new Error(hasBody ? text : `${res.status} ${res.statusText}`);
    }

    if (!hasBody) return null;

    try {
      return JSON.parse(text);
    } catch {
      // JSON이 아니면 원문 반환(드물지만)
      return text;
    }
  } finally {
    clearTimeout(timer);
  }
}

// === 공개 API ===

// 현재 세션 사용자 조회
export async function getMe() {
  try {
    const data = await request("/me", { method: "GET" });
    // 백엔드가 { user: {...} } 형태라면 아래처럼
    if (data && typeof data === "object" && "user" in data) {
      return data.user;
    }
    return data ?? null;
  } catch {
    return null;
  }
}

// 로그아웃
export async function postLogout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // 무시
  }
}

// 회원가입 (성공 후 서버 세션을 쓰려면,
// 백엔드가 /auth/signup에서 바로 세션 쿠키를 심어주는 게 베스트)
export async function postSignup(email, password, nickname) {
  const data = await request("/auth/signup", {
    method: "POST",
    json: { email, password, nickname },
  });
  return data;
}

// 로그인 (서버가 rc_session 쿠키를 세팅해야 함)
export async function postLogin(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    json: { email, password },
  });
  return data;
}

// 프로필 저장/업데이트
export async function putProfile(payload) {
  const data = await request("/profile", {
    method: "PUT",
    json: payload,
  });
  return data;
}

// 프로필 조회
export async function getProfile() {
  const data = await request("/profile", { method: "GET" });
  return data;
}

// 프로필 완성 여부 검증
export function isProfileComplete(user) {
  if (!user) return false;

  const hasBasicInfo = !!(
    user.nickname &&
    user.age &&
    user.gender
  );

  const hasLocation = !!(
    user.region_verified === true ||
    (user.lat && user.lng)
  );

  return hasBasicInfo && hasLocation;
}

// (선택) 외부에서 BASE를 확인하고 싶다면 export
export const API = API_BASE;
