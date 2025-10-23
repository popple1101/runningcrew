import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Crews.css';

export default function CrewList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 API 호출로 크루 목록 가져오기
    setTimeout(() => {
      setCrews([
        { id: 1, name: '서울 러너스', members: 45, region: '서울 강남구', description: '주 3회 저녁 런닝' },
        { id: 2, name: '새벽 크루', members: 23, region: '서울 마포구', description: '새벽 5시 한강 런닝' },
        { id: 3, name: '주말 러닝클럽', members: 67, region: '서울 송파구', description: '주말 오전 장거리 런닝' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="crew-shell">
        <div className="crew-container">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crew-shell">
      <div className="crew-container">
        <div className="crew-header">
          <h1>크루 찾기</h1>
          <button className="btn btn-primary" onClick={() => nav('/app/crews/new')}>
            크루 만들기
          </button>
        </div>

        <div className="crew-list">
          {crews.map((crew) => (
            <div key={crew.id} className="crew-card">
              <div className="crew-card-header">
                <h3>{crew.name}</h3>
                <span className="crew-members">{crew.members}명</span>
              </div>
              <p className="crew-region">📍 {crew.region}</p>
              <p className="crew-desc">{crew.description}</p>
              <div className="crew-card-actions">
                <button className="btn btn-ghost" onClick={() => nav(`/app/crews/${crew.id}`)}>
                  자세히 보기
                </button>
                <button className="btn btn-primary">가입하기</button>
              </div>
            </div>
          ))}
        </div>

        <div className="crew-footer">
          <button className="btn btn-ghost" onClick={() => nav('/app')}>
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

