import React from "react";

export default function KakaoLoginButton({ icon = "kakao-symbol.png" }) {
  // prod: 절대 백엔드 오리진, dev: Vite 프록시(상대경로)
  const AUTH_ORIGIN = (() => {
    if (import.meta.env.PROD) {
      const v = import.meta.env.VITE_AUTH_BASE;
      return v && /^https?:\/\//.test(v)
        ? v
        : "https://runcrew-backend.popple1101.workers.dev";
    }
    return ""; // dev에서 '/auth/...'로 호출
  })();

  // /runningcrew/ 베이스 고려한 최종 복귀 URL (/app)
  const BASE = import.meta.env.BASE_URL || "/";
  const redirectUrl = new URL(
    BASE.replace(/\/?$/, "/") + "app",
    window.location.origin
  ).toString();

  // 항상 '/auth/kakao' 경로로 호출 (prod는 절대, dev는 상대)
  const loginUrl = `${AUTH_ORIGIN}/auth/kakao?redirect=${encodeURIComponent(
    redirectUrl
  )}`;

  // BASE_URL 기준 아이콘 경로 보정
  const resolveAsset = (p) =>
    /^https?:\/\//.test(p) ? p : `${BASE}${p.replace(/^\//, "")}`;
  const iconSrc = resolveAsset(icon);

  return (
    <a href={loginUrl} className="kakao-btn" aria-label="카카오로 시작하기">
      <img
        src={iconSrc}
        alt=""
        className="kakao-icon"
        width={22}
        height={22}
        aria-hidden="true"
      />
      <span className="kakao-label">카카오로 시작하기</span>
    </a>
  );
}
