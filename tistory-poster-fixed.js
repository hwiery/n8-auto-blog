const puppeteer = require('puppeteer');
require('dotenv').config();

/**
 * 티스토리 자동 포스팅 스크립트
 * n8n 워크플로우에서 호출되어 브라우저 자동화를 통해 포스팅을 수행합니다.
 */

/**
 * 환경변수 설정 및 검증
 */
const TISTORY_ID = process.env.TISTORY_ID;
const TISTORY_PW = process.env.TISTORY_PW;
const BLOG_ADDRESS = process.env.BLOG_ADDRESS;

// n8n에서 전달받은 명령줄 인자
const postTitle = process.argv[2];
const postContentHTML = process.argv[3];
const postCategory = process.argv[4] || ''; // 선택적 카테고리
const postTags = process.argv[5] || ''; // 선택적 태그

/**
 * 환경변수 검증
 */
function validateEnvironment() {
  const errors = [];
  
  if (!TISTORY_ID) {
    errors.push('TISTORY_ID 환경변수가 설정되지 않았습니다.');
  }
  
  if (!TISTORY_PW) {
    errors.push('TISTORY_PW 환경변수가 설정되지 않았습니다.');
  }
  
  if (!BLOG_ADDRESS) {
    errors.push('BLOG_ADDRESS 환경변수가 설정되지 않았습니다.');
  }
    
    if (errors.length > 0) {
        console.error('❌ 환경변수 설정 오류:');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('\n💡 해결방법:');
        console.error('  export TISTORY_ID="your_tistory_id"');
        console.error('  export TISTORY_PW="your_tistory_password"');
        console.error('  export BLOG_ADDRESS="https://your-blog.tistory.com"');
        process.exit(1);
    }
    
    console.log('✅ 환경변수 검증 완료');
}

/**
 * 메인 포스팅 함수
 */
async function postToTistory() {
    // 환경변수 검증
    validateEnvironment();
    
    // 입력값 유효성 검사
    if (!postTitle || !postContentHTML) {
        console.error('❌ 오류: 제목과 내용이 필요합니다.');
        console.error('사용법: node tistory-poster.js "제목" "HTML내용" ["카테고리"] ["태그1,태그2"]');
        process.exit(1);
    }

    let browser;
    try {
        console.log('🚀 브라우저를 실행합니다...');
        
        // Puppeteer 브라우저 설정
        browser = await puppeteer.launch({
            headless: "new", // 새로운 headless 모드 사용
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--lang=ko-KR',
                '--accept-lang=ko-KR'
            ]
        });

        const page = await browser.newPage();
        
        // 한글 인코딩 설정
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        });
        
        // 네이티브 모달 자동 처리 설정
        setupNativeModalHandlers(page);
        
        // 브라우저 설정
        await page.setViewport({ width: 1280, height: 960 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // 1. 티스토리 로그인
        console.log('🔐 티스토리 로그인을 시도합니다...');
        await loginToTistory(page);

        // 2. 글쓰기 페이지로 이동
        console.log('📝 글쓰기 페이지로 이동합니다...');
        await navigateToWritePage(page);

        // 3. 포스트 작성
        console.log('✍️ 포스트를 작성합니다...');
        await writePost(page);

        // 4. 포스트 발행
        console.log('📤 포스트를 발행합니다...');
        await publishPost(page);

        // 성공 메시지
        const currentUrl = page.url();
        console.log(`✅ 포스팅 성공! 발행된 주소: ${currentUrl}`);
        
        return { success: true, url: currentUrl };

    } catch (error) {
        console.error('❌ 포스팅 과정에서 오류가 발생했습니다:', error.message);
        
        // 디버깅을 위한 스크린샷 저장

        
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔚 브라우저를 종료합니다.');
        }
    }
}

/**
 * 네이티브 모달 자동 처리 설정
 */
function setupNativeModalHandlers(page) {
    // JavaScript alert, confirm, prompt 자동 처리
    page.on('dialog', async dialog => {
        console.log(`🔔 네이티브 모달 감지: ${dialog.type()} - "${dialog.message()}"`);
        
        // 모달 타입에 따라 처리
        switch (dialog.type()) {
            case 'alert':
                await dialog.accept();
                console.log('✅ Alert 모달 자동 확인');
                break;
            case 'confirm':
                await dialog.accept(); // 기본적으로 확인
                console.log('✅ Confirm 모달 자동 확인');
                break;
            case 'prompt':
                await dialog.accept(''); // 빈 값으로 확인
                console.log('✅ Prompt 모달 자동 확인');
                break;
            case 'beforeunload':
                await dialog.accept(); // beforeunload는 확인으로 처리
                console.log('✅ Beforeunload 모달 자동 확인');
                break;
            default:
                await dialog.accept(); // 기본적으로 확인으로 처리
                console.log('✅ 기타 모달 자동 확인');
        }
    });

    // beforeunload 이벤트 무시 (페이지 이탈 경고)
    page.evaluateOnNewDocument(() => {
        // beforeunload 이벤트 무력화
        window.addEventListener('beforeunload', (e) => {
            delete e['returnValue'];
        });
        
        // 페이지 이탈 경고 무력화
        window.onbeforeunload = null;
    });

    console.log('✅ 네이티브 모달 핸들러 설정 완료');
}

/**
 * 티스토리 로그인 함수
 */
async function loginToTistory(page) {
    await page.goto('https://www.tistory.com/auth/login', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
    });

    // 페이지 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 카카오 로그인 버튼 확인 및 클릭
    const kakaoLoginSelectors = [
        'a.btn_login.link_kakao_id',
        '.btn_login.link_kakao_id',
        'a[class*="kakao"]',
        '.link_kakao_id',
        'a:contains("카카오계정으로 로그인")'
    ];

    let kakaoLoginButton = null;
    for (const selector of kakaoLoginSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 3000 });
            kakaoLoginButton = await page.$(selector);
            if (kakaoLoginButton) {
                console.log(`✅ 카카오 로그인 버튼 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    // 카카오 로그인 버튼이 있으면 클릭
    if (kakaoLoginButton) {
        console.log('🔗 카카오 로그인 버튼을 클릭합니다...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
            kakaoLoginButton.click()
        ]);
        
        // 카카오 로그인 페이지 로딩 대기
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 다양한 가능한 로그인 입력 필드 선택자들
    const loginSelectors = [
        'input[name="loginId"]',
        'input[name="username"]', 
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="아이디"]',
        'input[placeholder*="이메일"]',
        'input[placeholder*="카카오메일"]',
        '#loginId',
        '#username',
        '#email',
        '.input-email',
        '.login-input',
        'input[data-testid="email"]',
        'input[data-testid="username"]',
        'input[name="loginKey"]'
    ];

    const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        '#password',
        '.input-password',
        'input[placeholder*="비밀번호"]',
        'input[data-testid="password"]'
    ];

    const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '.btn-login',
        '.login-btn',
        '#loginBtn',
        'button:contains("로그인")',
        'button:contains("Login")',
        '[data-testid="login-button"]',
        '.submit',
        '.btn_g.highlight'
    ];

    // 로그인 입력 필드 찾기
    let emailInput = null;
    let passwordInput = null;
    let loginButton = null;

    // 이메일/아이디 입력 필드 찾기
    for (const selector of loginSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            emailInput = await page.$(selector);
            if (emailInput) {
                console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    // 비밀번호 입력 필드 찾기
    for (const selector of passwordSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            passwordInput = await page.$(selector);
            if (passwordInput) {
                console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    // 로그인 버튼 찾기
    for (const selector of buttonSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            loginButton = await page.$(selector);
            if (loginButton) {
                console.log(`✅ 로그인 버튼 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    if (!emailInput || !passwordInput || !loginButton) {
        throw new Error('로그인 폼 요소를 찾을 수 없습니다. 페이지 구조가 변경되었을 수 있습니다.');
    }
    
    // 아이디/비밀번호 입력
    console.log('📝 로그인 정보를 입력합니다...');
    await emailInput.type(TISTORY_ID, { delay: 100 });
    await passwordInput.type(TISTORY_PW, { delay: 100 });
    
    // 로그인 버튼 클릭
    console.log('🔐 로그인 버튼을 클릭합니다...');
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        loginButton.click()
    ]);

    console.log('✅ 로그인 성공');
}

/**
 * 글쓰기 페이지로 이동
 */
async function navigateToWritePage(page) {
    console.log('📝 블로그 메인 페이지로 이동합니다...');
    
    // 1단계: 블로그 메인 페이지로 이동
    try {
        await page.goto(BLOG_ADDRESS, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        console.log('✅ 블로그 메인 페이지 접속 완료');
    } catch (error) {
        console.log('⚠️ 메인 페이지 접속 실패:', error.message);
        throw new Error('블로그 메인 페이지에 접속할 수 없습니다.');
    }

    // 페이지 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2단계: 글쓰기 버튼 찾기 및 클릭
    console.log('🔍 글쓰기 버튼을 찾는 중...');
    
    // XPath를 사용하여 "글쓰기" 텍스트가 포함된 링크 찾기
    const writeButtonTexts = ['글쓰기', '새 글', '포스트 작성', 'Write'];
    let writeButtonFound = false;
    
    for (const text of writeButtonTexts) {
        try {
            console.log(`🔍 "${text}" 버튼 검색 중...`);
            const elements = await page.$x(`//a[contains(text(), "${text}")]`);
            if (elements.length > 0) {
                console.log(`✅ "${text}" 버튼 발견! 클릭합니다.`);
                await elements[0].click();
                writeButtonFound = true;
                break;
            }
        } catch (error) {
            console.log(`⚠️ "${text}" 버튼 검색 중 오류:`, error.message);
        }
    }
    
    // 추가 선택자로 시도
    if (!writeButtonFound) {
        const additionalSelectors = [
            'a[href*="newpost"]',
            'a[href*="/manage/newpost/"]',
            'a[href*="write"]',
            '.btn-write',
            '.write-btn',
            '#write-btn',
            'a[title*="글쓰기"]',
            'a[title*="새 글"]'
        ];
        
        for (const selector of additionalSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    console.log(`✅ 글쓰기 버튼 발견: ${selector}`);
                    await element.click();
                    writeButtonFound = true;
                    break;
                }
            } catch (error) {
                // 계속 시도
            }
        }
    }

    if (writeButtonFound) {
        console.log('🔗 글쓰기 버튼 클릭 완료, 페이지 로딩 대기...');
        // 글쓰기 페이지 로딩 대기
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 페이지 이동 확인
        try {
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch (error) {
            console.log('⚠️ 페이지 이동 감지 실패, 현재 페이지에서 계속 진행...');
        }
    } else {
        console.log('⚠️ 글쓰기 버튼을 찾을 수 없습니다. 직접 URL로 이동합니다...');
        // 직접 글쓰기 페이지로 이동
        const writePageUrl = `${BLOG_ADDRESS}/manage/newpost/`;
        await page.goto(writePageUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
    }

    // 추가 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 모달 창 처리 (이전 글 복원 등)
    await handleModals(page);

    // 제목 입력란 확인 (더 많은 선택자 추가)
    const titleSelectors = [
        '#post-title-inp',
        'input[name="title"]',
        'input[placeholder*="제목"]',
        'input[placeholder*="Title"]',
        '.title-input',
        '#title',
        'input[id*="title"]',
        'input[class*="title"]',
        '.post-title',
        '#postTitle',
        'input[data-role="title"]',
        '.editor-title input',
        '.write-title input'
    ];

    let titleInput = null;
    for (const selector of titleSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            titleInput = await page.$(selector);
            if (titleInput) {
                console.log(`✅ 제목 입력란 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    if (!titleInput) {
        // 페이지의 모든 input 요소 분석
        console.log('🔍 페이지의 모든 input 요소를 분석합니다...');
        const allInputs = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            return Array.from(inputs).map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                className: input.className,
                placeholder: input.placeholder
            }));
        });
        
        console.log('발견된 input 요소들:');
        allInputs.forEach((input, index) => {
            console.log(`  ${index + 1}. type:${input.type}, name:${input.name}, id:${input.id}, class:${input.className}, placeholder:${input.placeholder}`);
        });
        
        throw new Error('제목 입력란을 찾을 수 없습니다. 글쓰기 페이지가 올바르게 로드되지 않았을 수 있습니다.');
    }

    console.log('✅ 글쓰기 페이지 로딩 완료');
}

/**
 * 포스트 작성 함수
 */
async function writePost(page) {
    console.log('🖊️ 글 작성을 시작합니다...');
    
    try {
        // 제목 입력
        console.log('📝 제목을 입력합니다...');
        const titleSelector = 'input[name="title"], #title, .title-input, input[placeholder*="제목"]';
        await page.waitForSelector(titleSelector, { timeout: 10000 });
        await page.type(titleSelector, postTitle);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`✅ 제목 입력 완료: "${postTitle}"`);

        // HTML 모드로 전환 시도
        let htmlModeSuccess = false;
        try {
            await switchToHTMLMode(page);
            htmlModeSuccess = true;
            console.log('✅ HTML 모드 전환 성공');
            
            // HTML 모드에서 내용 입력
            console.log('📄 HTML 모드로 본문 내용을 입력합니다...');
            await inputContent(page, postContentHTML);
            
            // 내용 입력 확인
            const contentVerified = await verifyContentInput(page);
            if (!contentVerified) {
                console.log('⚠️ HTML 모드에서 내용 입력 실패, 텍스트 모드로 재시도');
                htmlModeSuccess = false;
            }
        } catch (error) {
            console.log('⚠️ HTML 모드 전환 실패, 일반 텍스트 모드로 진행:', error.message);
            htmlModeSuccess = false;
        }

        // HTML 모드 실패 시 텍스트 모드로 폴백
        if (!htmlModeSuccess) {
            console.log('📄 일반 텍스트 모드로 본문 내용을 입력합니다...');
            // HTML 태그 제거하여 일반 텍스트로 입력
            const plainText = postContentHTML.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            
            // 최소 내용 길이 보장
            const minContent = plainText.length > 100 ? plainText : plainText + '\n\n본 글은 자동으로 생성된 뉴스 요약입니다.\n\n' + '더 자세한 내용은 원문을 확인해주세요.'.repeat(3);
            
            await inputContent(page, minContent);
            
            // 내용 입력 재확인
            const contentVerified = await verifyContentInput(page);
            if (!contentVerified) {
                throw new Error('내용 입력에 완전히 실패했습니다.');
            }
        }

        // 카테고리 설정 (선택적)
        if (postCategory) {
            try {
                await page.waitForSelector('.category-list', { timeout: 3000 });
                await page.click('.category-list');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const categoryOption = await page.$x(`//span[contains(text(), "${postCategory}")]`);
                if (categoryOption.length > 0) {
                    await categoryOption[0].click();
                    console.log(`📁 카테고리 "${postCategory}" 설정 완료`);
                }
            } catch (error) {
                console.log(`⚠️ 카테고리 "${postCategory}" 설정 실패:`, error.message);
            }
        }

        // 태그 설정 (선택사항)
        if (postTags) {
            try {
                const tags = postTags.split(',').map(tag => tag.trim());
                const tagInput = await page.$('input[placeholder*="태그"]');
                if (tagInput) {
                    for (const tag of tags) {
                        await tagInput.type(tag);
                        await page.keyboard.press('Enter');
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    console.log(`🏷️ 태그 설정 완료: ${tags.join(', ')}`);
                }
            } catch (error) {
                console.log(`⚠️ 태그 설정 실패:`, error.message);
            }
        }

        console.log('✅ 포스트 작성 완료');
    } catch (error) {
        console.error('❌ 포스트 작성 중 오류 발생:', error.message);
        throw error;
    }
}

/**
 * 본문 내용 입력 함수
 */
async function inputContent(page, content) {
    console.log('📝 본문 내용 입력 시도...');
    
    // 내용 길이 확인
    console.log(`📊 입력할 내용 길이: ${content.length}자`);
    console.log(`📝 내용 미리보기: ${content.substring(0, 100)}...`);
    
    // 1. CodeMirror 에디터 시도 (HTML 모드에서 주로 사용)
    try {
        await page.waitForSelector('.CodeMirror', { timeout: 5000 });
        console.log('🔍 CodeMirror 에디터 발견');
        
        // 여러 방법으로 CodeMirror에 내용 입력 시도
        const success = await page.evaluate((content) => {
            try {
                // 방법 1: CodeMirror 인스턴스 직접 접근
                const editor = document.querySelector('.CodeMirror');
                if (editor && editor.CodeMirror) {
                    console.log('CodeMirror 인스턴스 발견, 내용 설정 중...');
                    editor.CodeMirror.setValue(content);
                    editor.CodeMirror.refresh();
                    return true;
                }
                
                // 방법 2: 모든 CodeMirror 인스턴스 확인
                if (window.CodeMirror && window.CodeMirror.instances) {
                    for (let instance of window.CodeMirror.instances) {
                        if (instance) {
                            console.log('CodeMirror 인스턴스 배열에서 발견');
                            instance.setValue(content);
                            instance.refresh();
                            return true;
                        }
                    }
                }
                
                // 방법 3: 전역 CodeMirror 객체 확인
                if (window.CodeMirror && window.CodeMirror.fromTextArea) {
                    const textareas = document.querySelectorAll('textarea');
                    for (let textarea of textareas) {
                        if (textarea.nextSibling && textarea.nextSibling.classList && 
                            textarea.nextSibling.classList.contains('CodeMirror')) {
                            console.log('textarea 연결된 CodeMirror 발견');
                            const cm = textarea.nextSibling.CodeMirror;
                            if (cm) {
                                cm.setValue(content);
                                cm.refresh();
                                return true;
                            }
                        }
                    }
                }
                
                return false;
            } catch (error) {
                console.error('CodeMirror 설정 중 오류:', error);
                return false;
            }
        }, content);
        
        if (success) {
            console.log('✅ CodeMirror 에디터에 내용 입력 완료');
            // 입력 후 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        } else {
            console.log('⚠️ CodeMirror 내용 설정 실패');
        }
    } catch (error) {
        console.log('⚠️ CodeMirror 에디터를 찾을 수 없습니다:', error.message);
    }

    // 2. textarea 직접 입력 시도
    const textareaSelectors = [
        'textarea[name="content"]',
        'textarea[id*="content"]',
        'textarea[class*="content"]',
        'textarea[placeholder*="내용"]',
        '.content-textarea',
        '#content',
        'textarea'
    ];

    for (const selector of textareaSelectors) {
        try {
            const textarea = await page.$(selector);
            if (textarea) {
                console.log(`✅ textarea 발견: ${selector}`);
                
                // textarea에 강제로 내용 입력
                await page.evaluate((selector, content) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.value = content;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, selector, content);
                
                console.log('✅ textarea에 내용 입력 완료');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return;
            }
        } catch (error) {
            console.log(`⚠️ textarea 시도 실패 (${selector}):`, error.message);
        }
    }

    // 3. contenteditable 요소 시도
    const editableSelectors = [
        '[contenteditable="true"]',
        '.editor-content',
        '.content-editor',
        '#editor',
        '.post-content'
    ];

    for (const selector of editableSelectors) {
        try {
            const element = await page.$(selector);
            if (element) {
                console.log(`✅ contenteditable 요소 발견: ${selector}`);
                
                await page.evaluate((selector, content) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.innerHTML = content;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, selector, content);
                
                console.log('✅ contenteditable 요소에 내용 입력 완료');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return;
            }
        } catch (error) {
            console.log(`⚠️ contenteditable 시도 실패 (${selector}):`, error.message);
        }
    }

    // 4. iframe 내부의 에디터 시도
    try {
        const frames = await page.frames();
        console.log(`🔍 ${frames.length}개의 iframe 확인 중...`);
        
        for (const frame of frames) {
            try {
                const body = await frame.$('body[contenteditable="true"]');
                if (body) {
                    console.log('✅ iframe 내 contenteditable body 발견');
                    await frame.evaluate((content) => {
                        document.body.innerHTML = content;
                        document.body.dispatchEvent(new Event('input', { bubbles: true }));
                    }, content);
                    console.log('✅ iframe 에디터에 내용 입력 완료');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return;
                }
            } catch (error) {
                // 계속 시도
            }
        }
    } catch (error) {
        console.log('⚠️ iframe 확인 중 오류:', error.message);
    }

    // 5. 마지막 시도: 클립보드 사용
    try {
        console.log('📋 클립보드를 사용한 내용 입력 시도...');
        
        // 클립보드에 내용 복사
        await page.evaluate((content) => {
            navigator.clipboard.writeText(content);
        }, content);
        
        // 에디터 영역 클릭 후 붙여넣기
        const possibleEditors = await page.$$('textarea, [contenteditable="true"], .CodeMirror');
        if (possibleEditors.length > 0) {
            await possibleEditors[0].click();
            await page.keyboard.down('Meta'); // macOS의 Cmd 키
            await page.keyboard.press('KeyV');
            await page.keyboard.up('Meta');
            console.log('✅ 클립보드를 통한 내용 입력 완료');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }
    } catch (error) {
        console.log('⚠️ 클립보드 입력 실패:', error.message);
    }

    console.log('❌ 모든 방법으로 본문 입력에 실패했습니다.');
    throw new Error('본문 내용을 입력할 수 없습니다. 에디터를 찾을 수 없습니다.');
}

/**
 * 내용 입력 확인 함수
 */
async function verifyContentInput(page) {
    console.log('🔍 내용 입력 확인 중...');
    
    try {
        // 다양한 방법으로 내용 확인
        const contentCheck = await page.evaluate(() => {
            // 1. CodeMirror 에디터 확인
            const cmEditor = document.querySelector('.CodeMirror');
            if (cmEditor && cmEditor.CodeMirror) {
                const content = cmEditor.CodeMirror.getValue();
                if (content && content.length > 50) {
                    return { found: true, length: content.length, method: 'CodeMirror' };
                }
            }
            
            // 2. textarea 확인
            const textareas = document.querySelectorAll('textarea');
            for (let textarea of textareas) {
                if (textarea.value && textarea.value.length > 50) {
                    return { found: true, length: textarea.value.length, method: 'textarea' };
                }
            }
            
            // 3. contenteditable 확인
            const editables = document.querySelectorAll('[contenteditable="true"]');
            for (let editable of editables) {
                const content = editable.innerHTML || editable.textContent;
                if (content && content.length > 50) {
                    return { found: true, length: content.length, method: 'contenteditable' };
                }
            }
            
            return { found: false, length: 0, method: 'none' };
        });
        
        if (contentCheck.found) {
            console.log(`✅ 내용 입력 확인됨: ${contentCheck.method} 방식, ${contentCheck.length}자`);
            return true;
        } else {
            console.log('❌ 내용이 입력되지 않았습니다.');
            return false;
        }
    } catch (error) {
        console.error('❌ 내용 확인 중 오류:', error.message);
        return false;
    }
}

/**
 * HTML 모드로 전환하는 함수
 */
async function switchToHTMLMode(page) {
    console.log('🔄 HTML 모드로 전환 시도...');
    
    try {
        // 페이지 상태 확인
        const pageUrl = page.url();
        console.log(`📍 현재 페이지: ${pageUrl}`);
        
        // 페이지 로딩 완료 대기
        await page.waitForLoadState?.('networkidle') || new Promise(resolve => setTimeout(resolve, 3000));
        
        // 현재 모드 확인
        const currentMode = await page.evaluate(() => {
            // HTML 모드 표시 확인
            const htmlIndicator = document.querySelector('#editor-mode-layer-btn-open');
            if (htmlIndicator) {
                return htmlIndicator.textContent.trim();
            }
            return 'unknown';
        });
        
        console.log(`📊 현재 에디터 모드: ${currentMode}`);
        
        if (currentMode.includes('HTML') || currentMode.includes('html')) {
            console.log('✅ 이미 HTML 모드입니다.');
            return;
        }
        
        // 에디터 로딩 완료 대기
        await page.waitForSelector('#editor-mode-layer-btn-open', { timeout: 10000 });
        console.log('✅ 에디터 모드 버튼 대기 완료');
        
        // 기본모드 버튼 클릭 (드롭다운 열기)
        const modeButton = await page.$('#editor-mode-layer-btn-open');
        if (modeButton) {
            console.log('✅ 에디터 모드 버튼 발견');
            await modeButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // HTML 모드 옵션 대기
            await page.waitForSelector('#editor-mode-html', { timeout: 5000 });
            
            // HTML 모드 선택
            const htmlModeOption = await page.$('#editor-mode-html');
            if (htmlModeOption) {
                console.log('✅ HTML 모드 옵션 발견');
                await htmlModeOption.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // HTML 모드 전환 시 나타나는 모달 처리
                console.log('🔍 HTML 모드 전환 모달 확인 중...');
                await handleHTMLModeModal(page);
                
                await new Promise(resolve => setTimeout(resolve, 8000)); // 모드 전환 완료 대기 (더 길게)
                
                // 전환 완료 확인
                const newMode = await page.evaluate(() => {
                    const htmlIndicator = document.querySelector('#editor-mode-layer-btn-open');
                    return htmlIndicator ? htmlIndicator.textContent.trim() : 'unknown';
                });
                
                console.log(`📊 전환 후 에디터 모드: ${newMode}`);
                
                if (newMode.includes('HTML') || newMode.includes('html')) {
                    console.log('✅ HTML 모드로 전환 완료');
                } else {
                    console.log(`⚠️ HTML 모드 전환 실패. 현재 모드: ${newMode}`);
                    
                    // 강제로 HTML 모드 전환 시도
                    console.log('🔄 강제 HTML 모드 전환 시도...');
                    await page.evaluate(() => {
                        // 직접 HTML 모드 설정 시도
                        const htmlButton = document.querySelector('#editor-mode-html');
                        if (htmlButton) {
                            htmlButton.click();
                        }
                        
                        // 또는 직접 에디터 모드 변경
                        if (window.Editor && window.Editor.setMode) {
                            window.Editor.setMode('html');
                        }
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } else {
                console.log('⚠️ HTML 모드 옵션을 찾을 수 없습니다.');
                throw new Error('HTML 모드 옵션 없음');
            }
        } else {
            console.log('⚠️ 에디터 모드 버튼을 찾을 수 없습니다.');
            throw new Error('에디터 모드 버튼 없음');
        }
    } catch (error) {
        console.error('❌ HTML 모드 전환 실패:', error.message);
        console.log('📸 오류 발생 시점 스크린샷 저장...');
        try {
            await page.screenshot({ path: 'html-mode-error.png', fullPage: true });
            console.log('📸 스크린샷 저장됨: html-mode-error.png');
        } catch (screenshotError) {
            console.log('⚠️ 스크린샷 저장 실패');
        }
        throw error; // 상위로 에러 전달
    }
}

/**
 * HTML 모드 전환 시 나타나는 모달 처리 함수 (예측 가능한 모달)
 */
async function handleHTMLModeModal(page) {
    console.log('🔍 HTML 모드 전환 모달 확인 중...');
    
    // 잠시 대기 후 모달 확인
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const modalSelectors = [
        '.mce-window',
        '.mce-container',
        '.mce-floatpanel',
        '.modal',
        '.popup',
        '.layer',
        '[role="dialog"]',
        '.mce-window-body',
        '.ui-dialog',
        '.modal-dialog'
    ];

    const confirmButtonSelectors = [
        '.mce-primary',
        '.mce-btn-primary',
        'button:contains("확인")',
        'button:contains("OK")',
        'button:contains("예")',
        'button:contains("Yes")',
        '.btn-primary',
        '.confirm-btn',
        'button[type="submit"]',
        '.mce-btn:contains("확인")',
        '.mce-btn:contains("OK")',
        '.ui-button-text:contains("확인")',
        '.ui-button:contains("확인")'
    ];

    // 예측 가능한 모달이므로 충분한 시간 대기
    for (const selector of modalSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 3000 });
            const modal = await page.$(selector);
            if (modal) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, modal);
                
                if (isVisible) {
                    console.log(`✅ HTML 모드 전환 모달 발견: ${selector}`);
                    
                    // 디버깅용 스크린샷
                    await page.screenshot({ path: 'html-mode-modal.png' });
                    console.log('📸 HTML 모드 모달 스크린샷 저장: html-mode-modal.png');
                    
                    // 확인 버튼 클릭 시도
                    const success = await clickConfirmButton(page, confirmButtonSelectors);
                    if (success) {
                        console.log('✅ HTML 모드 전환 모달 처리 완료');
                        return;
                    }
                }
            }
        } catch (error) {
            // 타임아웃 시 다음 선택자 시도
        }
    }

    console.log('✅ HTML 모드 전환 모달 없음');
}

/**
 * 확인 버튼 클릭 공통 함수
 */
async function clickConfirmButton(page, confirmButtonSelectors) {
    console.log('🔄 확인 버튼 클릭 시도...');
    
    // 확인 버튼 찾아서 클릭
    for (const selector of confirmButtonSelectors) {
        try {
            const confirmButton = await page.$(selector);
            if (confirmButton) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, confirmButton);
                
                if (isVisible) {
                    console.log(`✅ 확인 버튼 클릭: ${selector}`);
                    await confirmButton.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                }
            }
        } catch (error) {
            // 계속 시도
        }
    }

    // 텍스트로 버튼 찾기
    try {
        const confirmButtons = await page.$x('//button[contains(text(), "확인") or contains(text(), "OK") or contains(text(), "예")]');
        if (confirmButtons.length > 0) {
            console.log('✅ 텍스트로 확인 버튼 발견');
            await confirmButtons[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }
    } catch (error) {
        // 무시
    }

    // Enter 키로도 시도
    try {
        await page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('⌨️ Enter 키로 모달 확인');
        return true;
    } catch (error) {
        console.log('⚠️ 확인 버튼 클릭 실패');
        return false;
    }
}

/**
 * 발행 확인 레이어 처리 함수
 */
async function checkPublishConfirmation(page) {
    // 발행 확인 레이어가 나타나는지 확인
    const confirmSelectors = [
        '#publish-layer-btn',
        'button#publish-layer-btn',
        'button[id="publish-layer-btn"]',
        '#publish-btn',
        'button#publish-btn',
        'button[id="publish-btn"]',
        '.btn-layer-publish',
        '.btn_layer_publish',
        'button[class*="confirm"]',
        'button:contains("완료")',
        'button:contains("확인")',
        'button:contains("공개 발행")',
        'button:contains("발행")',
        '.confirm-btn',
        '.ok-btn'
    ];

    let confirmButton = null;
    
    // 발행 확인 버튼 찾기
    for (const selector of confirmSelectors) {
        try {
            await page.waitForSelector(selector, { 
                visible: true, 
                timeout: 3000 
            });
            confirmButton = await page.$(selector);
            if (confirmButton) {
                console.log(`✅ 발행 확인 버튼 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    if (confirmButton) {
        console.log('✅ 발행 확인 버튼을 클릭합니다...');
        await confirmButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 최종 발행 버튼이 있는지 확인 (공개 발행 버튼)
        try {
            const finalPublishButton = await page.$('#publish-btn');
            if (finalPublishButton) {
                console.log('✅ 최종 공개 발행 버튼을 클릭합니다...');
                await finalPublishButton.click();
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.log('⚠️ 최종 발행 버튼을 찾을 수 없습니다.');
        }
    } else {
        // 발행 확인 레이어가 없는 경우 (즉시 발행)
        console.log('⚠️ 발행 확인 레이어를 찾을 수 없습니다. 즉시 발행되었을 수 있습니다.');
    }
}

// 스크립트 실행
if (require.main === module) {
    postToTistory().catch(error => {
        console.error('스크립트 실행 오류:', error);
        process.exit(1);
    });
}

module.exports = { postToTistory }; 