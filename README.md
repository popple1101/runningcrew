# 🏃‍♂️ RunCrew - 러닝 크루 플랫폼

> 함께 달리는 즐거움, RunCrew와 함께하세요!

## 📋 프로젝트 개요

RunCrew는 러닝을 사랑하는 사람들이 모여 함께 달릴 수 있는 크루를 만들고 참여할 수 있는 플랫폼입니다.

### ✨ 주요 기능

- 🔐 **소셜 로그인**: 카카오, 네이버 간편 로그인
- 🗺️ **위치 기반 서비스**: GPS를 통한 정확한 위치 인증
- 👥 **크루 시스템**: 크루 생성, 참여, 관리
- 📊 **러닝 기록**: 개인 및 크루 러닝 기록 관리
- 🏆 **랭킹 시스템**: 크루별, 개인별 랭킹
- 📱 **PWA 지원**: 모바일 앱처럼 사용 가능

## 🏗️ 기술 스택

### Frontend
- **React 19** + **Vite**
- **React Router DOM** (라우팅)
- **Leaflet** (지도)
- **PWA** (Progressive Web App)

### Backend
- **Cloudflare Workers** + **Hono**
- **Supabase** (PostgreSQL, Storage)
- **JWT** (Jose 라이브러리)
- **OAuth 2.0** (카카오, 네이버)

### 배포
- **GitHub Pages** (Frontend)
- **Cloudflare Workers** (Backend)
- **Supabase** (Database)

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/popple1101/runningcrew.git
cd runningcrew
```

### 2. Frontend 설정
```bash
cd crew
npm install
npm run dev
```

### 3. Backend 설정
```bash
cd backend
npm install
npm run dev
```

## 📁 프로젝트 구조

```
runningcrew/
├── crew/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── context/      # React Context
│   │   └── lib/          # 유틸리티 함수
│   └── public/           # 정적 파일
├── backend/              # Backend (Cloudflare Workers + Hono)
│   ├── src/              # 메인 엔트리포인트
│   ├── routes/           # API 라우트
│   └── core/             # 핵심 모듈
└── .github/workflows/    # GitHub Actions
```

## 🔧 환경 설정

### Frontend 환경변수
```env
VITE_API_BASE=https://runcrew-backend.popple1101.workers.dev/api
VITE_AUTH_BASE=https://runcrew-backend.popple1101.workers.dev/auth
```

### Backend 환경변수 (wrangler.toml)
```toml
[vars]
JWT_ISSUER = "runcrew.app"
JWT_AUDIENCE = "runcrew-users"
AUTH_SECRET = "your-secret-key"
SUPABASE_URL = "your-supabase-url"
```

## 📱 배포된 사이트

- **Frontend**: [https://popple1101.github.io/runningcrew](https://popple1101.github.io/runningcrew)
- **Backend**: [https://runcrew-backend.popple1101.workers.dev](https://runcrew-backend.popple1101.workers.dev)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 팀원

- **popple1101** - 프로젝트 리더
- **sio60** - 개발자

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
