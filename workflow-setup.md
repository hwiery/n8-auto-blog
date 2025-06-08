# RSS to Tistory 자동 포스팅 워크플로우 설정 가이드

## 📋 개요
RSS 피드를 모니터링하여 새 글을 감지하고, LLM으로 분석 및 재창조한 후 티스토리에 자동 포스팅하는 완전한 자동화 시스템입니다.

## 🔧 사전 준비사항

### 1. Google Sheets 설정
1. 새 Google Sheets 문서 생성
2. 시트 이름을 `processed_links`로 변경
3. 헤더 설정:
   - A1: `original_link`
   - B1: `post_title`
   - C1: `pub_date`
   - D1: `processed_date`

### 2. Google Service Account 설정
1. Google Cloud Console에서 새 프로젝트 생성
2. Google Sheets API 활성화
3. Service Account 생성 및 JSON 키 다운로드
4. Google Sheets 문서를 Service Account 이메일과 공유

### 3. OpenAI API 설정
1. OpenAI 계정 생성 및 API 키 발급
2. GPT-4 모델 접근 권한 확인

### 4. 티스토리 환경변수 설정
```bash
# n8n 환경변수 설정
export TISTORY_ID="your_tistory_email@gmail.com"
export TISTORY_PW="your_tistory_password"
export BLOG_ADDRESS="https://your-blog.tistory.com"
export RSS_FEED_URL="https://your-rss-feed-url.com/feed"
```

## 🚀 워크플로우 구성

### Step 1: RSS Feed Read
- **노드**: RSS Feed Read
- **URL**: 환경변수 `RSS_FEED_URL` 또는 기본값 Google News
- **기능**: 설정된 RSS 피드의 새 글 감지

### Step 2: Check Processed Links
- **노드**: Google Sheets (Lookup)
- **기능**: 이미 처리된 글인지 확인
- **설정**:
  - Document ID: Google Sheets 문서 ID
  - Sheet Name: `processed_links`
  - Lookup Column: `A`
  - Lookup Value: `={{ $json.link }}`

### Step 3: IF - New Article?
- **노드**: IF
- **조건**: `{{ $node['Check Processed Links'].json.length }} === 0`
- **기능**: 새 글일 경우에만 다음 단계 진행

### Step 4: Extract Full Content
- **노드**: HTTP Request
- **URL**: `={{ $json.link }}`
- **Response Format**: HTML
- **기능**: 원문 페이지의 전체 HTML 가져오기

### Step 5: Parse HTML Content
- **노드**: Code (JavaScript)
- **기능**: HTML에서 본문 텍스트만 추출
- **주요 로직**:
  ```javascript
  // Nielsen Norman Group 사이트의 본문 선택자
  const selectors = [
    'article .article-content',
    '.article-body',
    '.post-content',
    'main article',
    '.content'
  ];
  ```

### Step 6: LLM 1차 분석
- **노드**: OpenAI (GPT-4)
- **기능**: 원문을 한국어로 번역하고 핵심 내용 구조화
- **프롬프트**: UX 리서처 역할로 JSON 형식 분석

### Step 7: LLM 2차 재창조
- **노드**: OpenAI (GPT-4)
- **기능**: 국내 독자를 위한 블로그 포스트 재창조
- **프롬프트**: IT 기획 전문가 역할로 인사이트 추가

### Step 8: Extract Post Data
- **노드**: Code (JavaScript)
- **기능**: LLM 응답에서 제목과 본문 추출

### Step 9: Post to Tistory
- **노드**: Execute Command
- **명령어**: `node tistory-poster-fixed.js "{{ $json.postTitle }}" "{{ $json.postContent }}"`
- **기능**: 티스토리에 자동 포스팅

### Step 10: Save Processed Link
- **노드**: Google Sheets (Append)
- **기능**: 처리된 링크를 Google Sheets에 저장

### Step 11: Success Notification
- **노드**: No Operation
- **기능**: 성공 메시지 출력

## ⚙️ 설정 방법

### 1. n8n 워크플로우 가져오기
1. n8n 대시보드에서 "Import from file" 선택
2. `n8n-workflow.json` 파일 업로드
3. 워크플로우가 성공적으로 가져와졌는지 확인

### 2. 노드별 설정 업데이트

#### Google Sheets 노드들
- `YOUR_GOOGLE_SHEET_ID`를 실제 Google Sheets 문서 ID로 변경
- Service Account 인증 정보 설정

#### OpenAI 노드들
- API 키 설정
- 모델을 `gpt-4`로 설정
- Temperature 및 Max Tokens 확인

#### Execute Command 노드
- 티스토리 스크립트 경로 확인: `/data/tistory-automation/tistory-poster-fixed.js`
- 환경변수 설정 확인

### 3. 트리거 설정
1. RSS Feed Read 노드를 트리거로 설정
2. 폴링 간격 설정 (예: 1시간마다)
3. 워크플로우 활성화

## 🔍 모니터링 및 디버깅

### 로그 확인
- n8n 실행 로그에서 각 단계별 결과 확인
- 오류 발생 시 해당 노드의 출력 데이터 검토

### 일반적인 문제 해결
1. **RSS 피드 읽기 실패**: 네트워크 연결 및 RSS URL 확인
2. **Google Sheets 접근 오류**: Service Account 권한 및 공유 설정 확인
3. **OpenAI API 오류**: API 키 및 사용량 한도 확인
4. **티스토리 포스팅 실패**: 환경변수 및 로그인 정보 확인

### 성능 최적화
- LLM 토큰 사용량 모니터링
- Google Sheets API 호출 횟수 관리
- 워크플로우 실행 빈도 조정

## 📊 예상 결과

### 자동화된 프로세스
1. **새 글 감지**: NNG에 새 글이 올라오면 자동으로 감지
2. **중복 방지**: 이미 처리된 글은 건너뛰기
3. **내용 분석**: LLM이 원문을 분석하고 한국어로 번역
4. **재창조**: 국내 독자를 위한 인사이트 추가
5. **자동 포스팅**: 티스토리에 완성된 글 자동 발행
6. **기록 관리**: 처리된 글 목록을 Google Sheets에 저장

### 품질 보장
- **구조화된 분석**: JSON 형식으로 일관된 분석 결과
- **국내 맞춤화**: 카카오, 토스 등 국내 서비스 사례 포함
- **SEO 최적화**: HTML 형식의 구조화된 콘텐츠
- **인사이트 추가**: 단순 번역을 넘어선 창의적 해석

## 🔄 유지보수

### 정기 점검 항목
- [ ] RSS 피드 URL 유효성 확인
- [ ] Google Sheets 용량 관리
- [ ] OpenAI API 사용량 모니터링
- [ ] 티스토리 로그인 상태 확인
- [ ] 워크플로우 실행 성공률 점검

### 업데이트 가이드
1. **새로운 RSS 소스 추가**: RSS Feed Read 노드 복제 및 URL 변경
2. **프롬프트 개선**: OpenAI 노드의 프롬프트 텍스트 수정
3. **포스팅 형식 변경**: LLM 2차 재창조 노드의 출력 형식 조정
4. **알림 기능 추가**: Slack, Discord 등 알림 노드 연결

이 워크플로우를 통해 고품질의 UX 인사이트 콘텐츠를 자동으로 생성하고 발행할 수 있습니다! 