# 🚀 간단한 티스토리 자동화 시스템 가이드

구글 시트나 OpenAI API 없이 작동하는 완전한 티스토리 자동화 시스템입니다.

## ✨ 주요 개선사항 (v2.0)

### 🎨 HTML 양식 개선
- **인라인 CSS 스타일**: 티스토리에서 완벽하게 렌더링되는 스타일 적용
- **반응형 디자인**: 모바일과 데스크톱에서 모두 보기 좋은 레이아웃
- **시각적 구조화**: 색상과 여백을 활용한 가독성 향상

### 🔍 내용 검증 시스템
- **자동 품질 검사**: 포스팅 전 내용과 구조 검증
- **필수 요소 확인**: 제목, 발행일, 원문 링크, 본문 내용 검증
- **HTML 구조 검증**: 올바른 태그 구조와 스타일 적용 확인

### 📰 제목 정리 기능
- **언론사명 자동 제거**: "- 한겨레", "| 조선일보" 등 자동 삭제
- **깔끔한 제목**: 핵심 내용만 남긴 간결한 제목

### 🔧 향상된 내용 추출
- **정교한 텍스트 처리**: 불필요한 요소 제거 및 의미있는 문장만 추출
- **리다이렉트 처리**: Google News 리다이렉트 자동 처리
- **에러 복구**: 내용 추출 실패 시 RSS 설명 사용

## 📋 시스템 구성

### 핵심 파일들
- `simple-auto-poster.js`: 메인 자동화 스크립트 (개선됨)
- `scheduler.js`: 스케줄링 시스템
- `test-content-format.js`: HTML 양식 테스트 도구 (신규)
- `setup-background.sh`: 백그라운드 실행 설정
- `processed_articles.json`: 중복 방지용 처리 기록

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 의존성 설치 (이미 완료된 경우 생략)
npm install

# 환경변수 확인 (.env 파일)
TISTORY_ID=your_email@gmail.com
TISTORY_PW=your_password
BLOG_ADDRESS=https://your-blog.tistory.com
RSS_FEED_URL=https://news.google.com/rss?topic=h&hl=ko&gl=KR&ceid=KR:ko
```

### 2. HTML 양식 테스트
```bash
# 새로운 HTML 양식 테스트
node test-content-format.js

# 생성된 HTML 파일 확인
open test-output.html  # macOS
```

### 3. 실제 포스팅 테스트
```bash
# 한 번 실행 (최대 3개 기사)
node simple-auto-poster.js

# 처리 기록 초기화 (새로운 테스트용)
echo "[]" > processed_articles.json
```

### 4. 스케줄링 설정
```bash
# 다양한 스케줄 옵션으로 실행
node scheduler.js hourly          # 매시간
node scheduler.js daily_9am       # 매일 오전 9시
node scheduler.js every_30min     # 30분마다
node scheduler.js three_times_daily # 하루 3번
node scheduler.js weekdays_9am    # 평일 오전 9시만
```

### 5. 백그라운드 실행 (macOS)
```bash
# LaunchAgent 설정
chmod +x setup-background.sh
./setup-background.sh

# 상태 확인
launchctl list | grep tistory
```

## 🎨 새로운 HTML 양식 미리보기

### 개선된 포스트 구조
```html
<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <!-- 제목 섹션 (파란색 강조선) -->
  <div style="border-left: 4px solid #007bff; padding-left: 20px;">
    <h2 style="color: #007bff;">깔끔한 제목 (언론사명 제거됨)</h2>
  </div>
  
  <!-- 메타 정보 (회색 배경) -->
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
    <p>📅 발행일: 2025. 6. 9.</p>
    <p>🔗 원문 보기: <a href="...">기사 원문 링크</a></p>
  </div>
  
  <!-- 본문 내용 -->
  <div>
    <h3 style="border-bottom: 2px solid #eee;">📰 주요 내용</h3>
    <p>의미있는 문장들로 구성된 본문...</p>
  </div>
  
  <!-- 푸터 정보 -->
  <div style="border-top: 1px solid #eee; text-align: center;">
    <p>📌 구글 뉴스 자동 수집 기사</p>
    <p>⏰ 자동 포스팅 시간</p>
  </div>
</div>
```

## 🔍 품질 검증 시스템

### 자동 검증 항목
1. **제목 검증**
   - 최소 5자 이상
   - 최대 100자 이하
   - 언론사명 자동 제거

2. **내용 검증**
   - 최소 50자 이상의 의미있는 내용
   - HTML 구조 완성도 확인
   - 필수 요소 포함 여부

3. **HTML 구조 검증**
   - 올바른 div 태그 구조
   - 인라인 스타일 적용
   - 모든 태그 정상 닫힘

### 검증 실패 시 동작
- 문제가 있는 기사는 자동으로 건너뜀
- 상세한 오류 메시지 출력
- 다음 기사로 자동 진행

## 📊 실행 결과 예시

```
🧪 HTML 양식과 내용 테스트 시작...

1. 제목 정리 테스트:
원본: AI 기술 발전으로 새로운 시대 열려 - 테크뉴스
정리됨: AI 기술 발전으로 새로운 시대 열려

2. HTML 내용 생성 테스트:
HTML 길이: 1496 자

3. 내용 검증:
✅ 제목 포함: 성공
✅ 발행일 포함: 성공
✅ 원문 링크 포함: 성공
✅ 주요 내용 포함: 성공
✅ 스타일 적용: 성공
✅ 본문 내용 포함: 성공

4. HTML 구조 검증:
✅ 시작 div 태그: 성공
✅ 종료 div 태그: 성공
✅ 제목 태그: 성공
✅ 내용 태그: 성공

🎯 전체 테스트 결과: ✅ 성공
```

## 🛠️ 문제 해결

### 일반적인 문제들

1. **내용이 비어있는 포스팅**
   - ✅ **해결됨**: 내용 검증 시스템으로 자동 차단
   - 최소 50자 이상의 의미있는 내용 보장

2. **HTML 양식이 깨짐**
   - ✅ **해결됨**: 인라인 CSS 스타일 적용
   - 티스토리에서 완벽하게 렌더링

3. **제목에 언론사명 포함**
   - ✅ **해결됨**: 자동 언론사명 제거 기능
   - 다양한 패턴 지원 (-, |, /, ·, [] 등)

4. **중복 포스팅**
   - ✅ **해결됨**: JSON 파일 기반 중복 방지
   - 기사 ID 기반 정확한 중복 검사

### 디버깅 도구

```bash
# HTML 양식 테스트
node test-content-format.js

# RSS 피드 테스트
node test-rss.js

# 환경변수 확인
node -e "console.log('환경변수:', {
  TISTORY_ID: !!process.env.TISTORY_ID,
  TISTORY_PW: !!process.env.TISTORY_PW,
  BLOG_ADDRESS: !!process.env.BLOG_ADDRESS
})"
```

## 📈 성능 및 안정성

### 개선된 기능들
- **리다이렉트 처리**: Google News 리다이렉트 자동 처리
- **타임아웃 설정**: 10초 타임아웃으로 무한 대기 방지
- **에러 복구**: 내용 추출 실패 시 RSS 설명 사용
- **메모리 관리**: 브라우저 인스턴스 적절한 종료

### 처리 속도
- 기사당 평균 30-60초 (브라우저 자동화 포함)
- 3개 기사 처리: 약 3-5분
- 내용 검증: 즉시 (1초 미만)

## 🔄 업데이트 내역

### v2.0 (2025.06.09)
- ✨ HTML 양식 완전 개선 (인라인 CSS)
- 🔍 포스팅 내용 검증 시스템 추가
- 📰 제목에서 언론사명 자동 제거
- 🔧 향상된 내용 추출 및 정제
- 🧪 HTML 양식 테스트 도구 추가

### v1.0 (이전 버전)
- 기본 RSS 피드 파싱
- 티스토리 자동 포스팅
- 중복 방지 시스템
- 스케줄링 기능

## 🎯 다음 단계

### 권장 사용법
1. **테스트 단계**: `test-content-format.js`로 HTML 양식 확인
2. **소량 테스트**: `simple-auto-poster.js`로 3개 기사 테스트
3. **스케줄링**: `scheduler.js`로 정기 실행 설정
4. **백그라운드**: `setup-background.sh`로 24시간 자동화

### 추가 개선 가능 사항
- 이미지 자동 추가
- 카테고리 자동 분류
- 다양한 RSS 소스 지원
- 소셜 미디어 연동

---

**💡 팁**: 처음 사용하시는 경우 `test-content-format.js`를 먼저 실행하여 HTML 양식을 확인해보세요! 