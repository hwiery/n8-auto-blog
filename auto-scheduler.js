/**
 * 자동 스케줄링 시스템
 * 매분마다 환경변수를 확인하여 스케줄된 포스팅을 자동 실행
 */

const { spawn } = require('child_process');

console.log('🕐 자동 스케줄링 시스템 시작...');
console.log('📅 매분마다 스케줄된 콘텐츠를 확인합니다.\n');

// 스케줄 확인 및 실행 함수
function checkAndExecuteSchedule() {
  const now = new Date();
  const timeStr = now.toLocaleString('ko-KR', { 
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  console.log(`🔍 [${timeStr}] 스케줄 확인 중...`);
  
  // run-scheduled-posting.js 실행
  const child = spawn('node', ['run-scheduled-posting.js'], {
    stdio: 'pipe',
    env: process.env
  });
  
  let output = '';
  let errorOutput = '';
  
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      // 포스팅 대상이 있었는지 확인
      if (output.includes('포스팅 대상')) {
        console.log('🚀 포스팅 실행됨:');
        console.log(output);
      } else if (output.includes('포스팅할 스케줄된 콘텐츠가 없습니다')) {
        console.log('⏰ 대기 중... (스케줄된 콘텐츠 없음)');
      } else {
        console.log('✅ 스케줄 확인 완료');
      }
    } else {
      console.error('❌ 스케줄 확인 중 오류 발생:');
      console.error(errorOutput);
    }
    console.log(''); // 빈 줄 추가
  });
  
  child.on('error', (error) => {
    console.error('❌ 실행 오류:', error.message);
  });
}

// 즉시 한 번 실행
checkAndExecuteSchedule();

// 매분마다 실행 (60초 = 60000ms)
const interval = setInterval(checkAndExecuteSchedule, 60000);

// 프로그램 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 자동 스케줄링 시스템을 종료합니다...');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 자동 스케줄링 시스템을 종료합니다...');
  clearInterval(interval);
  process.exit(0);
});

console.log('💡 Ctrl+C를 눌러 종료할 수 있습니다.');
console.log('🔄 매분마다 자동으로 스케줄을 확인합니다...\n'); 