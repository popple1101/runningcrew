# 카카오 로그인 설정 가이드

## 🔧 카카오 개발자 콘솔 설정

### 1. 카카오 개발자 콘솔 접속
https://developers.kakao.com

### 2. 내 애플리케이션 선택
- RunCrew 또는 사용 중인 앱 클릭

### 3. Redirect URI 설정 (가장 중요!)
**앱 설정 > 플랫폼 > Web**

아래 URI를 **정확히** 등록하세요:
```
https://runcrew-backend.popple1101.workers.dev/auth/kakao/callback
```

⚠️ **주의사항:**
- 끝에 `/` 없이
- `https://`로 시작
- 대소문자 정확히 일치
- 공백 없이

### 4. Client Secret 확인 (선택)
**앱 설정 > 보안**
- "Client Secret" 사용 여부 확인
- 사용 중이면 wrangler secret에 저장 필요

### 5. REST API 키 확인
**앱 설정 > 앱 키**
- "REST API 키" 복사
- 이게 KAKAO_CLIENT_ID입니다

---

## 🚨 현재 에러 원인

`invalid_grant` 에러 = Redirect URI 불일치

### 체크리스트:
- [ ] 카카오 콘솔에 정확한 Redirect URI 등록됨
- [ ] wrangler.toml의 KAKAO_REDIRECT_URI가 동일함
- [ ] REST API 키가 KAKAO_CLIENT_ID secret에 저장됨
- [ ] 앱이 "활성화" 상태임

