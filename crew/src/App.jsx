import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Protected from "./routes/Protected";
import ProfileGate from "./routes/ProfileGate";                 // ✅ 추가
import Main from "./components/Main";
import AppPage from "./pages/AppPage";
import Onboarding from "./pages/Onboarding/Onboarding";         // ✅ 추가
import "./components/main.css";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env?.BASE_URL || "/"}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Main />} />

          {/* 온보딩 페이지 (로그인 후, 미완성 프로필이면 여기로 이동) */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* 앱 보호 라우팅 + 프로필 검사 게이트 */}
          <Route
            path="/app"
            element={
              <Protected>
                <ProfileGate>
                  <AppPage />
                </ProfileGate>
              </Protected>
            }
          />

          {/* 기타 → 메인 */}
          <Route path="*" element={<Main />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
