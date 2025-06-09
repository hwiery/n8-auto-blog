/**
 * 간단한 블로그 확인 스크립트
 */

require('dotenv').config();
const puppeteer = require('puppeteer');

const BLOG_ADDRESS = process.env.BLOG_ADDRESS;

async function checkBlog() {
  console.log('🔍 블로그 확인 시작...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    console.log(`📝 블로그 주소: ${BLOG_ADDRESS}`);
    await page.goto(BLOG_ADDRESS);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📊 페이지 제목: ${title}`);
    
    // 모든 링크 확인
    const allLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        className: link.className
      })).filter(link => link.text && link.href);
    });
    
    console.log(`📊 총 ${allLinks.length}개의 링크 발견`);
    
    // 포스트 관련 링크 찾기
    const postLinks = allLinks.filter(link => 
      link.href.includes('/entry/') || 
      link.href.includes('/post/') ||
      link.text.includes('대통령') ||
      link.text.includes('李대통령') ||
      link.text.includes('경호처')
    );
    
    console.log(`📰 포스트 관련 링크 ${postLinks.length}개:`);
    postLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.text}`);
      console.log(`   링크: ${link.href}`);
    });
    
    // 첫 번째 포스트 확인
    if (postLinks.length > 0) {
      console.log(`\n🔍 첫 번째 포스트 확인: ${postLinks[0].text}`);
      await page.goto(postLinks[0].href);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 페이지 HTML 구조 확인
      const pageStructure = await page.evaluate(() => {
        const selectors = [
          '.entry-content',
          '.post-content', 
          '.article-view',
          '.tt_article_useless_p_margin',
          '.contents_style',
          '#content',
          '.post-body',
          '.article-content',
          '.post-article'
        ];
        
        const found = [];
        selectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            found.push({
              selector: selector,
              html: element.innerHTML.substring(0, 500),
              textLength: element.textContent.trim().length
            });
          }
        });
        
        return found;
      });
      
      console.log('📊 페이지 구조:');
      pageStructure.forEach(item => {
        console.log(`✅ ${item.selector} - 텍스트 길이: ${item.textLength}자`);
        console.log(`   HTML 미리보기: ${item.html.substring(0, 200)}...`);
      });
      
      // 스크린샷 저장
      await page.screenshot({ path: 'blog-check.png', fullPage: true });
      console.log('📸 스크린샷 저장: blog-check.png');
    }
    
    // 10초 대기 (수동 확인용)
    console.log('⏰ 10초 대기 중... (수동으로 확인해보세요)');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

checkBlog().catch(console.error); 