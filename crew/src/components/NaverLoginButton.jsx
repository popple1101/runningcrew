import React from "react";

export default function NaverLoginButton({
  icon = "/naver-symbol.png",
  className = "",
}) {
  const AUTH_BASE =
    import.meta.env.PROD && import.meta.env.VITE_AUTH_BASE
      ? import.meta.env.VITE_AUTH_BASE
      : "/auth";

  // 절대 리다이렉트(/app)
  const redirectUrl = new URL(
    (import.meta.env.BASE_URL || "/") + "app",
    window.location.origin
  ).toString();

  const loginUrl = `${AUTH_BASE}/naver?redirect=${encodeURIComponent(
    redirectUrl
  )}`;

  return (
    <a
      href={loginUrl}
      className={`naver-btn ${className}`}
      aria-label="네이버로 시작하기"
    >
      <img
        src={icon}
        alt=""
        className="naver-icon"
        width={22}
        height={22}
        aria-hidden="true"
      />
      <span className="naver-label">네이버로 시작하기</span>
    </a>
  );
}
