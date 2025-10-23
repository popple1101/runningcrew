import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Crews.css';

export default function CrewNew() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    region: '',
    meetingDay: '',
    meetingTime: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('크루 이름을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      // TODO: 실제 API 호출로 크루 생성
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('크루가 생성되었습니다!');
      nav('/app/crews');
    } catch (error) {
      alert('크루 생성 실패: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crew-shell">
      <div className="crew-container crew-form-container">
        <h1>크루 만들기</h1>

        <form onSubmit={handleSubmit} className="crew-form">
          <div className="form-field">
            <label htmlFor="name">크루 이름 *</label>
            <input
              id="name"
              type="text"
              placeholder="예: 서울 러너스"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">크루 소개</label>
            <textarea
              id="description"
              placeholder="크루에 대해 소개해주세요"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-field">
            <label htmlFor="region">활동 지역</label>
            <input
              id="region"
              type="text"
              placeholder="예: 서울 강남구"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="meetingDay">정기 모임 요일</label>
              <select
                id="meetingDay"
                value={form.meetingDay}
                onChange={(e) => setForm({ ...form, meetingDay: e.target.value })}
              >
                <option value="">선택</option>
                <option value="mon">월요일</option>
                <option value="tue">화요일</option>
                <option value="wed">수요일</option>
                <option value="thu">목요일</option>
                <option value="fri">금요일</option>
                <option value="sat">토요일</option>
                <option value="sun">일요일</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="meetingTime">정기 모임 시간</label>
              <input
                id="meetingTime"
                type="time"
                value={form.meetingTime}
                onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav('/app/crews')}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? '생성 중...' : '크루 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

