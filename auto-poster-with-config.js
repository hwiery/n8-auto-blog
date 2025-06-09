/**
 * 설정 기반 티스토리 자동화 시스템
 * 
 * config.js 파일의 설정에 따라 동작합니다.
 */

require('dotenv').config();
const config = require('./config');
const cron = require('node-cron');
const https = require('https');
const http = require('http');
const url = require('url');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// OpenAI API (선택적)
let openai = null;
if (config.openai.enabled && config.openai.apiKey) {
  try {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    console.log('✅ OpenAI API 활성화됨');
  } catch (error) {
    console.log('⚠️ OpenAI 패키지가 설치되지 않음. npm install openai 실행 필요');
  }
}

// 환경변수
const RSS_FEED_URL = process.env.RSS_FEED_URL;
const PROCESSED_FILE = 'processed_articles.json';

/**
 * 설정에 따른 HTML 템플릿 생성
 */
function createHTMLTemplate(article, content, template = 'rich') {
  const currentDate = new Date().toLocaleDateString('ko-KR');
  
  switch (template) {
    case 'rich':
      return `
<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <div style="border-left: 4px solid #007bff; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: #007bff; margin-bottom: 10px;">${article.title}</h2>
    <p style="margin: 5px 0;"><strong>📅 발행일:</strong> ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
    <p style="margin: 5px 0;"><strong>🔗 원문 보기:</strong> <a href="${article.link}" target="_blank" style="color: #007bff; text-decoration: none;">기사 원문 링크</a></p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="color: #495057; margin-bottom: 10px;">📰 주요 내용</h3>
    ${article.description ? `<p style="font-style: italic; color: #6c757d; margin-bottom: 15px;">${article.description}</p>` : ''}
    <div style="line-height: 1.8;">
      ${content ? content.split('\n').map(p => p.trim() ? `<p style="margin: 10px 0;">${p.trim()}</p>` : '').join('') : '<p>자세한 내용은 원문 링크를 참조해주세요.</p>'}
    </div>
  </div>
  
  <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 20px;">
    <p style="font-size: 0.9em; color: #6c757d;">
      📌 이 글은 구글 뉴스에서 자동으로 수집된 기사입니다.<br>
      ⏰ 자동 포스팅 시간: ${currentDate}
    </p>
  </div>
</div>`;

    case 'simple':
      return `
<div style="line-height: 1.6;">
  <h2>${article.title}</h2>
  <p><strong>발행일:</strong> ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
  <p><strong>원문:</strong> <a href="${article.link}" target="_blank">기사 원문 보기</a></p>
  
  <h3>주요 내용</h3>
  ${article.description ? `<p><em>${article.description}</em></p>` : ''}
  <div>
    ${content ? content.split('\n').map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('') : '<p>자세한 내용은 원문을 참조해주세요.</p>'}
  </div>
  
  <hr>
  <p><small>구글 뉴스 자동 수집 | ${currentDate}</small></p>
</div>`;

    case 'minimal':
      return `
<h2>${article.title}</h2>
<p>발행일: ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
<p>원문: <a href="${article.link}" target="_blank">링크</a></p>
${article.description ? `<p>${article.description}</p>` : ''}
${content ? `<div>${content.replace(/\n/g, '<br>')}</div>` : ''}
<p><small>자동 포스팅: ${currentDate}</small></p>`;

    case 'plain':
    default:
      return `
${article.title}

발행일: ${new Date(article.pubDate).toLocaleDateString('ko-KR')}
원문: ${article.link}

${article.description || ''}

${content || '자세한 내용은 원문을 참조해주세요.'}

---
구글 뉴스 자동 수집 | ${currentDate}`;
  }
}

/**
 * OpenAI API를 사용한 콘텐츠 개선
 */
async function improveContentWithAI(article, content) {
  if (!config.openai.enabled || !openai) {
    return { title: article.title, content, tags: config.content.defaultTags };
  }

  try {
    console.log('🤖 OpenAI로 콘텐츠 개선 중...');

    const improvements = {};

    // 제목 개선
    if (config.openai.features.improveTitle) {
      const titleResponse = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{
          role: 'user',
          content: `다음 뉴스 제목을 더 매력적이고 클릭하고 싶게 만들어주세요. 언론사명은 제거하고 핵심 내용만 남겨주세요:\n\n"${article.title}"`
        }],
        max_tokens: 100,
        temperature: config.openai.settings.temperature
      });
      improvements.title = titleResponse.choices[0].message.content.trim().replace(/['"]/g, '');
    }

    // 내용 개선
    if (config.openai.features.improveContent && content) {
      const contentResponse = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{
          role: 'user',
          content: `다음 뉴스 내용을 더 읽기 쉽고 이해하기 쉽게 요약해주세요:\n\n"${content}"`
        }],
        max_tokens: config.openai.settings.maxTokens,
        temperature: config.openai.settings.temperature
      });
      improvements.content = contentResponse.choices[0].message.content.trim();
    }

    // 태그 생성
    if (config.openai.features.generateTags) {
      const tagsResponse = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{
          role: 'user',
          content: `다음 뉴스 기사에 적합한 태그 5개를 쉼표로 구분해서 생성해주세요:\n\n제목: "${article.title}"\n내용: "${content || article.description}"`
        }],
        max_tokens: 100,
        temperature: config.openai.settings.temperature
      });
      const aiTags = tagsResponse.choices[0].message.content.trim().split(',').map(tag => tag.trim());
      improvements.tags = [...config.content.defaultTags, ...aiTags].slice(0, 8);
    }

    console.log('✅ OpenAI 콘텐츠 개선 완료');
    return {
      title: improvements.title || article.title,
      content: improvements.content || content,
      tags: improvements.tags || config.content.defaultTags
    };

  } catch (error) {
    console.error('⚠️ OpenAI API 오류:', error.message);
    return { title: article.title, content, tags: config.content.defaultTags };
  }
}

/**
 * RSS 피드 파싱
 */
async function parseRSSFeed() {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(RSS_FEED_URL);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    client.get(RSS_FEED_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const articles = [];
          const itemMatches = data.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];

          itemMatches.forEach(item => {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                          item.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
            const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim();
            const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                               item.match(/<description>(.*?)<\/description>/))?.[1]?.trim();
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim();

            if (title && link) {
              articles.push({
                title,
                link,
                description: description || '',
                pubDate: pubDate || new Date().toISOString(),
                id: Buffer.from(link).toString('base64').substring(0, 16)
              });
            }
          });

          resolve(articles);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 티스토리에 실제 포스팅하는 함수
 */
async function postToTistory(title, content, tags) {
  return new Promise((resolve, reject) => {
    const posterScript = path.join(__dirname, 'tistory-poster-fixed.js');
    const category = '뉴스'; // 기본 카테고리
    
    // Node.js 실행 파일 경로
    const nodePath = process.execPath;
    
    console.log(`📝 포스팅 시작: ${title}`);
    
    const posterProcess = spawn(nodePath, [
      posterScript,
      title,
      content,
      category,
      tags
    ], {
      env: {
        ...process.env,
        TISTORY_ID: process.env.TISTORY_ID,
        TISTORY_PW: process.env.TISTORY_PW,
        BLOG_ADDRESS: process.env.BLOG_ADDRESS
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    posterProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    posterProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    posterProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 포스팅 성공: ${title}`);
        resolve();
      } else {
        console.error(`❌ 포스팅 실패: ${title}`);
        console.error(`에러 출력: ${stderr}`);
        reject(new Error(`포스팅 실패 (코드: ${code})`));
      }
    });
    
    posterProcess.on('error', (error) => {
      console.error(`❌ 포스팅 프로세스 오류: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * 메인 자동화 함수
 */
async function runAutomation() {
  console.log('🚀 설정 기반 자동화 시작...');
  console.log(`📊 설정 요약:`);
  console.log(`   - 스케줄: ${config.schedule.enabled ? config.schedule.type : '비활성화'}`);
  console.log(`   - HTML 모드: ${config.htmlMode.enabled ? config.htmlMode.template : '비활성화'}`);
  console.log(`   - OpenAI: ${config.openai.enabled ? '활성화' : '비활성화'}`);
  console.log(`   - 최대 기사 수: ${config.schedule.maxArticlesPerRun}개`);

  try {
    // RSS 피드 파싱
    console.log('📡 RSS 피드 파싱 중...');
    const articles = await parseRSSFeed();
    console.log(`📰 총 ${articles.length}개 기사 발견`);

    // 처리된 기사 목록 로드
    let processedArticles = [];
    try {
      const data = fs.readFileSync(PROCESSED_FILE, 'utf8');
      processedArticles = JSON.parse(data);
    } catch (error) {
      console.log('📝 새로운 처리 기록 파일 생성');
    }

    // 새 기사 필터링
    const newArticles = articles.filter(article => 
      !processedArticles.includes(article.id)
    ).slice(0, config.schedule.maxArticlesPerRun);

    console.log(`🆕 새 기사 ${newArticles.length}개 발견`);

    if (newArticles.length === 0) {
      console.log('✅ 처리할 새 기사가 없습니다.');
      return;
    }

    // 각 기사 처리
    for (let i = 0; i < newArticles.length; i++) {
      const article = newArticles[i];
      console.log(`\n🔍 처리 중 (${i + 1}/${newArticles.length}): ${article.title}`);

      try {
        // 제목 정리
        let cleanTitle = article.title;
        if (config.content.removeMediaNames) {
          const patterns = [
            / - [가-힣A-Za-z0-9\s]+$/,
            / \| [가-힣A-Za-z0-9\s]+$/,
            / \/ [가-힣A-Za-z0-9\s]+$/,
            / · [가-힣A-Za-z0-9\s]+$/,
            /\[[가-힣A-Za-z0-9\s]+\]$/,
            / \([가-힣A-Za-z0-9\s]+\)$/
          ];
          
          patterns.forEach(pattern => {
            cleanTitle = cleanTitle.replace(pattern, '').trim();
          });
        }

        // 기사 내용 추출 (간단한 방법)
        let content = article.description || '';
        
        // OpenAI로 콘텐츠 개선
        const improved = await improveContentWithAI(
          { ...article, title: cleanTitle }, 
          content
        );

        // 내용 검증
        if (improved.content.length < config.content.minContentLength) {
          console.log(`⚠️ 내용이 너무 짧습니다 (${improved.content.length}자). 건너뜁니다.`);
          continue;
        }

        // HTML 템플릿 적용
        let postContent;
        if (config.htmlMode.enabled && config.htmlMode.template !== 'plain') {
          postContent = createHTMLTemplate(article, improved.content, config.htmlMode.template);
        } else {
          postContent = createHTMLTemplate(article, improved.content, 'plain');
        }

        console.log('✅ 콘텐츠 준비 완료');
        console.log(`📊 제목: ${improved.title}`);
        console.log(`📊 내용 길이: ${postContent.length}자`);
        console.log(`📊 태그: ${improved.tags.join(', ')}`);

        // 실제 포스팅은 기존 시스템 사용
        if (config.debug && config.debug.enabled) {
          console.log('🔍 디버그 모드: 실제 포스팅하지 않음');
          console.log('📝 포스팅 내용 미리보기:');
          console.log(postContent.substring(0, 300) + '...');
          console.log('✅ 디버그 모드 완료 - 실제 포스팅하지 않았습니다.');
        } else {
          // ✅ Puppeteer 문제 완전 해결! 실제 포스팅 실행
          console.log('📝 실제 포스팅 실행...');
          try {
            await postToTistory(improved.title, postContent, improved.tags.join(','));
            console.log('🎉 포스팅 성공!');
          } catch (error) {
            console.log('❌ 포스팅 실패:', error.message);
            // 포스팅 실패해도 기록은 남기지 않음 (재시도 가능)
            continue; // 다음 기사로 계속
          }
        }

        // 처리 완료 기록
        processedArticles.push(article.id);
        
        // 포스팅 간격 대기
        if (i < newArticles.length - 1) {
          console.log(`⏰ ${config.schedule.intervalBetweenPosts / 1000}초 대기...`);
          await new Promise(resolve => setTimeout(resolve, config.schedule.intervalBetweenPosts));
        }

      } catch (error) {
        console.error(`❌ 기사 처리 실패: ${error.message}`);
      }
    }

    // 처리 기록 저장
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedArticles, null, 2));
    console.log(`\n🎉 자동화 완료! ${newArticles.length}개 기사 처리됨`);

  } catch (error) {
    console.error('❌ 자동화 실행 오류:', error);
  }
}

/**
 * 스케줄러 설정
 */
function setupScheduler() {
  if (!config.schedule.enabled) {
    console.log('📅 스케줄러가 비활성화되어 있습니다.');
    return;
  }

  let cronExpression;
  
  switch (config.schedule.type) {
    case 'hourly':
      cronExpression = '0 * * * *'; // 매시간 정각
      break;
    case 'daily_9am':
      cronExpression = '0 9 * * *'; // 매일 오전 9시
      break;
    case 'every_30min':
      cronExpression = '*/30 * * * *'; // 30분마다
      break;
    case 'three_times_daily':
      cronExpression = '0 9,13,18 * * *'; // 하루 3번
      break;
    case 'weekdays_9am':
      cronExpression = '0 9 * * 1-5'; // 평일 오전 9시
      break;
    case 'custom':
      cronExpression = config.schedule.customCron;
      break;
    case 'manual':
    default:
      console.log('📅 수동 모드: 스케줄러를 설정하지 않습니다.');
      return;
  }

  console.log(`📅 스케줄러 설정: ${config.schedule.type} (${cronExpression})`);
  
  cron.schedule(cronExpression, () => {
    console.log(`\n⏰ 스케줄 실행: ${new Date().toLocaleString('ko-KR')}`);
    runAutomation();
  });

  console.log('✅ 스케줄러가 활성화되었습니다.');
}

// 메인 실행
if (require.main === module) {
  console.log('🚀 티스토리 자동화 시스템 시작...');
  
  if (config.schedule.type === 'manual') {
    console.log('📝 수동 모드로 즉시 실행합니다.');
    runAutomation();
  } else {
    setupScheduler();
    console.log('⏰ 스케줄러가 실행 중입니다. Ctrl+C로 종료하세요.');
    
    // 무한 루프로 스케줄러 유지
    setInterval(() => {
      // 스케줄러 상태 유지
    }, 60000);
  }
}

module.exports = { runAutomation, setupScheduler }; 