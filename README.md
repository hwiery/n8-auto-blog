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

### 1-1. n8n 실행 및 확인
```bash
# n8n 실행 (24시간 자동화를 위해서는 항상 실행 상태 유지 필요)
npx n8n start

# 브라우저에서 n8n 대시보드 접속
# http://localhost:5678

# 환경변수 검증 (선택사항)
node test-scheduled-content.js
```

**⚠️ 중요: n8n은 컴퓨터가 켜져있고 프로세스가 실행 중일 때만 작동합니다!**

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
5. **스케줄링 실행 안됨**: n8n 프로세스 실행 상태 및 워크플로우 활성화 확인

### n8n 관련 문제 해결
1. **n8n이 실행되지 않음**:
   ```bash
   # n8n 프로세스 확인
   Get-Process | Where-Object {$_.ProcessName -like "*n8n*"}
   
   # n8n 재시작
   npx n8n start
   ```

2. **워크플로우가 실행되지 않음**:
   - http://localhost:5678 접속하여 워크플로우 상태 확인
   - 워크플로우 활성화 버튼 클릭
   - Executions 탭에서 실행 이력 확인

3. **스케줄된 시간에 포스팅이 안됨**:
   ```bash
   # 환경변수 확인
   node test-scheduled-content.js
   
   # 수동 실행 테스트
   # n8n 대시보드에서 "Execute Workflow" 클릭
   ```

### 디버깅 팁
```bash
# 브라우저 화면 보기 (headless: false)
# tistory-poster-fixed.js에서 headless: false로 변경

# 상세 로그 확인
node tistory-poster-fixed.js "제목" "내용" 2>&1 | tee debug.log

# 환경변수 전체 확인
node -e "console.log('환경변수 확인:', {TISTORY_ID: !!process.env.TISTORY_ID, TISTORY_PW: !!process.env.TISTORY_PW, BLOG_ADDRESS: !!process.env.BLOG_ADDRESS})"
```

## 📊 모니터링 및 운영

### n8n 대시보드 모니터링
```
URL: http://localhost:5678
주요 확인 사항:
- Workflows: 워크플로우 활성화 상태
- Executions: 실행 이력 및 성공/실패 상태
- Settings: 환경변수 및 설정 확인
```

### 실행 환경별 특징
| 환경 | 장점 | 단점 | 권장 용도 |
|------|------|------|-----------|
| **로컬 실행** | 무료, 즉시 테스트 가능 | 컴퓨터 종료 시 중단 | 개발/테스트 |
| **n8n Cloud** | 24시간 자동 실행, 관리 편의 | 유료 ($20/월~) | 운영 환경 |
| **자체 서버** | 완전한 제어, 비용 효율적 | 서버 관리 필요 | 고급 사용자 |

### 24시간 자동화 방법
1. **n8n Cloud 사용 (권장)**:
   - https://n8n.cloud 가입
   - 워크플로우 업로드
   - 환경변수 설정

2. **로컬 24시간 실행**:
   ```bash
   # Windows 작업 스케줄러 등록
   # 또는 백그라운드 실행
   Start-Process -FilePath "npx" -ArgumentList "n8n", "start" -WindowStyle Hidden
   ```

## 📈 성능 최적화

### n8n 워크플로우 최적화
- **폴링 간격**: RSS 피드 업데이트 빈도에 맞춰 조정 (권장: 1-2시간)
- **LLM 토큰 관리**: 긴 원문의 경우 요약 후 분석
- **에러 재시도**: 네트워크 오류 시 자동 재시도 로직
- **병렬 처리**: 여러 RSS 소스 동시 처리

### 리소스 관리
- **메모리**: Puppeteer 브라우저 인스턴스 적절한 종료
- **네트워크**: 안정적인 인터넷 연결 유지
- **스토리지**: Google Sheets 행 수 관리

## 📅 스케줄링 기능 (NEW!)

### 환경변수 기반 스케줄링
```bash
# 스케줄된 콘텐츠 설정
CONTENTS_NUMBER=1
1_TIME=2025-06-08, 21:22 KST
1_URL=https://notebooklm.google.com/notebook/cd72861d-291e-4341-9478-3f0b2a948a85
1_PROCESSED=false
```

### 사용 방법
1. **워크플로우 가져오기**: `scheduled-content-workflow.json`
2. **환경변수 설정**: 위 형식으로 콘텐츠 스케줄 등록
3. **자동 실행**: 매시간 스케줄 확인 후 자동 포스팅
4. **모니터링**: n8n 대시보드에서 실행 상태 확인

### 지원하는 콘텐츠 소스
- NotebookLM 공유 링크
- 일반 웹사이트 및 블로그
- 뉴스 기사 및 기술 문서

자세한 내용은 `scheduled-content-setup.md` 참조

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
- 대용량 콘텐츠 처리 시 시간이 오래 걸릴 수 있습니다
