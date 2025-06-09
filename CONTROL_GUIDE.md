# 🚀 티스토리 자동화 시스템 컨트롤 가이드

이 가이드는 사용자가 요청한 3가지 주요 컨트롤 기능에 대해 설명합니다:

1. **포스팅 스케줄 컨트롤** - 언제 포스팅할지 설정
2. **HTML 모드 On/Off** - HTML 사용 여부 설정  
3. **OpenAI API On/Off** - AI 기능 사용 여부 설정

## 📋 빠른 시작

### 1. 현재 설정 확인
```bash
node config-manager.js
```

### 2. 설정 변경 예시
```bash
# 매일 오전 9시 자동 포스팅 + HTML 모드 + OpenAI 비활성화
node config-manager.js --schedule daily_9am --html on --openai off

# 수동 실행만 + 간단한 HTML + OpenAI 활성화
node config-manager.js --schedule manual --html-template simple --openai on
```

### 3. 자동화 실행
```bash
node auto-poster-with-config.js
```

---

## 📅 1. 포스팅 스케줄 컨트롤

### 사용 가능한 스케줄 옵션

| 옵션 | 설명 | 실행 시간 |
|------|------|-----------|
| `manual` | 수동 실행만 | 사용자가 직접 실행할 때만 |
| `hourly` | 매시간 정각 | 매시간 00분 |
| `daily_9am` | 매일 오전 9시 | 매일 09:00 |
| `every_30min` | 30분마다 | 매 30분마다 |
| `three_times_daily` | 하루 3번 | 09:00, 13:00, 18:00 |
| `weekdays_9am` | 평일 오전 9시만 | 월~금 09:00 |
| `custom` | 사용자 정의 | config.js에서 cron 표현식 설정 |
| `off` | 스케줄러 비활성화 | 실행 안함 |

### 설정 방법

```bash
# 매일 오전 9시 자동 실행
node config-manager.js --schedule daily_9am

# 하루 3번 실행 (9시, 13시, 18시)
node config-manager.js --schedule three_times_daily

# 수동 실행만
node config-manager.js --schedule manual

# 스케줄러 완전 비활성화
node config-manager.js --schedule off
```

### 추가 스케줄 설정

```bash
# 한 번에 처리할 최대 기사 수 설정 (기본: 3개)
node config-manager.js --max-articles 5

# 포스팅 간격 설정 (기본: 30초)
node config-manager.js --interval 60  # 60초 간격
```

### 사용자 정의 스케줄

`config.js` 파일에서 직접 수정:

```javascript
schedule: {
  type: 'custom',
  customCron: '0 8,12,16,20 * * *',  // 매일 8시, 12시, 16시, 20시
}
```

---

## 🎨 2. HTML 모드 On/Off

### HTML 모드 옵션

| 모드 | 설명 | 특징 |
|------|------|------|
| `on` (rich) | 풍부한 HTML 스타일링 | 색상, 테두리, 아이콘 포함 |
| `on` (simple) | 간단한 HTML 스타일링 | 기본적인 HTML 태그만 |
| `on` (minimal) | 최소한의 HTML | 제목, 링크, 기본 구조만 |
| `off` (plain) | HTML 없음 | 순수 텍스트만 |

### 설정 방법

```bash
# HTML 모드 활성화 (기본: rich 템플릿)
node config-manager.js --html on

# HTML 모드 비활성화 (순수 텍스트)
node config-manager.js --html off

# 특정 HTML 템플릿 선택
node config-manager.js --html-template simple
node config-manager.js --html-template minimal
node config-manager.js --html-template rich
node config-manager.js --html-template plain
```

### HTML 템플릿 미리보기

#### Rich 템플릿 (기본)
```html
<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <div style="border-left: 4px solid #007bff; padding-left: 20px;">
    <h2 style="color: #007bff;">제목</h2>
    <p><strong>📅 발행일:</strong> 2024-01-01</p>
    <p><strong>🔗 원문 보기:</strong> <a href="#">링크</a></p>
  </div>
  <!-- 스타일링된 내용 -->
</div>
```

#### Simple 템플릿
```html
<div style="line-height: 1.6;">
  <h2>제목</h2>
  <p><strong>발행일:</strong> 2024-01-01</p>
  <p><strong>원문:</strong> <a href="#">링크</a></p>
  <!-- 기본 내용 -->
</div>
```

#### Plain 모드 (HTML 없음)
```
제목

발행일: 2024-01-01
원문: https://example.com

내용...

---
구글 뉴스 자동 수집 | 2024-01-01
```

---

## 🤖 3. OpenAI API On/Off

### OpenAI 기능 옵션

| 기능 | 설명 | 효과 |
|------|------|------|
| `improveTitle` | 제목 개선 | 더 매력적인 제목으로 변경 |
| `improveContent` | 내용 개선 | 읽기 쉽게 요약 및 정리 |
| `generateTags` | 태그 자동 생성 | 기사 내용에 맞는 태그 생성 |
| `categorizePost` | 카테고리 분류 | 자동 카테고리 분류 |

### 설정 방법

```bash
# OpenAI 전체 활성화
node config-manager.js --openai on

# OpenAI 전체 비활성화
node config-manager.js --openai off

# 개별 기능 설정
node config-manager.js --openai-title on      # 제목 개선만
node config-manager.js --openai-content off   # 내용 개선 비활성화
node config-manager.js --openai-tags on       # 태그 생성 활성화
```

### OpenAI API 키 설정

`.env` 파일에 API 키 추가:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### OpenAI 패키지 설치

```bash
npm install openai
```

### 사용 예시

```bash
# OpenAI로 제목과 태그만 개선, 내용은 원본 사용
node config-manager.js --openai on --openai-title on --openai-content off --openai-tags on
```

---

## 🔧 통합 설정 예시

### 시나리오 1: 완전 자동화 (추천)
```bash
node config-manager.js \
  --schedule three_times_daily \
  --html on \
  --html-template rich \
  --openai on \
  --max-articles 3 \
  --interval 30
```

### 시나리오 2: 수동 제어 + 고품질
```bash
node config-manager.js \
  --schedule manual \
  --html on \
  --html-template simple \
  --openai on \
  --openai-title on \
  --openai-content on
```

### 시나리오 3: 빠른 포스팅 (OpenAI 없음)
```bash
node config-manager.js \
  --schedule hourly \
  --html on \
  --html-template minimal \
  --openai off \
  --max-articles 5 \
  --interval 15
```

### 시나리오 4: 텍스트만 + 수동
```bash
node config-manager.js \
  --schedule manual \
  --html off \
  --openai off
```

---

## 📊 실행 및 모니터링

### 1. 설정 확인
```bash
node config-manager.js
```

### 2. 테스트 실행 (디버그 모드)
```bash
node config-manager.js --debug on
node auto-poster-with-config.js
```

### 3. 실제 실행
```bash
node config-manager.js --debug off
node auto-poster-with-config.js
```

### 4. 백그라운드 실행 (Linux/Mac)
```bash
nohup node auto-poster-with-config.js > automation.log 2>&1 &
```

### 5. 로그 확인
```bash
tail -f automation.log
```

---

## 🚨 주의사항

1. **OpenAI API 비용**: OpenAI 기능 사용 시 API 호출 비용이 발생합니다.
2. **스케줄 중복**: 여러 스케줄을 동시에 실행하지 마세요.
3. **환경변수**: `.env` 파일에 필요한 모든 환경변수가 설정되어 있는지 확인하세요.
4. **권한**: 티스토리 로그인 정보가 올바른지 확인하세요.

---

## 🔍 문제 해결

### 설정이 적용되지 않을 때
```bash
# 설정 파일 확인
cat config.js

# 캐시 삭제 후 재실행
rm -rf node_modules/.cache
node auto-poster-with-config.js
```

### OpenAI 오류 시
```bash
# API 키 확인
echo $OPENAI_API_KEY

# OpenAI 비활성화 후 실행
node config-manager.js --openai off
```

### 스케줄러 문제 시
```bash
# 수동 모드로 변경
node config-manager.js --schedule manual

# 직접 실행으로 테스트
node auto-poster-with-config.js
```

---

## 📞 지원

문제가 발생하면 다음을 확인해주세요:

1. `node config-manager.js`로 현재 설정 확인
2. `.env` 파일의 환경변수 확인
3. `node auto-poster-with-config.js`로 수동 실행 테스트
4. 로그 파일 확인

이 가이드를 통해 티스토리 자동화 시스템을 완전히 제어할 수 있습니다! 🎉 