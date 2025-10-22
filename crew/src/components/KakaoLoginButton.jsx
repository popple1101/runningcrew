import React from "react";

export default function KakaoLoginButton({ icon = "kakao-symbol.png" }) {
  const AUTH_BASE =
    import.meta.env.PROD && import.meta.env.VITE_AUTH_BASE
      ? import.meta.env.VITE_AUTH_BASE
      : "/auth";

  // /runningcrew/ 같은 베이스를 고려한 절대 리다이렉트(/app)
  const redirectUrl = new URL(
    (import.meta.env.BASE_URL || "/") + "app",
    window.location.origin
  ).toString();

  const loginUrl = `${AUTH_BASE}/kakao?redirect=${encodeURIComponent(
    redirectUrl
  )}`;

  // BASE_URL 기반 아이콘 경로 보정
  const BASE = import.meta.env.BASE_URL || "/";
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
