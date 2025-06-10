/**
 * Electron 메인 프로세스
 * 티스토리 자동화 시스템 GUI 애플리케이션
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const cron = require('node-cron');

// 개발 모드 확인
const isDev = process.argv.includes('--dev');

let mainWindow;
let automationProcess = null;
let scheduledTask = null;
const CONFIG_FILE = path.join(__dirname, '..', 'gui-config.json');
const LOG_FILE = path.join(__dirname, '..', 'automation.log');

// 기본 설정값
const DEFAULT_CONFIG = {
    tistory: {
        id: '',
        password: '',
        blogAddress: ''
    },
    rss: {
        url: 'https://news.google.com/rss?topic=h&gl=KR&ceid=KR:ko',
        sourceType: 'google-news',
        category: 'h',
        keywordFilter: '',
        excludeKeywords: '',
        removeMediaNames: true,
        minContentLength: 100
    },
    schedule: {
        mode: 'manual',
        type: 'daily_9am',
        customCron: '',
        scheduledDate: '',
        scheduledTime: '09:00',
        repeatType: 'once',
        maxArticles: 3,
        interval: 30,
        enabled: false,
        allowRepost: false
    },
    html: {
        enabled: true,
        template: 'rich',
        includeImages: false,
        autoParagraph: true,
        addSourceLink: true
    },
    ai: {
        enabled: false,
        apiKey: '',
        model: 'gpt-3.5-turbo',
        improveTitle: false,
        improveContent: false,
        generateTags: false,
        addSummary: false,
        translateContent: false
    },
    advanced: {
        debug: false,
        headless: true,
        autoRetry: true
    }
};

/**
 * 메인 윈도우 생성
 */
function createWindow() {
    // 플랫폼별 아이콘 경로 설정
    let iconPath;
    if (process.platform === 'win32') {
        iconPath = path.join(__dirname, 'assets', 'icon.ico');
    } else if (process.platform === 'darwin') {
        iconPath = path.join(__dirname, 'assets', 'icon.icns');
    } else {
        iconPath = path.join(__dirname, 'assets', 'icon.png');
    }
    
    // 아이콘 파일 존재 확인
    if (!require('fs').existsSync(iconPath)) {
        console.warn(`아이콘 파일을 찾을 수 없습니다: ${iconPath}`);
        iconPath = undefined; // 기본 아이콘 사용
    }

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        frame: false,
        show: false,
        backgroundColor: '#1a1a1a',
        titleBarOverlay: false
    });

    // 윈도우 로드 완료 후 표시
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // 개발 환경에서만 개발자 도구 열기
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools();
        }
    });

    // HTML 파일 로드
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // 윈도우 닫기 이벤트
    mainWindow.on('closed', () => {
        mainWindow = null;
        if (automationProcess) {
            automationProcess.kill();
        }
        if (scheduledTask) {
            scheduledTask.destroy();
        }
    });

    // 외부 링크는 기본 브라우저에서 열기
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

/**
 * 애플리케이션 준비 완료
 */
app.whenReady().then(() => {
    createWindow();
    setupIPC();
    
    console.log('티스토리 자동화 GUI 애플리케이션이 시작되었습니다.');
    
    // macOS에서 독 아이콘 클릭 시 윈도우 재생성
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/**
 * 모든 윈도우가 닫혔을 때
 */
app.on('window-all-closed', () => {
    // macOS가 아닌 경우 앱 종료
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * 앱 종료 전 정리
 */
app.on('before-quit', () => {
    if (automationProcess) {
        automationProcess.kill();
    }
    if (scheduledTask) {
        scheduledTask.destroy();
    }
});

/**
 * IPC 핸들러 설정
 */
function setupIPC() {
    // 설정 로드
    ipcMain.handle('load-config', async () => {
        try {
            const configData = await fs.readFile(CONFIG_FILE, 'utf8');
            const config = JSON.parse(configData);
            return { ...DEFAULT_CONFIG, ...config };
        } catch (error) {
            console.log('설정 파일이 없어 기본값을 사용합니다.');
            return DEFAULT_CONFIG;
        }
    });

    // 설정 저장
    ipcMain.handle('save-config', async (event, section, data) => {
        try {
            let currentConfig = DEFAULT_CONFIG;
            
            // 기존 설정 로드
            try {
                const configData = await fs.readFile(CONFIG_FILE, 'utf8');
                currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
            } catch (error) {
                console.log('기존 설정을 불러올 수 없어 기본값을 사용합니다.');
            }
            
            // 섹션별 설정 업데이트
            currentConfig[section] = { ...currentConfig[section], ...data };
            
            // 설정 파일 저장
            await fs.writeFile(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
            
            console.log(`${section} 설정이 저장되었습니다.`);
            return { success: true, message: '설정이 저장되었습니다.' };
        } catch (error) {
            console.error('설정 저장 중 오류:', error);
            return { success: false, message: '설정 저장 중 오류가 발생했습니다.' };
        }
    });

    // 자동화 시작
    ipcMain.handle('start-automation', async (event, config) => {
        try {
            if (automationProcess) {
                return { success: false, message: '자동화가 이미 실행 중입니다.' };
            }

            const result = await startAutomationProcess(config);
            
            if (result.success) {
                // 스케줄러 설정
                if (config.schedule && config.schedule.enabled && config.schedule.mode === 'auto') {
                    setupScheduler(config);
                }
                
                // 상태 업데이트
                if (mainWindow) {
                    mainWindow.webContents.send('automation-status', 'running');
                }
            }
            
            return result;
        } catch (error) {
            console.error('자동화 시작 중 오류:', error);
            return { success: false, message: '자동화 시작 중 오류가 발생했습니다.' };
        }
    });

    // 자동화 중지
    ipcMain.handle('stop-automation', async () => {
        try {
            if (automationProcess) {
                automationProcess.kill();
                automationProcess = null;
            }
            
            if (scheduledTask) {
                scheduledTask.destroy();
                scheduledTask = null;
            }
            
            // 상태 업데이트
            if (mainWindow) {
                mainWindow.webContents.send('automation-status', 'stopped');
            }
            
            await appendToLogFile('자동화가 중지되었습니다.');
            return { success: true, message: '자동화가 중지되었습니다.' };
        } catch (error) {
            console.error('자동화 중지 중 오류:', error);
            return { success: false, message: '자동화 중지 중 오류가 발생했습니다.' };
        }
    });

    // 자동화 테스트
    ipcMain.handle('test-automation', async (event, config) => {
        try {
            await appendToLogFile('자동화 테스트를 시작합니다...');
            
            // 필수 설정 확인 (GUI 설정 구조에 맞게)
            const requiredSettings = [
                { name: 'TISTORY_ID', value: config.tistory?.id },
                { name: 'TISTORY_PW', value: config.tistory?.password }, 
                { name: 'BLOG_ADDRESS', value: config.tistory?.blogAddress }
            ];
            
            const missingSettings = requiredSettings.filter(setting => !setting.value || setting.value.trim() === '');
            
            if (missingSettings.length > 0) {
                const missingNames = missingSettings.map(s => s.name);
                const errorMsg = `필수 설정이 누락되었습니다: ${missingNames.join(', ')}`;
                await appendToLogFile(`❌ ${errorMsg}`);
                await appendToLogFile(`💡 환경 설정 페이지에서 티스토리 계정 정보를 입력해주세요.`);
                return { success: false, message: errorMsg };
            }
            
            await appendToLogFile('✅ 필수 설정 확인 완료');
            
            // RSS 피드 테스트
            const rssUrl = config.rss.url || process.env.RSS_FEED_URL;
            if (rssUrl) {
                console.log('RSS 피드 테스트 중...');
                await appendToLogFile('RSS 피드 테스트 중...');
                const rssTest = await testRSSFeed(rssUrl);
                if (!rssTest.success) {
                    const errorMsg = `RSS 피드 테스트 실패: ${rssTest.error}`;
                    await appendToLogFile(`❌ ${errorMsg}`);
                    return { success: false, message: errorMsg };
                } else {
                    await appendToLogFile(`✅ RSS 피드 테스트 성공: ${rssTest.articleCount}개 기사 발견`);
                }
            }
            
            // OpenAI API 테스트 (활성화된 경우)
            if (config.ai.enabled && config.ai.apiKey) {
                console.log('OpenAI API 테스트 중...');
                await appendToLogFile('OpenAI API 테스트 중...');
                const aiTest = await testOpenAI(config.ai.apiKey);
                if (!aiTest.success) {
                    await appendToLogFile(`⚠️ OpenAI API 테스트 실패: ${aiTest.error} (계속 진행)`);
                } else {
                    await appendToLogFile('✅ OpenAI API 테스트 성공');
                }
            }
            
            // 사용자 설정을 그대로 사용하되, 테스트용으로 기사 수만 제한
            const testConfig = {
                ...config,
                schedule: { ...config.schedule, maxArticles: 1 } // 테스트용으로 1개만
            };
            
            console.log(`🔧 테스트 모드 - 디버그 설정: ${testConfig.advanced?.debug}`);
            
            // GUI 설정을 파일로 저장 (자동화 스크립트가 읽을 수 있도록)
            const guiConfigPath = path.resolve(__dirname, '..', 'gui-config.json');
            await fs.writeFile(guiConfigPath, JSON.stringify(testConfig, null, 2));
            await appendToLogFile('✅ GUI 설정 저장 완료');
            
            await appendToLogFile('🚀 테스트용 자동화 프로세스 실행 중...');
            
            // 자동화 프로세스 실행 (테스트 모드)
            const testResult = await startAutomationProcess(testConfig, true);
            
            return testResult;
        } catch (error) {
            console.error('자동화 테스트 중 오류:', error);
            await appendToLogFile(`❌ 자동화 테스트 오류: ${error.message}`);
            return { success: false, message: `자동화 테스트 중 오류: ${error.message}` };
        }
    });

    // RSS 피드 테스트
    ipcMain.handle('test-rss-feed', async (event, url) => {
        return await testRSSFeed(url);
    });

    // OpenAI API 테스트
    ipcMain.handle('test-openai', async (event, apiKey) => {
        return await testOpenAI(apiKey);
    });

    // 로그 파일 읽기
    ipcMain.handle('read-log-file', async () => {
        try {
            const logData = await fs.readFile(LOG_FILE, 'utf8');
            return { success: true, data: logData };
        } catch (error) {
            console.error('로그 파일 읽기 오류:', error);
            return { success: false, message: '로그 파일을 읽을 수 없습니다.' };
        }
    });

    // 로그 파일 지우기
    ipcMain.handle('clear-log-file', async () => {
        try {
            await fs.writeFile(LOG_FILE, '');
            return { success: true, message: '로그가 삭제되었습니다.' };
        } catch (error) {
            console.error('로그 파일 삭제 오류:', error);
            return { success: false, message: '로그 파일을 삭제할 수 없습니다.' };
        }
    });

    // 로그 파일 열기
    ipcMain.handle('open-log-file', async () => {
        try {
            await shell.openPath(LOG_FILE);
            return { success: true };
        } catch (error) {
            console.error('로그 파일 열기 오류:', error);
            return { success: false, message: '로그 파일을 열 수 없습니다.' };
        }
    });

    // 로그 파일 내보내기
    ipcMain.handle('export-log-file', async () => {
        try {
            const result = await dialog.showSaveDialog(mainWindow, {
                title: '로그 파일 저장',
                defaultPath: `tistory-automation-log-${new Date().toISOString().split('T')[0]}.log`,
                filters: [
                    { name: '로그 파일', extensions: ['log'] },
                    { name: '텍스트 파일', extensions: ['txt'] },
                    { name: '모든 파일', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                const logData = await fs.readFile(LOG_FILE, 'utf8');
                await fs.writeFile(result.filePath, logData);
                return { success: true, message: '로그가 내보내기되었습니다.' };
            }
            
            return { success: false, message: '내보내기가 취소되었습니다.' };
        } catch (error) {
            console.error('로그 파일 내보내기 오류:', error);
            return { success: false, message: '로그 파일을 내보낼 수 없습니다.' };
        }
    });

    // 윈도우 컨트롤
    ipcMain.handle('window-minimize', () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });

    ipcMain.handle('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.handle('window-close', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });
}

/**
 * 자동화 프로세스 시작
 */
async function startAutomationProcess(config, isTestMode = false) {
    return new Promise((resolve, reject) => {
        // 스크립트 경로를 완전한 절대 경로로 설정
        const projectRoot = path.resolve(__dirname, '..');
        const scriptPath = path.resolve(projectRoot, 'auto-poster-with-config.js');
        
        console.log('자동화 스크립트 실행:', scriptPath);
        console.log('__dirname:', __dirname);
        console.log('프로젝트 루트:', projectRoot);
        
        // 환경 변수 설정 (블로그 주소 정규화)
        let blogAddress = config.tistory.blogAddress;
        if (blogAddress && !blogAddress.startsWith('http')) {
            blogAddress = `https://${blogAddress}`;
        }
        if (blogAddress && !blogAddress.endsWith('.tistory.com') && !blogAddress.includes('.tistory.com/')) {
            if (!blogAddress.includes('.tistory.com')) {
                // 도메인이 없으면 추가
                const domain = blogAddress.replace(/^https?:\/\//, '').replace(/\/$/, '');
                blogAddress = `https://${domain}.tistory.com`;
            }
        }
        
        const env = {
            ...process.env,
            TISTORY_ID: config.tistory.id,
            TISTORY_PW: config.tistory.password,
            BLOG_ADDRESS: blogAddress,
            RSS_FEED_URL: config.rss.url,
            OPENAI_API_KEY: config.ai.apiKey || '',
            DEBUG_MODE: config.advanced?.debug ? 'true' : 'false',
            HEADLESS_MODE: config.advanced?.headless ? 'true' : 'false',
            HTML_ENABLED: config.html.enabled ? 'true' : 'false',
            AI_ENABLED: config.ai.enabled ? 'true' : 'false',
            // Windows 인코딩 설정
            PYTHONIOENCODING: 'utf-8',
            LANG: 'ko_KR.UTF-8',
            // allowRepost 설정 (이전 기사 포함 여부)
            ALLOW_REPOST: config.schedule.allowRepost ? 'true' : 'false'
        };
        
        console.log('환경변수 설정 완료:');
        console.log(`  - TISTORY_ID: ${env.TISTORY_ID}`);
        console.log(`  - BLOG_ADDRESS: ${env.BLOG_ADDRESS}`);
        console.log(`  - RSS_FEED_URL: ${env.RSS_FEED_URL}`);
        console.log(`  - DEBUG_MODE: ${env.DEBUG_MODE}`);

        // Node.js 실행 파일 경로 명시적으로 지정
        const nodePath = 'node'; // 글로벌 node 명령어 사용 (shell 모드)
        
        console.log(`🔧 Node.js 경로: ${nodePath} (shell 모드 활성화)`);
        console.log(`📁 스크립트 경로: ${scriptPath}`);
        
        // 스크립트 파일 존재 확인
        if (!require('fs').existsSync(scriptPath)) {
            const error = new Error(`자동화 스크립트를 찾을 수 없습니다: ${scriptPath}`);
            console.error(error.message);
            reject(error);
            return;
        }
        
        automationProcess = spawn(nodePath, [scriptPath], {
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: projectRoot, // 작업 디렉토리를 프로젝트 루트로 설정
            shell: true // Windows 환경에서 node 명령어 인식을 위해 shell 모드 활성화
        });

        console.log('프로세스 PID:', automationProcess.pid);

        // 프로세스 시작 로그
        console.log('자동화 프로세스 시작됨');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('log-message', '✅ 자동화 프로세스 시작됨');
        }
        appendToLogFile('✅ 자동화 프로세스 시작됨');

        automationProcess.on('error', (error) => {
            console.error('프로세스 시작 오류:', error);
            automationProcess = null;
            
            const errorMessage = `프로세스 시작 실패: ${error.message}`;
            
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('log-message', errorMessage);
            }
            
            appendToLogFile(errorMessage);
            reject(error);
        });

                 if (isTestMode) {
             // 테스트 모드: 프로세스 완료 대기
             let outputBuffer = '';
             let hasError = false;
             
             // 로그 수집
             automationProcess.stdout.on('data', (data) => {
                 const message = data.toString().trim();
                 outputBuffer += message + '\n';
                 console.log('자동화 출력:', message);
                 
                 // 렌더러에 로그 전송
                 if (mainWindow && !mainWindow.isDestroyed()) {
                     mainWindow.webContents.send('log-message', message);
                 }
                 
                 // 로그 파일에 저장
                 appendToLogFile(message);
             });

             automationProcess.stderr.on('data', (data) => {
                 const message = data.toString().trim();
                 outputBuffer += `ERROR: ${message}\n`;
                 hasError = true;
                 console.error('자동화 오류:', message);
                 
                 if (mainWindow && !mainWindow.isDestroyed()) {
                     mainWindow.webContents.send('log-message', `오류: ${message}`);
                 }
                 
                 appendToLogFile(`오류: ${message}`);
             });

             automationProcess.on('close', (code) => {
                 console.log(`자동화 프로세스 종료됨. 코드: ${code}`);
                 automationProcess = null;
                 
                 const isSuccess = code === 0 && !hasError && 
                                 (outputBuffer.includes('자동화 완료') || 
                                  outputBuffer.includes('자동화 정상 완료') ||
                                  outputBuffer.includes('성공적으로 완료'));
                 
                 const statusMessage = isSuccess ? '자동화 정상 완료' : `자동화 오류 종료 (코드: ${code})`;
                 
                 if (mainWindow && !mainWindow.isDestroyed()) {
                     mainWindow.webContents.send('log-message', statusMessage);
                     mainWindow.webContents.send('automation-status', { running: false });
                 }
                 
                 appendToLogFile(statusMessage);
                 
                 // 결과 반환
                 if (isSuccess) {
                     resolve({ success: true, message: '자동화 테스트가 성공적으로 완료되었습니다.' });
                 } else {
                     resolve({ success: false, message: `자동화 테스트 실패 (종료 코드: ${code})` });
                 }
             });
         } else {
             // 일반 모드: 로그 출력만
             automationProcess.stdout.on('data', (data) => {
                 const message = data.toString().trim();
                 console.log('자동화 출력:', message);
                 
                 // 렌더러에 로그 전송
                 if (mainWindow && !mainWindow.isDestroyed()) {
                     mainWindow.webContents.send('log-message', message);
                 }
                 
                 // 로그 파일에 저장
                 appendToLogFile(message);
             });

             automationProcess.stderr.on('data', (data) => {
                 const message = data.toString().trim();
                 console.error('자동화 오류:', message);
                 
                 if (mainWindow && !mainWindow.isDestroyed()) {
                     mainWindow.webContents.send('log-message', `오류: ${message}`);
                 }
                 
                 appendToLogFile(`오류: ${message}`);
             });

             automationProcess.on('close', (code) => {
                 console.log(`자동화 프로세스 종료됨. 코드: ${code}`);
                 automationProcess = null;
                 
                 const statusMessage = code === 0 ? '자동화 정상 완료' : `자동화 오류 종료 (코드: ${code})`;
                 
                 if (mainWindow && !mainWindow.isDestroyed()) {
                     mainWindow.webContents.send('log-message', statusMessage);
                     mainWindow.webContents.send('automation-status', { running: false });
                 }
                 
                 appendToLogFile(statusMessage);
             });
             
             // 일반 모드에서는 바로 성공 반환
             setTimeout(() => {
                 if (automationProcess && !automationProcess.killed) {
                     resolve({ success: true, message: '자동화가 시작되었습니다.' });
                 } else {
                     reject(new Error('자동화 프로세스가 시작되지 않았습니다.'));
                 }
             }, 500);
         }

        automationProcess.on('error', (error) => {
            console.error('프로세스 시작 오류:', error);
            automationProcess = null;
            
            const errorMessage = `프로세스 시작 실패: ${error.message}`;
            
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('log-message', errorMessage);
            }
            
            appendToLogFile(errorMessage);
            reject(error);
        });

        // 초기 시작 알림
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('automation-status', { running: true });
            mainWindow.webContents.send('log-message', '✅ 자동화 시스템 활성화됨');
        }
        appendToLogFile('자동화 시스템 활성화됨');
    });
}

/**
 * 스케줄러 설정
 */
function setupScheduler(config) {
    // 기존 스케줄 제거
    if (scheduledTask) {
        scheduledTask.destroy();
        scheduledTask = null;
    }

    if (!config.schedule.enabled) {
        return;
    }

    let cronExpression = '';

    switch (config.schedule.mode) {
        case 'auto':
            switch (config.schedule.type) {
                case 'hourly':
                    cronExpression = '0 * * * *';
                    break;
                case 'daily_9am':
                    cronExpression = '0 9 * * *';
                    break;
                case 'every_30min':
                    cronExpression = '*/30 * * * *';
                    break;
                case 'three_times_daily':
                    cronExpression = '0 9,13,18 * * *';
                    break;
                case 'weekdays_9am':
                    cronExpression = '0 9 * * 1-5';
                    break;
                case 'custom':
                    cronExpression = config.schedule.customCron;
                    break;
            }
            break;
        case 'scheduled':
            if (config.schedule.scheduledDate && config.schedule.scheduledTime) {
                const [hour, minute] = config.schedule.scheduledTime.split(':');
                const scheduledDate = new Date(config.schedule.scheduledDate);
                const today = new Date();
                
                if (scheduledDate >= today) {
                    switch (config.schedule.repeatType) {
                        case 'once':
                            // 한 번만 실행
                            const executeTime = new Date(scheduledDate);
                            executeTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
                            
                            if (executeTime > new Date()) {
                                const timeout = setTimeout(() => {
                                    startAutomationProcess(config);
                                }, executeTime.getTime() - new Date().getTime());
                                
                                scheduledTask = { destroy: () => clearTimeout(timeout) };
                            }
                            return;
                        case 'daily':
                            cronExpression = `${minute} ${hour} * * *`;
                            break;
                        case 'weekly':
                            const dayOfWeek = scheduledDate.getDay();
                            cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
                            break;
                        case 'monthly':
                            const dayOfMonth = scheduledDate.getDate();
                            cronExpression = `${minute} ${hour} ${dayOfMonth} * *`;
                            break;
                    }
                }
            }
            break;
    }

    if (cronExpression && cron.validate(cronExpression)) {
        console.log(`스케줄 설정됨: ${cronExpression}`);
        
        scheduledTask = cron.schedule(cronExpression, () => {
            console.log('스케줄된 자동화 실행');
            if (!automationProcess) {
                startAutomationProcess(config);
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Seoul'
        });
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('log-message', `스케줄 설정됨: ${cronExpression}`);
        }
    } else {
        console.error('잘못된 Cron 표현식:', cronExpression);
    }
}

/**
 * RSS 피드 테스트
 */
async function testRSSFeed(url) {
    try {
        const fetch = require('node-fetch');
        const response = await fetch(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}` };
        }
        
        const xmlText = await response.text();
        
        // 간단한 RSS 유효성 검사
        if (!xmlText.includes('<rss') && !xmlText.includes('<feed')) {
            return { success: false, error: '유효한 RSS/Atom 피드가 아닙니다.' };
        }
        
        // 기사 수 추정
        const itemMatches = xmlText.match(/<item>/g) || xmlText.match(/<entry>/g) || [];
        const articleCount = itemMatches.length;
        
        return { success: true, articleCount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * OpenAI API 테스트
 */
async function testOpenAI(apiKey) {
    try {
        const fetch = require('node-fetch');
        
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'Tistory-Automation/1.0'
            },
            timeout: 10000
        });
        
        if (response.status === 401) {
            return { success: false, error: '유효하지 않은 API 키입니다.' };
        }
        
        if (!response.ok) {
            return { success: false, error: `API 오류: ${response.status}` };
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            return { success: true };
        } else {
            return { success: false, error: '사용 가능한 모델이 없습니다.' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * 로그 파일에 메시지 추가
 */
async function appendToLogFile(message) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        await fs.appendFile(LOG_FILE, logEntry);
    } catch (error) {
        console.error('로그 파일 쓰기 오류:', error);
    }
}

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
    console.error('처리되지 않은 예외:', error);
    appendToLogFile(`처리되지 않은 예외: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('처리되지 않은 Promise 거부:', reason);
    appendToLogFile(`처리되지 않은 Promise 거부: ${reason}`);
});

module.exports = { app, createWindow }; 