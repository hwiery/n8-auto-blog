/**
 * 티스토리 안전 템플릿 테스트
 * 기본 HTML 태그만 사용하여 호환성 확인
 */

// 환경변수 설정
process.env.TISTORY_ID = "hwiery@gmail.com";
process.env.TISTORY_PW = "1q2w3e4r5t";
process.env.BLOG_ADDRESS = "https://vibecoderyangc.tistory.com";
process.env.RSS_FEED_URL = "https://www.nngroup.com/feed/rss/";

console.log('🔧 티스토리 안전 템플릿 테스트 시작');
console.log('📋 사용 HTML 태그: h1, h2, p, strong, em, ul, li, a, hr, br');
console.log('🚫 제외 태그: div, style, script, iframe 등');

// config 수정
const config = require('./config');
config.schedule.type = 'manual';
config.schedule.enabled = false;
config.debug.enabled = false; // 실제 포스팅 실행
config.debug.headless = false; // 브라우저 표시

// 테스트 기사 데이터
const testArticle = {
  title: "The Future-Proof Designer",
  link: "https://www.nngroup.com/articles/future-proof-designer/",
  description: "Top product experts share four strategies for remaining indispensable as AI changes UI design, accelerates feature production, and reshapes data analysis.",
  pubDate: "2025-06-06T17:00:00.000Z"
};

const testContent = `AI is reshaping product development by automating tactical design tasks, accelerating feature production, and surfacing patterns in data at unprecedented speeds.

While these advancements offer efficiency gains, they also introduce new risks. Design may become marginalized as UI execution is automated.

Still, seasoned experts advise against panic. The core principles of UX and product design remain unchanged, and AI amplifies their importance in many ways.

To stay indispensable, designers must evolve: adapt to new workflows, deepen their judgment, and double down on the uniquely human skills that AI can't replace.

Our expert panel recommends several tactics for designers to stay indispensable as AI reshapes product development.

The key is to become more strategic and make the most of what AI offers by leveraging AI-driven insights while applying human judgment and critical thinking.`;

// 템플릿 생성 테스트
const { createEnhancedHTMLTemplate } = require('./enhanced-content-extractor');

console.log('\n🎨 티스토리 안전 HTML 템플릿 생성 중...');
const safeHTML = createEnhancedHTMLTemplate(testArticle, testContent);

console.log('\n📄 생성된 HTML 미리보기:');
console.log('=' .repeat(60));
console.log(safeHTML);
console.log('=' .repeat(60));

console.log('\n✅ 템플릿 검증 완료!');
console.log('📊 통계:');
console.log(`   - HTML 길이: ${safeHTML.length}자`);
console.log(`   - 문단 수: ${(safeHTML.match(/<p>/g) || []).length}개`);
console.log(`   - 제목 수: ${(safeHTML.match(/<h[1-6]>/g) || []).length}개`);
console.log(`   - 리스트 항목: ${(safeHTML.match(/<li>/g) || []).length}개`);

// 안전성 검증
const unsafeTags = ['div', 'style', 'script', 'iframe'];
const foundUnsafe = unsafeTags.filter(tag => safeHTML.includes(`<${tag}`));

if (foundUnsafe.length > 0) {
  console.log('⚠️ 안전하지 않은 태그 발견:', foundUnsafe);
} else {
  console.log('✅ 모든 태그가 티스토리 호환 기본 태그입니다!');
}

console.log('\n🚀 이제 실제 자동화를 실행합니다...');
require('./auto-poster-with-config.js'); 