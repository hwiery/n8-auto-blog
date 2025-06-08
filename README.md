# 티스토리 자동화 프로젝트

RSS 피드를 모니터링하여 새 글을 감지하고, LLM으로 분석 및 재창조한 후 티스토리에 자동 포스팅하는 완전한 자동화 시스템입니다.

## 📋 프로젝트 구성

### 🤖 n8n 워크플로우 (권장)
- **파일**: `n8n-workflow.json`
- **설명**: RSS 피드 모니터링부터 티스토리 포스팅까지의 완전 자동화
- **특징**: 
  - LLM 기반 콘텐츠 분석 및 재창조
  - 중복 포스팅 방지
  - Google Sheets 연동
  - 에러 핸들링 및 알림

### 🔧 독립 실행 스크립트
- **파일**: `tistory-poster-fixed.js` (최신 안정 버전)
- **설명**: 단독으로 실행 가능한 티스토리 포스팅 스크립트
- **사용법**: `node tistory-poster-fixed.js "제목" "내용"`

## 🚀 빠른 시작 (n8n 워크플로우)

### 1. 사전 준비
```bash
# 의존성 설치
npm install puppeteer dotenv

# 환경변수 설정 (.env 파일 생성)
TISTORY_ID=your_email@gmail.com
TISTORY_PW=your_password
BLOG_ADDRESS=https://your-blog.tistory.com
RSS_FEED_URL=https://news.google.com/rss?topic=h&hl=ko&gl=KR&ceid=KR:ko
```

### 2. Google Sheets 설정
1. 새 Google Sheets 문서 생성
2. 시트 이름을 `processed_links`로 변경
3. 헤더 설정:
   - A1: `original_link`
   - B1: `post_title`
   - C1: `pub_date`
   - D1: `processed_date`

### 3. n8n 워크플로우 가져오기
1. n8n 대시보드에서 "Import from file" 선택
2. `n8n-workflow.json` 파일 업로드
3. 노드별 설정 업데이트:
   - Google Sheets 문서 ID
   - OpenAI API 키
   - 환경변수 확인

### 4. 워크플로우 테스트
```bash
# 테스트 스크립트 실행
node test-n8n-workflow.js
```

## 📊 워크플로우 단계

### Step 1: RSS Feed Read
- **기능**: 설정된 RSS 피드 모니터링
- **기본값**: Google News (한국어)
- **설정**: `RSS_FEED_URL` 환경변수로 변경 가능
- **트리거**: 주기적 실행 (예: 1시간마다)

### Step 2: 중복 확인
- **기능**: Google Sheets에서 이미 처리된 글인지 확인
- **방법**: 원문 링크 기준 중복 검사

### Step 3: 원문 추출
- **기능**: RSS 요약이 아닌 전체 원문 추출
- **방법**: HTTP Request + HTML 파싱

### Step 4: LLM 1차 분석
- **기능**: 원문을 한국어로 번역하고 핵심 내용 구조화
- **모델**: GPT-4
- **출력**: JSON 형식의 구조화된 분석 결과

### Step 5: LLM 2차 재창조
- **기능**: 국내 독자를 위한 블로그 포스트 재창조
- **특징**: 
  - 카카오, 토스 등 국내 서비스 사례 추가
  - [인사이트+] 섹션으로 독창적 해석 제공
  - SEO 최적화된 HTML 구조

### Step 6: 티스토리 포스팅
- **기능**: 완성된 콘텐츠를 티스토리에 자동 발행
- **방법**: Puppeteer 기반 브라우저 자동화

### Step 7: 처리 기록
- **기능**: 처리된 글 정보를 Google Sheets에 저장
- **목적**: 중복 방지 및 이력 관리

## 🔧 파일 설명

### 핵심 파일
- `n8n-workflow.json`: n8n 워크플로우 정의 파일
- `tistory-poster-n8n.js`: n8n용 최적화된 티스토리 포스터
- `tistory-poster-fixed.js`: 독립 실행용 안정 버전
- `test-n8n-workflow.js`: 워크플로우 테스트 스크립트
- `workflow-setup.md`: 상세 설정 가이드

## ⚙️ 환경 설정

### 필수 환경변수
```bash
# 티스토리 계정 정보
TISTORY_ID=your_email@gmail.com
TISTORY_PW=your_password
BLOG_ADDRESS=https://your-blog.tistory.com

# RSS 피드 URL (선택사항, 기본값: Google News)
RSS_FEED_URL=https://your-rss-feed-url.com/feed

# OpenAI API (n8n 워크플로우용)
OPENAI_API_KEY=your_openai_api_key

# Google Sheets (n8n 워크플로우용)
GOOGLE_SHEETS_DOCUMENT_ID=your_sheet_id
```

### .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 위 환경변수들을 설정하세요.

### PowerShell에서 환경변수 설정 (Windows)
```powershell
$env:TISTORY_ID="your_email@gmail.com"
$env:TISTORY_PW="your_password"
$env:BLOG_ADDRESS="https://your-blog.tistory.com"
$env:RSS_FEED_URL="https://your-rss-feed-url.com/feed"
```

## 🧪 테스트

### 독립 스크립트 테스트
```bash
# 기본 테스트
node tistory-poster-fixed.js "테스트 제목" "<p>테스트 내용</p>"

# 환경변수 확인
node -e "console.log('TISTORY_ID:', process.env.TISTORY_ID ? '설정됨' : '미설정')"
```

### n8n 워크플로우 테스트
```bash
# 전체 워크플로우 시뮬레이션
node test-n8n-workflow.js

# 개별 컴포넌트 테스트
node -e "require('./test-n8n-workflow').testLLMResponseParsing()"
```

## 🔍 문제 해결

### 일반적인 문제
1. **로그인 실패**: 티스토리 계정 정보 및 2단계 인증 확인
2. **모달 처리 실패**: headless: false로 설정하여 브라우저 동작 확인
3. **환경변수 오류**: .env 파일 또는 시스템 환경변수 설정 확인
4. **Navigation timeout**: 네트워크 연결 및 페이지 로딩 시간 확인

### 디버깅 팁
```bash
# 브라우저 화면 보기 (headless: false)
# tistory-poster-fixed.js에서 headless: false로 변경

# 상세 로그 확인
node tistory-poster-fixed.js "제목" "내용" 2>&1 | tee debug.log

# 환경변수 전체 확인
node -e "console.log('환경변수 확인:', {TISTORY_ID: !!process.env.TISTORY_ID, TISTORY_PW: !!process.env.TISTORY_PW, BLOG_ADDRESS: !!process.env.BLOG_ADDRESS})"
```

## 📈 성능 최적화

### n8n 워크플로우 최적화
- **폴링 간격**: RSS 피드 업데이트 빈도에 맞춰 조정 (권장: 1-2시간)
- **LLM 토큰 관리**: 긴 원문의 경우 요약 후 분석
- **에러 재시도**: 네트워크 오류 시 자동 재시도 로직
- **병렬 처리**: 여러 RSS 소스 동시 처리

### 리소스 관리
- **메모리**: Puppeteer 브라우저 인스턴스 적절한 종료
- **API 호출**: OpenAI API 사용량 모니터링
- **스토리지**: Google Sheets 행 수 관리

## 🔄 확장 가능성

### 추가 기능 아이디어
1. **다중 RSS 소스**: UX Planet, Smashing Magazine 등 추가
2. **카테고리 자동 분류**: 콘텐츠 내용 기반 카테고리 설정
3. **이미지 자동 생성**: DALL-E API 연동으로 썸네일 생성
4. **소셜 미디어 연동**: 트위터, 링크드인 자동 공유
5. **SEO 최적화**: 메타 태그, 구조화된 데이터 자동 생성

### 다른 플랫폼 지원
- **네이버 블로그**: 네이버 블로그 API 연동
- **브런치**: 브런치 자동 포스팅 추가
- **미디엄**: Medium API 연동
- **워드프레스**: WordPress REST API 활용

## 🤝 기여하기

1. 이 저장소를 Fork 하세요
2. 새로운 기능 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성하세요

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## ⚠️ 주의사항

- 이 도구는 교육 및 개인 사용 목적으로 제작되었습니다
- 티스토리 이용약관을 준수하여 사용하세요
- RSS 피드 제공자의 이용약관을 확인하세요
- OpenAI API 사용량에 따른 비용이 발생할 수 있습니다
