import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { putProfile } from '../../lib/api';
import { useProfileStatus } from '../../context/useProfileStatus';
import './Onboarding.css';
import 'leaflet/dist/leaflet.css'; // 지도 스타일

export default function Onboarding() {
  const { user, refresh } = useProfileStatus();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    age: user?.age || '',
    gender: user?.gender || '',
    location: null,          // { lat, lng, accuracy }
    crewChoice: '',          // 'have' | 'create' | 'browse'
  });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setSaving(true);
    try {
      await putProfile({
        nickname: form.nickname?.trim(),
        age: Number(form.age),
        gender: form.gender,
        lat: form.location?.lat ?? null,
        lng: form.location?.lng ?? null,
        accuracy: form.location?.accuracy ?? null,
        crew_choice: form.crewChoice,
      });
      await refresh();
      if (form.crewChoice === 'create') nav('/app/crews/new', { replace: true });
      else if (form.crewChoice === 'browse') nav('/app/crews', { replace: true });
      else nav('/app', { replace: true });
    } catch (e) {
      alert(e.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ob-wrap">
      {step === 1 && (
        <StepProfile value={form} onChange={setForm} onNext={next} />
      )}

      {step === 2 && (
        <StepLocation
          value={form}
          onChange={setForm}
          onBack={back}
          onNext={next}
        />
      )}

      {step === 3 && (
        <section className="ob-card">
          <h2>크루</h2>
          <div className="ob-choices">
            {[
              ['have', '이미 크루가 있어요'],
              ['create', '크루 만들기'],
              ['browse', '크루 찾아보기'],
            ].map(([v, label]) => (
              <label key={v} className={`ob-choice ${form.crewChoice === v ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="crew"
                  value={v}
                  checked={form.crewChoice === v}
                  onChange={(e) => setForm({ ...form, crewChoice: e.target.value })}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="ob-actions">
            <button onClick={back}>이전</button>
            <button
              className="ob-primary"
              onClick={submit}
              disabled={!form.crewChoice || saving}
            >
              {saving ? '저장 중…' : '완료'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepProfile({ value, onChange, onNext }) {
  const canNext =
    value.nickname.trim().length >= 1 &&
    Number(value.age) > 0 &&
    !!value.gender;

  return (
    <section className="ob-card">
      <h2>프로필</h2>

      <div className="ob-form">
        <div className="ob-field">
          <label htmlFor="nickname">별명</label>
          <input
            id="nickname"
            type="text"
            placeholder="예: 번개토끼"
            value={value.nickname}
            onChange={(e) => onChange({ ...value, nickname: e.target.value })}
          />
        </div>

        <div className="ob-field">
          <label htmlFor="age">나이</label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min="1"
            value={value.age}
            onChange={(e) => onChange({ ...value, age: e.target.value })}
          />
        </div>

        <div className="ob-field ob-field-full">
          <label>성별</label>
          <div className="ob-radios">
            {[
              ['female', '여성'],
              ['male', '남성'],
            ].map(([val, label]) => (
              <label key={val} className="ob-radio">
                <input
                  type="radio"
                  name="gender"
                  value={val}
                  checked={value.gender === val}
                  onChange={(e) => onChange({ ...value, gender: e.target.value })}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="ob-actions">
        <button className="ob-primary" disabled={!canNext} onClick={onNext}>
          다음
        </button>
      </div>
    </section>
  );
}

function StepLocation({ value, onChange, onBack, onNext }) {
  const [status, setStatus] = useState('idle'); // idle | pending | ok | error | unsupported
  const [open, setOpen] = useState(false);

  const requestGeo = () => {
    if (!('geolocation' in navigator)) { setStatus('unsupported'); return; }
    setStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        onChange({ ...value, location: { lat, lng, accuracy } });
        setStatus('ok');
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <section className="ob-card">
      <h2>지역 인증</h2>
      <p>현재 위치를 인증하거나 지도로 직접 선택하세요.</p>

      <div className="ob-actions" style={{ justifyContent: 'flex-start' }}>
        <button className="ob-primary" onClick={requestGeo}>현위치로 인증</button>
        <button onClick={() => setOpen(true)}>지도로 직접 선택</button>
      </div>

      {status === 'pending' && <p className="ob-hint">확인 중…</p>}
      {status === 'ok' && value.location && (
        <p className="ob-ok">
          인증됨 ✅ ({value.location.lat.toFixed(5)}, {value.location.lng.toFixed(5)})
        </p>
      )}
      {status === 'error' && <p className="ob-err">실패 ❌ 권한을 허용하고 다시 시도해 주세요.</p>}
      {status === 'unsupported' && <p className="ob-err">이 브라우저는 위치를 지원하지 않아요.</p>}

      <MapPickerModal
        open={open}
        initial={value.location}
        onClose={() => setOpen(false)}
        onPick={(pt) => {
          onChange({ ...value, location: { lat: pt.lat, lng: pt.lng, accuracy: null } });
          setStatus('ok');
          setOpen(false);
        }}
      />

      <div className="ob-actions">
        <button onClick={onBack}>이전</button>
        <button className="ob-primary" onClick={onNext} disabled={!value.location}>다음</button>
      </div>
    </section>
  );
}

/** 지도 선택 모달(Leaflet, React-Leaflet 없이 순수 Leaflet) */
function MapPickerModal({ open, onClose, onPick, initial }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let L;
    (async () => {
      // 동적 로드(번들 초기용량 최소화)
      L = (await import('leaflet')).default;

      // 아이콘(기본 마커가 깨질 수 있어 수동 세팅)
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const el = ref.current;
      if (!el) return;

      const center = initial
        ? [initial.lat, initial.lng]
        : [37.5665, 126.9780]; // 서울시청

      mapRef.current = L.map(el).setView(center, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(center, { icon, draggable: true }).addTo(mapRef.current);

      mapRef.current.on('click', (e) => {
        markerRef.current.setLatLng(e.latlng);
      });
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="ob-modal">
      <div className="ob-modal-body">
        <div ref={ref} className="ob-map" />
        <div className="ob-modal-actions">
          <button onClick={onClose}>취소</button>
          <button
            className="ob-primary"
            onClick={() => {
              const ll = markerRef.current?.getLatLng();
              if (ll) onPick({ lat: ll.lat, lng: ll.lng });
            }}
          >
            이 위치로 선택
          </button>
        </div>
      </div>
    </div>
  );
}
