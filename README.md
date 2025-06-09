# 티스토리 자동화 GUI 시스템 v2.0

GUI 기반의 티스토리 자동 포스팅 시스템입니다. Electron + Node.js + Puppeteer를 활용하여 RSS 피드에서 자동으로 기사를 수집하고 티스토리 블로그에 포스팅합니다.

## 🚀 주요 기능

### ✨ 새로운 기능 (v2.0)
- **allowRepost 옵션**: 기존 기사도 재포스팅 가능
- **OpenAI API 연동**: 한국어 콘텐츠 자동 개선 및 재구성
- **향상된 GUI**: 토스트 메시지 시스템으로 개선된 사용자 경험
- **보안 강화**: 민감한 정보 자동 제거 및 보호
- **안정성 개선**: HTML 모드 실패 시 텍스트 모드 폴백

### 📰 자동화 기능
- RSS 피드 자동 파싱 (Google News, 커스텀 RSS 지원)
- 실제 기사 내용 추출 및 HTML 템플릿 생성
- 중복 기사 자동 필터링
- 자동 스케줄링 (수동, 자동, 예약 실행)
- 실시간 로그 모니터링

### 🤖 AI 기능
- 제목 개선 및 한국어 자연어 스타일 변환
- 콘텐츠 요약 및 재구성
- 자동 태그 생성
- 번역 및 현지화

## 🛠️ 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 설정 파일 생성
```bash
# 예제 설정 파일 복사
cp gui-config.example.json gui-config.json

# 개인 정보 입력
# gui-config.json 파일을 열어서 다음 정보를 입력하세요:
# - 티스토리 계정 정보
# - RSS 피드 URL
# - OpenAI API 키 (선택사항)
```

### 3. 환경변수 설정 (선택사항)
```bash
# .env 파일 생성
TISTORY_ID=your_email@gmail.com
TISTORY_PW=your_password  
BLOG_ADDRESS=https://your-blog.tistory.com
OPENAI_API_KEY=your_openai_api_key
```

### 4. 애플리케이션 실행
```bash
npm start
```

## 📋 사용 방법

### GUI 설정
1. **환경설정 탭**: 티스토리 계정 정보 입력
2. **스케줄 탭**: 실행 모드 및 옵션 설정
   - **기존 기사도 포스팅**: 체크 시 이전 기사도 재포스팅
3. **RSS & 콘텐츠 탭**: RSS 소스 및 필터링 설정
4. **HTML 설정 탭**: 포스팅 템플릿 설정
5. **AI 설정 탭**: OpenAI API 연동 및 기능 설정

### 자동화 실행
- **테스트**: RSS 피드 및 AI 연결 상태 확인
- **시작**: 자동화 프로세스 시작
- **중단**: 실행 중인 프로세스 및 스케줄 중지

## 🔧 고급 설정

### allowRepost 기능
- GUI에서 "기존 기사도 포스팅" 체크박스 활성화
- 새 기사가 없을 때도 과거 기사를 최대 개수만큼 포스팅
- 중복 포스팅 방지 기록 무시

### OpenAI API 연동
```json
{
  "ai": {
    "enabled": true,
    "apiKey": "sk-your-api-key",
    "model": "gpt-3.5-turbo",
    "improveTitle": true,
    "improveContent": true,
    "generateTags": true,
    "translateContent": true
  }
}
```

### HTML 템플릿 옵션
- **Rich**: 풍부한 스타일링 (기본)
- **Simple**: 간단한 스타일링  
- **Minimal**: 최소한의 스타일

## 🚨 문제 해결

### 포스팅 실패 문제
```
에러 출력:  ùٸ ʽϴ.
```
**해결책**: 
1. Puppeteer headless="new" 모드로 업데이트됨
2. HTML 모드 전환 실패 시 자동으로 텍스트 모드로 폴백
3. 한글 인코딩 설정 추가

### API 키 보안 오류
GitHub Push Protection에서 API 키 감지 시:
1. `gui-config.json`이 `.gitignore`에 추가됨
2. `gui-config.example.json` 파일 참조하여 설정
3. 민감한 정보는 로컬에서만 관리

### 환경변수 오류
```bash
# PowerShell에서 환경변수 확인
node -e "console.log('TISTORY_ID:', process.env.TISTORY_ID ? '설정됨' : '미설정')"

# 환경변수 설정
$env:TISTORY_ID="your_email@gmail.com"
$env:TISTORY_PW="your_password"
```

## 📁 파일 구조

```
n8-auto-blog/
├── src/                          # Electron GUI 소스
│   ├── main.js                   # 메인 프로세스
│   ├── preload.js               # Preload 스크립트
│   └── renderer/                # 렌더러 프로세스
├── auto-poster-with-config.js   # 자동화 메인 스크립트
├── tistory-poster-fixed.js      # 티스토리 포스터 (개선됨)
├── enhanced-content-extractor.js # 향상된 콘텐츠 추출기
├── tistory-safe-template.js     # 안전한 HTML 템플릿
├── config.js                    # 기본 설정
├── gui-config.example.json      # 설정 파일 예제
└── test-*.js                    # 테스트 스크립트들
```

## 📊 성능 최적화

- **메모리 최적화**: Puppeteer 인스턴스 적절한 종료
- **네트워크 최적화**: User-Agent 헤더 및 타임아웃 설정
- **오류 처리**: 재시도 로직 및 폴백 메커니즘
- **보안**: 민감한 정보 자동 보호

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## ⚠️ 주의사항

- 이 도구는 교육 및 개인 사용 목적입니다
- 티스토리 이용약관 준수 필요
- OpenAI API 사용 시 요금 발생 가능
- 민감한 정보는 로컬에서만 관리하세요
