import React from "react";
import KakaoLoginButton from "./KakaoLoginButton";
import NaverLoginButton from "./NaverLoginButton";
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
        <NaverLoginButton icon="/naver-symbol.png" />
      </div>
    </main>
  );
}
