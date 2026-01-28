#!/bin/bash

# ========================================
# 공통 라이브러리
# ========================================
# 모든 배포 스크립트에서 사용하는 공통 함수와 설정

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로그 함수
log_info() {
    local prefix="${1:-INFO}"
    local message="${2:-$1}"
    if [ $# -eq 2 ]; then
        echo -e "${GREEN}[${prefix}]${NC} ${message}"
    else
        echo -e "${GREEN}[INFO]${NC} ${message}"
    fi
}

log_warn() {
    local prefix="${1:-WARN}"
    local message="${2:-$1}"
    if [ $# -eq 2 ]; then
        echo -e "${YELLOW}[${prefix}]${NC} ${message}"
    else
        echo -e "${YELLOW}[WARN]${NC} ${message}"
    fi
}

log_error() {
    local prefix="${1:-ERROR}"
    local message="${2:-$1}"
    if [ $# -eq 2 ]; then
        echo -e "${RED}[${prefix}]${NC} ${message}"
    else
        echo -e "${RED}[ERROR]${NC} ${message}"
    fi
}

# dotenvx 실행 헬퍼 함수
run_with_env() {
    log_info "DEBUG run_with_env: ENV_FILE=$ENV_FILE"
    log_info "DEBUG run_with_env: dotenvx 존재=$(command -v dotenvx || echo 'not found')"
    log_info "DEBUG run_with_env: ENV_FILE 존재=$([ -f "$ENV_FILE" ] && echo 'yes' || echo 'no')"
    log_info "DEBUG run_with_env: DOTENV_PRIVATE_KEY_PRODUCTION=$([ -n "$DOTENV_PRIVATE_KEY_PRODUCTION" ] && echo "set (${#DOTENV_PRIVATE_KEY_PRODUCTION} chars)" || echo "not set")"

    if command -v dotenvx &> /dev/null && [ -f "$ENV_FILE" ]; then
        log_info "DEBUG run_with_env: dotenvx 사용"
        dotenvx run -f "$ENV_FILE" -- "$@"
    else
        log_info "DEBUG run_with_env: 직접 실행"
        "$@"
    fi
}

# 환경 설정 함수
setup_environment() {
    local environment="$1"

    # 스크립트 디렉토리 및 프로젝트 루트 설정
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

    # 환경 이름 매핑 (prod -> production)
    if [ "$environment" = "prod" ]; then
        ENVIRONMENT="production"
    else
        ENVIRONMENT="$environment"
    fi

    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"

    # 환경변수 export
    export ENVIRONMENT
}

# ========================================
# 롤링 업데이트 함수
# ========================================

# 컨테이너가 healthy 상태가 될 때까지 대기
wait_for_healthy() {
    local container_id="$1"
    local timeout="${2:-60}"
    local elapsed=0

    log_info "컨테이너 $container_id healthy 대기 중... (timeout: ${timeout}s)"

    while [ $elapsed -lt $timeout ]; do
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "unknown")

        if [ "$status" = "healthy" ]; then
            log_info "컨테이너 $container_id healthy 상태 확인"
            return 0
        elif [ "$status" = "unhealthy" ]; then
            log_error "컨테이너 $container_id unhealthy 상태"
            return 1
        fi

        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done

    echo ""
    log_error "타임아웃: 컨테이너 $container_id가 ${timeout}초 내에 healthy 상태가 되지 않음"
    return 1
}

# 서비스 롤링 업데이트 수행
rolling_update() {
    local service="$1"
    local compose_file="$2"
    local timeout="${3:-60}"

    log_info "=== $service 롤링 업데이트 시작 ==="

    # 1. 현재 실행 중인 컨테이너 ID 저장
    local old_containers=$(docker compose -f "$compose_file" ps -q "$service" 2>/dev/null)

    if [ -z "$old_containers" ]; then
        log_info "$service: 기존 컨테이너 없음, 새로 시작"
        run_with_env docker compose -f "$compose_file" up -d "$service"
        return $?
    fi

    log_info "$service: 기존 컨테이너 ID: $old_containers"

    # 2. 새 컨테이너 추가 (scale=2)
    log_info "$service: 새 컨테이너 추가 중..."
    run_with_env docker compose -f "$compose_file" up -d --scale "$service=2" --no-recreate "$service"

    # 3. 새 컨테이너 ID 찾기
    sleep 2
    local all_containers=$(docker compose -f "$compose_file" ps -q "$service" 2>/dev/null)
    local new_container=""

    for container in $all_containers; do
        local is_old=false
        for old in $old_containers; do
            if [ "$container" = "$old" ]; then
                is_old=true
                break
            fi
        done
        if [ "$is_old" = false ]; then
            new_container="$container"
            break
        fi
    done

    if [ -z "$new_container" ]; then
        log_error "$service: 새 컨테이너를 찾을 수 없음"
        return 1
    fi

    log_info "$service: 새 컨테이너 ID: $new_container"

    # 4. 새 컨테이너 healthy 대기
    if ! wait_for_healthy "$new_container" "$timeout"; then
        log_error "$service: 새 컨테이너 헬스체크 실패, 롤백 중..."
        docker stop "$new_container" 2>/dev/null || true
        docker rm "$new_container" 2>/dev/null || true
        return 1
    fi

    # 5. 기존 컨테이너 graceful shutdown (pre-stop-hook)
    log_info "$service: 기존 컨테이너 드레이닝 시작..."
    for old in $old_containers; do
        # drain 파일 생성으로 healthcheck 실패 유도 -> nginx가 트래픽 안 보냄
        docker exec "$old" touch /tmp/drain 2>/dev/null || true
    done

    # nginx가 unhealthy 컨테이너에 트래픽 안 보내도록 대기
    log_info "$service: 트래픽 드레이닝 대기 (10초)..."
    sleep 10

    # 6. 기존 컨테이너 종료
    log_info "$service: 기존 컨테이너 종료 중..."
    for old in $old_containers; do
        docker stop "$old" 2>/dev/null || true
        docker rm "$old" 2>/dev/null || true
    done

    # 7. scale 정리 (1개로)
    log_info "$service: scale 정리..."
    run_with_env docker compose -f "$compose_file" up -d --scale "$service=1" --no-recreate "$service"

    log_info "=== $service 롤링 업데이트 완료 ==="
    return 0
}
