// src/components/Main.jsx
import React from "react";
import KakaoLoginButton from "./KakaoLoginButton";
import NaverLoginButton from "./NaverLoginButton";
import "./main.css";

const BASE = import.meta.env.BASE_URL || "/";
const asset = (p) =>
  /^https?:\/\//.test(p) ? p : `${BASE}${p.replace(/^\//, "")}`;

export default function Main() {
  return (
    <main className="page">
      <div className="stack">
        <img
          src={asset("logo.png")}   // ✅ /runningcrew/logo.png 로 자동 보정
          alt="RunPick"
          className="logo"
          width="360"
          height="108"
          loading="eager"
          decoding="async"
        />
        {/* 아이콘은 컴포넌트 안에서 BASE_URL로 보정됨. 
            굳이 넘길 거면 앞에 / 빼고 파일명만 전달해도 OK */}
        <KakaoLoginButton icon="kakao-symbol.png" />
        <NaverLoginButton icon="naver-symbol.png" />
      </div>
    </main>
  );
}
