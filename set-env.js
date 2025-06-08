/**
 * 환경변수 설정 스크립트
 */

// 환경변수 설정
process.env.TISTORY_ID = "hwiery@gmail.com";
process.env.TISTORY_PW = "zkfktm91!!";
process.env.BLOG_ADDRESS = "https://vibecoderyangc.tistory.com";
process.env.GOOGLE_ID = "hwiery@gmail.com";
process.env.GOOGLE_PW = "zkfktm91!!";
process.env.CONTENTS_NUMBER = "4";
process.env["1_TIME"] = "2025-06-08, 22:00 KST";
process.env["1_URL"] = "https://notebooklm.google.com/notebook/cd72861d-291e-4341-9478-3f0b2a948a85";
process.env["1_PROCESSED"] = "true";
process.env["2_TIME"] = "2025-06-08, 22:35 KST";
process.env["2_URL"] = "https://notebooklm.google.com/notebook/cd72861d-291e-4341-9478-3f0b2a948a85";
process.env["2_PROCESSED"] = "true";
process.env["3_TIME"] = "2025-06-08, 22:50 KST";
process.env["3_URL"] = "https://notebooklm.google.com/notebook/e2422b61-88b9-4fe6-90fc-4e4971575067?original_referer=https:%2F%2Faccounts.google.com%23&pli=1&authuser=0";
process.env["3_PROCESSED"] = "true";
process.env["4_TIME"] = "2025-06-08, 22:55 KST";
process.env["4_URL"] = "https://notebooklm.google.com/notebook/e2422b61-88b9-4fe6-90fc-4e4971575067?original_referer=https:%2F%2Faccounts.google.com%23&pli=1&authuser=0";
process.env["4_PROCESSED"] = "false";

console.log('✅ 환경변수 설정 완료:');
console.log('TISTORY_ID:', process.env.TISTORY_ID);
console.log('BLOG_ADDRESS:', process.env.BLOG_ADDRESS);
console.log('GOOGLE_ID:', process.env.GOOGLE_ID);
console.log('CONTENTS_NUMBER:', process.env.CONTENTS_NUMBER);
console.log('1_TIME:', process.env["1_TIME"]);
console.log('1_PROCESSED:', process.env["1_PROCESSED"]);
console.log('2_TIME:', process.env["2_TIME"]);
console.log('2_PROCESSED:', process.env["2_PROCESSED"]);
console.log('3_TIME:', process.env["3_TIME"]);
console.log('3_PROCESSED:', process.env["3_PROCESSED"]);
console.log('4_TIME:', process.env["4_TIME"]);
console.log('4_URL:', process.env["4_URL"]);
console.log('4_PROCESSED:', process.env["4_PROCESSED"]);

// run-scheduled-posting.js 실행
const { spawn } = require('child_process');

console.log('\n🚀 스케줄된 포스팅 실행...');
const child = spawn('node', ['run-scheduled-posting.js'], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    console.log(`\n📋 포스팅 프로세스 종료 (코드: ${code})`);
});

child.on('error', (error) => {
    console.error('❌ 실행 오류:', error);
}); 