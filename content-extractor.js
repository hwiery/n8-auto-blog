/**
 * NotebookLM 콘텐츠 추출기
 */

const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Google 계정으로 자동 로그인
 * @param {Object} page - Puppeteer 페이지 객체
 * @param {string} email - Google 이메일
 * @param {string} password - Google 비밀번호
 */
async function loginToGoogle(page, email, password) {
  console.log('🔐 Google 자동 로그인 시작...');
  
  try {
    // 이메일 입력 대기
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('📧 이메일 입력란 발견');
    
    // 이메일 입력
    await page.type('input[type="email"]', email, { delay: 100 });
    console.log('✅ 이메일 입력 완료:', email);
    
    // 다음 버튼 클릭
    const nextButton = await page.$('#identifierNext');
    if (nextButton) {
      await nextButton.click();
      console.log('🔄 다음 버튼 클릭');
    }
    
    // 비밀번호 입력란 대기 (더 긴 시간 대기)
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });
    console.log('🔑 비밀번호 입력란 발견');
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 비밀번호 입력
    await page.type('input[type="password"]', password, { delay: 100 });
    console.log('✅ 비밀번호 입력 완료');
    
    // 로그인 버튼 클릭
    const passwordNext = await page.$('#passwordNext');
    if (passwordNext) {
      await passwordNext.click();
      console.log('🔐 로그인 버튼 클릭');
    }
    
    // 로그인 완료 대기 (더 긴 시간 대기)
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 });
    console.log('✅ Google 로그인 완료');
    
    return true;
  } catch (error) {
    console.error('❌ Google 로그인 실패:', error.message);
    return false;
  }
}

/**
 * NotebookLM URL에서 콘텐츠를 추출합니다
 * @param {string} url - NotebookLM URL
 * @returns {Promise<{title: string, content: string}>}
 */
async function extractNotebookLMContent(url) {
  console.log('📖 NotebookLM 콘텐츠 추출 시작...');
  console.log('🔗 URL:', url);
  
  // 사용자 데이터 디렉토리 설정 (기존 로그인 세션 활용)
  const userDataDir = path.join(__dirname, 'chrome-user-data');
  
  const browser = await puppeteer.launch({
    headless: false, // 디버깅을 위해 브라우저 표시
    userDataDir: userDataDir, // 사용자 데이터 디렉토리 사용
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions-except',
      '--disable-plugins-discovery',
      '--start-maximized'
    ],
    defaultViewport: null
  });
  
  const page = await browser.newPage();
  
  try {
    // User-Agent 설정 (더 일반적인 브라우저로 위장)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 자동화 감지 방지
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    // NotebookLM 페이지로 이동
    console.log('🌐 NotebookLM 페이지로 이동 중...');
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // 페이지 로딩 대기
    console.log('⏳ 페이지 로딩 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    
    // Google 로그인 페이지인지 확인
    if (currentUrl.includes('accounts.google.com')) {
      console.log('🔐 Google 로그인이 필요합니다.');
      
      // 환경변수에서 Google 계정 정보 가져오기
      const googleId = process.env.GOOGLE_ID;
      const googlePw = process.env.GOOGLE_PW;
      
      if (googleId && googlePw) {
        console.log('🔑 환경변수에서 Google 계정 정보 발견');
        console.log('⏰ 수동 로그인을 위해 60초 대기합니다...');
        console.log('🖱️ 브라우저에서 수동으로 Google 계정에 로그인해 주세요.');
        
        // 60초 대기 (수동 로그인 시간)
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // 로그인 후 원본 URL로 다시 이동
        console.log('🔄 원본 NotebookLM URL로 다시 이동...');
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('⚠️ Google 계정 정보가 환경변수에 없습니다.');
        console.log('⏰ 60초 동안 수동 로그인을 기다립니다...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
    
    // 최종 URL 확인
    const finalUrl = page.url();
    console.log('📍 최종 URL:', finalUrl);
    
    // 페이지 제목 추출
    const title = await page.evaluate(() => {
      // NotebookLM 특화 제목 선택자들
      const titleSelectors = [
        '[data-testid="notebook-title"]',
        '.notebook-title',
        '.document-title',
        'h1[data-testid*="title"]',
        'h1',
        '.title',
        '[aria-label*="제목"]',
        '[aria-label*="title"]',
        '.notebook-header h1',
        '.notebook-name'
      ];
      
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          const titleText = element.textContent.trim();
          console.log('제목 발견:', titleText);
          return titleText;
        }
      }
      
      // 페이지 title 태그 사용
      const pageTitle = document.title;
      if (pageTitle && !pageTitle.includes('로그인') && !pageTitle.includes('Sign in') && !pageTitle.includes('로그인할 수 없음')) {
        return pageTitle;
      }
      
      return 'NotebookLM 콘텐츠';
    });
    
    // 본문 내용 추출
    const content = await page.evaluate(() => {
      // NotebookLM 특화 본문 선택자들
      const contentSelectors = [
        '[data-testid="notebook-content"]',
        '.notebook-content',
        '.document-content',
        '[data-testid*="content"]',
        '.content-area',
        '.main-content',
        'main',
        'article',
        '.text-content',
        '[role="main"]',
        '.notebook-body',
        '.source-content'
      ];
      
      let extractedContent = '';
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          extractedContent = element.innerText || element.textContent || '';
          if (extractedContent.trim().length > 200) {
            console.log('본문 발견 (선택자:', selector, '):', extractedContent.substring(0, 100) + '...');
            break;
          }
        }
      }
      
      // 선택자로 찾지 못한 경우 전체 body에서 텍스트 추출
      if (!extractedContent || extractedContent.trim().length < 200) {
        const bodyText = document.body.innerText || document.body.textContent || '';
        
        // Google 로그인 관련 텍스트 필터링
        if (bodyText.includes('Google 계정으로 로그인') || 
            bodyText.includes('이메일 또는 휴대전화') ||
            bodyText.includes('Sign in') ||
            bodyText.includes('로그인할 수 없음')) {
          console.log('Google 로그인 페이지 감지됨');
          return '로그인이 필요한 콘텐츠입니다. 수동으로 확인해 주세요.';
        }
        
        // 불필요한 텍스트 제거
        const cleanText = bodyText
          .replace(/\n\s*\n/g, '\n\n') // 연속된 빈 줄 정리
          .replace(/^\s+|\s+$/g, '') // 앞뒤 공백 제거
          .split('\n')
          .filter(line => line.trim().length > 0) // 빈 줄 제거
          .filter(line => !line.match(/^(메뉴|로그인|회원가입|검색|Navigation|Menu|Sign in|Login)$/i)) // 네비게이션 텍스트 제거
          .join('\n');
        
        extractedContent = cleanText;
      }
      
      return extractedContent.trim();
    });
    
    console.log('✅ 콘텐츠 추출 완료');
    console.log('📄 제목:', title);
    console.log('📝 내용 길이:', content.length, '자');
    console.log('📝 내용 미리보기:', content.substring(0, 200) + '...');
    
    return {
      title: title || 'NotebookLM 콘텐츠',
      content: content || '콘텐츠를 추출할 수 없습니다.'
    };
    
  } catch (error) {
    console.error('❌ 콘텐츠 추출 실패:', error.message);
    return {
      title: 'NotebookLM 콘텐츠',
      content: `콘텐츠 추출 중 오류가 발생했습니다.\n\n원본 링크: ${url}`
    };
  } finally {
    console.log('🔚 브라우저 종료 중...');
    await browser.close();
  }
}

/**
 * 추출된 콘텐츠를 HTML 형식으로 변환합니다
 * @param {string} title - 제목
 * @param {string} content - 본문 내용
 * @param {string} originalUrl - 원본 URL
 * @returns {string} HTML 형식의 콘텐츠
 */
function formatContentAsHTML(title, content, originalUrl) {
  // 본문을 단락으로 분리
  const paragraphs = content
    .split('\n\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  
  const html = `
<div class="notebooklm-content">
  <h2>${title}</h2>
  
  ${paragraphs}
  
  <hr>
  <p><strong>원본 출처:</strong> <a href="${originalUrl}" target="_blank">NotebookLM에서 보기</a></p>
  <p><em>이 콘텐츠는 NotebookLM에서 자동으로 추출되었습니다.</em></p>
</div>
  `.trim();
  
  return html;
}

module.exports = {
  extractNotebookLMContent,
  formatContentAsHTML
}; 