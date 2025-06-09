#!/bin/bash

# 맥OS Electron 앱 권한 문제 해결 스크립트
# 티스토리 자동화 관리자 앱 실행을 위한 권한 설정

echo "🔧 맥OS Electron 앱 권한 문제 해결 중..."

# 앱 경로 설정
APP_PATH="dist/mac-arm64/티스토리 자동화 관리자.app"
APP_PATH_INTEL="dist/mac/티스토리 자동화 관리자.app"

# ARM64 맥용 앱이 있는지 확인
if [ -d "$APP_PATH" ]; then
    CURRENT_APP="$APP_PATH"
    echo "📱 ARM64 맥용 앱을 찾았습니다: $APP_PATH"
elif [ -d "$APP_PATH_INTEL" ]; then
    CURRENT_APP="$APP_PATH_INTEL"
    echo "💻 Intel 맥용 앱을 찾았습니다: $APP_PATH_INTEL"
else
    echo "❌ 빌드된 앱을 찾을 수 없습니다. 먼저 'npm run build:mac'을 실행해주세요."
    exit 1
fi

echo ""
echo "🛠️  권한 문제 해결 방법들:"
echo ""

# 방법 1: Gatekeeper 우회
echo "📋 방법 1: Gatekeeper 우회 (가장 간단)"
echo "   터미널에서 다음 명령어를 실행하세요:"
echo "   sudo xattr -cr '$CURRENT_APP'"
echo ""

# 방법 2: 시스템 환경설정을 통한 허용
echo "📋 방법 2: 시스템 환경설정을 통한 허용"
echo "   1. 앱을 한 번 실행해보세요 (오류가 나더라도 괜찮습니다)"
echo "   2. '시스템 환경설정' > '보안 및 개인 정보 보호' > '일반' 탭으로 이동"
echo "   3. '확인되지 않은 개발자...' 메시지 옆의 '확인 없이 열기' 버튼 클릭"
echo ""

# 방법 3: 개발자 도구를 통한 임시 서명
echo "📋 방법 3: 임시 개발자 서명 (개발용)"
echo "   터미널에서 다음 명령어를 실행하세요:"
echo "   codesign --force --deep --sign - '$CURRENT_APP'"
echo ""

# 방법 4: spctl 비활성화 (권장하지 않음)
echo "📋 방법 4: Gatekeeper 완전 비활성화 (권장하지 않음)"
echo "   sudo spctl --master-disable"
echo "   (보안상 권장하지 않습니다)"
echo ""

# 자동 실행 옵션 제공
echo "🚀 자동으로 해결하시겠습니까? (방법 1 + 방법 3 적용)"
read -p "y/n: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 권한 문제 자동 해결 중..."
    
    # Extended attributes 제거
    echo "📝 Extended attributes 제거 중..."
    sudo xattr -cr "$CURRENT_APP"
    
    # 임시 서명 적용
    echo "✍️  임시 개발자 서명 적용 중..."
    codesign --force --deep --sign - "$CURRENT_APP"
    
    echo ""
    echo "✅ 권한 문제가 해결되었습니다!"
    echo "이제 앱을 실행해보세요:"
    echo "   open '$CURRENT_APP'"
    echo ""
    
    # 앱 실행 여부 확인
    read -p "지금 앱을 실행하시겠습니까? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 앱을 실행합니다..."
        open "$CURRENT_APP"
    fi
else
    echo "수동으로 위의 방법들 중 하나를 선택해서 실행해주세요."
fi

echo ""
echo "📚 추가 도움말:"
echo "   - 여전히 문제가 있다면 'npm run build:mac'으로 다시 빌드해보세요"
echo "   - Puppeteer 사용으로 인해 보안 권한이 필요할 수 있습니다"
echo "   - 개발 환경에서는 'npm start'로 직접 실행하는 것을 권장합니다" 