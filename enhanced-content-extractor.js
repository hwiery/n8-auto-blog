/**
 * 향상된 콘텐츠 추출기
 * RSS 피드에서 실제 기사 내용을 추출하여 풍부한 HTML 콘텐츠를 생성합니다.
 */

const https = require('https');
const http = require('http');
const url = require('url');

/**
 * 간단한 HTTP 요청으로 기사 내용을 추출합니다.
 * @param {string} articleUrl - 기사 URL
 * @returns {Promise<string>} 추출된 기사 본문
 */
async function extractArticleContent(articleUrl) {
  console.log('📄 기사 내용 추출 시작:', articleUrl);
  
  try {
    // fetch 사용으로 변경 (더 안정적)
    const fetch = require('node-fetch');
    
    const response = await fetch(articleUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000, // 15초 타임아웃
      follow: 5, // 최대 5번 리다이렉션
    });

    if (!response.ok) {
      console.log(`⚠️ HTTP ${response.status} 응답: ${articleUrl}`);
      return '';
    }

    const html = await response.text();
    
    // HTML에서 본문 내용 추출 (더 정교한 방식)
    let content = '';
    
    // 주요 콘텐츠 영역 선택자들
    const contentSelectors = [
      // 일반적인 기사 본문 선택자
      'article .article-content',
      'article .content',
      '.article-body',
      '.news-content',
      '.post-content',
      '.entry-content',
      'main .content',
      '[class*="article-content"]',
      '[class*="news-content"]',
      '[class*="post-content"]',
      // 한국 언론사 특화 선택자
      '.article_view',
      '.news_text',
      '.article-text',
      '.view_text',
      '.read_txt',
      // 구글 뉴스 리다이렉션 대응
      'body',
    ];
    
    // 정규식으로 메타 태그에서 description 추출 시도
    const metaDescMatch = html.match(/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*/i);
    if (metaDescMatch) {
      content = metaDescMatch[1];
      console.log(`📋 메타 태그에서 설명 추출: ${content.length}자`);
    }
    
    // 본문 텍스트 추출
    if (!content || content.length < 100) {
      // HTML 정리
      let cleanHtml = html
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // 스크립트 제거
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // 스타일 제거
        .replace(/<nav[^>]*>.*?<\/nav>/gis, '') // 네비게이션 제거
        .replace(/<header[^>]*>.*?<\/header>/gis, '') // 헤더 제거
        .replace(/<footer[^>]*>.*?<\/footer>/gis, '') // 푸터 제거
        .replace(/<aside[^>]*>.*?<\/aside>/gis, '') // 사이드바 제거
        .replace(/<!--.*?-->/gis, ''); // 주석 제거

      // 모든 HTML 태그 제거 후 텍스트 추출
      content = cleanHtml
        .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
        .replace(/\s+/g, ' ') // 연속 공백 정리
        .replace(/\n\s*\n/g, '\n') // 연속 줄바꿈 정리
        .trim();
      
      console.log(`📋 HTML 전체에서 텍스트 추출: ${content.length}자`);
    }
    
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
      /\[출처.*?\]/gi,
      /\(출처.*?\)/gi,
    ];
    
    unwantedPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // 콘텐츠 길이 체크 및 보강
    if (content.length < 100) {
      console.log(`⚠️ 추출된 콘텐츠가 부족함 (${content.length}자), 폴백 콘텐츠 추가`);
      
      // 메타 태그에서 추가 정보 시도
      const titleMatch = html.match(/<title[^>]*>([^<]*)</i);
      const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*/i);
      
      let additionalContent = '';
      if (titleMatch && titleMatch[1]) {
        additionalContent += `제목: ${titleMatch[1].trim()}\n\n`;
      }
      if (descMatch && descMatch[1]) {
        additionalContent += `${descMatch[1].trim()}\n\n`;
      }
      
      content = additionalContent + content;
    }
    
    // 의미있는 문장들만 추출 (최소 10자 이상으로 완화)
    const sentences = content.split(/[.!?]\s+/)
      .filter(sentence => sentence.trim().length > 10)
      .slice(0, 12); // 최대 12문장으로 늘림
    
    content = sentences.join('. ').trim();
    
    // 최대 길이 제한 (1200자)
    if (content.length > 1200) {
      content = content.substring(0, 1200);
      // 마지막 완전한 문장에서 자르기
      const lastPeriod = content.lastIndexOf('.');
      if (lastPeriod > 600) {
        content = content.substring(0, lastPeriod + 1);
      }
      content += '...';
    }
    
    // 최종 안전 체크: 최소 길이 보장
    if (content.length < 50) {
      console.log(`⚠️ 최종 콘텐츠가 너무 짧음 (${content.length}자), 기본 콘텐츠로 대체`);
      content = `최신 동향과 관련된 중요한 내용을 다루고 있습니다.

현재 화제가 되고 있는 주요 이슈들을 살펴보고, 이와 관련된 다양한 관점과 의견들을 종합해서 정리했습니다.

앞으로의 전망과 예상되는 변화들에 대해서도 함께 알아보겠습니다.

관련 업계와 전문가들의 다양한 분석과 견해를 통해 더 깊이 있는 이해를 도울 것입니다.`;
    }
    
    console.log(`✅ 기사 내용 추출 완료: ${content.length}자`);
    return content;
    
  } catch (error) {
    console.error('❌ 기사 내용 추출 실패:', error.message);
    
    // 폴백: 기사 제목이나 URL에서 기본 내용 생성
    const fallbackContent = `현재 주목받고 있는 주요 이슈에 대해 다루고 있습니다.
    
관련 분야의 최신 동향과 전문가들의 의견을 종합하여 정리한 내용입니다. 

다양한 관점에서 바라본 분석과 향후 전망에 대해서도 함께 살펴보겠습니다.

업계 동향과 관련된 중요한 정보들을 지속적으로 모니터링하여 유용한 인사이트를 제공하고 있습니다.`;
    
    console.log(`🔄 폴백 콘텐츠 사용: ${fallbackContent.length}자`);
    return fallbackContent;
  }
}

/**
 * 티스토리 호환 HTML 템플릿 생성 (기본 태그만 사용)
 * @param {Object} article - 기사 정보
 * @param {string} fullContent - 전체 기사 내용
 * @returns {string} 티스토리 호환 HTML
 */
function createEnhancedHTMLTemplate(article, fullContent) {
  // 기사 제목에서 언론사명 제거
  const cleanTitle = article.title
    .replace(/ - [가-힣A-Za-z0-9\s]+$/, '')
    .replace(/ \| [가-힣A-Za-z0-9\s]+$/, '')
    .replace(/ \/ [가-힣A-Za-z0-9\s]+$/, '')
    .replace(/ · [가-힣A-Za-z0-9\s]+$/, '')
    .replace(/\[[가-힣A-Za-z0-9\s]+\]$/, '')
    .trim();

  // 콘텐츠가 있으면 문단으로 분할
  let contentHTML = '';
  if (fullContent && fullContent.length > 20) {
    const paragraphs = fullContent
      .split(/[.!?]\s+/)
      .filter(p => p.trim().length > 20)
      .slice(0, 6);

    contentHTML = paragraphs.map(paragraph => 
      `<p>${paragraph.trim()}${paragraph.endsWith('.') || paragraph.endsWith('!') || paragraph.endsWith('?') ? '' : '.'}</p>`
    ).join('\n');
  } else if (article.description) {
    contentHTML = `<p>${article.description}</p>`;
  } else {
          contentHTML = '<p>관련 내용에 대한 자세한 분석과 전망을 제공하고 있습니다.</p>';
  }

  return `<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <div style="border-left: 4px solid #007bff; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: #007bff; margin-bottom: 10px; font-size: 24px;">${cleanTitle}</h2>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 14px; color: #666;">
      <strong>📅 발행일:</strong> ${new Date(article.pubDate).toLocaleDateString('ko-KR')}
    </p>
    <p style="margin: 5px 0; font-size: 14px; color: #666;">
      <strong>📖 더 알아보기:</strong> <a href="${article.link}" target="_blank" style="color: #007bff; text-decoration: none;">관련 정보</a>
    </p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">📰 주요 내용</h3>
    ${contentHTML}
  </div>
  
  <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
    <p style="font-size: 12px; color: #999; text-align: center; margin: 5px 0;">
      📌 현재 주목받고 있는 이슈들을 종합하여 정리한 글입니다.
    </p>
    <p style="font-size: 12px; color: #999; text-align: center; margin: 5px 0;">
      ⏰ 자동 포스팅 시간: ${new Date().toLocaleDateString('ko-KR')}
    </p>
  </div>
</div>`;
}

module.exports = {
  extractArticleContent,
  createEnhancedHTMLTemplate
}; 