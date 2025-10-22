import { supabase } from "../lib/supabase";

export default function KakaoLoginButton() {
  const login = async () => {
    const redirectTo = `${window.location.origin}/runningcrew/`; // GH Pages 베이스
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo }, // <- 여기로 되돌아옴 (콜백은 Supabase가 처리)
    });
    if (error) console.error(error);
  };

  return <button onClick={login}>카카오로 로그인</button>;
}
