# 맥OS Electron 앱 권한 문제 해결 가이드

## 🚨 문제 상황
맥에서 "티스토리 자동화 관리자" 앱을 실행할 때 다음과 같은 오류가 발생하는 경우:
- "확인되지 않은 개발자가 개발했기 때문에 열 수 없습니다"
- "앱이 손상되었을 수 있습니다"
- 반복적인 권한 요청 또는 알 수 없는 오류

## 🛠️ 해결 방법들

### 방법 1: 자동 해결 스크립트 (권장)
```bash
./fix-mac-permissions.sh
```

### 방법 2: 수동 해결 (터미널 사용)
```bash
# 1. Extended Attributes 제거
sudo xattr -cr "dist/mac-arm64/티스토리 자동화 관리자.app"

# 2. 임시 개발자 서명 적용
codesign --force --deep --sign - "dist/mac-arm64/티스토리 자동화 관리자.app"

# 3. 앱 실행
open "dist/mac-arm64/티스토리 자동화 관리자.app"
```

### 방법 3: 시스템 환경설정을 통한 허용
1. 앱을 한 번 실행 시도 (오류가 나더라도 OK)
2. `시스템 환경설정` > `보안 및 개인정보 보호` > `일반` 탭
3. "확인되지 않은 개발자..." 메시지 옆의 `확인 없이 열기` 클릭

### 방법 4: Control + 클릭으로 실행
1. Finder에서 앱 파일에 Control 키를 누른 상태로 클릭
2. 컨텍스트 메뉴에서 `열기` 선택
3. 경고창에서 `열기` 클릭

## 🔧 개발자를 위한 영구 해결책

### 1. 새로 빌드하기
```bash
# 수정된 설정으로 다시 빌드
npm run build:mac
```

### 2. 개발 모드로 실행 (권장)
```bash
# 빌드된 앱 대신 개발 모드로 직접 실행
npm start
```

## 📋 주요 변경사항

### package.json 수정 내용:
- `hardenedRuntime: false` - 엄격한 런타임 비활성화
- `gatekeeperAssess: false` - Gatekeeper 평가 비활성화
- 권한 설명 메시지 추가

### 추가된 entitlements:
- 네트워크 접근 권한
- 파일 시스템 접근 권한  
- 화면 녹화 및 접근성 권한
- Puppeteer 실행을 위한 권한들

## 🚀 빠른 해결책

**가장 빠른 방법:**
```bash
sudo xattr -cr "dist/mac-arm64/티스토리 자동화 관리자.app" && open "dist/mac-arm64/티스토리 자동화 관리자.app"
```

## ⚠️ 보안 주의사항

1. **개발 환경에서만 사용**: 이 해결책들은 개발/테스트 환경용입니다
2. **배포시에는 적절한 서명 필요**: 실제 배포시에는 애플 개발자 계정으로 서명해야 합니다
3. **Gatekeeper 비활성화 지양**: `sudo spctl --master-disable`는 보안상 권장하지 않습니다

## 📞 여전히 문제가 있다면

1. 앱을 완전히 삭제 후 다시 빌드
2. 맥 시스템 재시작
3. 개발 모드로 실행: `npm start`
4. 터미널에서 직접 스크립트 실행: `node auto-poster-with-config.js`

## 🔍 문제 진단

권한 상태 확인:
```bash
spctl --assess --verbose "dist/mac-arm64/티스토리 자동화 관리자.app"
```

서명 상태 확인:
```bash
codesign -dv "dist/mac-arm64/티스토리 자동화 관리자.app"
``` 