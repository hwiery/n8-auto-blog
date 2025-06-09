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
        enabled: false
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
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        frame: true,
        show: false
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
    
    console.log('🚀 티스토리 자동화 GUI 애플리케이션이 시작되었습니다.');
    
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
            
            try {
                const configData = await fs.readFile(CONFIG_FILE, 'utf8');
                currentConfig = JSON.parse(configData);
            } catch (error) {
                // 파일이 없으면 기본값 사용
            }
            
            // 특정 섹션 업데이트
            if (section === 'environment') {
                currentConfig.tistory = data.tistory;
                currentConfig.advanced = data.advanced;
            } else {
                currentConfig[section] = data;
            }
            
            await fs.writeFile(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
            
            // 스케줄 변경 시 스케줄러 업데이트
            if (section === 'schedule') {
                setupScheduler(currentConfig);
            }
            
            return { success: true };
        } catch (error) {
            console.error('설정 저장 오류:', error);
            return { success: false, error: error.message };
        }
    });

    // 자동화 시작
    ipcMain.handle('start-automation', async (event, config) => {
        try {
            if (automationProcess) {
                return { success: false, error: '이미 실행 중입니다.' };
            }

            // 필수 설정 확인
            if (!config.tistory.id || !config.tistory.password || !config.tistory.blogAddress) {
                return { success: false, error: '티스토리 계정 정보를 입력해주세요.' };
            }

            if (!config.rss.url) {
                return { success: false, error: 'RSS 피드 URL을 입력해주세요.' };
            }

            // 설정 저장
            await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));

            // 자동화 스크립트 실행
            await startAutomationProcess(config);
            
            // 스케줄러 설정
            if (config.schedule.enabled) {
                setupScheduler(config);
            }

            return { success: true };
        } catch (error) {
            console.error('자동화 시작 오류:', error);
            return { success: false, error: error.message };
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

            return { success: true };
        } catch (error) {
            console.error('자동화 중지 오류:', error);
            return { success: false, error: error.message };
        }
    });

    // 테스트 실행
    ipcMain.handle('test-automation', async (event, config) => {
        try {
            // RSS 피드 테스트
            const rssResult = await testRSSFeed(config.rss.url);
            if (!rssResult.success) {
                return { success: false, error: `RSS 피드 오류: ${rssResult.error}` };
            }

            // AI API 테스트 (활성화된 경우)
            if (config.ai.enabled && config.ai.apiKey) {
                const aiResult = await testOpenAI(config.ai.apiKey);
                if (!aiResult.success) {
                    return { success: false, error: `AI API 오류: ${aiResult.error}` };
                }
            }

            return { 
                success: true, 
                message: `RSS: ${rssResult.articleCount}개 기사, AI: ${config.ai.enabled ? '연결됨' : '비활성화'}` 
            };
        } catch (error) {
            console.error('테스트 오류:', error);
            return { success: false, error: error.message };
        }
    });

    // RSS 피드 테스트
    ipcMain.handle('test-rss-feed', async (event, url) => {
        return await testRSSFeed(url);
    });

    // AI 연결 테스트
    ipcMain.handle('test-ai-connection', async (event, apiKey) => {
        return await testOpenAI(apiKey);
    });

    // 로그 관련
    ipcMain.handle('clear-logs', async () => {
        try {
            await fs.writeFile(LOG_FILE, '');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('export-logs', async () => {
        try {
            const { dialog } = require('electron');
            const result = await dialog.showSaveDialog(mainWindow, {
                defaultPath: `tistory-automation-logs-${new Date().toISOString().split('T')[0]}.txt`,
                filters: [
                    { name: '텍스트 파일', extensions: ['txt'] },
                    { name: '모든 파일', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                const logData = await fs.readFile(LOG_FILE, 'utf8').catch(() => '로그 없음');
                await fs.writeFile(result.filePath, logData);
                return { success: true, filePath: result.filePath };
            } else {
                return { success: false, error: '저장이 취소되었습니다.' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-log-file', async () => {
        try {
            await shell.openPath(LOG_FILE);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

/**
 * 자동화 프로세스 시작
 */
async function startAutomationProcess(config) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'auto-poster-with-config.js');
        
        // 환경 변수 설정
        const env = {
            ...process.env,
            TISTORY_ID: config.tistory.id,
            TISTORY_PW: config.tistory.password,
            BLOG_ADDRESS: config.tistory.blogAddress,
            RSS_FEED_URL: config.rss.url,
            OPENAI_API_KEY: config.ai.apiKey || '',
            DEBUG_MODE: config.advanced.debug ? 'true' : 'false',
            HEADLESS_MODE: config.advanced.headless ? 'true' : 'false',
            HTML_ENABLED: config.html.enabled ? 'true' : 'false',
            AI_ENABLED: config.ai.enabled ? 'true' : 'false'
        };

        // Node.js 실행 파일 경로 명시적으로 지정
        const nodePath = process.execPath; // 현재 실행 중인 Node.js 경로 사용
        
        automationProcess = spawn(nodePath, [scriptPath], {
            env,
            stdio: ['pipe', 'pipe', 'pipe']
        });

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
            
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('automation-status', { running: false });
            }
        });

        automationProcess.on('error', (error) => {
            console.error('프로세스 시작 오류:', error);
            automationProcess = null;
            reject(error);
        });

        // 성공적으로 시작됨
        setTimeout(() => {
            if (automationProcess && !automationProcess.killed) {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('automation-status', { running: true });
                }
                resolve();
            }
        }, 1000);
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