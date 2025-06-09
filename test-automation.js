/**
 * 자동화 시스템 테스트 스크립트
 */

// 환경변수 설정
process.env.TISTORY_ID = "hwiery@gmail.com";
process.env.TISTORY_PW = "1q2w3e4r5t";
process.env.BLOG_ADDRESS = "https://vibecoderyangc.tistory.com";
process.env.RSS_FEED_URL = "https://www.nngroup.com/feed/rss/";

console.log('🔧 환경변수 설정 완료');
console.log('📍 블로그 주소:', process.env.BLOG_ADDRESS);

// 자동화 실행
require('./auto-poster-with-config.js'); 