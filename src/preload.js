/**
 * Preload 스크립트
 * 렌더러 프로세스와 메인 프로세스 간의 안전한 통신 제공
 */

const { contextBridge, ipcRenderer } = require('electron');

// Electron API를 안전하게 렌더러에 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 설정 관련
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (section, data) => ipcRenderer.invoke('save-config', section, data),
    
    // 자동화 관련
    startAutomation: (config) => ipcRenderer.invoke('start-automation', config),
    stopAutomation: () => ipcRenderer.invoke('stop-automation'),
    testAutomation: (config) => ipcRenderer.invoke('test-automation', config),
    
    // RSS 테스트
    testRSSFeed: (url) => ipcRenderer.invoke('test-rss-feed', url),
    
    // AI 테스트
    testOpenAI: (apiKey) => ipcRenderer.invoke('test-openai', apiKey),
    
    // 로그 관련
    readLogFile: () => ipcRenderer.invoke('read-log-file'),
    clearLogFile: () => ipcRenderer.invoke('clear-log-file'),
    openLogFile: () => ipcRenderer.invoke('open-log-file'),
    exportLogFile: () => ipcRenderer.invoke('export-log-file'),
    
    // 윈도우 컨트롤
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    
    // 이벤트 리스너
    onLogUpdate: (callback) => ipcRenderer.on('log-update', callback),
    onAutomationStatus: (callback) => ipcRenderer.on('automation-status', callback),
    removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
}); 