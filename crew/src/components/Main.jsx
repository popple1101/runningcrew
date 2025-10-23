// src/components/Main.jsx
import React, { useState } from "react";
import KakaoLoginButton from "./KakaoLoginButton";
import NaverLoginButton from "./NaverLoginButton";
import AuthModal from "./AuthModal";
import "./main.css";

const BASE = import.meta.env.BASE_URL || "/";
const asset = (p) =>
  /^https?:\/\//.test(p) ? p : `${BASE}${p.replace(/^\//, "")}`;

export default function Main() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const openLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  return (
    <main className="page">
      <div className="stack">
        <img
          src={asset("logo.png")}
          alt="RunPick"
          className="logo"
          width="360"
          height="108"
          loading="eager"
          decoding="async"
        />
        
        {/* 소셜 로그인 */}
        <KakaoLoginButton icon="kakao-symbol.png" />
        <NaverLoginButton icon="naver-symbol.png" />

        {/* 구분선 */}
        <div className="divider">
          <span>또는</span>
        </div>

        {/* 일반 로그인/회원가입 버튼 */}
        <div className="auth-buttons">
          <button className="email-btn login-btn" onClick={openLogin}>
            이메일로 로그인
          </button>
          <button className="email-btn signup-btn" onClick={openSignup}>
            이메일로 회원가입
          </button>
        </div>
      </div>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </main>
  );
}
