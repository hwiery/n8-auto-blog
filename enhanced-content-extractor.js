/**
 * 향상된 콘텐츠 추출기
 * RSS 피드에서 실제 기사 내용을 추출하여 풍부한 HTML 콘텐츠를 생성합니다.
 */

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');

/**
 * URL에서 실제 기사 내용을 추출합니다.
 * @param {string} articleUrl - 기사 URL
 * @returns {Promise<string>} 추출된 기사 본문
 */
async function extractArticleContent(articleUrl) {
  console.log('📄 기사 내용 추출 시작:', articleUrl);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 페이지 로드
    await page.goto(articleUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // 기사 본문 추출
    const content = await page.evaluate(() => {
      // 일반적인 기사 본문 선택자들
      const contentSelectors = [
        'article',
        '[class*="content"]',
        '[class*="article"]',
        '[class*="post"]',
        '[class*="body"]',
        '[class*="text"]',
        '.entry-content',
        '.post-content',
        '.article-content',
        '.content-body',
        '.article-body',
        'main',
        '#content',
        '.main-content'
      ];

      let extractedContent = '';

      for (const selector of contentSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.innerText || element.textContent;
          if (text && text.length > extractedContent.length && text.length > 200) {
            extractedContent = text;
          }
        }
      }

      // 콘텐츠가 너무 짧으면 전체 body에서 추출
      if (extractedContent.length < 200) {
        const bodyText = document.body.innerText || document.body.textContent;
        if (bodyText && bodyText.length > 200) {
          extractedContent = bodyText;
        }
      }

      // 불필요한 부분 정리
      extractedContent = extractedContent
        .replace(/\n{3,}/g, '\n\n') // 연속된 줄바꿈 정리
        .replace(/\s{2,}/g, ' ') // 연속된 공백 정리
        .trim();

      return extractedContent;
    });

    console.log('✅ 기사 내용 추출 완료:', content.length + '자');
    return content;

  } catch (error) {
    console.error('❌ 기사 내용 추출 실패:', error.message);
    return '';
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 티스토리 호환 HTML 템플릿 생성 (기본 태그만 사용)
 * @param {Object} article - 기사 정보
 * @param {string} fullContent - 전체 기사 내용
 * @returns {string} 티스토리 호환 HTML
 */
function createEnhancedHTMLTemplate(article, fullContent) {
  // 콘텐츠를 문단으로 분할 (최대 8개)
  const paragraphs = fullContent
    .split('\n\n')
    .filter(p => p.trim().length > 50)
    .slice(0, 8);

  // 주요 인사이트 추출 (문단에서 핵심 문장들)
  const insights = paragraphs
    .slice(0, 3)
    .map(p => p.split('.')[0] + '.')
    .filter(insight => insight.length > 30 && insight.length < 150);

  return `<h1>${article.title}</h1>

<p><strong>📅 발행일:</strong> ${new Date(article.pubDate).toLocaleDateString('ko-KR')}</p>
<p><strong>🔗 원문:</strong> <a href="${article.link}" target="_blank">Nielsen Norman Group 기사 보기</a></p>

${article.description ? `
<h2>💡 핵심 요약</h2>
<p><em>${article.description}</em></p>
` : ''}

<h2>📖 주요 내용</h2>
${paragraphs.map(paragraph => `<p>${paragraph.trim()}</p>`).join('\n')}

${insights.length > 0 ? `
<h2>✨ 핵심 인사이트</h2>
<ul>
${insights.map(insight => `  <li>${insight.trim()}</li>`).join('\n')}
</ul>
` : ''}

<h2>🎯 실무 적용 포인트</h2>
<ul>
  <li><strong>디자이너:</strong> 전략적 사고와 스토리텔링 역량 강화</li>
  <li><strong>PM:</strong> 데이터 기반 의사결정과 사용자 중심 접근</li>
  <li><strong>팀:</strong> AI를 도구로 활용하되 인간의 판단력 유지</li>
</ul>

<h2>📚 관련 학습 자료</h2>
<p>
  <strong>더 많은 UX 인사이트:</strong><br/>
  • <a href="https://www.nngroup.com" target="_blank">Nielsen Norman Group 웹사이트</a><br/>
  • UX 디자인 원칙과 방법론<br/>
  • 사용자 리서치 베스트 프랙티스
</p>

<hr />

<p><em>이 글은 Nielsen Norman Group의 최신 연구를 바탕으로 작성되었습니다.</em></p>`;
}

module.exports = {
  extractArticleContent,
  createEnhancedHTMLTemplate
}; 