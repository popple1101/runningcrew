export default function KakaoLoginButton({ icon = "/kakao-symbol.png" }) {
  const loginUrl = `${import.meta.env.VITE_API_BASE}/auth/kakao`;

  return (
    <a href={loginUrl} className="kakao-btn" aria-label="카카오로 시작하기">
      {/* PNG/SVG 아무거나 가능. 색 강제하고 싶으면 아래 '마스크 방식' 주석 참고 */}
      <img
        src={icon}
        alt=""
        className="kakao-icon"
        width="22"
        height="22"
        aria-hidden="true"
      />
      <span className="kakao-label">카카오로 시작하기</span>
    </a>
  );
}

/*
아이콘을 무조건 검정 단색으로 보이게 하고 싶다면:

1) 위의 <img .../> 대신 <span className="kakao-icon-mask" aria-hidden="true" /> 사용
2) main.css에 .kakao-icon-mask 스타일 주석 해제
*/
