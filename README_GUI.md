# 티스토리 자동화 관리자 v2.0

🚀 **크로스 플랫폼 지원 티스토리 블로그 자동 포스팅 GUI 애플리케이션**

Windows, macOS, Linux에서 모두 사용할 수 있는 직관적인 그래픽 인터페이스로 티스토리 블로그 자동화를 간편하게 관리하세요.

![티스토리 자동화 관리자](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Electron](https://img.shields.io/badge/Electron-28.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 주요 기능

### 🕐 **스마트 스케줄링**
- **수동 실행**: 원하는 시점에 직접 실행
- **자동 실행**: 다양한 간격으로 자동 포스팅
  - 매시간 정각
  - 매일 오전 9시
  - 30분마다
  - 하루 3번 (오전 9시, 오후 1시, 오후 6시)
  - 평일 오전 9시
  - 커스텀 Cron 표현식
- **일시 지정 실행**: 특정 날짜와 시간에 실행
  - 한 번만 실행
  - 매일 반복
  - 매주 반복
  - 매월 반복

### 🎨 **HTML 템플릿 시스템**
- **Rich 템플릿**: 풍부한 스타일링과 그라데이션 효과
- **Simple 템플릿**: 깔끔하고 간단한 디자인
- **Minimal 템플릿**: 최소한의 스타일링
- **Plain 템플릿**: 텍스트만 포함
- **실시간 미리보기**: 템플릿 적용 결과를 즉시 확인
- **고급 옵션**: 이미지 포함, 자동 단락 생성, 출처 링크 추가

### 🤖 **AI 기반 콘텐츠 개선**
- **제목 개선**: OpenAI API로 더 매력적인 제목 생성
- **내용 개선**: 가독성과 품질 향상
- **태그 자동 생성**: 적절한 태그 추천
- **요약 추가**: 기사 요약 자동 생성
- **번역 기능**: 다국어 콘텐츠 번역
- **모델 선택**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo 지원

### 📰 **다양한 RSS 소스 지원**
- **Google News 한국**: 국내 주요 뉴스
- **카테고리별 뉴스**: 
  - 주요 뉴스 (h)
  - 세계 뉴스 (w)
  - 국내 뉴스 (n)
  - 비즈니스 (b)
  - 기술 (t)
  - 엔터테인먼트 (e)
  - 스포츠 (s)
  - 과학 (snc)
  - 건강 (m)
- **커스텀 RSS**: 사용자 정의 RSS 피드 URL
- **키워드 필터링**: 포함/제외 키워드 설정
- **언론사명 제거**: 제목에서 자동으로 언론사명 삭제
- **최소 내용 길이**: 품질 보장을 위한 최소 글자 수 설정

## 🖥️ 크로스 플랫폼 지원

### Windows
- Windows 10/11 (x64, x86)
- NSIS 설치 프로그램
- 포터블 버전 제공
- 시작 메뉴 및 바탕화면 바로가기 생성

### macOS
- macOS 10.14 이상
- Intel (x64) 및 Apple Silicon (ARM64) 지원
- DMG 디스크 이미지
- 다크 모드 지원
- Notarization 완료

### Linux
- Ubuntu, Debian (DEB 패키지)
- CentOS, RHEL, Fedora (RPM 패키지)
- Universal AppImage
- x64 아키텍처 지원

## 📥 설치 방법

### 소스에서 설치
```bash
# 저장소 클론
git clone https://github.com/your-username/tistory-automation-gui.git
cd tistory-automation-gui

# 의존성 설치
npm install

# 애플리케이션 실행
npm start
```

### 패키지 빌드
```bash
# 모든 플랫폼용 빌드
npm run build:all

# 개별 플랫폼 빌드
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 🚀 빠른 시작

### 1. 기본 설정
1. **환경설정** 탭에서 티스토리 계정 정보 입력:
   - 아이디
   - 비밀번호
   - 블로그 주소

### 2. RSS 소스 설정
1. **콘텐츠 설정** 탭에서:
   - RSS 소스 타입 선택
   - 카테고리 선택 (Google News의 경우)
   - 또는 커스텀 RSS URL 입력
   - 키워드 필터 설정 (선택사항)

### 3. 스케줄 설정
1. **스케줄 설정** 탭에서:
   - 실행 모드 선택 (수동/자동/일시 지정)
   - 자동 실행 시 스케줄 타입 선택
   - 일시 지정 시 날짜와 시간 설정
   - 최대 기사 수 및 포스팅 간격 설정

### 4. HTML 및 AI 설정
1. **HTML 설정** 탭에서:
   - HTML 모드 활성화/비활성화
   - 템플릿 선택 및 미리보기
   - 이미지 포함, 자동 단락 등 옵션 설정

2. **AI 설정** 탭에서:
   - OpenAI API 키 입력
   - AI 모델 선택
   - 사용할 AI 기능 선택

### 5. 실행 및 모니터링
1. **대시보드**에서:
   - 현재 설정 확인
   - 시작/중지/테스트 버튼으로 제어
   - 실시간 로그 모니터링

## 📋 시스템 요구사항

### 최소 요구사항
- **CPU**: 듀얼 코어 1.6GHz 이상
- **RAM**: 4GB 이상
- **디스크**: 500MB 여유 공간
- **인터넷**: 안정적인 인터넷 연결

### 권장 요구사항
- **CPU**: 쿼드 코어 2.0GHz 이상
- **RAM**: 8GB 이상
- **디스크**: 1GB 여유 공간
- **인터넷**: 고속 인터넷 연결

### 소프트웨어 요구사항
- **Node.js**: 18.0.0 이상
- **Chrome/Chromium**: 자동 설치됨 (Puppeteer)

## 🔧 고급 설정

### 환경 변수
`.env` 파일을 생성하여 기본값을 설정할 수 있습니다:

```env
TISTORY_ID=your_id
TISTORY_PW=your_password
BLOG_ADDRESS=your_blog_address
RSS_FEED_URL=https://news.google.com/rss?topic=h&gl=KR&ceid=KR:ko
OPENAI_API_KEY=your_openai_api_key
DEBUG_MODE=false
HEADLESS_MODE=true
```

### 설정 파일
GUI에서 변경한 설정은 `gui-config.json`에 자동 저장됩니다.

### 로그 파일
애플리케이션 로그는 `automation.log` 파일에 저장됩니다.

## 🛠️ 개발자 가이드

### 프로젝트 구조
```
tistory-automation-gui/
├── src/
│   ├── main.js              # Electron 메인 프로세스
│   ├── preload.js           # IPC 브릿지
│   ├── renderer/
│   │   ├── index.html       # GUI HTML
│   │   ├── style.css        # 스타일시트
│   │   └── script.js        # 렌더러 프로세스 로직
│   └── assets/
│       ├── icon.png         # Linux 아이콘
│       ├── icon.ico         # Windows 아이콘
│       └── icon.icns        # macOS 아이콘
├── build/                   # 빌드 리소스
├── auto-poster-with-config.js # 자동화 스크립트
├── config.js                # 통합 설정 파일
├── package.json             # 패키지 정보
└── README_GUI.md           # 이 파일
```

### 개발 환경 설정
```bash
# 개발 모드로 실행 (DevTools 자동 열림)
npm run dev

# 패키지만 빌드 (실행 파일 생성하지 않음)
npm run pack
```

### IPC 통신
렌더러와 메인 프로세스 간 통신은 `preload.js`를 통해 안전하게 이루어집니다:

```javascript
// 렌더러에서 메인 프로세스 함수 호출
const result = await window.electronAPI.startAutomation(config);

// 메인 프로세스에서 렌더러로 이벤트 전송
window.electronAPI.onLogMessage((message) => {
    console.log('로그:', message);
});
```

## 🐛 문제 해결

### 일반적인 문제들

**Q: 크롬 브라우저가 실행되지 않아요**
A: Puppeteer가 자동으로 Chromium을 다운로드합니다. 인터넷 연결을 확인하고 방화벽 설정을 점검해주세요.

**Q: OpenAI API 오류가 발생해요**
A: API 키가 올바른지 확인하고, 계정에 충분한 크레딧이 있는지 확인해주세요.

**Q: RSS 피드를 읽을 수 없어요**
A: RSS URL이 유효한지 확인하고, 해당 사이트가 접근 가능한지 확인해주세요.

**Q: 티스토리 로그인이 안 돼요**
A: 계정 정보가 정확한지 확인하고, 2단계 인증이 비활성화되어 있는지 확인해주세요.

### 로그 확인
- GUI의 **로그** 탭에서 실시간 로그 확인
- `automation.log` 파일에서 상세 로그 확인
- 개발자 도구 (F12)에서 브라우저 로그 확인

### 디버그 모드
환경설정에서 디버그 모드를 활성화하면 더 자세한 로그를 확인할 수 있습니다.

## 🔒 보안 및 개인정보

- 모든 계정 정보는 로컬에만 저장됩니다
- 암호는 평문으로 저장되므로 보안에 주의해주세요
- OpenAI API 키는 안전하게 관리해주세요
- 공용 컴퓨터에서 사용 시 주의가 필요합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조해주세요.

## 🤝 기여하기

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📞 지원

- **Issues**: [GitHub Issues](https://github.com/your-username/tistory-automation-gui/issues)
- **토론**: [GitHub Discussions](https://github.com/your-username/tistory-automation-gui/discussions)

---

**티스토리 자동화 관리자**는 블로거들의 생산성 향상을 위해 개발되었습니다. 
여러분의 피드백과 제안으로 더 나은 도구로 발전시켜 나가겠습니다! 🎉 