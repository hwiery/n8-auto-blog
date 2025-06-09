#!/usr/bin/env node

/**
 * 티스토리 자동화 빠른 시작 스크립트
 */

require('dotenv').config();
const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 티스토리 자동화 빠른 시작\n');

// 환경변수 확인
const requiredVars = ['TISTORY_ID', 'TISTORY_PW', 'BLOG_ADDRESS'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 누락된 환경변수:', missingVars.join(', '));
  console.error('💡 .env 파일을 확인해주세요.');
  process.exit(1);
}

console.log('✅ 환경변수 설정 완료\n');

function showMenu() {
  console.log('📋 사용 가능한 옵션:');
  console.log('1. 즉시 포스팅 (수동)');
  console.log('2. 스케줄된 포스팅 실행');
  console.log('3. n8n 워크플로우 시작');
  console.log('4. 환경 설정 테스트');
  console.log('5. 종료');
  console.log('');
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function manualPosting() {
  console.log('\n📝 수동 포스팅 모드');
  
  const title = await askQuestion('제목을 입력하세요: ');
  const content = await askQuestion('내용을 입력하세요 (HTML 가능): ');
  
  if (!title || !content) {
    console.log('❌ 제목과 내용을 모두 입력해주세요.');
    return;
  }
  
  console.log('\n🚀 포스팅을 시작합니다...');
  
  const child = spawn('node', ['tistory-poster-fixed.js', title, content], {
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ 포스팅 완료!');
    } else {
      console.log('\n❌ 포스팅 실패');
    }
    showMenu();
    handleUserInput();
  });
}

function runScheduledPosting() {
  console.log('\n⏰ 스케줄된 포스팅 실행');
  
  const child = spawn('node', ['run-scheduled-posting.js'], {
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    console.log('\n📊 스케줄된 포스팅 완료');
    showMenu();
    handleUserInput();
  });
}

function startN8n() {
  console.log('\n🤖 n8n 워크플로우 시작');
  console.log('브라우저에서 http://localhost:5678 에 접속하세요.');
  
  const child = spawn('npx', ['n8n', 'start'], {
    stdio: 'inherit'
  });
  
  // n8n은 백그라운드에서 계속 실행
  console.log('\n💡 n8n이 백그라운드에서 실행됩니다.');
  console.log('종료하려면 Ctrl+C를 누르세요.');
}

function runEnvironmentTest() {
  console.log('\n🔧 환경 설정 테스트');
  
  const child = spawn('node', ['test-n8n-setup.js'], {
    stdio: 'inherit'
  });
  
  child.on('close', () => {
    console.log('');
    showMenu();
    handleUserInput();
  });
}

async function handleUserInput() {
  const choice = await askQuestion('옵션을 선택하세요 (1-5): ');
  
  switch (choice) {
    case '1':
      await manualPosting();
      break;
    case '2':
      runScheduledPosting();
      break;
    case '3':
      startN8n();
      break;
    case '4':
      runEnvironmentTest();
      break;
    case '5':
      console.log('👋 프로그램을 종료합니다.');
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('❌ 잘못된 선택입니다. 1-5 중에서 선택해주세요.');
      showMenu();
      handleUserInput();
  }
}

// 프로그램 시작
showMenu();
handleUserInput(); 