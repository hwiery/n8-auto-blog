#!/bin/bash

# 티스토리 자동화 앱 최종 실행 해결 스크립트

APP_PATH="dist/mac-arm64/티스토리 자동화 관리자.app"

echo "🔧 티스토리 자동화 앱 최종 해결 중..."

# 방법 1: quarantine 속성 완전 제거
echo "1️⃣ Quarantine 속성 제거 중..."
sudo xattr -rd com.apple.quarantine "$APP_PATH"
sudo xattr -rd com.apple.metadata:kMDItemWhereFroms "$APP_PATH"
sudo xattr -cr "$APP_PATH"

# 방법 2: 모든 하위 디렉토리까지 권한 수정
echo "2️⃣ 권한 수정 중..."
sudo find "$APP_PATH" -type f -exec chmod +x {} \;
sudo chmod -R 755 "$APP_PATH"

# 방법 3: 새로운 서명 적용
echo "3️⃣ 새 서명 적용 중..."
sudo codesign --force --deep --sign - "$APP_PATH"

# 방법 4: 직접 실행 테스트
echo "4️⃣ 직접 실행 테스트..."
echo "🚀 앱을 실행합니다..."

# 백그라운드로 실행
open "$APP_PATH" &

# 3초 후 실행 상태 확인
sleep 3

if pgrep -f "티스토리 자동화 관리자" > /dev/null; then
    echo "✅ 성공! 앱이 실행되었습니다!"
    echo "실행 중인 프로세스:"
    ps aux | grep -i "티스토리" | grep -v grep
else
    echo "❌ 앱이 실행되지 않았습니다."
    echo ""
    echo "🔄 개발 모드로 실행을 시도합니다..."
    echo "개발 모드 실행: npm start"
fi

echo ""
echo "📚 추가 해결 방법:"
echo "1. '시스템 환경설정' → '보안 및 개인정보 보호' → '일반' 탭에서 앱 허용"
echo "2. 터미널에서 'npm start'로 개발 모드 실행"
echo "3. Finder에서 앱에 Control+클릭 후 '열기' 선택" 