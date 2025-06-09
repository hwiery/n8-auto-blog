# 🚀 티스토리 자동화 설정 완료 가이드

## ✅ 현재 완료된 설정

### 1. 기본 환경 설정 ✅
- [x] 의존성 설치 완료 (`puppeteer`, `dotenv`)
- [x] 환경변수 설정 완료 (`.env` 파일)
- [x] 독립 실행 스크립트 테스트 성공

### 2. 스크립트 수정 완료 ✅
- [x] `tistory-poster-fixed.js`에 dotenv 설정 추가
- [x] `tistory-poster-n8n.js`에 dotenv 설정 추가
- [x] `run-scheduled-posting.js`에 dotenv 설정 추가

### 3. 테스트 완료 ✅
- [x] 독립 실행 스크립트로 티스토리 포스팅 성공
- [x] 환경변수 검증 완료
- [x] 모든 필수 파일 존재 확인

## 🔄 다음 단계: n8n 워크플로우 설정

### 1. n8n 실행 확인
```bash
# n8n 프로세스 확인
ps aux | grep n8n

# n8n 재시작 (필요시)
npx n8n start
```

### 2. n8n 대시보드 접속
- 브라우저에서 http://localhost:5678 접속
- 초기 설정 완료 (사용자 계정 생성)

### 3. 워크플로우 가져오기
1. "Import from file" 또는 "+" 버튼 클릭
2. `n8n-workflow.json` 파일 업로드
3. 워크플로우 가져오기 완료 확인

### 4. 필수 설정 업데이트

#### Google Sheets 설정 (선택사항)
```bash
# Google Sheets 문서 ID 환경변수 추가 (.env 파일에)
GOOGLE_SHEETS_DOCUMENT_ID=your_google_sheet_id
```

#### OpenAI API 설정 (LLM 기능용)
- OpenAI API 키 발급
- n8n의 OpenAI 노드에 API 키 설정

### 5. 워크플로우 활성화
- 워크플로우 우상단의 "Active" 토글 활성화
- 스케줄 설정 (예: 1시간마다 실행)

## 🎯 현재 사용 가능한 기능

### 1. 독립 실행 스크립트 ✅
```bash
# 즉시 포스팅
node tistory-poster-fixed.js "제목" "HTML내용"

# 예시
node tistory-poster-fixed.js "테스트 포스팅" "<h2>제목</h2><p>내용</p>"
```

### 2. 스케줄된 포스팅 ✅
```bash
# 환경변수로 스케줄 설정 후 실행
node run-scheduled-posting.js
```

### 3. n8n 워크플로우 (설정 후 사용 가능)
- RSS 피드 자동 모니터링
- LLM 기반 콘텐츠 분석 및 재창조
- 자동 포스팅 및 중복 방지

## 🔧 문제 해결

### n8n 접속 안됨
```bash
# 포트 확인
lsof -i :5678

# n8n 재시작
pkill -f n8n
npx n8n start
```

### 환경변수 문제
```bash
# 환경변수 확인
node test-n8n-setup.js
```

### 포스팅 실패
```bash
# 브라우저 화면 보기 (디버깅)
# tistory-poster-fixed.js에서 headless: false로 변경
```

## 📊 성능 모니터링

### 실행 로그 확인
- n8n 대시보드의 "Executions" 탭
- 각 노드별 실행 결과 및 오류 확인

### 리소스 사용량
- 메모리: Puppeteer 브라우저 인스턴스
- 네트워크: RSS 피드 및 API 호출
- 스토리지: 로그 및 임시 파일

## 🎉 완료!

현재 티스토리 자동화 시스템이 성공적으로 설정되었습니다!

**즉시 사용 가능:**
- 독립 실행 스크립트로 수동 포스팅
- 스케줄된 콘텐츠 자동 포스팅

**추가 설정 후 사용 가능:**
- n8n 워크플로우를 통한 완전 자동화
- RSS 피드 모니터링 및 LLM 기반 콘텐츠 생성

문의사항이 있으시면 README.md의 문제 해결 섹션을 참조하세요! 