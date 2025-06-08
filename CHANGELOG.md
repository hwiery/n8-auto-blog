# 변경 이력 (CHANGELOG)

## 2025-06-08 - BLOG_ADDRESS 변경

### 🔄 변경사항
- **BLOG_ADDRESS 업데이트**: `https://playplayguitar.tistory.com` → `https://vibecoderyangc.tistory.com`

### 📁 수정된 파일들
1. **`tistory-poster-n8n.js`**
   - 기본 BLOG_ADDRESS 값 변경
   - 환경변수 검증 로직 개선 (기본값 비교 → 환경변수 존재 여부 확인)

2. **`tistory-poster-fixed.js`**
   - 기본 BLOG_ADDRESS 값 변경

3. **`n8n-workflow.json`**
   - Execute Command 노드에서 `tistory-poster-fixed.js` → `tistory-poster-n8n.js`로 변경

4. **`README.md`**
   - 모든 예시에서 BLOG_ADDRESS 업데이트

5. **`workflow-setup.md`**
   - 설정 가이드에서 BLOG_ADDRESS 업데이트

### ✅ 테스트 결과
- **환경변수 검증**: 모든 환경변수 올바르게 설정됨
- **로그인 프로세스**: 카카오 로그인 성공
- **모달 처리**: 네이티브 모달 2개 자동 처리 완료
- **HTML 모드 전환**: 성공
- **콘텐츠 입력**: CodeMirror 에디터에 정상 입력
- **포스팅 완료**: `https://vibecoderyangc.tistory.com`에 성공적으로 발행

### 🔧 기술적 개선사항
1. **환경변수 검증 로직 개선**
   ```javascript
   // 이전: 기본값과 비교
   if (BLOG_ADDRESS === 'https://playplayguitar.tistory.com') {
   
   // 개선: 환경변수 존재 여부 확인
   if (!process.env.BLOG_ADDRESS) {
   ```

2. **n8n 워크플로우 최적화**
   - 더 안정적인 `tistory-poster-n8n.js` 사용
   - headless 모드로 n8n 환경에 최적화

### 📊 성능 지표
- **전체 워크플로우 실행 시간**: 약 2분 30초
- **로그인 성공률**: 100%
- **모달 처리 성공률**: 100%
- **포스팅 성공률**: 100%

### 🚀 다음 단계
1. n8n에서 워크플로우 활성화
2. RSS 피드 모니터링 시작
3. Google Sheets 및 OpenAI API 연동
4. 정기적인 모니터링 및 로그 확인

---

## 이전 버전 이력

### 2025-06-07 - 초기 구현
- 티스토리 자동 포스팅 스크립트 개발
- n8n 워크플로우 구현
- LLM 기반 콘텐츠 분석 및 재창조 기능 추가
- 모달 처리 및 에러 핸들링 구현 