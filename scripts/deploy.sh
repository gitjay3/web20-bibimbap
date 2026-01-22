#!/bin/bash

set -euo pipefail

# 공통 라이브러리 로드
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

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
EOF
    exit 1
}

# 환경 검증
if [ $# -ne 1 ]; then
    usage
fi

ENVIRONMENT=$1

if [[ "$ENVIRONMENT" != "prod" ]]; then
    log_error "Invalid environment: $ENVIRONMENT (only 'prod' is supported)"
    usage
fi

# 환경 설정
setup_environment "$ENVIRONMENT"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log_info "=== 배포 시작: $ENVIRONMENT 환경 ==="
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
docker compose -f "$COMPOSE_FILE" ps > "$BACKUP_DIR/containers_${ENVIRONMENT}_${TIMESTAMP}.txt" || true
docker compose -f "$COMPOSE_FILE" images > "$BACKUP_DIR/images_${ENVIRONMENT}_${TIMESTAMP}.txt" || true

# 5. Docker 리소스 정리 (디스크 공간 확보)
log_info "Step 5: Docker 리소스 정리"
log_info "정리 전 디스크 사용량:"
df -h / | tail -1

# 1. 중지된 컨테이너 정리
log_info "중지된 컨테이너 정리..."
docker container prune -f || true

# 2. dangling 이미지 정리 (태그 없는 이미지만)
log_info "dangling 이미지 정리..."
docker image prune -f || true

# 3. 사용하지 않는 볼륨 정리
log_info "미사용 볼륨 정리..."
docker volume prune -f || true

# 4. 빌드 캐시 정리
log_info "빌드 캐시 정리..."
docker builder prune -f || true

log_info "정리 후 디스크 사용량:"
df -h / | tail -1

# 5. 최신 이미지 Pull
log_info "Step 6: 최신 Docker 이미지 Pull"
run_with_env docker compose -f "$COMPOSE_FILE" pull

# .deploy.env가 있으면 DATABASE_URL 등 환경변수 로드
log_info "DEBUG: PROJECT_ROOT=$PROJECT_ROOT"
log_info "DEBUG: .deploy.env 경로: $PROJECT_ROOT/.deploy.env"
if [ -f "$PROJECT_ROOT/.deploy.env" ]; then
    log_info "DEBUG: .deploy.env 파일 존재함"
    set -a
    source "$PROJECT_ROOT/.deploy.env"
    set +a
    log_info "DEBUG: DOTENV_PRIVATE_KEY_PRODUCTION 설정됨: $([ -n "$DOTENV_PRIVATE_KEY_PRODUCTION" ] && echo "yes (${#DOTENV_PRIVATE_KEY_PRODUCTION} chars)" || echo "no")"
else
    log_warn "DEBUG: .deploy.env 파일 없음!"
fi

# 6. Prisma 마이그레이션 실행
log_info "Step 7: Prisma 마이그레이션 실행"

# DATABASE_URL 결정: 환경변수 우선, 없으면 dotenvx로 복호화
if [ -n "${DATABASE_URL:-}" ]; then
    MIGRATION_DATABASE_URL="$DATABASE_URL"
    log_info "환경변수에서 DATABASE_URL 사용"
elif command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
    MIGRATION_DATABASE_URL=$(dotenvx get DATABASE_URL -f "$ENV_FILE")
    log_info "dotenvx로 DATABASE_URL 복호화"
else
    log_error "DATABASE_URL을 찾을 수 없습니다"
    exit 1
fi

# 디버깅: DATABASE_URL 값 확인 (민감정보 제외)
log_info "DATABASE_URL 길이: ${#MIGRATION_DATABASE_URL}"
log_info "DATABASE_URL 시작: ${MIGRATION_DATABASE_URL:0:15}..."

# DATABASE_URL을 export하고 -e 플래그로 쉘 환경변수 참조
export DATABASE_URL="$MIGRATION_DATABASE_URL"

if run_with_env docker compose -f "$COMPOSE_FILE" run --rm -e DATABASE_URL backend npx prisma migrate deploy; then
    log_info "마이그레이션 성공"
else
    log_error "마이그레이션 실패"
    exit 1
fi

# 7. 컨테이너 재시작
log_info "Step 8: 컨테이너 재시작"

run_with_env docker compose -f "$COMPOSE_FILE" down
run_with_env docker compose -f "$COMPOSE_FILE" up -d

if [ $? -ne 0 ]; then
    log_error "컨테이너 시작 실패"
    bash "$SCRIPT_DIR/rollback.sh" "$ENVIRONMENT"
    exit 1
fi

# 8. 컨테이너 시작 대기
log_info "Step 9: 컨테이너 시작 대기 (5초)"
sleep 5

# 9. 완료
log_info "=== 배포 완료 ==="
run_with_env docker compose -f "$COMPOSE_FILE" ps

exit 0
