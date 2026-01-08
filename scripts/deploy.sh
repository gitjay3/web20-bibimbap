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

# 6. Database 마이그레이션
log_info "Step 6: Database 마이그레이션 실행"

# DATABASE_URL 확인 (환경변수가 이미 있으면 사용, 없으면 복호화)
if [ -z "${DATABASE_URL:-}" ]; then
    log_info "DATABASE_URL 환경변수가 없습니다. 복호화 시도..."

    # 환경변수 파일에서 DATABASE_URL 추출
    if command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
        log_info "dotenvx로 DATABASE_URL 복호화"
        DATABASE_URL=$(dotenvx get DATABASE_URL -f "$ENV_FILE" 2>/dev/null || echo "")
    else
        log_info ".env 파일에서 DATABASE_URL 읽기"
        DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || echo "")
    fi

    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL을 찾을 수 없습니다"
        exit 1
    fi
fi

# DATABASE_URL을 export (쉘 환경변수로 전달)
export DATABASE_URL

log_info "기존 DATABASE_URL 환경변수 사용"

# DATABASE_URL 길이 확인 (디버깅)
DB_URL_LENGTH=${#DATABASE_URL}
log_info "DATABASE_URL 길이: $DB_URL_LENGTH characters"

# Backend 컨테이너가 실행 중인지 확인
if docker compose -f "$COMPOSE_FILE" ps backend | grep -q "Up"; then
    log_info "기존 backend 컨테이너에서 마이그레이션 실행"
    docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy
else
    log_warn "실행 중인 backend 컨테이너가 없습니다. 새 컨테이너로 마이그레이션 실행"
    # DATABASE_URL을 쉘 환경변수에서 가져와서 전달 (특수 문자 이스케이프 문제 방지)
    docker compose -f "$COMPOSE_FILE" run --rm -e DATABASE_URL backend npx prisma migrate deploy
fi

if [ $? -ne 0 ]; then
    log_error "Database 마이그레이션 실패"
    log_info "롤백 실행..."
    bash "$SCRIPT_DIR/rollback.sh" "$ENV_DISPLAY"
    exit 1
fi

# 7. 컨테이너 재시작 (down -> up)
log_info "Step 7: 컨테이너 재시작"

# 기존 컨테이너 중지 (볼륨은 유지)
log_info "기존 컨테이너 중지"
run_with_env docker compose -f "$COMPOSE_FILE" down

# 새 컨테이너 시작
log_info "새 컨테이너 시작"
run_with_env docker compose -f "$COMPOSE_FILE" up -d

if [ $? -ne 0 ]; then
    log_error "컨테이너 시작 실패"
    log_info "롤백 실행..."
    bash "$SCRIPT_DIR/rollback.sh" "$ENV_DISPLAY"
    exit 1
fi

# 8. 컨테이너 시작 대기
log_info "Step 8: 컨테이너 시작 대기 (10초)"
sleep 10

# 9. 배포 검증 (컨테이너 상태 확인)
log_info "Step 9: 배포 검증"

# 모든 서비스가 실행 중인지 확인
if command -v jq &> /dev/null; then
    FAILED_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps --format json | jq -r 'select(.State != "running") | .Service' 2>/dev/null || echo "")
else
    # jq가 없으면 간단한 grep 사용
    log_warn "jq가 설치되지 않았습니다. 간단한 검증만 수행합니다."
    RUNNING_COUNT=$(docker compose -f "$COMPOSE_FILE" ps | grep -c "Up" || echo "0")
    EXPECTED_COUNT=$(docker compose -f "$COMPOSE_FILE" config --services | wc -l)

    if [ "$RUNNING_COUNT" -ne "$EXPECTED_COUNT" ]; then
        FAILED_SERVICES="일부 서비스"
    else
        FAILED_SERVICES=""
    fi
fi

if [ -n "$FAILED_SERVICES" ]; then
    log_error "다음 서비스가 실행되지 않았습니다:"
    echo "$FAILED_SERVICES"
    log_info "롤백 실행..."
    bash "$SCRIPT_DIR/rollback.sh" "$ENV_DISPLAY"
    exit 1
fi

# 10. 성공 로그
log_info "=== 배포 완료: $ENV_DISPLAY 환경 ==="
log_info "배포 시간: $TIMESTAMP"
log_info ""
log_info "실행 중인 서비스:"
docker compose -f "$COMPOSE_FILE" ps

# 11. 정리
log_info ""
log_info "배포 백업 파일:"
log_info "  - $BACKUP_DIR/containers_${ENV_DISPLAY}_${TIMESTAMP}.txt"
log_info "  - $BACKUP_DIR/images_${ENV_DISPLAY}_${TIMESTAMP}.txt"
log_info ""
log_info "로그 확인: docker compose -f $COMPOSE_FILE logs -f"

exit 0
