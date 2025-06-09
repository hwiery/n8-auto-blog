#!/bin/bash

# 디버그 모드로 앱 실행 스크립트

APP_PATH="dist/mac-arm64/티스토리 자동화 관리자.app"
EXEC_PATH="$APP_PATH/Contents/MacOS/티스토리 자동화 관리자"

echo "🔍 앱 디버그 정보:"
echo "📂 앱 경로: $APP_PATH"
echo "💻 실행 파일: $EXEC_PATH"
echo ""

# 1. 파일 존재 확인
echo "1️⃣ 파일 존재 확인:"
if [ -f "$EXEC_PATH" ]; then
    echo "✅ 실행 파일 존재함"
else
    echo "❌ 실행 파일 없음"
    exit 1
fi

# 2. 권한 확인
echo "2️⃣ 권한 확인:"
ls -la "$EXEC_PATH"

# 3. 서명 상태 확인
echo "3️⃣ 서명 상태:"
codesign -dv "$APP_PATH" 2>&1

# 4. Gatekeeper 상태 확인
echo "4️⃣ Gatekeeper 상태:"
spctl --assess "$APP_PATH" 2>&1

# 5. 환경 변수 설정하고 실행
echo "5️⃣ 디버그 모드로 실행 시도:"
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_IS_DEV=1

echo "🚀 앱 실행 중... (로그 출력)"
"$EXEC_PATH" --enable-logging --v=1 2>&1 &

# 프로세스 ID 저장
APP_PID=$!
echo "📱 앱 PID: $APP_PID"

# 5초 후 상태 확인
sleep 5

if kill -0 $APP_PID 2>/dev/null; then
    echo "✅ 앱이 실행 중입니다!"
    ps aux | grep $APP_PID | grep -v grep
else
    echo "❌ 앱이 종료되었습니다."
    echo "종료 코드 확인 중..."
    wait $APP_PID
    echo "Exit code: $?"
fi 