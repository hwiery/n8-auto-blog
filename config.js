/**
 * 티스토리 자동화 시스템 통합 설정 파일
 * 
 * 이 파일에서 모든 주요 기능을 On/Off 할 수 있습니다.
 */

module.exports = {
  // ========================================
  // 1. 포스팅 스케줄 설정
  // ========================================
  schedule: {
    // 스케줄 활성화 여부
    enabled: true,
    
    // 스케줄 타입 선택
    // 'manual' - 수동 실행만
    // 'hourly' - 매시간 정각
    // 'daily_9am' - 매일 오전 9시
    // 'every_30min' - 30분마다
    // 'three_times_daily' - 하루 3번 (9시, 13시, 18시)
    // 'weekdays_9am' - 평일 오전 9시만
    // 'custom' - 사용자 정의 cron 표현식
    type: 'manual',
    
    // custom 타입일 때 사용할 cron 표현식
    // 예: '0 9,13,18 * * *' (매일 9시, 13시, 18시)
    customCron: '0 9,13,18 * * *',
    
    // 한 번에 처리할 최대 기사 수
    maxArticlesPerRun: 3,
    
    // 포스팅 간격 (밀리초, 기본 30초)
    intervalBetweenPosts: 30000,
    
    // Add allowRepost option to enable posting existing articles when 새기사 없음
    allowRepost: false
  },

  // ========================================
  // 2. HTML 모드 설정
  // ========================================
  htmlMode: {
    // HTML 모드 사용 여부
    enabled: true,
    
    // HTML 템플릿 타입
    // 'rich' - 풍부한 스타일링 (기본)
    // 'simple' - 간단한 스타일링
    // 'minimal' - 최소한의 스타일링
    // 'plain' - HTML 없이 일반 텍스트만
    template: 'rich',
    
    // 강제 HTML 모드 전환 시도 여부
    forceHtmlMode: true,
    
    // HTML 입력 검증 여부
    validateInput: true,
    
    // HTML 입력 실패 시 재시도 횟수
    retryCount: 2
  },

  // ========================================
  // 3. OpenAI API 설정
  // ========================================
  openai: {
    // OpenAI API 사용 여부
    enabled: false,
    
    // API 키 (환경변수에서 가져옴)
    apiKey: process.env.OPENAI_API_KEY,
    
    // 사용할 모델
    model: 'gpt-3.5-turbo',
    
    // 기능별 설정
    features: {
      // 제목 개선
      improveTitle: true,
      
      // 내용 요약 및 개선
      improveContent: true,
      
      // 태그 자동 생성
      generateTags: true,
      
      // 카테고리 자동 분류
      categorizePost: true
    },
    
    // API 호출 설정
    settings: {
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000 // 30초
    }
  },

  // ========================================
  // 4. 콘텐츠 설정
  // ========================================
  content: {
    // 제목에서 언론사명 제거 여부
    removeMediaNames: true,
    
    // 최소 콘텐츠 길이 (문자 수)
    minContentLength: 50,
    
    // 최대 콘텐츠 길이 (문자 수)
    maxContentLength: 2000,
    
    // 기본 카테고리
    defaultCategory: '뉴스',
    
    // 기본 태그
    defaultTags: ['구글뉴스', '자동포스팅', '뉴스']
  },

  // ========================================
  // 5. RSS 피드 설정
  // ========================================
  rss: {
    // RSS 피드 URL (환경변수가 우선됨)
    url: process.env.RSS_FEED_URL || 'https://uxplanet.org/feed',
    
    // RSS 파싱 설정
    timeout: 10000, // 10초
    maxRetries: 3,
    
    // 피드 캐시 설정
    enableCache: true,
    cacheTime: 300000 // 5분
  },

  // ========================================
  // 6. 디버깅 및 로깅 설정
  // ========================================
  debug: {
    // 디버그 모드 활성화
    enabled: false,
    
    // 스크린샷 저장 여부
    saveScreenshots: false,
    
    // 상세 로그 출력 여부
    verboseLogging: true,
    
    // 브라우저 헤드리스 모드 (false = 브라우저 창 보임)
    headless: true
  }
}; 