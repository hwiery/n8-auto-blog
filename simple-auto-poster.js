/**
 * 간단한 구글 뉴스 자동 포스팅 시스템
 * - 구글 시트 없이 로컬 파일로 중복 관리
 * - OpenAI API 없이 기본 텍스트 처리
 * - RSS 피드 자동 모니터링
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 설정
const CONFIG = {
  RSS_URL: process.env.RSS_FEED_URL || 'https://news.google.com/rss?topic=h&hl=ko&gl=KR&ceid=KR:ko',
  PROCESSED_FILE: 'processed_articles.json',
  MAX_ARTICLES_PER_RUN: 3, // 한 번에 처리할 최대 기사 수
  CONTENT_MIN_LENGTH: 10, // 최소 콘텐츠 길이 (RSS 설명만으로도 충분)
};

console.log('🚀 간단한 구글 뉴스 자동 포스팅 시작...\n');

/**
 * RSS 피드 파싱 함수
 */
async function fetchRSSFeed(url) {
  try {
    // Node.js 18 호환성을 위해 https 모듈 사용
    const https = require('https');
    const xmlText = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    });
    
    // 간단한 XML 파싱 (정규식 사용)
    const items = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const titleRegex = /<title>(.*?)<\/title>/s;
    const linkRegex = /<link>(.*?)<\/link>/s;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/s;
    const descriptionRegex = /<description>(.*?)<\/description>/s;
    
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const pubDateMatch = pubDateRegex.exec(itemContent);
      const descriptionMatch = descriptionRegex.exec(itemContent);
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          description: descriptionMatch ? descriptionMatch[1].trim() : '',
          id: Buffer.from(linkMatch[1]).toString('base64').slice(0, 20) // 고유 ID 생성
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error('❌ RSS 피드 가져오기 실패:', error.message);
    return [];
  }
}

/**
 * 처리된 기사 목록 로드
 */
function loadProcessedArticles() {
  try {
    if (fs.existsSync(CONFIG.PROCESSED_FILE)) {
      const data = fs.readFileSync(CONFIG.PROCESSED_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('⚠️ 처리된 기사 목록 로드 실패:', error.message);
  }
  return [];
}

/**
 * 처리된 기사 목록 저장
 */
function saveProcessedArticles(articles) {
  try {
    fs.writeFileSync(CONFIG.PROCESSED_FILE, JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('❌ 처리된 기사 목록 저장 실패:', error.message);
  }
}

/**
 * 기사 내용 추출 및 정제
 */
async function extractArticleContent(url) {
  try {
    const https = require('https');
    const http = require('http');
    const urlModule = require('url');
    
    const parsedUrl = urlModule.parse(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const html = await new Promise((resolve, reject) => {
      const request = client.get(url, (res) => {
        // 리다이렉트 처리
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`🔄 리다이렉트: ${res.headers.location}`);
          return extractArticleContent(res.headers.location).then(resolve).catch(reject);
        }
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
      
      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('요청 시간 초과'));
      });
    });
    
    // HTML에서 본문 내용 추출 (더 정교한 방식)
    let content = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // 스크립트 제거
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // 스타일 제거
      .replace(/<nav[^>]*>.*?<\/nav>/gis, '') // 네비게이션 제거
      .replace(/<header[^>]*>.*?<\/header>/gis, '') // 헤더 제거
      .replace(/<footer[^>]*>.*?<\/footer>/gis, '') // 푸터 제거
      .replace(/<aside[^>]*>.*?<\/aside>/gis, '') // 사이드바 제거
      .replace(/<!--.*?-->/gis, '') // 주석 제거
      .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
      .replace(/\s+/g, ' ') // 연속 공백 정리
      .replace(/\n\s*\n/g, '\n') // 연속 줄바꿈 정리
      .trim();
    
    // 불필요한 텍스트 패턴 제거
    const unwantedPatterns = [
      /Copyright.*?All rights reserved/gi,
      /저작권.*?무단.*?금지/gi,
      /본 콘텐츠의 저작권은/gi,
      /기자\s*[가-힣]{2,4}@/gi,
      /\[.*?기자\]/gi,
      /\(.*?기자\)/gi,
      /무단전재.*?재배포.*?금지/gi,
      /\[사진.*?\]/gi,
      /\(사진.*?\)/gi,
    ];
    
    unwantedPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // 의미있는 문장들만 추출 (최소 10자 이상)
    const sentences = content.split(/[.!?]\s+/)
      .filter(sentence => sentence.trim().length > 10)
      .slice(0, 5); // 최대 5문장
    
    content = sentences.join('. ').trim();
    
    // 최대 길이 제한 (800자)
    if (content.length > 800) {
      content = content.substring(0, 800);
      // 마지막 완전한 문장에서 자르기
      const lastPeriod = content.lastIndexOf('.');
      if (lastPeriod > 400) {
        content = content.substring(0, lastPeriod + 1);
      }
      content += '...';
    }
    
    return content;
  } catch (error) {
    console.error('⚠️ 기사 내용 추출 실패:', error.message);
    return '';
  }
}

/**
 * 제목에서 언론사명 제거
 */
function cleanTitle(title) {
  // 언론사명 패턴들 (- 언론사명, | 언론사명, / 언론사명 등)
  const patterns = [
    / - [가-힣A-Za-z0-9\s]+$/,  // " - 한겨레", " - 조선일보" 등
    / \| [가-힣A-Za-z0-9\s]+$/,  // " | 언론사명"
    / \/ [가-힣A-Za-z0-9\s]+$/,  // " / 언론사명"
    / · [가-힣A-Za-z0-9\s]+$/,   // " · 언론사명"
    /\[[가-힣A-Za-z0-9\s]+\]$/,  // "[언론사명]"
  ];
  
  let cleanedTitle = title;
  patterns.forEach(pattern => {
    cleanedTitle = cleanedTitle.replace(pattern, '');
  });
  
  return cleanedTitle.trim();
}

/**
 * 기사를 블로그 포스트 형식으로 변환
 */
function formatAsPost(article, content) {
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const pubDate = new Date(article.pubDate).toLocaleDateString('ko-KR');
  
  // 내용이 너무 짧거나 없으면 기본 메시지 사용
  let mainContent = '';
  if (content && content.length > 20) {
    // HTML 태그가 이미 제거된 텍스트를 단락으로 나누기
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    mainContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
  } else if (article.description && article.description.length > 10) {
    mainContent = `<p>${article.description}</p>`;
  } else {
    mainContent = '<p>자세한 내용은 아래 원문 링크를 참조해주세요.</p>';
  }
  
  const htmlContent = `<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <div style="border-left: 4px solid #007bff; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: #007bff; margin-bottom: 10px; font-size: 24px;">${cleanTitle(article.title)}</h2>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 14px; color: #666;">
      <strong>📅 발행일:</strong> ${pubDate}
    </p>
    <p style="margin: 5px 0; font-size: 14px; color: #666;">
      <strong>🔗 원문 보기:</strong> <a href="${article.link}" target="_blank" style="color: #007bff; text-decoration: none;">기사 원문 링크</a>
    </p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">📰 주요 내용</h3>
    ${mainContent}
  </div>
  
  <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
    <p style="font-size: 12px; color: #999; text-align: center; margin: 5px 0;">
      📌 이 글은 구글 뉴스에서 자동으로 수집된 기사를 재구성한 것입니다.
    </p>
    <p style="font-size: 12px; color: #999; text-align: center; margin: 5px 0;">
      ⏰ 자동 포스팅 시간: ${currentDate}
    </p>
  </div>
</div>`;
  
  return htmlContent;
}

/**
 * 티스토리에 포스팅
 */
function postToTistory(title, content) {
  return new Promise((resolve, reject) => {
    console.log(`📝 포스팅 시작: ${title}`);
    
    const child = spawn('node', [
      'tistory-poster-fixed.js',
      title,
      content,
      '뉴스',
      '구글뉴스,자동포스팅,뉴스'
    ], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 포스팅 완료: ${title}\n`);
        resolve();
      } else {
        console.error(`❌ 포스팅 실패: ${title}\n`);
        reject(new Error(`포스팅 실패: ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ 실행 오류:`, error);
      reject(error);
    });
  });
}

/**
 * 포스팅 내용 검증
 */
function validatePostContent(title, content) {
  const issues = [];
  
  // 제목 검증
  if (!title || title.trim().length < 5) {
    issues.push('제목이 너무 짧습니다 (최소 5자)');
  }
  
  if (title.length > 100) {
    issues.push('제목이 너무 깁니다 (최대 100자)');
  }
  
  // 내용 검증
  if (!content || content.trim().length < 50) {
    issues.push('내용이 너무 짧습니다 (최소 50자)');
  }
  
  // HTML 구조 검증
  if (!content.includes('<div style="font-family:')) {
    issues.push('HTML 구조가 올바르지 않습니다');
  }
  
  if (!content.includes('</div>')) {
    issues.push('HTML 태그가 제대로 닫히지 않았습니다');
  }
  
  // 필수 요소 검증
  const requiredElements = [
    '📅 발행일',
    '🔗 원문 보기',
    '📰 주요 내용',
    '📌 이 글은 구글 뉴스에서'
  ];
  
  requiredElements.forEach(element => {
    if (!content.includes(element)) {
      issues.push(`필수 요소 누락: ${element}`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

/**
 * 메인 자동화 함수
 */
async function runAutomation() {
  console.log('🔍 RSS 피드에서 새 기사 확인 중...');
  
  // 1. RSS 피드 가져오기
  const articles = await fetchRSSFeed(CONFIG.RSS_URL);
  if (articles.length === 0) {
    console.log('⚠️ 가져올 기사가 없습니다.');
    return;
  }
  
  console.log(`📰 총 ${articles.length}개 기사 발견`);
  
  // 2. 처리된 기사 목록 로드
  const processedArticles = loadProcessedArticles();
  const processedIds = processedArticles.map(a => a.id);
  
  // 3. 새 기사 필터링
  const newArticles = articles.filter(article => !processedIds.includes(article.id));
  
  if (newArticles.length === 0) {
    console.log('✅ 모든 기사가 이미 처리되었습니다.');
    return;
  }
  
  console.log(`🆕 새 기사 ${newArticles.length}개 발견`);
  
  // 4. 처리할 기사 수 제한
  const articlesToProcess = newArticles.slice(0, CONFIG.MAX_ARTICLES_PER_RUN);
  console.log(`📝 ${articlesToProcess.length}개 기사 처리 시작...\n`);
  
  // 5. 각 기사 처리
  for (const article of articlesToProcess) {
    try {
      console.log(`🔍 처리 중: ${article.title}`);
      
      // 기사 내용 추출 (실패 시 RSS 설명 사용)
      let content = await extractArticleContent(article.link);
      
      // 내용 추출 실패 시 RSS 설명 사용
      if (!content || content.length < CONFIG.CONTENT_MIN_LENGTH) {
        content = article.description || '자세한 내용은 원문 링크를 참조해주세요.';
        console.log(`📝 RSS 설명 사용: ${article.title}`);
      }
      
      // 블로그 포스트 형식으로 변환
      const postContent = formatAsPost(article, content);
      
      // 제목 정리 (언론사명 제거)
      const cleanedTitle = cleanTitle(article.title);
      
      // 내용 검증
      const validation = validatePostContent(cleanedTitle, postContent);
      if (!validation.isValid) {
        console.error(`❌ 포스팅 내용 검증 실패: ${article.title}`);
        validation.issues.forEach(issue => console.error(`   - ${issue}`));
        console.log('⏭️ 다음 기사로 넘어갑니다...\n');
        continue;
      }
      
      console.log('✅ 내용 검증 통과');
      
      // 티스토리에 포스팅
      await postToTistory(cleanedTitle, postContent);
      
      // 처리된 기사 목록에 추가
      processedArticles.push({
        id: article.id,
        title: article.title,
        link: article.link,
        processedAt: new Date().toISOString()
      });
      
      // 잠시 대기 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ 기사 처리 실패: ${article.title}`, error.message);
    }
  }
  
  // 6. 처리된 기사 목록 저장
  saveProcessedArticles(processedArticles);
  
  console.log('🎉 자동화 처리 완료!');
  console.log(`📊 총 처리된 기사: ${processedArticles.length}개`);
}

/**
 * 오래된 처리 기록 정리 (30일 이상)
 */
function cleanupOldRecords() {
  try {
    const processedArticles = loadProcessedArticles();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentArticles = processedArticles.filter(article => {
      const processedDate = new Date(article.processedAt);
      return processedDate > thirtyDaysAgo;
    });
    
    if (recentArticles.length < processedArticles.length) {
      saveProcessedArticles(recentArticles);
      console.log(`🧹 오래된 기록 ${processedArticles.length - recentArticles.length}개 정리 완료`);
    }
  } catch (error) {
    console.error('⚠️ 기록 정리 실패:', error.message);
  }
}

// 메인 실행
async function main() {
  try {
    // 환경변수 확인
    const requiredVars = ['TISTORY_ID', 'TISTORY_PW', 'BLOG_ADDRESS'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ 누락된 환경변수:', missingVars.join(', '));
      process.exit(1);
    }
    
    console.log('✅ 환경변수 확인 완료');
    console.log(`📡 RSS URL: ${CONFIG.RSS_URL}\n`);
    
    // 오래된 기록 정리
    cleanupOldRecords();
    
    // 자동화 실행
    await runAutomation();
    
  } catch (error) {
    console.error('❌ 자동화 실행 중 오류:', error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { runAutomation, CONFIG }; 