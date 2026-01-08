#!/bin/bash

set -euo pipefail

# 공통 라이브러리 로드
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

# 환경 파라미터
ENVIRONMENT=${1:-prod}

# 환경 설정
setup_environment "$ENVIRONMENT"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

CHECKS_PASSED=0
CHECKS_WARNING=0
CHECKS_FAILED=0

log_info "CHECK" "=== 배포 전 검사 시작: $ENVIRONMENT ==="
echo ""

# 1. Docker 설치 확인
log_info "CHECK" "1. Docker 설치 확인"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "   ✓ Docker 설치됨: $DOCKER_VERSION"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "CHECK" "Docker가 설치되지 않았습니다"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 2. Docker Compose 확인
log_info "CHECK" "2. Docker Compose 확인"
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo "   ✓ Docker Compose 설치됨: $COMPOSE_VERSION"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "CHECK" "Docker Compose가 설치되지 않았습니다"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 3. Docker 실행 확인
log_info "CHECK" "3. Docker 데몬 실행 확인"
if docker info &> /dev/null; then
    echo "   ✓ Docker 데몬 실행 중"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "CHECK" "Docker 데몬이 실행되지 않았습니다"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 4. Compose 파일 존재 확인
log_info "CHECK" "4. Docker Compose 파일 확인"
if [ -f "$COMPOSE_FILE" ]; then
    echo "   ✓ Compose 파일 존재: $COMPOSE_FILE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "CHECK" "Compose 파일이 없습니다: $COMPOSE_FILE"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 5. 환경 변수 파일 확인
log_info "CHECK" "5. 환경 변수 파일 확인"
if [ -f "$ENV_FILE" ]; then
    echo "   ✓ 환경 파일 존재: $ENV_FILE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warn "CHECK" "환경 파일이 없습니다: $ENV_FILE (선택사항)"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 6. 디스크 공간 확인
log_info "CHECK" "6. 디스크 공간 확인"
AVAILABLE_SPACE=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
AVAILABLE_SPACE_GB=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE_SPACE_GB" -ge 5 ]; then
    echo "   ✓ 사용 가능한 디스크 공간: $AVAILABLE_SPACE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warn "CHECK" "디스크 공간 부족: $AVAILABLE_SPACE (최소 5GB 권장)"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 7. 네트워크 연결 확인 (NCP Registry)
log_info "CHECK" "7. 네트워크 연결 확인"
if [ -n "${NCP_REGISTRY_URL:-}" ]; then
    REGISTRY_HOST=$(echo "$NCP_REGISTRY_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    if curl -s --head --connect-timeout 5 "https://$REGISTRY_HOST" &> /dev/null; then
        echo "   ✓ NCP Registry 접근 가능: $REGISTRY_HOST"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        log_warn "CHECK" "NCP Registry 접근 불가: $REGISTRY_HOST"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
else
    log_warn "CHECK" "NCP_REGISTRY_URL 환경변수가 설정되지 않았습니다"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 8. 백업 디렉토리 확인
log_info "CHECK" "8. 백업 디렉토리 확인"
BACKUP_DIR="$PROJECT_ROOT/backups"
if [ -d "$BACKUP_DIR" ]; then
    echo "   ✓ 백업 디렉토리 존재: $BACKUP_DIR"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_info "CHECK" "   백업 디렉토리 생성: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi

# 결과 출력
echo ""
echo "========================================="
echo "검사 완료"
echo "========================================="
echo "통과: $CHECKS_PASSED"
echo "경고: $CHECKS_WARNING"
echo "실패: $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -gt 0 ]; then
    log_error "CHECK" "배포 전 검사 실패. 위 오류를 수정한 후 다시 시도하세요."
    exit 1
else
    log_info "CHECK" "모든 검사 통과. 배포를 진행할 수 있습니다."
    exit 0
fi
