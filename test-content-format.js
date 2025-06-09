/**
 * HTML 양식과 내용 테스트 스크립트
 */

require('dotenv').config();
const { runAutomation } = require('./simple-auto-poster');

// 테스트용 샘플 기사
const sampleArticle = {
  title: "AI 기술 발전으로 새로운 시대 열려 - 테크뉴스",
  description: "인공지능 기술의 급속한 발전으로 다양한 산업 분야에서 혁신이 일어나고 있습니다.",
  link: "https://example.com/news/ai-tech",
  pubDate: new Date().toISOString(),
  id: "test123"
};

const sampleContent = `
인공지능 기술이 빠르게 발전하면서 우리 생활의 모든 영역에 변화를 가져오고 있다. 
특히 의료, 교육, 금융 등의 분야에서 AI의 활용도가 높아지고 있으며, 
이는 기존의 업무 방식을 완전히 바꾸어 놓고 있다.

전문가들은 향후 5년 내에 AI 기술이 더욱 정교해질 것으로 예상한다고 밝혔다.
이러한 변화는 새로운 일자리 창출과 동시에 기존 직업의 변화도 가져올 것으로 보인다.
`;

console.log('🧪 HTML 양식과 내용 테스트 시작...\n');

// 제목 정리 테스트
function cleanTitle(title) {
  const patterns = [
    / - [가-힣A-Za-z0-9\s]+$/,
    / \| [가-힣A-Za-z0-9\s]+$/,
    / \/ [가-힣A-Za-z0-9\s]+$/,
    / · [가-힣A-Za-z0-9\s]+$/,
    /\[[가-힣A-Za-z0-9\s]+\]$/,
  ];
  
  let cleanedTitle = title;
  patterns.forEach(pattern => {
    cleanedTitle = cleanedTitle.replace(pattern, '');
  });
  
  return cleanedTitle.trim();
}

// HTML 포맷팅 테스트
function formatAsPost(article, content) {
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const pubDate = new Date(article.pubDate).toLocaleDateString('ko-KR');
  
  let mainContent = '';
  if (content && content.length > 20) {
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    mainContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
  } else if (article.description && article.description.length > 10) {
    mainContent = `<p>${article.description}</p>`;
  } else {
    mainContent = '<p>자세한 내용은 아래 원문 링크를 참조해주세요.</p>';
  }
  
  const htmlContent = `<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333;">
  <div style="border-left: 4px solid #007bff; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: #007bff; margin-bottom: 10px; font-size: 24px;">${cleanTitle(article.title)}</h2>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 14px; color: #666;">
      <strong>📅 발행일:</strong> ${pubDate}
    </p>
    <p style="margin: 5px 0; font-size: 14px; color: #666;">
      <strong>🔗 원문 보기:</strong> <a href="${article.link}" target="_blank" style="color: #007bff; text-decoration: none;">기사 원문 링크</a>
    </p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">📰 주요 내용</h3>
    ${mainContent}
  </div>
  
  <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
    <p style="font-size: 12px; color: #999; text-align: center; margin: 5px 0;">
      📌 이 글은 구글 뉴스에서 자동으로 수집된 기사를 재구성한 것입니다.
    </p>
    <p style="font-size: 12px; color: #999; text-align: center; margin: 5px 0;">
      ⏰ 자동 포스팅 시간: ${currentDate}
    </p>
  </div>
</div>`;
  
  return htmlContent;
}

// 테스트 실행
console.log('1. 제목 정리 테스트:');
console.log(`원본: ${sampleArticle.title}`);
console.log(`정리됨: ${cleanTitle(sampleArticle.title)}\n`);

console.log('2. HTML 내용 생성 테스트:');
const htmlContent = formatAsPost(sampleArticle, sampleContent);
console.log('HTML 길이:', htmlContent.length, '자');
console.log('HTML 미리보기 (첫 200자):');
console.log(htmlContent.substring(0, 200) + '...\n');

console.log('3. 내용 검증:');
console.log('✅ 제목 포함:', htmlContent.includes(cleanTitle(sampleArticle.title)) ? '성공' : '실패');
console.log('✅ 발행일 포함:', htmlContent.includes('발행일') ? '성공' : '실패');
console.log('✅ 원문 링크 포함:', htmlContent.includes('원문 보기') ? '성공' : '실패');
console.log('✅ 주요 내용 포함:', htmlContent.includes('주요 내용') ? '성공' : '실패');
console.log('✅ 스타일 적용:', htmlContent.includes('style=') ? '성공' : '실패');
console.log('✅ 본문 내용 포함:', htmlContent.includes('인공지능') ? '성공' : '실패');

console.log('\n4. HTML 구조 검증:');
const hasOpeningDiv = htmlContent.includes('<div style="font-family:');
const hasClosingDiv = htmlContent.endsWith('</div>');
const hasTitle = htmlContent.includes('<h2 style=');
const hasContent = htmlContent.includes('<p>');

console.log('✅ 시작 div 태그:', hasOpeningDiv ? '성공' : '실패');
console.log('✅ 종료 div 태그:', hasClosingDiv ? '성공' : '실패');
console.log('✅ 제목 태그:', hasTitle ? '성공' : '실패');
console.log('✅ 내용 태그:', hasContent ? '성공' : '실패');

const allTestsPassed = hasOpeningDiv && hasClosingDiv && hasTitle && hasContent;
console.log('\n🎯 전체 테스트 결과:', allTestsPassed ? '✅ 성공' : '❌ 실패');

if (allTestsPassed) {
  console.log('\n💾 완성된 HTML을 파일로 저장...');
  const fs = require('fs');
  fs.writeFileSync('test-output.html', htmlContent);
  console.log('✅ test-output.html 파일로 저장 완료');
  console.log('💡 브라우저에서 test-output.html을 열어 결과를 확인해보세요.');
}

console.log('\n🔍 실제 RSS 테스트를 원하시면 다음 명령어를 실행하세요:');
console.log('node simple-auto-poster.js'); 