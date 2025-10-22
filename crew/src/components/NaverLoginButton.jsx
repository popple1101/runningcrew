import React from "react";

export default function NaverLoginButton({
  icon = "naver-symbol.png",
  className = "",
}) {
  const AUTH_BASE =
    import.meta.env.PROD && import.meta.env.VITE_AUTH_BASE
      ? import.meta.env.VITE_AUTH_BASE
      : "/auth";

  const redirectUrl = new URL(
    (import.meta.env.BASE_URL || "/") + "app",
    window.location.origin
  ).toString();

  const loginUrl = `${AUTH_BASE}/naver?redirect=${encodeURIComponent(
    redirectUrl
  )}`;

  const BASE = import.meta.env.BASE_URL || "/";
  const resolveAsset = (p) =>
    /^https?:\/\//.test(p) ? p : `${BASE}${p.replace(/^\//, "")}`;
  const iconSrc = resolveAsset(icon);

  return (
    <a
      href={loginUrl}
      className={`naver-btn ${className}`}
      aria-label="네이버로 시작하기"
    >
      <img
        src={iconSrc}
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
