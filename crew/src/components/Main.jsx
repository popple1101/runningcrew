import KakaoLoginButton from "./KakaoLoginButton";
import "./main.css";

export default function Main() {
  return (
    <main className="page">
      <div className="stack">
        <img
          src="/logo.png" // 또는 import 로 가져와도 됨
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
