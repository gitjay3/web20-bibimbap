#!/bin/bash

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[CHECK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# 환경 파라미터
ENVIRONMENT=${1:-prod}
ENV_DISPLAY="$ENVIRONMENT"  # 로그 표시용
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# 환경 이름 매핑 (prod -> production)
if [ "$ENVIRONMENT" = "prod" ]; then
    ENV_NAME="production"
else
    ENV_NAME="$ENVIRONMENT"
fi
ENV_FILE="$PROJECT_ROOT/.env.$ENV_NAME"

# docker-compose.yml에서 사용할 ENVIRONMENT 환경변수 설정
export ENVIRONMENT="$ENV_NAME"

CHECKS_PASSED=0
CHECKS_WARNING=0
CHECKS_FAILED=0

log_info "=== 배포 전 검사 시작: $ENV_DISPLAY ==="
echo ""

# 1. Docker 설치 확인
log_info "1. Docker 설치 확인"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "   ✓ Docker 설치됨: $DOCKER_VERSION"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "Docker가 설치되지 않았습니다"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 2. Docker Compose 확인
log_info "2. Docker Compose 확인"
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo "   ✓ Docker Compose 설치됨: $COMPOSE_VERSION"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "Docker Compose가 설치되지 않았습니다"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 3. Docker 실행 확인
log_info "3. Docker 데몬 실행 확인"
if docker info &> /dev/null; then
    echo "   ✓ Docker 데몬 실행 중"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "Docker 데몬이 실행되지 않았습니다"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 4. Compose 파일 존재 확인
log_info "4. Docker Compose 파일 확인"
if [ -f "$COMPOSE_FILE" ]; then
    echo "   ✓ Compose 파일 존재: $COMPOSE_FILE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_error "Compose 파일이 없습니다: $COMPOSE_FILE"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# 5. 환경 변수 파일 확인
log_info "5. 환경 변수 파일 확인"
if [ -f "$ENV_FILE" ]; then
    echo "   ✓ 환경 파일 존재: $ENV_FILE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warn "환경 파일이 없습니다: $ENV_FILE (선택사항)"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 6. dotenvx 설치 확인 (선택사항)
log_info "6. dotenvx 설치 확인"
if command -v dotenvx &> /dev/null; then
    DOTENVX_VERSION=$(dotenvx --version)
    echo "   ✓ dotenvx 설치됨: $DOTENVX_VERSION"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warn "dotenvx가 설치되지 않았습니다 (선택사항, 평문 환경변수 사용)"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 7. 디스크 공간 확인
log_info "7. 디스크 공간 확인"
AVAILABLE_SPACE=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
AVAILABLE_SPACE_GB=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE_SPACE_GB" -ge 5 ]; then
    echo "   ✓ 사용 가능한 디스크 공간: $AVAILABLE_SPACE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warn "디스크 공간 부족: $AVAILABLE_SPACE (최소 5GB 권장)"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 8. 네트워크 연결 확인 (NCP Registry)
log_info "8. 네트워크 연결 확인"
if [ -n "${NCP_REGISTRY_URL:-}" ]; then
    REGISTRY_HOST=$(echo "$NCP_REGISTRY_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    if curl -s --head --connect-timeout 5 "https://$REGISTRY_HOST" &> /dev/null; then
        echo "   ✓ NCP Registry 접근 가능: $REGISTRY_HOST"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        log_warn "NCP Registry 접근 불가: $REGISTRY_HOST"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
else
    log_warn "NCP_REGISTRY_URL 환경변수가 설정되지 않았습니다"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 9. Database 연결 확인 (NCP Managed Database)
log_info "9. Database 연결 확인"

# DATABASE_URL에서 호스트 추출
if [ -n "${DATABASE_URL:-}" ]; then
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
        if timeout 2 bash -c "< /dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null; then
            echo "   ✓ Database 연결 가능: $DB_HOST:$DB_PORT"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            log_error "Database 연결 실패: $DB_HOST:$DB_PORT"
            CHECKS_FAILED=$((CHECKS_FAILED + 1))
        fi
    else
        log_warn "DATABASE_URL 파싱 실패, 연결 확인 건너뜀"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
else
    log_warn "DATABASE_URL 환경변수가 설정되지 않았습니다"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi

# 10. 이전 배포 백업 디렉토리 확인
log_info "10. 백업 디렉토리 확인"
BACKUP_DIR="$PROJECT_ROOT/backups"
if [ -d "$BACKUP_DIR" ]; then
    echo "   ✓ 백업 디렉토리 존재: $BACKUP_DIR"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_info "   백업 디렉토리 생성: $BACKUP_DIR"
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
    log_error "배포 전 검사 실패. 위 오류를 수정한 후 다시 시도하세요."
    exit 1
else
    log_info "모든 검사 통과. 배포를 진행할 수 있습니다."
    exit 0
fi
