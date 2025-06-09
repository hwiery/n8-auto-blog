const puppeteer = require('puppeteer');
require('dotenv').config();

/**
 * 환경변수 설정 및 검증
 */
const TISTORY_ID = process.env.TISTORY_ID;
const TISTORY_PW = process.env.TISTORY_PW;
const BLOG_ADDRESS = process.env.BLOG_ADDRESS;

// 명령행 인수에서 제목과 내용 가져오기
const postTitle = process.argv[2] || '새로운 포스트';
const postContentHTML = process.argv[3] || '<p>포스트 내용이 없습니다.</p>';
const postCategory = process.argv[4] || null; // 선택사항
const postTags = process.argv[5] || null; // 선택사항

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
    
    let browser;
    try {
        console.log('🚀 브라우저를 실행합니다...');
        
        // Puppeteer 브라우저 설정 (n8n 환경에 최적화)
        browser = await puppeteer.launch({
            headless: true, // n8n에서는 headless 모드 사용
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        const page = await browser.newPage();
        
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
        
        // n8n에서 사용할 수 있는 JSON 형태로 결과 출력
        const result = {
            success: true,
            url: currentUrl,
            title: postTitle,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 결과 데이터:', JSON.stringify(result, null, 2));
        return result;

    } catch (error) {
        console.error('❌ 포스팅 과정에서 오류가 발생했습니다:', error.message);
        
        // n8n에서 사용할 수 있는 에러 정보 출력
        const errorResult = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 에러 데이터:', JSON.stringify(errorResult, null, 2));
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
    const kakaoLoginButton = await page.$('a.btn_login.link_kakao_id');

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

    // 로그인 폼 요소 찾기 및 입력
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
        '#email'
    ];

    const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        '#password',
        'input[placeholder*="비밀번호"]'
    ];

    const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '.btn-login',
        '.login-btn',
        '#loginBtn'
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
    const writePageUrl = `${BLOG_ADDRESS}/manage/newpost/`;
    
    try {
        await page.goto(writePageUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
    } catch (error) {
        console.log('⚠️ 첫 번째 시도 실패, 다시 시도합니다...');
        // 두 번째 시도
        await page.goto(writePageUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
    }

    // 페이지 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 모달 창 처리 (이전 글 복원 등)
    await handleModals(page);

    // 제목 입력란 확인
    const titleSelectors = [
        '#post-title-inp',
        'input[name="title"]',
        'input[placeholder*="제목"]',
        '.title-input',
        '#title',
        'input[id*="title"]'
    ];

    let titleInput = null;
    for (const selector of titleSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
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
        throw new Error('제목 입력란을 찾을 수 없습니다. 글쓰기 페이지가 올바르게 로드되지 않았을 수 있습니다.');
    }

    console.log('✅ 글쓰기 페이지 로딩 완료');
}

/**
 * 포스트 작성 함수
 */
async function writePost(page) {
    // 제목 입력란 찾기
    const titleSelectors = [
        '#post-title-inp',
        'input[name="title"]',
        'input[placeholder*="제목"]',
        '.title-input',
        '#title',
        'input[id*="title"]'
    ];

    let titleInput = null;
    for (const selector of titleSelectors) {
        try {
            titleInput = await page.$(selector);
            if (titleInput) {
                console.log(`✅ 제목 입력란 사용: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    if (!titleInput) {
        throw new Error('제목 입력란을 찾을 수 없습니다.');
    }

    // 제목 입력
    await titleInput.click();
    await titleInput.evaluate(input => input.value = '');
    await titleInput.type(postTitle, { delay: 50 });

    // HTML 모드로 전환
    await switchToHTMLMode(page);

    // 본문 내용 입력
    await inputContent(page, postContentHTML);

    // 카테고리 설정 (선택사항)
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
}

/**
 * 본문 내용 입력 함수
 */
async function inputContent(page, content) {
    console.log('🔍 본문 내용 입력 시도...');
    
    // CodeMirror 에디터 시도
    try {
        await page.waitForSelector('.CodeMirror', { timeout: 5000 });
        const success = await page.evaluate((content) => {
            const editor = document.querySelector('.CodeMirror');
            if (editor && editor.CodeMirror) {
                editor.CodeMirror.setValue(content);
                return true;
            }
            return false;
        }, content);
        
        if (success) {
            console.log('✅ CodeMirror 에디터에 내용 입력 완료');
            return;
        }
    } catch (error) {
        console.log('⚠️ CodeMirror 에디터를 찾을 수 없습니다.');
    }

    // textarea 시도
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
                await textarea.click();
                await textarea.evaluate(el => el.value = '');
                await textarea.type(content, { delay: 10 });
                console.log('✅ textarea에 내용 입력 완료');
                return;
            }
        } catch (error) {
            // 계속 시도
        }
    }

    console.log('⚠️ 본문 입력 필드를 찾을 수 없습니다. 기본 모드에서 계속 진행합니다.');
}

/**
 * 모달 창 처리 함수 (예측 불가능한 모달 처리)
 */
async function handleModals(page) {
    console.log('🔍 예측 불가능한 모달 확인 중...');
    
    // 다양한 모달 관련 선택자들
    const modalSelectors = [
        '.modal',
        '.popup',
        '.layer',
        '.dialog',
        '[role="dialog"]',
        '.overlay',
        '.modal-dialog',
        '.popup-layer',
        '.alert',
        '.notification',
        '.toast'
    ];

    // 모달 닫기 버튼 선택자들
    const closeButtonSelectors = [
        '.close',
        '.btn-close',
        '.modal-close',
        '.popup-close',
        'button:contains("닫기")',
        'button:contains("취소")',
        'button:contains("확인")',
        'button:contains("아니오")',
        'button:contains("무시")',
        'button:contains("나중에")',
        '[aria-label="닫기"]',
        '[aria-label="Close"]',
        '.fa-times',
        '.fa-close',
        '.icon-close',
        '[data-dismiss="modal"]'
    ];

    // 짧은 시간만 기다려서 모달 확인 (예측 불가능한 모달 대응)
    for (const selector of modalSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 1000 }); // 1초만 대기
            const modal = await page.$(selector);
            if (modal) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, modal);
                
                if (isVisible) {
                    console.log(`✅ 예측 불가능한 모달 발견: ${selector}`);
                    
                    // 모달 닫기 시도
                    await closeModal(page, closeButtonSelectors);
                    return;
                }
            }
        } catch (error) {
            // 타임아웃은 정상 - 모달이 없다는 의미
        }
    }

    console.log('✅ 예측 불가능한 모달 없음 - 정상 진행');
}

/**
 * 모달 닫기 공통 함수
 */
async function closeModal(page, closeButtonSelectors) {
    console.log('🔄 모달 닫기 시도...');
    
    // 닫기 버튼 찾아서 클릭
    for (const selector of closeButtonSelectors) {
        try {
            const closeButton = await page.$(selector);
            if (closeButton) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, closeButton);
                
                if (isVisible) {
                    console.log(`✅ 닫기 버튼 클릭: ${selector}`);
                    await closeButton.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                }
            }
        } catch (error) {
            // 계속 시도
        }
    }

    // ESC 키로도 시도
    try {
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('⌨️ ESC 키로 모달 닫기 시도');
        return true;
    } catch (error) {
        console.log('⚠️ 모달 닫기 실패');
        return false;
    }
}

/**
 * HTML 모드로 전환하는 함수
 */
async function switchToHTMLMode(page) {
    console.log('🔄 HTML 모드로 전환 시도...');
    
    try {
        // 기본모드 버튼 클릭 (드롭다운 열기)
        const modeButton = await page.$('#editor-mode-layer-btn-open');
        if (modeButton) {
            console.log('✅ 에디터 모드 버튼 발견');
            await modeButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // HTML 모드 선택
            const htmlModeOption = await page.$('#editor-mode-html');
            if (htmlModeOption) {
                console.log('✅ HTML 모드 옵션 발견');
                await htmlModeOption.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // HTML 모드 전환 시 나타나는 모달 처리
                console.log('🔍 HTML 모드 전환 모달 확인 중...');
                await handleHTMLModeModal(page);
                
                await new Promise(resolve => setTimeout(resolve, 2000)); // 모드 전환 완료 대기
                console.log('✅ HTML 모드로 전환 완료');
            } else {
                console.log('⚠️ HTML 모드 옵션을 찾을 수 없습니다.');
            }
        } else {
            console.log('⚠️ 에디터 모드 버튼을 찾을 수 없습니다. 이미 HTML 모드일 수 있습니다.');
        }
    } catch (error) {
        console.log('⚠️ HTML 모드 전환 실패:', error.message);
        console.log('기본 모드에서 계속 진행합니다.');
    }
}

/**
 * HTML 모드 전환 시 나타나는 모달 처리 함수 (예측 가능한 모달)
 */
async function handleHTMLModeModal(page) {
    console.log('🔍 HTML 모드 전환 모달 확인 중...');
    
    const modalSelectors = [
        '.mce-window',
        '.mce-container',
        '.mce-floatpanel',
        '.modal',
        '.popup',
        '.layer',
        '[role="dialog"]',
        '.mce-window-body'
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
        '.mce-btn:contains("OK")'
    ];

    // 예측 가능한 모달이므로 충분한 시간 대기
    for (const selector of modalSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
            const modal = await page.$(selector);
            if (modal) {
                const isVisible = await page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                }, modal);
                
                if (isVisible) {
                    console.log(`✅ HTML 모드 전환 모달 발견: ${selector}`);
                    
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
 * 포스트 발행 함수
 */
async function publishPost(page) {
    // 다양한 발행 버튼 선택자들 (저장 버튼부터 시도)
    const publishSelectors = [
        'button:contains("저장")',
        'button:contains("임시저장")',
        'button:contains("발행")',
        'button:contains("공개 발행")',
        'button:contains("게시")',
        '#publish-btn',
        'button#publish-btn',
        'button[id="publish-btn"]',
        '.btn-publish',
        '.btn_publish',
        'button[class*="publish"]',
        '.publish-btn',
        '.save-btn',
        '#save-btn',
        'input[value="발행"]',
        'input[value="게시"]',
        'input[value="저장"]',
        '[data-role="publish"]',
        '[data-action="publish"]'
    ];

    let publishButton = null;
    
    // 발행 버튼 찾기
    for (const selector of publishSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 3000 });
            publishButton = await page.$(selector);
            if (publishButton) {
                console.log(`✅ 발행 버튼 발견: ${selector}`);
                break;
            }
        } catch (error) {
            // 선택자를 찾지 못한 경우 다음 시도
        }
    }

    if (!publishButton) {
        // 발행 버튼을 찾지 못한 경우 페이지의 모든 버튼 확인
        console.log('⚠️ 발행 버튼을 찾지 못했습니다. 페이지의 모든 버튼을 확인합니다...');
        
        // 페이지 하단으로 스크롤
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const allButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
            return buttons.map(btn => ({
                text: (btn.textContent || btn.value || '').trim(),
                className: btn.className,
                id: btn.id,
                type: btn.type,
                visible: btn.offsetParent !== null && btn.offsetWidth > 0 && btn.offsetHeight > 0
            })).filter(btn => btn.visible && btn.text); // 보이는 버튼이면서 텍스트가 있는 것만
        });
        
        console.log('📋 페이지의 모든 버튼들:', JSON.stringify(allButtons, null, 2));
        
        // 저장/발행 관련 버튼 찾기 (우선순위: 저장 > 발행 > 게시)
        const targetButton = allButtons.find(btn => 
            btn.text.includes('저장') || 
            btn.text.includes('임시저장') ||
            btn.id.includes('save')
        ) || allButtons.find(btn => 
            btn.text.includes('발행') || 
            btn.text.includes('공개발행') ||
            btn.id.includes('publish')
        ) || allButtons.find(btn => 
            btn.text.includes('게시') ||
            btn.text.includes('완료')
        );

        if (targetButton) {
            console.log(`✅ 저장/발행 버튼 발견: "${targetButton.text}" (ID: ${targetButton.id})`);
            
            // 버튼 클릭
            if (targetButton.id) {
                publishButton = await page.$(`#${targetButton.id}`);
            } else {
                // ID가 없는 경우 텍스트로 찾기
                const buttonByText = await page.$x(`//button[contains(text(), "${targetButton.text}")]`);
                if (buttonByText.length > 0) {
                    publishButton = buttonByText[0];
                }
            }
        }
    }

    if (!publishButton) {
        throw new Error('발행 버튼을 찾을 수 없습니다. 페이지 구조를 확인해주세요.');
    }

    // 발행 버튼 클릭
    console.log('📤 발행 버튼을 클릭합니다...');
    await publishButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 발행 확인 레이어 확인
    await checkPublishConfirmation(page);

    console.log('✅ 포스트 발행 완료');
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