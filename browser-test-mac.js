const puppeteer = require('puppeteer');

async function macOSTest() {
  console.log('🧪 macOS 전용 브라우저 테스트 시작...');
  console.log('🖥️ 플랫폼:', process.platform, process.arch);
  
  try {
    // macOS 전용 설정
    const browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--remote-debugging-port=0',
        '--user-data-dir=/tmp/puppeteer-test-' + Date.now(),
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000
    });
    
    console.log('✅ 브라우저 시작 성공');
    
    const page = await browser.newPage();
    
    // 브라우저 정보 확인
    const browserVersion = await browser.version();
    console.log('🔍 브라우저 버전:', browserVersion);
    
    // 간단한 페이지 로드 테스트
    await page.goto('data:text/html,<h1>테스트 페이지</h1>', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('✅ 기본 페이지 로드 성공');
    
    // 구글 페이지 테스트
    await page.goto('https://www.google.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('✅ 구글 페이지 로드 성공');
    
    const title = await page.title();
    console.log('📝 페이지 제목:', title);
    
    // 3초 후 종료
    setTimeout(async () => {
      await browser.close();
      console.log('✅ 테스트 완료 - 브라우저 정상 작동');
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    console.error('❌ macOS 브라우저 테스트 실패:', error.message);
    console.error('📋 오류 타입:', error.name);
    console.error('📋 오류 코드:', error.code);
    
    if (error.message.includes('socket hang up')) {
      console.error('🔍 해결 방법:');
      console.error('  1. Chrome 브라우저가 설치되어 있는지 확인');
      console.error('  2. 시스템 보안 설정에서 개발자 도구 허용');
      console.error('  3. 방화벽이나 안티바이러스가 차단하지 않는지 확인');
      console.error('  4. 터미널에서 sudo 권한으로 실행해보기');
    }
    
    process.exit(1);
  }
}

macOSTest(); 