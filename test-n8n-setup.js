/**
 * n8n 워크플로우 설정 테스트 스크립트
 */

require('dotenv').config();

console.log('🔧 n8n 워크플로우 설정 테스트 시작...\n');

// 환경변수 확인
console.log('📋 환경변수 확인:');
const requiredVars = ['TISTORY_ID', 'TISTORY_PW', 'BLOG_ADDRESS'];
const optionalVars = ['RSS_FEED_URL', 'GOOGLE_SHEETS_DOCUMENT_ID'];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value ? '✅ 설정됨' : '❌ 미설정'}`);
});

console.log('\n📋 선택적 환경변수:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value ? '✅ 설정됨' : '⚠️ 미설정 (기본값 사용)'}`);
});

// RSS 피드 테스트
console.log('\n🔍 RSS 피드 테스트:');
const rssUrl = process.env.RSS_FEED_URL || 'https://news.google.com/rss?topic=h&hl=ko&gl=KR&ceid=KR:ko';
console.log(`  RSS URL: ${rssUrl}`);

// 티스토리 포스터 스크립트 확인
console.log('\n📝 티스토리 포스터 스크립트 확인:');
const fs = require('fs');
const scripts = ['tistory-poster-fixed.js', 'tistory-poster-n8n.js'];

scripts.forEach(script => {
  const exists = fs.existsSync(script);
  console.log(`  ${script}: ${exists ? '✅ 존재함' : '❌ 없음'}`);
});

// n8n 워크플로우 파일 확인
console.log('\n🤖 n8n 워크플로우 파일 확인:');
const workflowFiles = ['n8n-workflow.json', 'n8n-workflow-example.json'];

workflowFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${file}: ${exists ? '✅ 존재함' : '❌ 없음'}`);
});

console.log('\n🚀 다음 단계:');
console.log('1. 브라우저에서 http://localhost:5678 접속');
console.log('2. n8n 대시보드에서 "Import from file" 선택');
console.log('3. n8n-workflow.json 파일 업로드');
console.log('4. 워크플로우 노드들의 설정 확인 및 업데이트');
console.log('5. 워크플로우 활성화');

console.log('\n💡 참고사항:');
console.log('- Google Sheets 연동을 위해서는 Service Account 설정이 필요합니다');
console.log('- OpenAI API 키가 필요합니다 (GPT-4 접근 권한 포함)');
console.log('- 완전 자동화를 위해서는 n8n이 24시간 실행되어야 합니다');

console.log('\n✅ 테스트 완료!'); 