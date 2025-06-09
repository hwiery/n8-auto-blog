/**
 * HTML 입력 문제 해결 테스트 스크립트
 */

require('dotenv').config();
const puppeteer = require('puppeteer');

const TISTORY_ID = process.env.TISTORY_ID;
const TISTORY_PW = process.env.TISTORY_PW;
const BLOG_ADDRESS = process.env.BLOG_ADDRESS;

// 테스트용 HTML 내용
const testHTML = `
<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <div style="border-left: 4px solid #007bff; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: #007bff; margin-bottom: 10px;">🔍 HTML 입력 테스트</h2>
    <p style="margin: 5px 0;"><strong>📅 테스트 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
    <p style="margin: 5px 0;"><strong>🔗 테스트 목적:</strong> HTML 내용이 제대로 입력되는지 확인</p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="color: #495057; margin-bottom: 10px;">📰 테스트 내용</h3>
    <p>이것은 HTML 양식 테스트입니다. 다양한 스타일이 적용되어야 합니다.</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>볼드 텍스트: <strong>굵은 글씨</strong></li>
      <li>이탤릭 텍스트: <em>기울임 글씨</em></li>
      <li>색상 텍스트: <span style="color: #dc3545;">빨간색 글씨</span></li>
    </ul>
  </div>
  
  <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 20px;">
    <p style="font-size: 0.9em; color: #6c757d;">
      📌 이 글은 HTML 입력 테스트를 위해 자동으로 생성되었습니다.
    </p>
  </div>
</div>
`;

async function testHTMLInput() {
  console.log('🔍 HTML 입력 테스트 시작...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  try {
    // 티스토리 로그인
    console.log('🔐 티스토리 로그인...');
    await page.goto('https://www.tistory.com/auth/login');
    
    // 카카오 로그인
    await page.click('a.btn_login.link_kakao_id');
    await page.waitForNavigation();
    
    // 로그인 정보 입력
    await page.type('input[name="loginId"]', TISTORY_ID);
    await page.type('input[name="password"]', TISTORY_PW);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // 블로그로 이동
    console.log('📝 블로그로 이동...');
    await page.goto(BLOG_ADDRESS);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 글쓰기 버튼 클릭
    await page.click('.btn-write');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 제목 입력
    console.log('📝 제목 입력...');
    await page.type('#post-title-inp', 'HTML 입력 테스트 - ' + new Date().toLocaleTimeString());
    
    // 현재 에디터 모드 확인
    const currentMode = await page.evaluate(() => {
      const modeButton = document.querySelector('#editor-mode-layer-btn-open');
      return modeButton ? modeButton.textContent.trim() : 'not found';
    });
    console.log(`📊 현재 에디터 모드: ${currentMode}`);
    
    // HTML 모드로 전환 (강제)
    console.log('🔄 HTML 모드로 강제 전환...');
    
    // 1단계: 모드 버튼 클릭
    await page.click('#editor-mode-layer-btn-open');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2단계: HTML 모드 선택
    await page.click('#editor-mode-html');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3단계: 확인 모달 처리 (자동으로 처리됨)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 최종 모드 확인
    const finalMode = await page.evaluate(() => {
      const modeButton = document.querySelector('#editor-mode-layer-btn-open');
      return modeButton ? modeButton.textContent.trim() : 'not found';
    });
    console.log(`📊 최종 에디터 모드: ${finalMode}`);
    
    // 에디터 상태 확인
    const editorState = await page.evaluate(() => {
      const codeMirror = document.querySelector('.CodeMirror');
      const textareas = document.querySelectorAll('textarea');
      
      return {
        codeMirror: codeMirror ? 'found' : 'not found',
        codeMirrorVisible: codeMirror ? (codeMirror.offsetParent !== null) : false,
        textareas: textareas.length,
        codeMirrorInstance: codeMirror && codeMirror.CodeMirror ? 'has instance' : 'no instance'
      };
    });
    
    console.log('📊 에디터 상태:', JSON.stringify(editorState, null, 2));
    
    // HTML 내용 입력 (여러 방법 시도)
    console.log('📝 HTML 내용 입력 시도...');
    
    // 방법 1: CodeMirror 직접 입력
    const method1Success = await page.evaluate((html) => {
      const editor = document.querySelector('.CodeMirror');
      if (editor && editor.CodeMirror) {
        try {
          editor.CodeMirror.setValue(html);
          editor.CodeMirror.refresh();
          return true;
        } catch (error) {
          console.error('CodeMirror 입력 오류:', error);
          return false;
        }
      }
      return false;
    }, testHTML);
    
    console.log(`📊 방법 1 (CodeMirror): ${method1Success ? '성공' : '실패'}`);
    
    if (!method1Success) {
      // 방법 2: textarea 직접 입력
      const method2Success = await page.evaluate((html) => {
        const textareas = document.querySelectorAll('textarea');
        for (let textarea of textareas) {
          if (textarea.offsetParent !== null) { // 보이는 textarea만
            textarea.value = html;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      }, testHTML);
      
      console.log(`📊 방법 2 (textarea): ${method2Success ? '성공' : '실패'}`);
    }
    
    // 입력 결과 확인
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const inputResult = await page.evaluate(() => {
      const editor = document.querySelector('.CodeMirror');
      if (editor && editor.CodeMirror) {
        return {
          method: 'CodeMirror',
          length: editor.CodeMirror.getValue().length,
          content: editor.CodeMirror.getValue().substring(0, 200)
        };
      }
      
      const textareas = document.querySelectorAll('textarea');
      for (let textarea of textareas) {
        if (textarea.value && textarea.value.length > 100) {
          return {
            method: 'textarea',
            length: textarea.value.length,
            content: textarea.value.substring(0, 200)
          };
        }
      }
      
      return { method: 'none', length: 0, content: '' };
    });
    
    console.log('📊 입력 결과:', JSON.stringify(inputResult, null, 2));
    
    // 스크린샷 저장
    await page.screenshot({ path: 'html-input-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: html-input-test.png');
    
    // 발행하지 않고 임시저장만
    console.log('💾 임시저장 시도...');
    
    // 임시저장 버튼 찾기
    const saveButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      return buttons.map(btn => ({
        text: (btn.textContent || btn.value || '').trim(),
        id: btn.id,
        className: btn.className,
        visible: btn.offsetParent !== null
      })).filter(btn => btn.visible && (
        btn.text.includes('저장') || 
        btn.text.includes('임시') ||
        btn.id.includes('save')
      ));
    });
    
    console.log('📊 저장 버튼들:', JSON.stringify(saveButtons, null, 2));
    
    // 10초 대기 (수동 확인용)
    console.log('⏰ 10초 대기 중... (수동으로 확인해보세요)');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'html-input-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testHTMLInput().catch(console.error); 