const path = require('path');
const fs = require('fs');

console.log('=== 경로 테스트 ===');

// main.js가 위치한 src 디렉토리 시뮬레이션
const srcDir = path.join(__dirname, 'src');
console.log('1. src 디렉토리 (main.js 위치):', srcDir);

// 수정된 방식: 절대 경로 사용
const projectRoot = path.resolve(srcDir, '..');
const scriptPath = path.join(projectRoot, 'auto-poster-with-config.js');

console.log('2. 프로젝트 루트:', projectRoot);
console.log('3. 스크립트 경로:', scriptPath);
console.log('4. 파일 존재 여부:', fs.existsSync(scriptPath));

// 실제 현재 위치에서 확인
const currentScript = path.join(__dirname, 'auto-poster-with-config.js');
console.log('5. 현재 위치 스크립트:', currentScript);
console.log('6. 현재 위치 존재 여부:', fs.existsSync(currentScript));

console.log('=== 테스트 완료 ==='); 