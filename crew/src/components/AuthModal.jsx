import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postSignup, postLogin } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    nickname: '',
  });
  const { refresh } = useAuth();
  const nav = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        await postSignup(form.email, form.password, form.nickname);
        alert('회원가입 성공! 로그인됩니다.');
      } else {
        await postLogin(form.email, form.password);
      }
      
      await refresh(); // 세션 갱신
      onClose();
      nav('/app'); // 메인 앱으로 이동
    } catch (error) {
      alert(error.message || '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setForm({ email: '', password: '', nickname: '' });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                type="text"
                placeholder="닉네임 (2~30자)"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                required
                minLength={2}
                maxLength={30}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? '영문+숫자 8자 이상' : '비밀번호'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              아직 계정이 없으신가요?{' '}
              <button onClick={switchMode} className="auth-link">
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button onClick={switchMode} className="auth-link">
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

