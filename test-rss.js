/**
 * RSS 피드 테스트 스크립트
 */

const https = require('https');

const RSS_URL = 'https://news.google.com/rss?topic=h&hl=ko&gl=KR&ceid=KR:ko';

console.log('🔍 RSS 피드 테스트 시작...');
console.log(`📡 URL: ${RSS_URL}\n`);

https.get(RSS_URL, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 RSS 피드 내용 (첫 1000자):');
    console.log(data.substring(0, 1000));
    console.log('\n...\n');
    
    // 아이템 개수 확인
    const itemMatches = data.match(/<item>/g);
    console.log(`📊 발견된 아이템 수: ${itemMatches ? itemMatches.length : 0}`);
    
    // 첫 번째 아이템 추출 테스트
    const itemRegex = /<item>(.*?)<\/item>/s;
    const firstItem = itemRegex.exec(data);
    
    if (firstItem) {
      console.log('\n📰 첫 번째 아이템:');
      console.log(firstItem[1].substring(0, 500));
      
      // 제목 추출 테스트
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/s;
      const titleMatch = titleRegex.exec(firstItem[1]);
      
      if (titleMatch) {
        console.log(`\n📝 제목: ${titleMatch[1]}`);
      } else {
        console.log('\n❌ 제목 추출 실패');
        
        // 다른 제목 형식 시도
        const simpleTitleRegex = /<title>(.*?)<\/title>/s;
        const simpleTitleMatch = simpleTitleRegex.exec(firstItem[1]);
        if (simpleTitleMatch) {
          console.log(`📝 간단 제목: ${simpleTitleMatch[1]}`);
        }
      }
    } else {
      console.log('\n❌ 아이템 추출 실패');
    }
  });
  
  res.on('error', (error) => {
    console.error('❌ RSS 피드 가져오기 실패:', error.message);
  });
}).on('error', (error) => {
  console.error('❌ 요청 실패:', error.message);
}); 