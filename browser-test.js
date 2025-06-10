const puppeteer = require('puppeteer');

async function quickTest() {
  console.log('🧪 빠른 브라우저 테스트 시작...');
  
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000
    });
    
    console.log('✅ 브라우저 시작 성공');
    
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    
    console.log('✅ 구글 페이지 로드 성공');
    
    setTimeout(async () => {
      await browser.close();
      console.log('✅ 테스트 완료 - 브라우저 정상 작동');
    }, 3000);
    
  } catch (error) {
    console.error('❌ 브라우저 테스트 실패:', error.message);
    console.error('오류 상세:', error);
  }
}

quickTest(); 