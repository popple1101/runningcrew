import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return user ? (
    <div>
      <p>반갑습니다, {user.user_metadata?.name || user.email || user.id}</p>
      <button onClick={() => supabase.auth.signOut()}>로그아웃</button>
    </div>
  ) : (
    <div>
      <p>로그인 필요</p>
      {/* 카카오 버튼 컴포넌트 붙이기 */}
    </div>
  );
}
