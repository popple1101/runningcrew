// crew/src/components/NaverLoginButton.jsx
import React from "react";

export default function NaverLoginButton({
  icon = "naver-symbol.png",
  className = "",
}) {
  // prod에서는 반드시 VITE_AUTH_BASE를 사용(예: https://runcrew-backend.popple1101.workers.dev)
  const AUTH_BASE =
    import.meta.env.PROD && import.meta.env.VITE_AUTH_BASE
      ? import.meta.env.VITE_AUTH_BASE
      : "/auth";

  // GH Pages base(/runningcrew/)를 고려해서 /app 절대 URL 생성
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

  // 디버그(필요 시): console.log('[Naver Login] url=', loginUrl);

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
