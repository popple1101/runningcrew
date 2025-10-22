import { useAuth } from "../context/AuthContext";

export default function AppPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h1>RunPick</h1>
      <p>
        <b>{user?.nickname ?? "Runner"}</b> 님 환영!
      </p>
      {user?.photo_url && (
        <img
          src={user.photo_url}
          alt="avatar"
          width="48"
          height="48"
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
      )}
      <div style={{ marginTop: 16 }}>
        <button onClick={logout}>로그아웃</button>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <ul>
        <li>크루모집</li>
        <li>크루원모집</li>
        <li>크루랭킹</li>
        <li>리뷰화면</li>
      </ul>
    </div>
  );
}
