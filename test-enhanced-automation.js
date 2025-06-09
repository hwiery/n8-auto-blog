/**
 * 향상된 자동화 시스템 테스트 스크립트
 * 완전한 워크플로우를 테스트합니다.
 */

// 환경변수 설정
process.env.TISTORY_ID = "hwiery@gmail.com";
process.env.TISTORY_PW = "1q2w3e4r5t";
process.env.BLOG_ADDRESS = "https://vibecoderyangc.tistory.com";
process.env.RSS_FEED_URL = "https://www.nngroup.com/feed/rss/";

console.log('🔧 향상된 자동화 시스템 테스트 시작');
console.log('📍 블로그 주소:', process.env.BLOG_ADDRESS);
console.log('📡 RSS 피드:', process.env.RSS_FEED_URL);

// config 수정하여 즉시 실행되도록 설정
const config = require('./config');
config.schedule.type = 'manual'; // 수동 모드로 즉시 실행
config.schedule.enabled = false; // 스케줄러 비활성화
config.debug.enabled = false; // 실제 포스팅 실행
config.debug.headless = false; // 브라우저 창 표시하여 디버깅

console.log('⚙️ 설정 완료:');
console.log(`   - HTML 모드: ${config.htmlMode.enabled ? config.htmlMode.template : '비활성화'}`);
console.log(`   - OpenAI: ${config.openai.enabled ? '활성화' : '비활성화'}`);
console.log(`   - 디버그: ${config.debug.enabled ? '활성화' : '비활성화'}`);
console.log(`   - 헤드리스: ${config.debug.headless ? '활성화' : '비활성화'}`);

// 자동화 실행
console.log('\n🚀 자동화 시작...');
require('./auto-poster-with-config.js'); 