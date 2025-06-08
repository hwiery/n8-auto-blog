/**
 * 스케줄된 콘텐츠 자동 포스팅 실행 스크립트
 */

const { spawn } = require('child_process');
const { extractNotebookLMContent, formatContentAsHTML } = require('./content-extractor');

console.log('🚀 스케줄된 콘텐츠 포스팅 시작...\n');

// 환경변수 확인
const requiredVars = ['TISTORY_ID', 'TISTORY_PW', 'BLOG_ADDRESS', 'CONTENTS_NUMBER'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 누락된 환경변수:', missingVars.join(', '));
  process.exit(1);
}

// 스케줄된 콘텐츠 확인
const contentsNumber = parseInt(process.env.CONTENTS_NUMBER || '0');
const currentTime = new Date();

console.log(`📅 현재 시간: ${currentTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
console.log(`📋 확인할 콘텐츠 수: ${contentsNumber}개\n`);

const scheduledContents = [];

for (let i = 1; i <= contentsNumber; i++) {
  const timeKey = `${i}_TIME`;
  const urlKey = `${i}_URL`;
  const processedKey = `${i}_PROCESSED`;
  
  const scheduledTime = process.env[timeKey];
  const contentUrl = process.env[urlKey];
  const isProcessed = process.env[processedKey] === 'true';
  
  console.log(`콘텐츠 #${i}:`);
  console.log(`  시간: ${scheduledTime}`);
  console.log(`  URL: ${contentUrl}`);
  console.log(`  처리됨: ${isProcessed}`);
  
  if (scheduledTime && contentUrl && !isProcessed) {
    const timeStr = scheduledTime.replace(' KST', '+09:00');
    const scheduledDate = new Date(timeStr);
    
    console.log(`  스케줄 시간: ${scheduledDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
    
    if (currentTime >= scheduledDate) {
      scheduledContents.push({
        contentId: i,
        scheduledTime: scheduledTime,
        contentUrl: contentUrl,
        processedKey: processedKey
      });
      console.log(`  ✅ 포스팅 대상`);
    } else {
      console.log(`  ⏳ 아직 시간이 안됨`);
    }
  } else {
    console.log(`  ❌ 조건 불충족`);
  }
  console.log('');
}

if (scheduledContents.length === 0) {
  console.log('⏰ 현재 포스팅할 스케줄된 콘텐츠가 없습니다.');
  process.exit(0);
}

console.log(`🚀 ${scheduledContents.length}개 콘텐츠 포스팅 시작...\n`);

// 각 콘텐츠에 대해 포스팅 실행
async function processContent(content) {
  return new Promise(async (resolve, reject) => {
    console.log(`📝 콘텐츠 #${content.contentId} 포스팅 중...`);
    console.log(`📎 URL: ${content.contentUrl}`);
    
    try {
      // NotebookLM URL에서 콘텐츠 추출
      console.log('🔍 NotebookLM 콘텐츠 추출 중...');
      const extractedContent = await extractNotebookLMContent(content.contentUrl);
      
      // HTML 형식으로 변환
      const htmlContent = formatContentAsHTML(
        extractedContent.title,
        extractedContent.content,
        content.contentUrl
      );
      
      console.log('📄 추출된 제목:', extractedContent.title);
      console.log('📝 추출된 내용 길이:', extractedContent.content.length, '자');
      
      // 포스팅 제목 생성 (추출된 제목 사용 또는 기본 제목)
      const postTitle = extractedContent.title !== 'NotebookLM 콘텐츠' 
        ? extractedContent.title 
        : `NotebookLM 콘텐츠 #${content.contentId}`;
      
      // tistory-poster-fixed.js 실행
      const child = spawn('node', [
        'tistory-poster-fixed.js',
        postTitle,
        htmlContent,
        '일반',
        'NotebookLM,자동포스팅'
      ], {
        stdio: 'inherit',
        env: process.env
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 콘텐츠 #${content.contentId} 포스팅 완료`);
          
          // 처리 완료 표시 (환경변수 업데이트)
          process.env[content.processedKey] = 'true';
          console.log(`🔄 ${content.processedKey} = true로 업데이트됨`);
          
          resolve();
        } else {
          console.error(`❌ 콘텐츠 #${content.contentId} 포스팅 실패 (코드: ${code})`);
          reject(new Error(`포스팅 실패: ${code}`));
        }
      });
      
      child.on('error', (error) => {
        console.error(`❌ 실행 오류:`, error);
        reject(error);
      });
      
    } catch (error) {
      console.error(`❌ 콘텐츠 추출 실패:`, error.message);
      
      // 콘텐츠 추출 실패 시 기본 내용으로 포스팅
      const fallbackContent = `
        <div class="error-content">
          <h2>NotebookLM 콘텐츠 #${content.contentId}</h2>
          <p>죄송합니다. 콘텐츠를 자동으로 추출하는 중 오류가 발생했습니다.</p>
          <p><strong>원본 링크:</strong> <a href="${content.contentUrl}" target="_blank">NotebookLM에서 직접 보기</a></p>
          <p><em>수동으로 내용을 확인해 주세요.</em></p>
        </div>
      `;
      
      const child = spawn('node', [
        'tistory-poster-fixed.js',
        `NotebookLM 콘텐츠 #${content.contentId}`,
        fallbackContent,
        '일반',
        'NotebookLM,자동포스팅,오류'
      ], {
        stdio: 'inherit',
        env: process.env
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`⚠️ 콘텐츠 #${content.contentId} 기본 내용으로 포스팅 완료`);
          process.env[content.processedKey] = 'true';
          resolve();
        } else {
          reject(new Error(`포스팅 실패: ${code}`));
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    }
  });
}

// 순차적으로 포스팅 실행
async function runPosting() {
  for (const content of scheduledContents) {
    try {
      await processContent(content);
      console.log(''); // 빈 줄 추가
    } catch (error) {
      console.error(`포스팅 중 오류 발생:`, error.message);
    }
  }
  
  console.log('🎉 모든 스케줄된 포스팅 완료!');
}

runPosting().catch(console.error); 