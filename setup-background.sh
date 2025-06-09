#!/bin/bash

# macOS 백그라운드 실행 설정 스크립트

echo "🚀 티스토리 자동화 백그라운드 실행 설정"
echo ""

# 현재 디렉토리 확인
CURRENT_DIR=$(pwd)
echo "📁 현재 디렉토리: $CURRENT_DIR"

# launchd plist 파일 생성
PLIST_FILE="$HOME/Library/LaunchAgents/com.tistory.automation.plist"

echo "📝 LaunchAgent 설정 파일 생성 중..."

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tistory.automation</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$CURRENT_DIR/scheduler.js</string>
        <string>every_30min</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$CURRENT_DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$CURRENT_DIR/automation.log</string>
    
    <key>StandardErrorPath</key>
    <string>$CURRENT_DIR/automation.error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ LaunchAgent 설정 파일 생성 완료: $PLIST_FILE"

# 권한 설정
chmod 644 "$PLIST_FILE"

echo ""
echo "🔧 사용 가능한 명령어:"
echo ""
echo "1. 백그라운드 서비스 시작:"
echo "   launchctl load $PLIST_FILE"
echo ""
echo "2. 백그라운드 서비스 중지:"
echo "   launchctl unload $PLIST_FILE"
echo ""
echo "3. 서비스 상태 확인:"
echo "   launchctl list | grep com.tistory.automation"
echo ""
echo "4. 로그 확인:"
echo "   tail -f $CURRENT_DIR/automation.log"
echo ""
echo "5. 에러 로그 확인:"
echo "   tail -f $CURRENT_DIR/automation.error.log"
echo ""

# 스케줄 옵션 안내
echo "📋 스케줄 옵션 변경 방법:"
echo ""
echo "plist 파일에서 다음 부분을 수정하세요:"
echo "<string>every_30min</string>"
echo ""
echo "사용 가능한 옵션:"
echo "- hourly: 매시간 정각"
echo "- daily_9am: 매일 오전 9시"
echo "- every_30min: 30분마다"
echo "- three_times_daily: 하루 3번 (9시, 13시, 18시)"
echo "- weekdays_9am: 평일 오전 9시만"
echo ""

echo "⚠️ 주의사항:"
echo "- .env 파일이 올바르게 설정되어 있는지 확인하세요"
echo "- Node.js 경로가 /usr/local/bin/node가 아닐 수 있습니다"
echo "- Node.js 경로 확인: which node"
echo ""

# Node.js 경로 확인
NODE_PATH=$(which node)
echo "🔍 현재 Node.js 경로: $NODE_PATH"

if [ "$NODE_PATH" != "/usr/local/bin/node" ]; then
    echo "⚠️ Node.js 경로가 다릅니다. plist 파일을 수정해야 할 수 있습니다."
    echo "   수정할 경로: $NODE_PATH"
fi

echo ""
echo "✅ 설정 완료!"
echo ""
echo "💡 빠른 시작:"
echo "1. launchctl load $PLIST_FILE"
echo "2. tail -f $CURRENT_DIR/automation.log" 