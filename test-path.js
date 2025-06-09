const path = require('path');
const fs = require('fs');

console.log('현재 디렉토리:', __dirname);
console.log('프로젝트 루트 추정:', path.join(__dirname));

// src 디렉토리에서 계산하는 경우 (main.js의 위치)
const srcDir = path.join(__dirname, 'src');
console.log('src 디렉토리:', srcDir);

// src에서 상위로 올라가서 auto-poster-with-config.js 찾기
const scriptFromSrc = path.join(srcDir, '..', 'auto-poster-with-config.js');
console.log('src에서 계산된 경로:', scriptFromSrc);
console.log('파일 존재 여부:', fs.existsSync(scriptFromSrc));

// 절대 경로로 확인
const absolutePath = path.resolve(scriptFromSrc);
console.log('절대 경로:', absolutePath);
console.log('절대 경로 존재 여부:', fs.existsSync(absolutePath)); 