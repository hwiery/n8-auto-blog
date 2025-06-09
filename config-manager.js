#!/usr/bin/env node

/**
 * 티스토리 자동화 시스템 설정 관리 도구
 * 
 * 사용법:
 * node config-manager.js
 * node config-manager.js --schedule daily_9am
 * node config-manager.js --html off
 * node config-manager.js --openai on
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = './config.js';

/**
 * 현재 설정 읽기
 */
function readConfig() {
  try {
    delete require.cache[require.resolve(CONFIG_FILE)];
    return require(CONFIG_FILE);
  } catch (error) {
    console.error('❌ 설정 파일을 읽을 수 없습니다:', error.message);
    process.exit(1);
  }
}

/**
 * 설정 파일 업데이트
 */
function updateConfig(updates) {
  const config = readConfig();
  
  // 설정 업데이트 적용
  Object.keys(updates).forEach(key => {
    const value = updates[key];
    const keys = key.split('.');
    
    let current = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  });

  // 파일에 저장
  const configContent = `/**
 * 티스토리 자동화 시스템 통합 설정 파일
 * 
 * 이 파일에서 모든 주요 기능을 On/Off 할 수 있습니다.
 */

module.exports = ${JSON.stringify(config, null, 2)};`;

  fs.writeFileSync(CONFIG_FILE, configContent);
  console.log('✅ 설정이 업데이트되었습니다.');
}

/**
 * 현재 설정 표시
 */
function showCurrentConfig() {
  const config = readConfig();
  
  console.log('\n📊 현재 설정 상태:');
  console.log('==========================================');
  
  // 스케줄 설정
  console.log(`\n📅 포스팅 스케줄:`);
  console.log(`   활성화: ${config.schedule.enabled ? '✅ ON' : '❌ OFF'}`);
  console.log(`   타입: ${config.schedule.type}`);
  console.log(`   최대 기사 수: ${config.schedule.maxArticlesPerRun}개`);
  console.log(`   포스팅 간격: ${config.schedule.intervalBetweenPosts / 1000}초`);
  
  // HTML 모드
  console.log(`\n🎨 HTML 모드:`);
  console.log(`   활성화: ${config.htmlMode.enabled ? '✅ ON' : '❌ OFF'}`);
  console.log(`   템플릿: ${config.htmlMode.template}`);
  console.log(`   강제 HTML 모드: ${config.htmlMode.forceHtmlMode ? '✅ ON' : '❌ OFF'}`);
  
  // OpenAI 설정
  console.log(`\n🤖 OpenAI API:`);
  console.log(`   활성화: ${config.openai.enabled ? '✅ ON' : '❌ OFF'}`);
  console.log(`   모델: ${config.openai.model}`);
  console.log(`   제목 개선: ${config.openai.features.improveTitle ? '✅ ON' : '❌ OFF'}`);
  console.log(`   내용 개선: ${config.openai.features.improveContent ? '✅ ON' : '❌ OFF'}`);
  console.log(`   태그 생성: ${config.openai.features.generateTags ? '✅ ON' : '❌ OFF'}`);
  
  // 콘텐츠 설정
  console.log(`\n📝 콘텐츠 설정:`);
  console.log(`   언론사명 제거: ${config.content.removeMediaNames ? '✅ ON' : '❌ OFF'}`);
  console.log(`   최소 길이: ${config.content.minContentLength}자`);
  console.log(`   기본 카테고리: ${config.content.defaultCategory}`);
  
  // 디버그 설정
  console.log(`\n🔍 디버그 모드:`);
  console.log(`   활성화: ${config.debug.enabled ? '✅ ON' : '❌ OFF'}`);
  console.log(`   헤드리스 모드: ${config.debug.headless ? '✅ ON' : '❌ OFF'}`);
  
  console.log('\n==========================================');
}

/**
 * 도움말 표시
 */
function showHelp() {
  console.log(`
🚀 티스토리 자동화 시스템 설정 관리 도구

📋 사용법:
  node config-manager.js                    # 현재 설정 보기
  node config-manager.js --help             # 도움말 보기

📅 스케줄 설정:
  --schedule manual                         # 수동 실행만
  --schedule hourly                         # 매시간 정각
  --schedule daily_9am                      # 매일 오전 9시
  --schedule every_30min                    # 30분마다
  --schedule three_times_daily              # 하루 3번 (9시, 13시, 18시)
  --schedule weekdays_9am                   # 평일 오전 9시만
  --schedule off                            # 스케줄러 비활성화

🎨 HTML 모드 설정:
  --html on                                 # HTML 모드 활성화
  --html off                                # HTML 모드 비활성화
  --html-template rich                      # 풍부한 스타일링
  --html-template simple                    # 간단한 스타일링
  --html-template minimal                   # 최소한의 스타일링
  --html-template plain                     # 일반 텍스트만

🤖 OpenAI API 설정:
  --openai on                               # OpenAI API 활성화
  --openai off                              # OpenAI API 비활성화
  --openai-title on/off                     # 제목 개선 기능
  --openai-content on/off                   # 내용 개선 기능
  --openai-tags on/off                      # 태그 생성 기능

📊 기타 설정:
  --max-articles 5                          # 한 번에 처리할 최대 기사 수
  --interval 30                             # 포스팅 간격 (초)
  --debug on/off                            # 디버그 모드
  --media-names on/off                      # 언론사명 제거 기능

💡 예시:
  node config-manager.js --schedule daily_9am --html on --openai off
  node config-manager.js --html-template simple --max-articles 5
  node config-manager.js --openai on --openai-title on --openai-content off
`);
}

/**
 * 명령행 인수 파싱 및 처리
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showCurrentConfig();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const updates = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--schedule':
        if (value === 'off') {
          updates['schedule.enabled'] = false;
        } else {
          updates['schedule.enabled'] = true;
          updates['schedule.type'] = value;
        }
        break;

      case '--html':
        updates['htmlMode.enabled'] = value === 'on';
        break;

      case '--html-template':
        updates['htmlMode.template'] = value;
        break;

      case '--openai':
        updates['openai.enabled'] = value === 'on';
        break;

      case '--openai-title':
        updates['openai.features.improveTitle'] = value === 'on';
        break;

      case '--openai-content':
        updates['openai.features.improveContent'] = value === 'on';
        break;

      case '--openai-tags':
        updates['openai.features.generateTags'] = value === 'on';
        break;

      case '--max-articles':
        updates['schedule.maxArticlesPerRun'] = parseInt(value);
        break;

      case '--interval':
        updates['schedule.intervalBetweenPosts'] = parseInt(value) * 1000;
        break;

      case '--debug':
        updates['debug.enabled'] = value === 'on';
        break;

      case '--media-names':
        updates['content.removeMediaNames'] = value === 'on';
        break;

      default:
        console.log(`⚠️ 알 수 없는 옵션: ${flag}`);
        break;
    }
  }

  if (Object.keys(updates).length > 0) {
    updateConfig(updates);
    console.log('\n📊 업데이트된 설정:');
    Object.keys(updates).forEach(key => {
      console.log(`   ${key}: ${updates[key]}`);
    });
    console.log('\n현재 설정을 확인하려면: node config-manager.js');
  } else {
    console.log('⚠️ 업데이트할 설정이 없습니다.');
    showHelp();
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { readConfig, updateConfig, showCurrentConfig }; 