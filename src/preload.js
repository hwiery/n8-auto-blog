const { contextBridge, ipcRenderer } = require('electron');

// 안전한 IPC 통신을 위한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 설정 관련
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (section, data) => ipcRenderer.invoke('save-config', section, data),
    
    // 자동화 제어
    startAutomation: (config) => ipcRenderer.invoke('start-automation', config),
    stopAutomation: () => ipcRenderer.invoke('stop-automation'),
    testAutomation: (config) => ipcRenderer.invoke('test-automation', config),
    
    // 테스트 기능
    testRSSFeed: (url) => ipcRenderer.invoke('test-rss-feed', url),
    testAIConnection: (apiKey) => ipcRenderer.invoke('test-ai-connection', apiKey),
    
    // 로그 관리
    clearLogs: () => ipcRenderer.invoke('clear-logs'),
    exportLogs: () => ipcRenderer.invoke('export-logs'),
    openLogFile: () => ipcRenderer.invoke('open-log-file'),
    
    // 이벤트 리스너
    onLogMessage: (callback) => {
        ipcRenderer.on('log-message', (event, message) => callback(message));
    },
    
    onAutomationStatus: (callback) => {
        ipcRenderer.on('automation-status', (event, status) => callback(status));
    },
    
    // 리스너 제거
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
}); 