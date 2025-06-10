// 티스토리 자동화 GUI 메인 스크립트
let currentConfig = {};
let isAutomationRunning = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadCurrentConfig();
    setupEventListeners();
    setupTabNavigation();
    setupTitleBarControls();
    updateCurrentSettings();
});

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log('티스토리 자동화 GUI가 시작되었습니다.');
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 탭 네비게이션 설정
    setupTabNavigation();
    
    // 타이틀 바 컨트롤 설정
    setupTitleBarControls();
    
    // 현재 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    const scheduledDateInput = document.getElementById('scheduled-date');
    if (scheduledDateInput) {
        scheduledDateInput.value = today;
    }
    
    // 기본 RSS URL 설정
    const rssUrlInput = document.getElementById('rss-url');
    if (rssUrlInput) {
        rssUrlInput.value = 'https://news.google.com/rss?topic=h&gl=KR&ceid=KR:ko';
    }
    
    // 설정 로드 후 요약 업데이트
    loadCurrentConfig().then(() => {
        updateCurrentSettings();
        updateLogViewer(); // 로그 뷰어 초기화
    });
    
    // HTML 모드 기본값 설정
    updateHTMLOptionsVisibility();
    updateAIOptionsVisibility();
    updateScheduleOptionsVisibility();
    updateRSSSourceOptions();
    
    // 정기적으로 로그 업데이트 (10초마다)
    setInterval(updateLogViewer, 10000);
    
    // Electron API 확인
    if (!window.electronAPI) {
        console.warn('Electron API가 사용 불가능합니다. 일부 기능이 제한될 수 있습니다.');
        showMessage('Electron API에 연결할 수 없습니다. 일부 기능이 제한될 수 있습니다.', 'warning');
    }
}

/**
 * 타이틀 바 컨트롤 설정
 */
function setupTitleBarControls() {
    const minimizeBtn = document.getElementById('minimize-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const closeBtn = document.getElementById('close-btn');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.minimize();
            }
        });
    }
    
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.maximize();
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.close();
            }
        });
    }
}

/**
 * 현재 설정 로드
 */
async function loadCurrentConfig() {
    try {
        const config = await window.electronAPI?.loadConfig() || {};
        currentConfig = config;
        populateFormFromConfig(currentConfig);
        // 설정 로드 후 요약 업데이트
        updateCurrentSettings();
    } catch (error) {
        console.error('설정 로드 중 오류:', error);
        showMessage('설정을 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 설정을 폼에 반영
 */
function populateFormFromConfig(config) {
    // 티스토리 계정 정보
    if (config.tistory) {
        setInputValue('tistory-id', config.tistory.id);
        setInputValue('tistory-pw', config.tistory.password);
        setInputValue('blog-address', config.tistory.blogAddress);
    }
    
    // RSS 설정
    if (config.rss) {
        setInputValue('rss-url', config.rss.url);
        setSelectValue('rss-source-type', config.rss.sourceType);
        setSelectValue('news-category', config.rss.category);
        setInputValue('keyword-filter', config.rss.keywordFilter);
        setInputValue('exclude-keywords', config.rss.excludeKeywords);
        setCheckboxValue('remove-media-names', config.rss.removeMediaNames);
        setInputValue('min-content-length', config.rss.minContentLength);
    }
    
    // 스케줄 설정
    if (config.schedule) {
        setSelectValue('execution-mode', config.schedule.mode);
        setSelectValue('auto-schedule-type', config.schedule.type);
        setInputValue('custom-cron', config.schedule.customCron);
        setInputValue('max-articles', config.schedule.maxArticles);
        setInputValue('post-interval', config.schedule.interval);
        setCheckboxValue('enable-scheduler', config.schedule.enabled);
        setCheckboxValue('allow-repost', config.schedule.allowRepost);
        
        if (config.schedule.scheduledDate) {
            setInputValue('scheduled-date', config.schedule.scheduledDate);
        }
        if (config.schedule.scheduledTime) {
            setInputValue('scheduled-time', config.schedule.scheduledTime);
        }
        setSelectValue('repeat-type', config.schedule.repeatType);
    }
    
    // HTML 설정
    if (config.html) {
        setCheckboxValue('html-enabled', config.html.enabled);
        setSelectValue('html-template', config.html.template);
        setCheckboxValue('include-images', config.html.includeImages);
        setCheckboxValue('auto-paragraph', config.html.autoParagraph);
        setCheckboxValue('add-source-link', config.html.addSourceLink);
    }
    
    // AI 설정
    if (config.ai) {
        setCheckboxValue('ai-enabled', config.ai.enabled);
        setInputValue('openai-api-key', config.ai.apiKey);
        setSelectValue('ai-model', config.ai.model);
        setCheckboxValue('improve-title', config.ai.improveTitle);
        setCheckboxValue('improve-content', config.ai.improveContent);
        setCheckboxValue('generate-tags', config.ai.generateTags);
        setCheckboxValue('add-summary', config.ai.addSummary);
        setCheckboxValue('translate-content', config.ai.translateContent);
    }
    
    // 고급 설정
    if (config.advanced) {
        setCheckboxValue('debug-mode', config.advanced.debug);
        setCheckboxValue('headless-mode', config.advanced.headless);
        setCheckboxValue('auto-retry', config.advanced.autoRetry);
    }
    
    updateScheduleOptionsVisibility();
    updateHTMLOptionsVisibility();
    updateAIOptionsVisibility();
    updateRSSSourceOptions();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 대시보드 제어 버튼
    document.getElementById('start-btn')?.addEventListener('click', startAutomation);
    document.getElementById('stop-btn')?.addEventListener('click', stopAutomation);
    document.getElementById('test-btn')?.addEventListener('click', testAutomation);
    
    // 설정 저장 버튼
    document.getElementById('save-schedule')?.addEventListener('click', saveScheduleSettings);
    document.getElementById('save-content')?.addEventListener('click', saveContentSettings);
    document.getElementById('save-html')?.addEventListener('click', saveHTMLSettings);
    document.getElementById('save-ai')?.addEventListener('click', saveAISettings);
    document.getElementById('save-environment')?.addEventListener('click', saveEnvironmentSettings);
    
    // 테스트 버튼
    document.getElementById('test-rss')?.addEventListener('click', testRSSFeed);
    document.getElementById('test-ai')?.addEventListener('click', testAIConnection);
    
    // 로그 관리 버튼
    document.getElementById('clear-log')?.addEventListener('click', clearLogs);
    document.getElementById('export-log')?.addEventListener('click', exportLogs);
    document.getElementById('open-log-file')?.addEventListener('click', openLogFile);
    document.getElementById('copy-all-logs')?.addEventListener('click', copyAllLogs);
    
    // 동적 UI 변경 이벤트
    document.getElementById('execution-mode')?.addEventListener('change', updateScheduleOptionsVisibility);
    document.getElementById('auto-schedule-type')?.addEventListener('change', updateCustomCronVisibility);
    document.getElementById('html-enabled')?.addEventListener('change', updateHTMLOptionsVisibility);
    document.getElementById('ai-enabled')?.addEventListener('change', updateAIOptionsVisibility);
    document.getElementById('rss-source-type')?.addEventListener('change', updateRSSSourceOptions);
    document.getElementById('news-category')?.addEventListener('change', updateRSSSourceOptions);
    document.getElementById('html-template')?.addEventListener('change', updateTemplatePreview);
    
    // 모달 닫기
    document.querySelector('.close')?.addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('message-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

/**
 * 탭 네비게이션 설정
 */
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 모든 탭 비활성화
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 선택된 탭 활성화
            this.classList.add('active');
            const targetTab = this.getAttribute('data-tab');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

/**
 * 스케줄 옵션 표시/숨김
 */
function updateScheduleOptionsVisibility() {
    const executionMode = document.getElementById('execution-mode')?.value;
    const autoOptions = document.getElementById('auto-schedule-options');
    const scheduledOptions = document.getElementById('scheduled-options');
    
    // 모든 옵션 숨기기
    if (autoOptions) autoOptions.style.display = 'none';
    if (scheduledOptions) scheduledOptions.style.display = 'none';
    
    // 선택된 모드에 따라 표시
    if (executionMode === 'auto' && autoOptions) {
        autoOptions.style.display = 'block';
        updateCustomCronVisibility();
    } else if (executionMode === 'scheduled' && scheduledOptions) {
        scheduledOptions.style.display = 'block';
    }
}

/**
 * 커스텀 Cron 입력 필드 표시/숨김
 */
function updateCustomCronVisibility() {
    const scheduleType = document.getElementById('auto-schedule-type')?.value;
    const customCronGroup = document.getElementById('custom-cron-group');
    
    if (customCronGroup) {
        customCronGroup.style.display = scheduleType === 'custom' ? 'block' : 'none';
    }
}

/**
 * HTML 옵션 표시/숨김
 */
function updateHTMLOptionsVisibility() {
    const htmlEnabled = document.getElementById('html-enabled')?.checked;
    const htmlOptions = document.getElementById('html-options');
    
    if (htmlOptions) {
        htmlOptions.style.display = htmlEnabled ? 'block' : 'none';
    }
    
    if (htmlEnabled) {
        updateTemplatePreview();
    }
}

/**
 * AI 옵션 표시/숨김
 */
function updateAIOptionsVisibility() {
    const aiEnabled = document.getElementById('ai-enabled')?.checked;
    const aiOptions = document.getElementById('ai-options');
    const aiFeatures = document.getElementById('ai-features');
    
    if (aiOptions) {
        aiOptions.style.display = aiEnabled ? 'block' : 'none';
    }
    if (aiFeatures) {
        aiFeatures.style.display = aiEnabled ? 'block' : 'none';
    }
}

/**
 * RSS 소스 옵션 업데이트
 */
function updateRSSSourceOptions() {
    const sourceType = document.getElementById('rss-source-type')?.value;
    const categoryGroup = document.getElementById('google-news-category');
    const rssUrlInput = document.getElementById('rss-url');
    
    if (categoryGroup) {
        categoryGroup.style.display = sourceType === 'google-news-custom' ? 'block' : 'none';
    }
    
    // RSS URL 자동 설정
    if (rssUrlInput && sourceType) {
        switch (sourceType) {
            case 'google-news':
                rssUrlInput.value = 'https://news.google.com/rss?topic=h&gl=KR&ceid=KR:ko';
                break;
            case 'google-news-custom':
                const category = document.getElementById('news-category')?.value || 'h';
                rssUrlInput.value = `https://news.google.com/rss?topic=${category}&gl=KR&ceid=KR:ko`;
                break;
        }
    }
}

/**
 * 템플릿 미리보기 업데이트
 */
function updateTemplatePreview() {
    const templateSelect = document.getElementById('html-template');
    const previewDiv = document.getElementById('template-preview');
    
    if (!templateSelect || !previewDiv) return;
    
    const template = templateSelect.value;
    const sampleContent = '이것은 샘플 기사 내용입니다. HTML 템플릿이 어떻게 적용되는지 확인할 수 있습니다.';
    
    let previewHTML = '';
    
    switch (template) {
        case 'rich':
            previewHTML = `
                <div style="max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">샘플 기사 제목</h2>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong>📄 요약:</strong> ${sampleContent}
                    </div>
                    <p style="font-size: 16px; margin: 20px 0;">${sampleContent}</p>
                    <blockquote style="border-left: 4px solid #3498db; padding-left: 20px; margin: 20px 0; font-style: italic;">
                        "중요한 인용문이나 강조하고 싶은 내용"
                    </blockquote>
                </div>
            `;
            break;
        case 'simple':
            previewHTML = `
                <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                    <h2 style="color: #333; border-bottom: 1px solid #ddd;">샘플 기사 제목</h2>
                    <p><strong>요약:</strong> ${sampleContent}</p>
                    <p>${sampleContent}</p>
                </div>
            `;
            break;
        case 'minimal':
            previewHTML = `
                <div>
                    <h2>샘플 기사 제목</h2>
                    <p><strong>요약:</strong> ${sampleContent}</p>
                    <p>${sampleContent}</p>
                </div>
            `;
            break;
        default:
            previewHTML = '<p>템플릿을 선택해주세요.</p>';
    }
    
    previewDiv.innerHTML = previewHTML;
}

/**
 * 현재 설정 요약 업데이트 (실제 저장된 설정 기반)
 */
function updateCurrentSettings() {
    // currentConfig가 없으면 DOM에서 읽기
    const config = currentConfig || {};
    
    // 스케줄 설정
    const scheduleMode = config.schedule?.mode || document.getElementById('execution-mode')?.value || 'manual';
    const scheduleEnabled = config.schedule?.enabled || document.getElementById('enable-scheduler')?.checked || false;
    
    // 실행 날짜 설정 표시
    let dateSettingText = '수동 실행';
    if (scheduleEnabled && scheduleMode === 'auto') {
        const autoType = config.schedule?.type || document.getElementById('auto-schedule-type')?.value;
        dateSettingText = getScheduleTypeText(autoType);
    } else if (scheduleEnabled && scheduleMode === 'scheduled') {
        const date = config.schedule?.scheduledDate || document.getElementById('scheduled-date')?.value;
        const time = config.schedule?.scheduledTime || document.getElementById('scheduled-time')?.value;
        if (date && time) {
            const repeatType = config.schedule?.repeatType || document.getElementById('repeat-type')?.value;
            const repeatText = getRepeatTypeText(repeatType);
            dateSettingText = `${date} ${time} (${repeatText})`;
        }
    }
    
    // RSS 소스 설정
    const rssSourceType = config.rss?.sourceType || document.getElementById('rss-source-type')?.value || 'custom';
    const rssUrl = config.rss?.url || document.getElementById('rss-url')?.value || '';
    
    // HTML 모드 설정
    const htmlEnabled = config.html?.enabled !== undefined 
        ? config.html.enabled 
        : (document.getElementById('html-enabled')?.checked || false);
    const htmlTemplate = config.html?.template || document.getElementById('html-template')?.value || 'rich';
    
    // AI 기능 설정
    const aiEnabled = config.ai?.enabled !== undefined 
        ? config.ai.enabled 
        : (document.getElementById('ai-enabled')?.checked || false);
    const aiModel = config.ai?.model || document.getElementById('ai-model')?.value || 'gpt-3.5-turbo';
    
    // DOM 업데이트
    setElementText('current-schedule-mode', getExecutionModeText(scheduleMode));
    setElementText('current-date-setting', dateSettingText);
    setElementText('current-rss-source', getRSSSourceTextFromConfig(rssSourceType, rssUrl));
    setElementText('current-html-mode', htmlEnabled ? `활성화됨 (${getTemplateText(htmlTemplate)})` : '비활성화됨');
    setElementText('current-ai-status', aiEnabled ? `활성화됨 (${aiModel})` : '비활성화됨');
    
    // 추가 정보 업데이트
    if (config.schedule?.maxArticles) {
        setElementText('current-max-articles', `최대 ${config.schedule.maxArticles}개 기사`);
    }
    
    // 마지막 업데이트 시간 표시
    const now = new Date().toLocaleString('ko-KR');
    setElementText('settings-last-updated', `마지막 업데이트: ${now}`);
}

/**
 * 실행 모드 텍스트 반환
 */
function getExecutionModeText(mode) {
    const modeTexts = {
        'manual': '수동 실행',
        'auto': '자동 실행',
        'scheduled': '일시 지정 실행'
    };
    return modeTexts[mode] || '설정되지 않음';
}

/**
 * 스케줄 타입 텍스트 반환
 */
function getScheduleTypeText(type) {
    const typeTexts = {
        'hourly': '매시간 정각',
        'daily_9am': '매일 오전 9시',
        'every_30min': '30분마다',
        'three_times_daily': '하루 3번',
        'weekdays_9am': '평일 오전 9시',
        'custom': '사용자 정의'
    };
    return typeTexts[type] || '설정되지 않음';
}

/**
 * RSS 소스 텍스트 반환
 */
function getRSSSourceText() {
    const sourceType = document.getElementById('rss-source-type')?.value;
    const sourceTexts = {
        'google-news': 'Google News (한국)',
        'google-news-custom': 'Google News (카테고리별)',
        'custom': '사용자 정의 RSS'
    };
    return sourceTexts[sourceType] || 'Google News (한국)';
}

/**
 * 설정 기반 RSS 소스 텍스트 반환
 */
function getRSSSourceTextFromConfig(sourceType, rssUrl) {
    const sourceTexts = {
        'google-news': 'Google News (한국)',
        'google-news-custom': 'Google News (카테고리별)',
        'custom': '사용자 정의 RSS'
    };
    
    let sourceText = sourceTexts[sourceType] || '사용자 정의 RSS';
    
    // URL이 NNGroup인 경우 특별 표시
    if (rssUrl && rssUrl.includes('nngroup.com')) {
        sourceText = 'Nielsen Norman Group (UX 연구)';
    } else if (sourceType === 'custom' && rssUrl) {
        const urlHost = new URL(rssUrl).hostname.replace('www.', '');
        sourceText = `사용자 정의 (${urlHost})`;
    }
    
    return sourceText;
}

/**
 * 반복 타입 텍스트 반환
 */
function getRepeatTypeText(type) {
    const typeTexts = {
        'once': '한 번만',
        'daily': '매일 반복',
        'weekly': '매주 반복',
        'monthly': '매월 반복'
    };
    return typeTexts[type] || '한 번만';
}

/**
 * 템플릿 타입 텍스트 반환
 */
function getTemplateText(template) {
    const templateTexts = {
        'rich': '풍부한 스타일',
        'simple': '간단한 스타일',
        'minimal': '최소한 스타일',
        'plain': '플레인 텍스트'
    };
    return templateTexts[template] || '풍부한 스타일';
}

/**
 * 자동화 시작
 */
async function startAutomation() {
    if (isAutomationRunning) {
        showMessage('이미 자동화가 실행 중입니다.', 'warning');
        return;
    }
    
    try {
        showLoadingSpinner(true);
        
        const config = collectCurrentConfig();
        const result = await window.electronAPI?.startAutomation(config) || { success: false, error: 'Electron API 사용 불가' };
        
        if (result.success) {
            isAutomationRunning = true;
            updateAutomationStatus('running');
            showMessage('자동화가 시작되었습니다.', 'success');
            logMessage('✅ 자동화 시작됨');
        } else {
            showMessage(`자동화 시작 실패: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('자동화 시작 오류:', error);
        showMessage('자동화 시작 중 오류가 발생했습니다.', 'error');
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * 자동화 중지
 */
async function stopAutomation() {
    if (!isAutomationRunning) {
        showMessage('실행 중인 자동화가 없습니다.', 'warning');
        return;
    }
    
    try {
        showLoadingSpinner(true);
        
        const result = await window.electronAPI?.stopAutomation() || { success: false, error: 'Electron API 사용 불가' };
        
        if (result.success) {
            isAutomationRunning = false;
            updateAutomationStatus('stopped');
            showMessage('자동화가 중지되었습니다.', 'success');
            logMessage('⏹️ 자동화 중지됨');
        } else {
            showMessage(`자동화 중지 실패: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('자동화 중지 오류:', error);
        showMessage('자동화 중지 중 오류가 발생했습니다.', 'error');
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * 자동화 테스트
 */
async function testAutomation() {
    const btn = document.getElementById('test-btn');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 테스트 중...';
        
        const config = collectCurrentConfig();
        
        // 필수 설정 확인
        if (!config.tistory || !config.tistory.id || !config.tistory.password || !config.tistory.blogAddress) {
            showMessage('티스토리 계정 정보를 먼저 설정해주세요.', 'warning');
            return;
        }
        
        if (!config.rss || !config.rss.url) {
            showMessage('RSS 피드 URL을 먼저 설정해주세요.', 'warning');
            return;
        }
        
        await appendToLogFile('자동화 테스트를 시작합니다...');
        
        const result = await window.electronAPI.testAutomation(config);
        
        if (result.success) {
            showMessage('테스트가 성공적으로 완료되었습니다!', 'success');
        } else {
            showMessage(`테스트 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('테스트 오류:', error);
        showMessage('테스트 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * RSS 피드 테스트
 */
async function testRSSFeed() {
    const btn = document.getElementById('test-rss');
    const originalText = btn.innerHTML;
    const rssUrl = document.getElementById('rss-url').value;
    
    if (!rssUrl) {
        showMessage('RSS URL을 입력해주세요.', 'warning');
        return;
    }
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 테스트 중...';
        
        const result = await window.electronAPI.testRSSFeed(rssUrl);
        
        if (result.success) {
            showMessage(`RSS 피드 테스트 성공! ${result.articleCount || 0}개의 기사를 찾았습니다.`, 'success');
        } else {
            showMessage(`RSS 피드 테스트 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('RSS 테스트 오류:', error);
        showMessage('RSS 피드 테스트 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * AI 연결 테스트
 */
async function testAIConnection() {
    const btn = document.getElementById('test-ai');
    const originalText = btn.innerHTML;
    const apiKey = document.getElementById('openai-api-key').value;
    
    if (!apiKey) {
        showMessage('OpenAI API 키를 입력해주세요.', 'warning');
        return;
    }
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 테스트 중...';
        
        const result = await window.electronAPI.testOpenAI(apiKey);
        
        if (result.success) {
            showMessage('OpenAI API 연결 테스트 성공!', 'success');
        } else {
            showMessage(`OpenAI API 테스트 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('AI 테스트 오류:', error);
        showMessage('AI 연결 테스트 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * 현재 설정 수집
 */
function collectCurrentConfig() {
    return {
        tistory: {
            id: document.getElementById('tistory-id')?.value || '',
            password: document.getElementById('tistory-pw')?.value || '',
            blogAddress: document.getElementById('blog-address')?.value || ''
        },
        rss: {
            url: document.getElementById('rss-url')?.value || '',
            sourceType: document.getElementById('rss-source-type')?.value || 'google-news',
            category: document.getElementById('news-category')?.value || 'h',
            keywordFilter: document.getElementById('keyword-filter')?.value || '',
            excludeKeywords: document.getElementById('exclude-keywords')?.value || '',
            removeMediaNames: document.getElementById('remove-media-names')?.checked || false,
            minContentLength: parseInt(document.getElementById('min-content-length')?.value) || 100
        },
        schedule: {
            mode: document.getElementById('execution-mode')?.value || 'manual',
            type: document.getElementById('auto-schedule-type')?.value || 'daily_9am',
            customCron: document.getElementById('custom-cron')?.value || '',
            scheduledDate: document.getElementById('scheduled-date')?.value || '',
            scheduledTime: document.getElementById('scheduled-time')?.value || '09:00',
            repeatType: document.getElementById('repeat-type')?.value || 'once',
            maxArticles: parseInt(document.getElementById('max-articles')?.value) || 3,
            interval: parseInt(document.getElementById('post-interval')?.value) || 30,
            enabled: document.getElementById('enable-scheduler')?.checked || false,
            allowRepost: document.getElementById('allow-repost')?.checked || false
        },
        html: {
            enabled: document.getElementById('html-enabled')?.checked || false,
            template: document.getElementById('html-template')?.value || 'rich',
            includeImages: document.getElementById('include-images')?.checked || false,
            autoParagraph: document.getElementById('auto-paragraph')?.checked || false,
            addSourceLink: document.getElementById('add-source-link')?.checked || false
        },
        ai: {
            enabled: document.getElementById('ai-enabled')?.checked || false,
            apiKey: document.getElementById('openai-api-key')?.value || '',
            model: document.getElementById('ai-model')?.value || 'gpt-3.5-turbo',
            improveTitle: document.getElementById('improve-title')?.checked || false,
            improveContent: document.getElementById('improve-content')?.checked || false,
            generateTags: document.getElementById('generate-tags')?.checked || false,
            addSummary: document.getElementById('add-summary')?.checked || false,
            translateContent: document.getElementById('translate-content')?.checked || false
        },
        advanced: {
            debug: document.getElementById('debug-mode')?.checked || false,
            headless: document.getElementById('headless-mode')?.checked || true,
            autoRetry: document.getElementById('auto-retry')?.checked || true
        }
    };
}

/**
 * 스케줄 설정 저장
 */
async function saveScheduleSettings() {
    const btn = document.getElementById('save-schedule');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
        
        const scheduleData = {
            mode: document.getElementById('execution-mode')?.value || 'manual',
            type: document.getElementById('auto-schedule-type')?.value || 'daily_9am',
            customCron: document.getElementById('custom-cron')?.value || '',
            scheduledDate: document.getElementById('scheduled-date')?.value || '',
            scheduledTime: document.getElementById('scheduled-time')?.value || '09:00',
            repeatType: document.getElementById('repeat-type')?.value || 'once',
            maxArticles: parseInt(document.getElementById('max-articles')?.value) || 3,
            interval: parseInt(document.getElementById('post-interval')?.value) || 30,
            enabled: document.getElementById('enable-scheduler')?.checked || false,
            allowRepost: document.getElementById('allow-repost')?.checked || false
        };
        
        // 데이터 유효성 검사
        if (scheduleData.maxArticles < 1 || scheduleData.maxArticles > 50) {
            showMessage('최대 기사 수는 1-50 사이여야 합니다.', 'warning');
            return;
        }
        
        if (scheduleData.interval < 5 || scheduleData.interval > 300) {
            showMessage('포스팅 간격은 5-300초 사이여야 합니다.', 'warning');
            return;
        }
        
        if (scheduleData.mode === 'scheduled' && !scheduleData.scheduledDate) {
            showMessage('일시 지정 실행을 선택했다면 실행 날짜를 설정해주세요.', 'warning');
            return;
        }
        
        const result = await window.electronAPI.saveConfig('schedule', scheduleData);
        
        if (result.success) {
            currentConfig.schedule = scheduleData;
            updateCurrentSettings();
            showMessage('스케줄 설정이 저장되었습니다.', 'success');
        } else {
            showMessage(`설정 저장 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('스케줄 설정 저장 오류:', error);
        showMessage('스케줄 설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * 콘텐츠 설정 저장
 */
async function saveContentSettings() {
    const btn = document.getElementById('save-content');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
        
        const contentData = {
            url: document.getElementById('rss-url')?.value || '',
            sourceType: document.getElementById('rss-source-type')?.value || 'google-news',
            category: document.getElementById('news-category')?.value || 'h',
            keywordFilter: document.getElementById('keyword-filter')?.value || '',
            excludeKeywords: document.getElementById('exclude-keywords')?.value || '',
            removeMediaNames: document.getElementById('remove-media-names')?.checked || false,
            minContentLength: parseInt(document.getElementById('min-content-length')?.value) || 100
        };
        
        // 데이터 유효성 검사
        if (!contentData.url) {
            showMessage('RSS 피드 URL을 입력해주세요.', 'warning');
            return;
        }
        
        if (contentData.minContentLength < 50 || contentData.minContentLength > 5000) {
            showMessage('최소 글자 수는 50-5000 사이여야 합니다.', 'warning');
            return;
        }
        
        // URL 형식 검사
        try {
            new URL(contentData.url);
        } catch {
            showMessage('올바른 RSS URL을 입력해주세요.', 'warning');
            return;
        }
        
        const result = await window.electronAPI.saveConfig('rss', contentData);
        
        if (result.success) {
            currentConfig.rss = contentData;
            updateCurrentSettings();
            showMessage('콘텐츠 설정이 저장되었습니다.', 'success');
        } else {
            showMessage(`설정 저장 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('콘텐츠 설정 저장 오류:', error);
        showMessage('콘텐츠 설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * HTML 설정 저장
 */
async function saveHTMLSettings() {
    const btn = document.getElementById('save-html');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
        
        const htmlData = {
            enabled: document.getElementById('html-enabled')?.checked || false,
            template: document.getElementById('html-template')?.value || 'rich',
            includeImages: document.getElementById('include-images')?.checked || false,
            autoParagraph: document.getElementById('auto-paragraph')?.checked || false,
            addSourceLink: document.getElementById('add-source-link')?.checked || false
        };
        
        const result = await window.electronAPI.saveConfig('html', htmlData);
        
        if (result.success) {
            currentConfig.html = htmlData;
            updateCurrentSettings();
            showMessage('HTML 설정이 저장되었습니다.', 'success');
        } else {
            showMessage(`설정 저장 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('HTML 설정 저장 오류:', error);
        showMessage('HTML 설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * AI 설정 저장
 */
async function saveAISettings() {
    const btn = document.getElementById('save-ai');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
        
        const aiData = {
            enabled: document.getElementById('ai-enabled')?.checked || false,
            apiKey: document.getElementById('openai-api-key')?.value || '',
            model: document.getElementById('ai-model')?.value || 'gpt-3.5-turbo',
            improveTitle: document.getElementById('improve-title')?.checked || false,
            improveContent: document.getElementById('improve-content')?.checked || false,
            generateTags: document.getElementById('generate-tags')?.checked || false,
            addSummary: document.getElementById('add-summary')?.checked || false,
            translateContent: document.getElementById('translate-content')?.checked || false
        };
        
        // 데이터 유효성 검사
        if (aiData.enabled && !aiData.apiKey) {
            showMessage('AI 기능을 활성화하려면 OpenAI API 키를 입력해주세요.', 'warning');
            return;
        }
        
        if (aiData.enabled && aiData.apiKey && !aiData.apiKey.startsWith('sk-')) {
            showMessage('올바른 OpenAI API 키를 입력해주세요. (sk-로 시작)', 'warning');
            return;
        }
        
        const result = await window.electronAPI.saveConfig('ai', aiData);
        
        if (result.success) {
            currentConfig.ai = aiData;
            updateCurrentSettings();
            showMessage('AI 설정이 저장되었습니다.', 'success');
        } else {
            showMessage(`설정 저장 실패: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('AI 설정 저장 오류:', error);
        showMessage('AI 설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * 환경설정 저장
 */
async function saveEnvironmentSettings() {
    const btn = document.getElementById('save-environment');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
        
        const tistoryData = {
            id: document.getElementById('tistory-id')?.value || '',
            password: document.getElementById('tistory-pw')?.value || '',
            blogAddress: document.getElementById('blog-address')?.value || ''
        };
        
        const advancedData = {
            debug: document.getElementById('debug-mode')?.checked || false,
            headless: document.getElementById('headless-mode')?.checked || true,
            autoRetry: document.getElementById('auto-retry')?.checked || true
        };
        
        // 데이터 유효성 검사
        if (!tistoryData.id || !tistoryData.password || !tistoryData.blogAddress) {
            showMessage('티스토리 계정 정보를 모두 입력해주세요.', 'warning');
            return;
        }
        
        // 블로그 주소 형식 검사
        if (!tistoryData.blogAddress.includes('.tistory.com')) {
            showMessage('올바른 티스토리 블로그 주소를 입력해주세요. (예: myblog.tistory.com)', 'warning');
            return;
        }
        
        // 두 섹션 동시 저장
        const tistoryResult = await window.electronAPI.saveConfig('tistory', tistoryData);
        const advancedResult = await window.electronAPI.saveConfig('advanced', advancedData);
        
        if (tistoryResult.success && advancedResult.success) {
            currentConfig.tistory = tistoryData;
            currentConfig.advanced = advancedData;
            updateCurrentSettings();
            showMessage('환경설정이 저장되었습니다.', 'success');
        } else {
            const errorMessage = !tistoryResult.success ? tistoryResult.message : advancedResult.message;
            showMessage(`설정 저장 실패: ${errorMessage}`, 'error');
        }
        
    } catch (error) {
        console.error('환경설정 저장 오류:', error);
        showMessage('환경설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * 로그 지우기
 */
async function clearLogs() {
    try {
        const result = await window.electronAPI.clearLogFile();
        
        if (result.success) {
            const logViewer = document.getElementById('log-viewer');
            const realTimeLog = document.getElementById('real-time-log');
            
            if (logViewer) {
                logViewer.textContent = '';
            }
            
            if (realTimeLog) {
                realTimeLog.innerHTML = '';
            }
            
            showMessage('로그가 삭제되었습니다.', 'success');
        } else {
            showMessage(`로그 삭제 실패: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('로그 삭제 오류:', error);
        showMessage('로그 삭제 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 로그 내보내기
 */
async function exportLogs() {
    try {
        const result = await window.electronAPI.exportLogFile();
        
        if (result.success) {
            showMessage('로그가 성공적으로 내보내기되었습니다.', 'success');
        } else {
            showMessage(`로그 내보내기 실패: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('로그 내보내기 오류:', error);
        showMessage('로그 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 로그 파일 열기
 */
async function openLogFile() {
    try {
        const result = await window.electronAPI.openLogFile();
        
        if (!result.success) {
            showMessage(`로그 파일 열기 실패: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('로그 파일 열기 오류:', error);
        showMessage('로그 파일 열기 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 모든 로그 복사
 */
async function copyAllLogs() {
    try {
        const result = await window.electronAPI.readLogFile();
        
        if (result.success && result.data) {
            await navigator.clipboard.writeText(result.data);
            showMessage('로그가 클립보드에 복사되었습니다.', 'success');
        } else {
            showMessage('복사할 로그가 없습니다.', 'warning');
        }
    } catch (error) {
        console.error('로그 복사 오류:', error);
        showMessage('로그 복사 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 자동화 상태 업데이트
 */
function updateAutomationStatus(status) {
    const statusElement = document.getElementById('automation-status');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (statusElement) {
        statusElement.className = `status-${status}`;
        
        switch (status) {
            case 'running':
                statusElement.textContent = '실행 중';
                if (startBtn) startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                break;
            case 'stopped':
                statusElement.textContent = '중지됨';
                if (startBtn) startBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = true;
                break;
            case 'error':
                statusElement.textContent = '오류';
                if (startBtn) startBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = true;
                break;
        }
    }
}

/**
 * 토스트 메시지 표시 (3초 후 자동 사라짐)
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${getIconForType(type)}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        container.removeChild(toast);
    }, 3000);
}

/**
 * 메시지 타입에 따른 아이콘 반환
 */
function getIconForType(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * 모달 닫기
 */
function closeModal() {
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 로딩 스피너 표시/숨김
 */
function showLoadingSpinner(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

/**
 * 로그 메시지 추가
 */
function logMessage(message) {
    const timestamp = new Date().toLocaleString('ko-KR');
    const logEntry = `[${timestamp}] ${message}`;
    
    // 실시간 로그에 추가
    const realTimeLog = document.getElementById('real-time-log');
    if (realTimeLog) {
        const logDiv = document.createElement('div');
        logDiv.className = 'log-entry';
        logDiv.textContent = logEntry;
        realTimeLog.appendChild(logDiv);
        realTimeLog.scrollTop = realTimeLog.scrollHeight;
        
        // 최대 100개 로그만 유지
        const entries = realTimeLog.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }
    
    // 메인 로그 뷰어에도 추가
    const logViewer = document.getElementById('log-viewer');
    if (logViewer) {
        const logDiv = document.createElement('div');
        logDiv.className = 'log-entry';
        logDiv.textContent = logEntry;
        logViewer.appendChild(logDiv);
        logViewer.scrollTop = logViewer.scrollHeight;
        
        // 최대 200개 로그만 유지
        const entries = logViewer.querySelectorAll('.log-entry');
        if (entries.length > 200) {
            entries[0].remove();
        }
    }
}

/**
 * 로그 파일 읽기 및 업데이트
 */
async function updateLogViewer() {
    try {
        const result = await window.electronAPI.readLogFile();
        
        if (result.success) {
            const logViewer = document.getElementById('log-viewer');
            const realTimeLog = document.getElementById('real-time-log');
            
            if (logViewer) {
                logViewer.textContent = result.data || '로그가 없습니다.';
                logViewer.scrollTop = logViewer.scrollHeight;
            }
            
            if (realTimeLog) {
                // 최근 10줄만 표시
                const lines = (result.data || '').split('\n').filter(line => line.trim());
                const recentLines = lines.slice(-10);
                realTimeLog.innerHTML = recentLines.map(line => `<div class="log-entry">${line}</div>`).join('');
                realTimeLog.scrollTop = realTimeLog.scrollHeight;
            }
        }
    } catch (error) {
        console.error('로그 읽기 오류:', error);
    }
}

/**
 * 로그에 메시지 추가
 */
async function appendToLogFile(message) {
    const timestamp = new Date().toLocaleString('ko-KR');
    const logMessage = `[${timestamp}] ${message}\n`;
    
    try {
        // 로그 파일에 추가하는 것은 메인 프로세스에서 처리
        console.log(logMessage);
        
        // UI 업데이트
        const logViewer = document.getElementById('log-viewer');
        const realTimeLog = document.getElementById('real-time-log');
        
        if (logViewer) {
            logViewer.textContent += logMessage;
            logViewer.scrollTop = logViewer.scrollHeight;
        }
        
        if (realTimeLog) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = logMessage.trim();
            realTimeLog.appendChild(logEntry);
            
            // 최대 10개 항목만 유지
            while (realTimeLog.children.length > 10) {
                realTimeLog.removeChild(realTimeLog.firstChild);
            }
            
            realTimeLog.scrollTop = realTimeLog.scrollHeight;
        }
        
    } catch (error) {
        console.error('로그 추가 오류:', error);
    }
}

// 유틸리티 함수들
/**
 * 입력 필드 값 설정
 */
function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}

/**
 * 체크박스 값 설정
 */
function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element && typeof value === 'boolean') {
        element.checked = value;
    }
}

/**
 * 셀렉트 박스 값 설정
 */
function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}

/**
 * 요소 텍스트 설정
 */
function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text || '-';
    }
}

// Electron API 이벤트 리스너
if (typeof window !== 'undefined' && window.electronAPI) {
    // 로그 메시지 수신
    if (window.electronAPI.onLogMessage) {
        window.electronAPI.onLogMessage((message) => {
            logMessage(message);
        });
    }
    
    // 자동화 상태 변경 수신
    if (window.electronAPI.onAutomationStatus) {
        window.electronAPI.onAutomationStatus((status) => {
            isAutomationRunning = status.running;
            updateAutomationStatus(status.running ? 'running' : 'stopped');
        });
    }
} 