import React from "react";

export default function KakaoLoginButton({ icon = "/kakao-symbol.png" }) {
  // dev: /auth → Vite 프록시
  // prod: 필요하면 VITE_AUTH_BASE에 풀 URL 넣기(예: https://runcrew-backend.../auth)
  const AUTH_BASE =
    import.meta.env.PROD && import.meta.env.VITE_AUTH_BASE
      ? import.meta.env.VITE_AUTH_BASE
      : "/auth";

  // 라우터 basename 고려해서 /app 절대 URL 구성
  const redirectUrl = new URL(
    (import.meta.env.BASE_URL || "/") + "app",
    window.location.origin
  ).toString();

  const loginUrl = `${AUTH_BASE}/kakao?redirect=${encodeURIComponent(
    redirectUrl
  )}`;

  return (
    <a href={loginUrl} className="kakao-btn" aria-label="카카오로 시작하기">
      <img
        src={icon}
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
