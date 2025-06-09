/**
 * 블로그 포스팅 내용 검증 스크립트
 */

require('dotenv').config();
const puppeteer = require('puppeteer');

const BLOG_ADDRESS = process.env.BLOG_ADDRESS;

async function verifyBlogPosts() {
  console.log('🔍 블로그 포스팅 내용 검증 시작...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    // 블로그 메인 페이지로 이동
    console.log('📝 블로그 메인 페이지로 이동...');
    await page.goto(BLOG_ADDRESS);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 최신 포스트들 확인
    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll('.list_content .item_post, .area-post .post-item, .post-list .post-item');
      const posts = [];
      
      for (let i = 0; i < Math.min(3, postElements.length); i++) {
        const post = postElements[i];
        const titleElement = post.querySelector('.link_post, .post-title a, .title a, h3 a, h2 a');
        const linkElement = post.querySelector('a');
        
        if (titleElement && linkElement) {
          posts.push({
            title: titleElement.textContent.trim(),
            link: linkElement.href
          });
        }
      }
      
      return posts;
    });
    
    console.log(`📊 발견된 최신 포스트 ${posts.length}개:`);
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   링크: ${post.link}`);
    });
    
    // 각 포스트의 내용 확인
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n🔍 포스트 ${i + 1} 내용 확인: ${post.title}`);
      
      try {
        await page.goto(post.link);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 포스트 내용 추출
        const content = await page.evaluate(() => {
          const contentSelectors = [
            '.entry-content',
            '.post-content', 
            '.article-view',
            '.tt_article_useless_p_margin',
            '.contents_style',
            '#content',
            '.post-body'
          ];
          
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              return {
                html: element.innerHTML,
                text: element.textContent.trim(),
                length: element.innerHTML.length
              };
            }
          }
          
          return { html: '', text: '', length: 0 };
        });
        
        console.log(`📊 내용 길이: ${content.length}자`);
        console.log(`📝 텍스트 길이: ${content.text.length}자`);
        
        if (content.html.includes('<div style="font-family:')) {
          console.log('✅ HTML 스타일이 적용되었습니다.');
        } else {
          console.log('❌ HTML 스타일이 적용되지 않았습니다.');
        }
        
        if (content.html.includes('📅 발행일')) {
          console.log('✅ 발행일 정보가 포함되어 있습니다.');
        } else {
          console.log('❌ 발행일 정보가 누락되었습니다.');
        }
        
        if (content.html.includes('🔗 원문 보기')) {
          console.log('✅ 원문 링크가 포함되어 있습니다.');
        } else {
          console.log('❌ 원문 링크가 누락되었습니다.');
        }
        
        if (content.html.includes('📰 주요 내용')) {
          console.log('✅ 주요 내용 섹션이 포함되어 있습니다.');
        } else {
          console.log('❌ 주요 내용 섹션이 누락되었습니다.');
        }
        
        if (content.text.length < 50) {
          console.log('⚠️ 내용이 너무 짧습니다.');
        } else {
          console.log('✅ 충분한 내용이 있습니다.');
        }
        
        // 내용 미리보기
        console.log(`📝 내용 미리보기: ${content.text.substring(0, 200)}...`);
        
        // 스크린샷 저장
        await page.screenshot({ path: `verify-post-${i + 1}.png`, fullPage: true });
        console.log(`📸 포스트 ${i + 1} 스크린샷 저장: verify-post-${i + 1}.png`);
        
      } catch (error) {
        console.error(`❌ 포스트 ${i + 1} 확인 중 오류:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

verifyBlogPosts().catch(console.error); 