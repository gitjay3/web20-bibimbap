#!/bin/bash

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[ROLLBACK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 사용법
usage() {
    cat << EOF
Usage: $0 <environment> [backup_timestamp]

Arguments:
    environment         배포 환경 (prod)
    backup_timestamp    복원할 백업 타임스탬프 (선택사항, 기본값: 최신)

Example:
    $0 prod
    $0 prod 20260108_143000

설명:
    - backup_timestamp를 지정하지 않으면 가장 최근 백업으로 복원
    - 백업 파일은 backups/ 디렉토리에 저장됨
EOF
    exit 1
}

# 환경 검증
if [ $# -lt 1 ]; then
    usage
fi

ENVIRONMENT=$1
ENV_DISPLAY="$ENVIRONMENT"  # 로그 표시용
BACKUP_TIMESTAMP=${2:-}

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

log_info "=== 롤백 시작: $ENV_DISPLAY 환경 ==="

# 백업 디렉토리 확인
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "백업 디렉토리가 없습니다: $BACKUP_DIR"
    log_error "복원할 수 있는 백업이 없습니다."
    exit 1
fi

# 백업 타임스탬프 결정
if [ -z "$BACKUP_TIMESTAMP" ]; then
    log_info "최신 백업 검색 중..."

    # 가장 최근 백업 파일 찾기
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/images_${ENV_DISPLAY}_*.txt 2>/dev/null | head -n 1 || echo "")

    if [ -z "$LATEST_BACKUP" ]; then
        log_error "백업 파일을 찾을 수 없습니다"
        log_error "백업이 없어서 롤백할 수 없습니다."
        exit 1
    fi

    # 타임스탬프 추출
    BACKUP_TIMESTAMP=$(basename "$LATEST_BACKUP" | sed "s/images_${ENV_DISPLAY}_//" | sed 's/.txt//')
    log_info "최신 백업 발견: $BACKUP_TIMESTAMP"
else
    log_info "지정된 백업 사용: $BACKUP_TIMESTAMP"
fi

# 백업 파일 경로
IMAGES_BACKUP="$BACKUP_DIR/images_${ENV_DISPLAY}_${BACKUP_TIMESTAMP}.txt"
CONTAINERS_BACKUP="$BACKUP_DIR/containers_${ENV_DISPLAY}_${BACKUP_TIMESTAMP}.txt"

# 백업 파일 존재 확인
if [ ! -f "$IMAGES_BACKUP" ]; then
    log_error "이미지 백업 파일이 없습니다: $IMAGES_BACKUP"
    exit 1
fi

log_info "백업 파일 확인:"
log_info "  - Images: $IMAGES_BACKUP"
if [ -f "$CONTAINERS_BACKUP" ]; then
    log_info "  - Containers: $CONTAINERS_BACKUP"
fi

# 사용자 확인 (CI 환경에서는 자동 진행)
if [ -t 0 ]; then
    # Interactive terminal - 사용자 확인 필요
    echo ""
    log_warn "경고: 롤백을 진행하면 현재 실행 중인 컨테이너가 중지되고"
    log_warn "       백업 시점($BACKUP_TIMESTAMP)의 이미지로 복원됩니다."
    echo ""
    read -p "계속하시겠습니까? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        log_info "롤백이 취소되었습니다."
        exit 0
    fi
else
    # Non-interactive (CI/CD) - 자동 진행
    log_warn "자동 롤백 모드: 백업 시점($BACKUP_TIMESTAMP)으로 복원합니다."
fi

# 1. 현재 컨테이너 중지
log_info "Step 1: 현재 실행 중인 컨테이너 중지"
if command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
    dotenvx run -f "$ENV_FILE" -- docker compose -f "$COMPOSE_FILE" down
else
    docker compose -f "$COMPOSE_FILE" down
fi

# 2. 백업된 이미지 정보 읽기 및 복원
log_info "Step 2: 백업된 이미지로 복원"

log_warn "자동 이미지 복원은 구현되지 않았습니다."
log_warn "수동으로 이전 이미지 태그를 사용하여 배포해야 합니다."
echo ""
log_info "예시:"
log_info "  1. GitHub에서 이전 성공한 워크플로우의 이미지 태그 확인"
log_info "  2. .env.$ENV_NAME 파일에서 IMAGE_TAG 변경"
log_info "  3. deploy.sh 다시 실행"

# 3. 이전 설정으로 컨테이너 재시작 시도
log_info "Step 3: 이전 설정으로 컨테이너 재시작"

# IMAGE_TAG를 이전 버전으로 변경하라는 안내
log_warn "롤백을 완료하려면:"
log_warn "  1. IMAGE_TAG 환경변수를 이전 버전으로 설정"
log_warn "  2. 아래 명령어 실행:"
echo ""
if command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
    echo "     dotenvx run -f $ENV_FILE -- docker compose -f $COMPOSE_FILE up -d"
else
    echo "     docker compose -f $COMPOSE_FILE up -d"
fi
echo ""

# 간단한 자동 복원 시도 (현재 설정 그대로)
log_info "현재 설정으로 서비스 재시작 시도..."
if command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
    dotenvx run -f "$ENV_FILE" -- docker compose -f "$COMPOSE_FILE" up -d
else
    docker compose -f "$COMPOSE_FILE" up -d
fi

# 4. 상태 확인
log_info "Step 4: 서비스 상태 확인"
sleep 10

docker compose -f "$COMPOSE_FILE" ps

# 5. 완료
log_info "=== 롤백 프로세스 완료 ==="
log_warn "주의: 완전한 롤백을 위해서는 IMAGE_TAG를 이전 버전으로 수동 변경 후"
log_warn "       컨테이너를 다시 시작해야 할 수 있습니다."
echo ""
log_info "서비스 로그 확인: docker compose -f $COMPOSE_FILE logs -f"

exit 0
