/**
 * 티스토리 자동화 스케줄러
 * - cron 스타일 스케줄링
 * - 다양한 실행 옵션 제공
 * - 로그 관리
 */

require('dotenv').config();
const { runAutomation } = require('./simple-auto-poster');
const fs = require('fs');
const path = require('path');

// 스케줄링 설정
const SCHEDULE_CONFIG = {
  LOG_FILE: 'scheduler.log',
  MAX_LOG_SIZE: 1024 * 1024, // 1MB
  TIMEZONE: 'Asia/Seoul'
};

/**
 * 로그 기록 함수
 */
function log(message) {
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: SCHEDULE_CONFIG.TIMEZONE });
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  try {
    // 로그 파일 크기 확인 및 정리
    if (fs.existsSync(SCHEDULE_CONFIG.LOG_FILE)) {
      const stats = fs.statSync(SCHEDULE_CONFIG.LOG_FILE);
      if (stats.size > SCHEDULE_CONFIG.MAX_LOG_SIZE) {
        // 로그 파일이 너무 크면 백업 후 새로 시작
        const backupFile = `${SCHEDULE_CONFIG.LOG_FILE}.backup`;
        fs.renameSync(SCHEDULE_CONFIG.LOG_FILE, backupFile);
        log('📁 로그 파일 백업 완료');
      }
    }
    
    fs.appendFileSync(SCHEDULE_CONFIG.LOG_FILE, logMessage);
  } catch (error) {
    console.error('로그 기록 실패:', error.message);
  }
}

/**
 * 시간 기반 실행 조건 확인
 */
function shouldRun(schedule) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0=일요일, 1=월요일, ...
  
  switch (schedule.type) {
    case 'hourly':
      // 매시간 정각에 실행
      return currentMinute === 0;
      
    case 'daily':
      // 매일 지정된 시간에 실행
      return currentHour === schedule.hour && currentMinute === 0;
      
    case 'interval':
      // 지정된 간격(분)마다 실행
      return currentMinute % schedule.minutes === 0;
      
    case 'custom':
      // 사용자 정의 시간들에 실행
      return schedule.times.some(time => {
        const [hour, minute] = time.split(':').map(Number);
        return currentHour === hour && currentMinute === minute;
      });
      
    case 'weekdays':
      // 평일 지정 시간에만 실행
      const isWeekday = currentDay >= 1 && currentDay <= 5;
      return isWeekday && currentHour === schedule.hour && currentMinute === 0;
      
    default:
      return false;
  }
}

/**
 * 스케줄 설정 예시들
 */
const SCHEDULE_PRESETS = {
  // 매시간 정각에 실행
  hourly: {
    type: 'hourly',
    description: '매시간 정각에 실행'
  },
  
  // 매일 오전 9시에 실행
  daily_9am: {
    type: 'daily',
    hour: 9,
    description: '매일 오전 9시에 실행'
  },
  
  // 30분마다 실행
  every_30min: {
    type: 'interval',
    minutes: 30,
    description: '30분마다 실행'
  },
  
  // 하루 3번 실행 (9시, 13시, 18시)
  three_times_daily: {
    type: 'custom',
    times: ['09:00', '13:00', '18:00'],
    description: '하루 3번 실행 (9시, 13시, 18시)'
  },
  
  // 평일 오전 9시에만 실행
  weekdays_9am: {
    type: 'weekdays',
    hour: 9,
    description: '평일 오전 9시에만 실행'
  }
};

/**
 * 스케줄러 메인 루프
 */
async function runScheduler(scheduleType = 'every_30min') {
  const schedule = SCHEDULE_PRESETS[scheduleType];
  
  if (!schedule) {
    log(`❌ 알 수 없는 스케줄 타입: ${scheduleType}`);
    return;
  }
  
  log(`🕐 스케줄러 시작: ${schedule.description}`);
  log(`📅 현재 시간: ${new Date().toLocaleString('ko-KR', { timeZone: SCHEDULE_CONFIG.TIMEZONE })}`);
  
  // 무한 루프로 스케줄 확인
  while (true) {
    try {
      if (shouldRun(schedule)) {
        log('🚀 스케줄된 시간입니다. 자동화 실행 시작...');
        
        try {
          await runAutomation();
          log('✅ 자동화 실행 완료');
        } catch (error) {
          log(`❌ 자동화 실행 실패: ${error.message}`);
        }
        
        // 같은 분에 중복 실행 방지를 위해 1분 대기
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
      
      // 30초마다 스케줄 확인
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      log(`❌ 스케줄러 오류: ${error.message}`);
      // 오류 발생 시 5분 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 300000));
    }
  }
}

/**
 * 일회성 실행 함수
 */
async function runOnce() {
  log('🚀 일회성 자동화 실행 시작...');
  
  try {
    await runAutomation();
    log('✅ 일회성 자동화 실행 완료');
  } catch (error) {
    log(`❌ 일회성 자동화 실행 실패: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 스케줄 정보 출력
 */
function showSchedules() {
  console.log('📋 사용 가능한 스케줄 옵션:\n');
  
  Object.entries(SCHEDULE_PRESETS).forEach(([key, schedule]) => {
    console.log(`${key}: ${schedule.description}`);
  });
  
  console.log('\n사용법:');
  console.log('node scheduler.js [스케줄타입]');
  console.log('node scheduler.js once  # 일회성 실행');
  console.log('node scheduler.js hourly  # 매시간 실행');
  console.log('node scheduler.js daily_9am  # 매일 9시 실행');
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  // 환경변수 확인
  const requiredVars = ['TISTORY_ID', 'TISTORY_PW', 'BLOG_ADDRESS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 누락된 환경변수:', missingVars.join(', '));
    process.exit(1);
  }
  
  switch (command) {
    case 'once':
      await runOnce();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showSchedules();
      break;
      
    default:
      if (SCHEDULE_PRESETS[command]) {
        await runScheduler(command);
      } else {
        console.error(`❌ 알 수 없는 명령어: ${command}`);
        showSchedules();
        process.exit(1);
      }
  }
}

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  log('🛑 스케줄러 종료 요청 받음');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 스케줄러 종료됨');
  process.exit(0);
});

// 스크립트 직접 실행 시
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 스케줄러 실행 오류:', error.message);
    process.exit(1);
  });
}

module.exports = { runScheduler, runOnce, SCHEDULE_PRESETS }; 