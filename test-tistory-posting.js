const { spawn } = require('child_process');
const fs = require('fs');

// 테스트용 HTML 콘텐츠 생성
const testContent = `
<h2>테스트 포스팅</h2>
<p>이것은 자동화 시스템의 테스트 포스팅입니다.</p>
<p>현재 시간: ${new Date().toLocaleString('ko-KR')}</p>
<ul>
<li>브라우저 연결 테스트 완료</li>
<li>콘텐츠 길이 검증 통과</li>
<li>시스템 Chrome 사용</li>
</ul>
<p>이 포스팅이 성공적으로 발행되면 모든 문제가 해결된 것입니다!</p>
`;

// 임시 HTML 파일 생성
const tempFile = `temp_test_content_${Date.now()}.html`;
fs.writeFileSync(tempFile, testContent);

console.log('🧪 티스토리 포스팅 테스트 시작...');
console.log(`📄 테스트 콘텐츠 파일: ${tempFile}`);
console.log(`📊 콘텐츠 길이: ${testContent.length}자`);

// tistory-poster-fixed.js 실행
const posterProcess = spawn('node', [
    'tistory-poster-fixed.js',
    '브라우저 연결 테스트 성공! - 자동화 시스템 정상 작동',
    tempFile,
    '테스트',
    '자동화테스트,브라우저연결,성공'
], {
    stdio: 'inherit',
    env: process.env
});

posterProcess.on('close', (code) => {
    // 임시 파일 정리
    try {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            console.log(`🗑️ 임시 파일 정리: ${tempFile}`);
        }
    } catch (error) {
        console.warn('⚠️ 임시 파일 정리 실패:', error.message);
    }
    
    if (code === 0) {
        console.log('🎉 티스토리 포스팅 테스트 성공!');
        console.log('✅ 모든 문제가 해결되었습니다!');
    } else {
        console.log(`❌ 티스토리 포스팅 테스트 실패 (코드: ${code})`);
    }
    
    process.exit(code);
});

posterProcess.on('error', (error) => {
    console.error('❌ 프로세스 실행 오류:', error.message);
    
    // 임시 파일 정리
    try {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    } catch (cleanupError) {
        console.warn('⚠️ 임시 파일 정리 실패:', cleanupError.message);
    }
    
    process.exit(1);
}); 