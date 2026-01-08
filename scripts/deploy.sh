#!/bin/bash

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# dotenvx 실행 헬퍼 함수
run_with_env() {
    if command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
        dotenvx run -f "$ENV_FILE" -- "$@"
    else
        "$@"
    fi
}

# 사용법
usage() {
    cat << EOF
Usage: $0 <environment>

Arguments:
    environment    배포 환경 (prod)

Example:
    $0 prod

Environment Variables Required:
    NCP_REGISTRY_URL        - NCP Container Registry URL (필수)
    NCP_REGISTRY_USERNAME   - Registry username (필수)
    NCP_REGISTRY_PASSWORD   - Registry password (필수)
    IMAGE_TAG               - Docker image tag (필수)
    DOTENVX_PRIVATE_KEY     - dotenvx 복호화 키 (선택사항, .env.keys 파일 사용 가능)
EOF
    exit 1
}

# 환경 검증
if [ $# -ne 1 ]; then
    usage
fi

ENVIRONMENT=$1
ENV_DISPLAY="$ENVIRONMENT"  # 로그 표시용

if [[ "$ENVIRONMENT" != "prod" ]]; then
    log_error "Invalid environment: $ENVIRONMENT (only 'prod' is supported)"
    usage
fi

# 변수 설정
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

BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log_info "=== 배포 시작: $ENV_DISPLAY 환경 ==="
log_info "프로젝트 루트: $PROJECT_ROOT"
log_info "Compose 파일: $COMPOSE_FILE"
log_info "환경 변수 파일: $ENV_FILE"

# 1. 배포 전 검사
log_info "Step 1: 배포 전 검사 실행"
if ! bash "$SCRIPT_DIR/pre-deploy-checks.sh" "$ENVIRONMENT"; then
    log_error "배포 전 검사 실패"
    exit 1
fi

# 2. 필수 환경변수 검증
log_info "Step 2: 필수 환경변수 검증"
MISSING_VARS=()

if [ -z "${NCP_REGISTRY_URL:-}" ]; then
    MISSING_VARS+=("NCP_REGISTRY_URL")
fi
if [ -z "${NCP_REGISTRY_USERNAME:-}" ]; then
    MISSING_VARS+=("NCP_REGISTRY_USERNAME")
fi
if [ -z "${NCP_REGISTRY_PASSWORD:-}" ]; then
    MISSING_VARS+=("NCP_REGISTRY_PASSWORD")
fi
if [ -z "${IMAGE_TAG:-}" ]; then
    MISSING_VARS+=("IMAGE_TAG")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_error "다음 필수 환경변수가 설정되지 않았습니다:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    log_error "배포를 진행할 수 없습니다."
    exit 1
fi

# 3. NCP Container Registry 로그인
log_info "Step 3: NCP Container Registry 로그인"
echo "$NCP_REGISTRY_PASSWORD" | docker login "$NCP_REGISTRY_URL" -u "$NCP_REGISTRY_USERNAME" --password-stdin
if [ $? -eq 0 ]; then
    log_info "Container Registry 로그인 성공"
else
    log_error "Container Registry 로그인 실패"
    exit 1
fi

# 4. 기존 컨테이너 상태 백업 (롤백용)
log_info "Step 4: 현재 실행 중인 컨테이너 정보 백업"
mkdir -p "$BACKUP_DIR"
docker compose -f "$COMPOSE_FILE" ps > "$BACKUP_DIR/containers_${ENV_DISPLAY}_${TIMESTAMP}.txt" || true
docker compose -f "$COMPOSE_FILE" images > "$BACKUP_DIR/images_${ENV_DISPLAY}_${TIMESTAMP}.txt" || true

# 5. 최신 이미지 Pull
log_info "Step 5: 최신 Docker 이미지 Pull"
run_with_env docker compose -f "$COMPOSE_FILE" pull

# 6. 컨테이너 재시작
log_info "Step 6: 컨테이너 재시작"

# .deploy.env 로드 (DOTENV_PRIVATE_KEY_PRODUCTION 환경변수 설정용)
if [ -f "$PROJECT_ROOT/.deploy.env" ]; then
    log_info "GitHub Actions 환경변수 로드: .deploy.env"
    set -a
    source "$PROJECT_ROOT/.deploy.env"
    set +a
fi

run_with_env docker compose -f "$COMPOSE_FILE" down
run_with_env docker compose -f "$COMPOSE_FILE" up -d

if [ $? -ne 0 ]; then
    log_error "컨테이너 시작 실패"
    bash "$SCRIPT_DIR/rollback.sh" "$ENV_DISPLAY"
    exit 1
fi

# 7. 컨테이너 시작 대기
log_info "Step 7: 컨테이너 시작 대기 (10초)"
sleep 10

# 8. 배포 검증
log_info "Step 8: 배포 검증"

if command -v jq &> /dev/null; then
    FAILED_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps --format json | jq -r 'select(.State != "running") | .Service' 2>/dev/null || echo "")
else
    RUNNING_COUNT=$(docker compose -f "$COMPOSE_FILE" ps | grep -c "Up" || echo "0")
    EXPECTED_COUNT=$(docker compose -f "$COMPOSE_FILE" config --services | wc -l)
    if [ "$RUNNING_COUNT" -ne "$EXPECTED_COUNT" ]; then
        FAILED_SERVICES="일부 서비스"
    else
        FAILED_SERVICES=""
    fi
fi

if [ -n "$FAILED_SERVICES" ]; then
    log_error "서비스 실행 실패: $FAILED_SERVICES"
    bash "$SCRIPT_DIR/rollback.sh" "$ENV_DISPLAY"
    exit 1
fi

# 9. 완료
log_info "=== 배포 완료 ==="
docker compose -f "$COMPOSE_FILE" ps

exit 0
