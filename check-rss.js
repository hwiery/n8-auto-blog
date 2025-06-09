const https = require('https');

// 작동이 확실한 RSS 피드들을 테스트
const RSS_URLS = [
  'https://feeds.feedblitz.com/smashingmagazine',
  'https://rss.cnn.com/rss/edition.rss',
  'https://uxplanet.org/feed'
];

async function testRSSFeed(url) {
  return new Promise((resolve) => {
    console.log(`\n🔍 테스트 중: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📊 데이터 길이: ${data.length}자`);
        
        if (data.length > 0) {
          console.log('📰 구조 샘플:');
          console.log(data.substring(0, 300) + '...');
          
          const itemMatches = data.match(/<item[^>]*>[\s\S]*?<\/item>/g);
          const entryMatches = data.match(/<entry[^>]*>[\s\S]*?<\/entry>/g);
          
          console.log(`📊 <item> 태그: ${itemMatches ? itemMatches.length : 0}개`);
          console.log(`📊 <entry> 태그: ${entryMatches ? entryMatches.length : 0}개`);
          
          if (itemMatches && itemMatches.length > 0) {
            console.log('✅ RSS 2.0 형식 감지');
            resolve({ url, success: true, format: 'rss2.0', items: itemMatches.length });
          } else if (entryMatches && entryMatches.length > 0) {
            console.log('✅ Atom 형식 감지');
            resolve({ url, success: true, format: 'atom', items: entryMatches.length });
          } else {
            console.log('❌ RSS 항목을 찾을 수 없음');
            resolve({ url, success: false });
          }
        } else {
          console.log('❌ 데이터 없음');
          resolve({ url, success: false });
        }
      });
    }).on('error', (error) => {
      console.error(`❌ 요청 오류: ${error.message}`);
      resolve({ url, success: false, error: error.message });
    });
  });
}

async function testAllFeeds() {
  console.log('🚀 RSS 피드 테스트 시작...');
  
  for (const url of RSS_URLS) {
    await testRSSFeed(url);
  }
  
  console.log('\n🎉 테스트 완료!');
}

testAllFeeds(); 