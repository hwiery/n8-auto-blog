/**
 * GUI 자동화 테스트 스크립트
 * GUI에서 호출되는 것과 동일한 환경변수를 설정하고 테스트합니다.
 */

// 환경변수 설정 (GUI와 동일)
process.env.TISTORY_ID = 'vibecoderyangc';
process.env.TISTORY_PW = 'your_password_here'; // 실제 비밀번호로 교체 필요
process.env.BLOG_ADDRESS = 'https://vibecoderyangc.tistory.com';
process.env.RSS_FEED_URL = 'https://www.nngroup.com/feed/rss/';
process.env.OPENAI_API_KEY = '';
process.env.DEBUG_MODE = 'true'; // 디버그 모드로 실행
process.env.HEADLESS_MODE = 'true';
process.env.HTML_ENABLED = 'true';
process.env.AI_ENABLED = 'false';

console.log('🧪 GUI 자동화 테스트 시작...');
console.log('📊 환경변수 설정:');
console.log(`   - TISTORY_ID: ${process.env.TISTORY_ID}`);
console.log(`   - BLOG_ADDRESS: ${process.env.BLOG_ADDRESS}`);
console.log(`   - RSS_FEED_URL: ${process.env.RSS_FEED_URL}`);
console.log(`   - DEBUG_MODE: ${process.env.DEBUG_MODE}`);
console.log(`   - HTML_ENABLED: ${process.env.HTML_ENABLED}`);
console.log();

// 자동화 스크립트 실행
require('./auto-poster-with-config.js'); 