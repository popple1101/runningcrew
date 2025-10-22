import React from "react"; // ← 추가
import KakaoLoginButton from "./KakaoLoginButton";
import "./main.css";

export default function Main() {
  return (
    <main className="page">
      <div className="stack">
        <img
          src="/logo.png"
          alt="RunPick"
          className="logo"
          width="360"
          height="108"
          loading="eager"
          decoding="async"
        />
        <KakaoLoginButton icon="/kakao-symbol.png" />
      </div>
    </main>
  );
}
