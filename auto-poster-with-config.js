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

// 향상된 콘텐츠 추출기 import
const { extractArticleContent, createEnhancedHTMLTemplate } = require('./enhanced-content-extractor');

// GUI 설정을 config와 통합하는 함수
function loadGUIConfig() {
  try {
    const guiConfigPath = path.resolve(__dirname, 'gui-config.json');
    if (fs.existsSync(guiConfigPath)) {
      const guiConfig = JSON.parse(fs.readFileSync(guiConfigPath, 'utf8'));
      
      // AI 설정 통합
      if (guiConfig.ai) {
        config.openai.enabled = guiConfig.ai.enabled || false;
        config.openai.apiKey = guiConfig.ai.apiKey || config.openai.apiKey;
        config.openai.model = guiConfig.ai.model || config.openai.model;
        
        // AI 기능 설정 통합
        config.openai.features.improveTitle = guiConfig.ai.improveTitle || false;
        config.openai.features.improveContent = guiConfig.ai.improveContent || false;
        config.openai.features.generateTags = guiConfig.ai.generateTags || false;
        config.openai.features.addSummary = guiConfig.ai.addSummary || false;
        config.openai.features.translateContent = guiConfig.ai.translateContent || false;
      }
      
      // RSS 설정 통합
      if (guiConfig.rss) {
        config.rss.url = guiConfig.rss.url || config.rss.url;
        config.content.minContentLength = guiConfig.rss.minContentLength || config.content.minContentLength;
        config.content.removeMediaNames = guiConfig.rss.removeMediaNames || false;
      }
      
      // HTML 설정 통합
      if (guiConfig.html) {
        config.htmlMode.enabled = guiConfig.html.enabled || false;
        config.htmlMode.template = guiConfig.html.template || config.htmlMode.template;
        config.htmlMode.includeImages = guiConfig.html.includeImages || false;
        config.htmlMode.autoParagraph = guiConfig.html.autoParagraph || false;
        config.htmlMode.addSourceLink = guiConfig.html.addSourceLink || false;
      }
      
      // 일정 설정 통합
      if (guiConfig.schedule) {
        config.schedule.maxArticlesPerRun = guiConfig.schedule.maxArticles || config.schedule.maxArticlesPerRun;
        config.schedule.intervalBetweenPosts = (guiConfig.schedule.interval || 30) * 1000; // 초를 밀리초로
      }
      
      // 디버그 설정 통합
      if (guiConfig.advanced) {
        config.debug = config.debug || {};
        config.debug.enabled = guiConfig.advanced.debug || false;
      }
      
      console.log('✅ GUI 설정 통합 완료');
      console.log(`🔧 AI 활성화: ${config.openai.enabled}`);
      console.log(`🔧 콘텐츠 개선: ${config.openai.features.improveContent}`);
      console.log(`🔧 제목 개선: ${config.openai.features.improveTitle}`);
      console.log(`🔧 태그 생성: ${config.openai.features.generateTags}`);
      
      return guiConfig;
    }
  } catch (error) {
    console.warn('⚠️ GUI 설정 파일 로드 오류:', error.message);
  }
  return null;
}

// GUI 설정 로드
const guiConfig = loadGUIConfig();

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
    <p style="margin: 5px 0;"><strong>📖 더 알아보기:</strong> <a href="${article.link}" target="_blank" style="color: #007bff; text-decoration: none;">관련 정보</a></p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="color: #495057; margin-bottom: 10px;">📰 주요 내용</h3>
    ${article.description ? `<p style="font-style: italic; color: #6c757d; margin-bottom: 15px;">${article.description}</p>` : ''}
    <div style="line-height: 1.8;">
      ${content ? content.split('\n').map(p => p.trim() ? `<p style="margin: 10px 0; color: #333;">${p.trim()}</p>` : '').join('') : '<p style="color: #333;">관련 내용에 대한 상세한 분석을 다루고 있습니다.</p>'}
    </div>
  </div>
  
  <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 20px;">
    <p style="font-size: 0.9em; color: #6c757d;">
      📌 현재 주목받고 있는 이슈들을 종합하여 정리한 글입니다.<br>
      ⏰ 작성 시간: ${currentDate}
    </p>
  </div>
</div>`;

    case 'simple':
      return `
<div style="line-height: 1.6;">
  <h2>${article.title}</h2>
  <p><strong>발행일:</strong> ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
  <p><strong>관련 자료:</strong> <a href="${article.link}" target="_blank">추가 정보 보기</a></p>
  
  <h3>주요 내용</h3>
  ${article.description ? `<p><em>${article.description}</em></p>` : ''}
  <div>
    ${content ? content.split('\n').map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('') : '<p>관련 내용에 대한 심화 분석을 제공하고 있습니다.</p>'}
  </div>
  
  <hr>
  <p><small>종합 정리 | ${currentDate}</small></p>
</div>`;

    case 'minimal':
      return `
<h2>${article.title}</h2>
<p>발행일: ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
<p>관련 자료: <a href="${article.link}" target="_blank">링크</a></p>
${article.description ? `<p>${article.description}</p>` : ''}
${content ? `<div>${content.replace(/\n/g, '<br>')}</div>` : ''}
<p><small>작성일: ${currentDate}</small></p>`;

    case 'plain':
    default:
      return `
${article.title}

발행일: ${new Date(article.pubDate).toLocaleDateString('ko-KR')}
관련 자료: ${article.link}

${article.description || ''}

${content || '관련 주제에 대한 포괄적인 분석을 다루고 있습니다.'}

---
종합 정리 | ${currentDate}`;
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
 * RSS 피드 파싱 (URL 매개변수 버전)
 */
async function parseRSSFeedWithUrl(feedUrl) {
  console.log(`🔗 RSS 피드 요청: ${feedUrl}`);
  try {
    const fetch = require('node-fetch');
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: config.rss.timeout
    });
    const data = await response.text();
    console.log(`📊 RSS 응답 데이터 길이: ${data.length}자`);
    const itemMatches = data.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];
    console.log(`📊 찾은 item 태그 수: ${itemMatches.length}개`);
    const articles = [];
    itemMatches.forEach((item, index) => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                    item.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim();
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                         item.match(/<description>(.*?)<\/description>/))?.[1]?.trim() || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || new Date().toISOString();
      if (title && link) {
        const article = { title, link, description, pubDate, id: Buffer.from(link).toString('base64').substring(0, 16) };
        articles.push(article);
        console.log(`📰 기사 ${index + 1}: ${title.substring(0, 50)}...`);
      }
    });
    console.log(`✅ RSS 파싱 완료: ${articles.length}개 기사 추출`);
    return articles;
  } catch (error) {
    console.error('❌ RSS 요청 또는 파싱 오류:', error.message);
    throw error;
  }
}

/**
 * RSS 피드 파싱 (기존 버전 - 호환성 유지)
 */
async function parseRSSFeed() {
  const feedUrl = RSS_FEED_URL || config.rss?.url;
  if (!feedUrl) {
    throw new Error('RSS 피드 URL이 설정되지 않았습니다.');
  }
  return parseRSSFeedWithUrl(feedUrl);
}

/**
 * 향상된 콘텐츠 처리 함수
 */
async function processArticleWithEnhancedContent(article) {
  console.log(`🔍 처리 중: ${article.title}`);
  
  // GUI 설정 로드
  let guiConfig = {};
  try {
    const guiConfigPath = path.resolve(__dirname, 'gui-config.json');
    if (fs.existsSync(guiConfigPath)) {
      guiConfig = JSON.parse(fs.readFileSync(guiConfigPath, 'utf8'));
    }
  } catch (error) {
    console.warn('⚠️ GUI 설정 로드 실패:', error.message);
  }
  
  try {
    // 1. 실제 기사 내용 추출
    console.log('📄 실제 기사 내용을 추출합니다...');
    const fullContent = await extractArticleContent(article.link);
    
    // 2. 향상된 HTML 템플릿 생성
    console.log('🎨 향상된 HTML 템플릿을 생성합니다...');
    const enhancedHTML = createEnhancedHTMLTemplate(article, fullContent);
    
    // 3. AI로 콘텐츠를 한국어 자연어 스타일로 개선 (설정이 활성화된 경우에만)
    let finalContent = enhancedHTML;
    let improvedTitle = article.title;
    let improvedTags = config.content.defaultTags;
    
    // GUI 설정과 기본 설정을 모두 고려
    const aiConfig = guiConfig?.ai || config.openai;
    const isAIEnabled = aiConfig?.enabled && openai && fullContent && fullContent.length > 50;
    
    if (isAIEnabled) {
      console.log('🤖 AI로 콘텐츠를 한국어 자연어 스타일로 개선합니다...');
      try {
        const aiImproved = await improveContentWithAI(article, fullContent);
        finalContent = createEnhancedHTMLTemplate({ ...article, title: aiImproved.title }, aiImproved.content);
        improvedTitle = aiImproved.title;
        improvedTags = aiImproved.tags;
        console.log('✅ AI 콘텐츠 개선 완료');
        console.log(`🤖 AI 개선된 제목: ${improvedTitle}`);
        console.log(`🤖 AI 생성된 태그: ${improvedTags.join(', ')}`);
      } catch (error) {
        console.log('⚠️ AI 콘텐츠 개선 실패, 기본 템플릿 사용:', error.message);
      }
    } else {
      const aiConfig = guiConfig?.ai || config.openai;
      console.log(`ℹ️ AI 콘텐츠 개선 비활성화 (GUI enabled: ${guiConfig?.ai?.enabled}, config enabled: ${config.openai.enabled}, openai객체: ${!!openai}, fullContent길이: ${fullContent?.length || 0}자)`);
    }
    
    console.log('✅ 콘텐츠 준비 완료');
    console.log(`📊 제목: ${article.title}`);
    console.log(`📊 내용 길이: ${finalContent.length}자`);
    console.log(`📊 태그: ${config.content.defaultTags.join(', ')}`);
    
    // 실제 콘텐츠 길이 계산 (AI 개선된 경우 finalContent에서 추출)
    let realContentLength = fullContent.length;
    
    // HTML 콘텐츠에서 실제 텍스트 추출해서 길이 계산
    if (finalContent && finalContent.length > fullContent.length) {
      // HTML 태그 제거해서 실제 텍스트 길이 확인
      const textOnly = finalContent.replace(/<[^>]*>/g, '').trim();
      realContentLength = Math.max(fullContent.length, textOnly.length);
    }
    
    return {
      title: improvedTitle,
      content: finalContent,
      tags: improvedTags,
      originalContent: fullContent,
      contentLength: realContentLength
    };
    
  } catch (error) {
    console.error(`❌ 기사 처리 실패: ${article.title}`, error.message);
    
    // 폴백: 기본 템플릿 사용
    console.log('🔄 기본 템플릿으로 폴백합니다...');
    const fallbackContent = article.description || `이 기사는 ${article.title}에 대한 내용입니다. 원문에서 자세한 정보를 확인하실 수 있습니다.`;
    const fallbackHTML = createHTMLTemplate(article, fallbackContent, 'rich');
    
    // 폴백 콘텐츠 길이 계산
    const fallbackTextLength = fallbackHTML.replace(/<[^>]*>/g, '').trim().length;
    
    return {
      title: article.title,
      content: fallbackHTML,
      tags: config.content.defaultTags,
      originalContent: fallbackContent,
      contentLength: Math.max(fallbackContent.length, fallbackTextLength)
    };
  }
}

/**
 * 티스토리에 실제 포스팅하는 함수
 */
async function postToTistory(title, content, tags) {
  return new Promise((resolve, reject) => {
    const posterScript = path.join(__dirname, 'tistory-poster-fixed.js');
    const category = '뉴스'; // 기본 카테고리
    
    // Node.js 실행 파일 경로
    const nodePath = 'node'; // 글로벌 node 명령어 사용 (shell 모드)
    
    console.log(`📝 포스팅 시작: ${title}`);
    
    // 임시 파일로 콘텐츠 저장 (shell syntax error 방지)
    const tempContentFile = path.join(__dirname, `temp_content_${Date.now()}.html`);
    
    try {
      fs.writeFileSync(tempContentFile, content, 'utf8');
      
      // 프로젝트 루트 경로 설정
      const projectRoot = path.resolve(__dirname, '..');
      const posterProcess = spawn(nodePath, [
        posterScript,
        title,
        tempContentFile,  // 파일 경로로 전달
        category,
        tags
      ], {
        env: {
          ...process.env,
          TISTORY_ID: process.env.TISTORY_ID,
          TISTORY_PW: process.env.TISTORY_PW,
          BLOG_ADDRESS: process.env.BLOG_ADDRESS
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectRoot,
        shell: false  // shell 모드 비활성화로 안정성 향상
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
        // 임시 파일 정리
        try {
          if (fs.existsSync(tempContentFile)) {
            fs.unlinkSync(tempContentFile);
          }
        } catch (cleanupError) {
          console.warn('⚠️ 임시 파일 정리 실패:', cleanupError.message);
        }
        
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
        // 임시 파일 정리
        try {
          if (fs.existsSync(tempContentFile)) {
            fs.unlinkSync(tempContentFile);
          }
        } catch (cleanupError) {
          console.warn('⚠️ 임시 파일 정리 실패:', cleanupError.message);
        }
        
        console.error(`❌ 포스팅 프로세스 오류: ${error.message}`);
        reject(error);
      });
    } catch (fileError) {
      console.error(`❌ 임시 파일 생성 실패: ${fileError.message}`);
      reject(fileError);
    }
  });
}

/**
 * 메인 자동화 함수
 */
async function runAutomation() {
  // GUI 설정 로드 및 적용 (한 번만 로드)
  let guiConfig = {};
  let allowRepost = process.env.ALLOW_REPOST === 'true';
  let maxArticles = config.schedule.maxArticlesPerRun; // 기본값
  
  try {
    const guiConfigPath = path.resolve(__dirname, 'gui-config.json');
    if (fs.existsSync(guiConfigPath)) {
      guiConfig = JSON.parse(fs.readFileSync(guiConfigPath, 'utf8'));
      console.log('🔧 GUI 설정 파일 로드 완료');
      
      // allowRepost 설정 적용
      if (typeof guiConfig.schedule?.allowRepost === 'boolean') {
        allowRepost = guiConfig.schedule.allowRepost;
        console.log(`🔧 GUI 설정 allowRepost 사용: ${allowRepost}`);
      }
      
      // maxArticles 설정 적용
      if (typeof guiConfig.schedule?.maxArticles === 'number' && guiConfig.schedule.maxArticles > 0) {
        maxArticles = guiConfig.schedule.maxArticles;
        console.log(`🔧 GUI 설정 maxArticles 사용: ${maxArticles}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ GUI 설정 파일 로드 오류:', error.message);
  }
  console.log(`🔧 allowRepost 최종 값: ${allowRepost}`);
  console.log('🚀 설정 기반 자동화 시작...');
  console.log('🚀 runAutomation() 함수가 호출되었습니다.');
  console.log(`📊 설정 요약:`);
  console.log(`   - 스케줄: ${config.schedule.enabled ? config.schedule.type : '비활성화'}`);
  console.log(`   - HTML 모드: ${config.htmlMode.enabled ? config.htmlMode.template : '비활성화'}`);
  console.log(`   - OpenAI: ${config.openai.enabled ? '활성화' : '비활성화'}`);
  console.log(`   - 최대 기사 수: ${maxArticles}개`);
  
  // RSS URL 결정 (GUI 설정 우선)
  let rssUrl = config.rss?.url; // 기본 config
  
  // GUI 설정에서 RSS URL 가져오기 (이미 로드된 guiConfig 사용)
  if (guiConfig.rss?.url) {
    rssUrl = guiConfig.rss.url;
    console.log(`🔧 GUI 설정 RSS URL 사용: ${rssUrl}`);
  }
  
  // 환경변수로 오버라이드 가능 (최종 우선순위)
  if (RSS_FEED_URL) {
    rssUrl = RSS_FEED_URL;
    console.log(`🔧 환경변수 RSS URL로 오버라이드: ${rssUrl}`);
  }
  
  console.log(`📡 RSS 설정 확인:`);
  console.log(`   - GUI RSS URL: ${guiConfig?.rss?.url || '없음'}`);
  console.log(`   - 환경변수 RSS URL: ${RSS_FEED_URL || '없음'}`);
  console.log(`   - 기본 config RSS URL: ${config.rss?.url || '없음'}`);
  console.log(`   - 최종 사용할 URL: ${rssUrl}`);
  
  if (!rssUrl) {
    console.error('❌ RSS 피드 URL이 설정되지 않았습니다.');
    console.error('❌ 환경변수나 config.js에서 RSS URL을 확인해주세요.');
    throw new Error('RSS 피드 URL이 설정되지 않았습니다.');
  }
  
  console.log(`✅ RSS URL 확인 완료: ${rssUrl}`);

  try {
    // RSS 피드 파싱
    console.log(`📡 RSS 피드 파싱 중... (${rssUrl})`);
    const articles = await parseRSSFeedWithUrl(rssUrl);
    console.log(`📰 총 ${articles.length}개 기사 발견`);

    // 처리된 기사 목록 로드
    let processedArticles = [];
    try {
      const data = fs.readFileSync(PROCESSED_FILE, 'utf8');
      processedArticles = JSON.parse(data);
    } catch (error) {
      console.log('📝 새로운 처리 기록 파일 생성');
    }

    // 포스팅 대상 기사 필터링 (allowRepost 지원)
    let targetArticles;
    if (allowRepost) {
      // 이전 처리 기록 무시: 모든 기사 중 최대 개수만큼 포스팅
      targetArticles = articles.slice(0, maxArticles);
      console.log(`⚙️ allowRepost 활성: 과거 기사 포함, 총 ${targetArticles.length}개 기사 포스팅`);
    } else {
      // 새 기사만 포스팅
      targetArticles = articles.filter(article =>
        !processedArticles.includes(article.id)
      ).slice(0, maxArticles);
      console.log(`🆕 새 기사 ${targetArticles.length}개 발견`);
    }

    if (targetArticles.length === 0) {
      console.log('❌ 처리할 기사가 없습니다!');
      console.log(`❌ 총 RSS 기사: ${articles.length}개`);
      console.log(`❌ 이미 처리된 기사: ${processedArticles.length}개`);
      console.log(`❌ allowRepost 설정: ${allowRepost}`);
      console.log(`❌ 최대 기사 수: ${maxArticles}개`);
      
      if (!allowRepost && articles.length > 0) {
        console.log('💡 해결방법: allowRepost를 true로 설정하거나 processed_articles.json을 삭제하세요');
      }
      
      return;
    }

    // 각 기사 처리 (targetArticles 사용)
    for (let i = 0; i < targetArticles.length; i++) {
      const article = targetArticles[i];
      console.log(`\n🔍 처리 중 (${i + 1}/${targetArticles.length}): ${article.title}`);

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

        // 향상된 콘텐츠 처리 사용
        const processedContent = await processArticleWithEnhancedContent({ ...article, title: cleanTitle });

        // 내용 검증 개선 - 실제 추출된 콘텐츠 길이 확인
        const actualContentLength = processedContent.contentLength || 
                                   processedContent.originalContent?.length || 
                                   processedContent.content?.length || 0;
        
        // GUI 설정의 minContentLength 사용 (기본값 50자)
        let minLength = 50;
        try {
          const guiConfigPath = path.resolve(__dirname, 'gui-config.json');
          if (fs.existsSync(guiConfigPath)) {
            const guiConfig = JSON.parse(fs.readFileSync(guiConfigPath, 'utf8'));
            if (guiConfig.rss?.minContentLength) {
              minLength = guiConfig.rss.minContentLength;
              console.log(`🔧 GUI 설정 minContentLength 사용: ${minLength}자`);
            }
          }
        } catch (error) {
          console.warn('⚠️ GUI minContentLength 설정 확인 실패:', error.message);
        }
        
        console.log(`📊 콘텐츠 길이 검증: ${actualContentLength}자 (최소 ${minLength}자 필요)`);
        console.log(`📊 실제 HTML 콘텐츠 길이: ${processedContent.content?.length || 0}자`);
        
        // 실제 콘텐츠 또는 HTML 콘텐츠 중 하나라도 충분하면 진행
        const htmlContentLength = processedContent.content?.length || 0;
        const hasEnoughContent = actualContentLength >= minLength || htmlContentLength >= 500; // HTML은 더 관대하게
        
        if (!hasEnoughContent) {
          console.log(`⚠️ 내용이 너무 짧습니다 (실제: ${actualContentLength}자, HTML: ${htmlContentLength}자). 건너뜁니다.`);
          continue;
        }
        
        console.log(`✅ 콘텐츠 길이 검증 통과 (실제: ${actualContentLength}자, HTML: ${htmlContentLength}자)`);

        // 최종 포스팅 콘텐츠
        let postContent = processedContent.content;

        console.log('✅ 콘텐츠 준비 완료');
        console.log(`📊 제목: ${processedContent.title}`);
        console.log(`📊 내용 길이: ${postContent.length}자`);
        console.log(`📊 실제 추출 길이: ${actualContentLength}자`);
        console.log(`📊 태그: ${processedContent.tags.join(', ')}`);

        // 디버그 모드 체크 (GUI 설정 우선)
        let debugMode = false;
        
        // 1. GUI 설정에서 디버그 모드 확인
        try {
          const guiConfigPath = path.resolve(__dirname, 'gui-config.json');
          if (fs.existsSync(guiConfigPath)) {
            const guiConfig = JSON.parse(fs.readFileSync(guiConfigPath, 'utf8'));
            debugMode = guiConfig.advanced?.debug === true;
            console.log(`🔧 GUI 디버그 설정: ${debugMode}`);
          }
        } catch (error) {
          console.warn('⚠️ GUI 디버그 설정 확인 실패:', error.message);
        }
        
        // 2. 환경변수로 오버라이드 가능
        if (process.env.DEBUG_MODE === 'true') {
          debugMode = true;
          console.log(`🔧 환경변수로 디버그 모드 강제 활성화`);
        } else if (process.env.DEBUG_MODE === 'false') {
          debugMode = false;
          console.log(`🔧 환경변수로 디버그 모드 강제 비활성화`);
        }
        
        console.log(`🔧 최종 디버그 모드: ${debugMode}`);
        
        if (debugMode) {
          console.log('🔍 디버그 모드: 실제 포스팅하지 않음');
          console.log('📝 포스팅 내용 미리보기:');
          console.log(`📋 제목: ${processedContent.title}`);
          console.log(`📄 내용 길이: ${postContent.length}자`);
          console.log(`🏷️ 태그: ${processedContent.tags.join(', ')}`);
          console.log(`📝 내용 샘플: ${postContent.substring(0, 200)}...`);
          console.log('✅ 디버그 모드 완료 - 실제 포스팅하지 않았습니다.');
        } else {
          // ✅ 실제 포스팅 실행!
          console.log('📝 실제 티스토리 포스팅을 시작합니다...');
          console.log(`📝 포스팅 제목: ${processedContent.title}`);
          console.log(`📝 포스팅 길이: ${postContent.length}자`);
          console.log(`📝 태그: ${processedContent.tags.join(', ')}`);
          
          try {
            await postToTistory(processedContent.title, postContent, processedContent.tags.join(','));
            console.log('🎉 티스토리 포스팅 성공!');
            console.log(`🎉 "${processedContent.title}" 포스팅이 완료되었습니다.`);
          } catch (error) {
            console.log('❌ 포스팅 실패:', error.message);
            console.log('❌ 다음 기사로 계속 진행합니다...');
            // 포스팅 실패해도 기록은 남기지 않음 (재시도 가능)
            continue; // 다음 기사로 계속
          }
        }

        // 처리 완료 기록 (allowRepost env 비활성화 시에만 기록)
        if (!allowRepost) {
          processedArticles.push(article.id);
        }
        
        // 포스팅 간격 대기
        if (i < targetArticles.length - 1) {
          console.log(`⏰ ${config.schedule.intervalBetweenPosts / 1000}초 대기...`);
          await new Promise(resolve => setTimeout(resolve, config.schedule.intervalBetweenPosts));
        }

      } catch (error) {
        console.error(`❌ 기사 처리 실패: ${error.message}`);
      }
    }

    // 처리 기록 저장
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedArticles, null, 2));
    console.log(`\n🎉 자동화 완료! ${targetArticles.length}개 기사 처리됨`);

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
  
  // 환경변수 우선 체크 (GUI에서 호출된 경우)
  const isCalledFromGUI = process.env.TISTORY_ID && process.env.RSS_FEED_URL;
  
  console.log('📊 상세 환경변수 확인:');
  console.log(`   - TISTORY_ID: ${process.env.TISTORY_ID ? '설정됨' : '없음'}`);
  console.log(`   - TISTORY_PW: ${process.env.TISTORY_PW ? '설정됨' : '없음'}`);
  console.log(`   - BLOG_ADDRESS: ${process.env.BLOG_ADDRESS || '없음'}`);
  console.log(`   - RSS_FEED_URL: ${process.env.RSS_FEED_URL || '없음'}`);
  console.log(`   - DEBUG_MODE: ${process.env.DEBUG_MODE || '없음'}`);
  console.log(`   - HTML_ENABLED: ${process.env.HTML_ENABLED || '없음'}`);
  console.log(`   - GUI 호출 여부: ${isCalledFromGUI ? '예' : '아니오'}`);
  
  if (isCalledFromGUI || config.schedule.type === 'manual') {
    console.log('📝 즉시 실행 모드로 자동화를 시작합니다.');
    
    // 환경변수 기반 디버그 모드 설정
    const debugMode = process.env.DEBUG_MODE === 'true';
    console.log(`🔍 디버그 모드: ${debugMode ? '활성화' : '비활성화'}`);
    
    // RSS URL 최종 확인
    const finalRssUrl = RSS_FEED_URL || config.rss?.url;
    console.log(`🔗 최종 RSS URL: ${finalRssUrl}`);
    
    if (!finalRssUrl) {
      console.error('❌ RSS URL이 설정되지 않았습니다!');
      console.error('❌ 환경변수 RSS_FEED_URL 또는 config.rss.url을 확인해주세요.');
      process.exit(1);
    }
    
    // 실제 자동화 실행
    console.log('⏳ RSS 피드 파싱 및 포스팅 작업을 시작합니다...');
    console.log('⏳ runAutomation() 함수를 호출합니다...');
    
    runAutomation().then(() => {
      console.log('🎉 자동화 실행 완료!');
      console.log('📝 모든 작업이 성공적으로 완료되었습니다.');
      process.exit(0);
    }).catch(error => {
      console.error('❌ 자동화 실행 실패:', error.message);
      console.error('❌ 스택 트레이스:', error.stack);
      console.error('📝 자동화 작업 중 오류가 발생했습니다.');
      process.exit(1);
    });
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