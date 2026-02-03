#!/bin/bash

set -euo pipefail

# 공통 라이브러리 로드
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

# 사용법
usage() {
    cat << EOF
Usage: $0 <environment> [max_retries]

Arguments:
    environment    배포 환경 (prod, staging)
    max_retries    최대 재시도 횟수 (기본값: 5)

Example:
    $0 prod
    $0 staging
    $0 prod 10

설명:
    모든 컨테이너가 실행 중인지 확인합니다.
    재시도 간격: 10초
EOF
    exit 1
}

# 환경 검증
if [ $# -lt 1 ]; then
    usage
fi

ENVIRONMENT=$1
MAX_RETRIES=${2:-5}
RETRY_INTERVAL=10

if [[ "$ENVIRONMENT" != "prod" && "$ENVIRONMENT" != "staging" ]]; then
    log_error "HEALTH" "Invalid environment: $ENVIRONMENT (only 'prod' or 'staging' is supported)"
    usage
fi

# 환경 설정
setup_environment "$ENVIRONMENT"

log_info "HEALTH" "=== Health Check 시작: $ENVIRONMENT 환경 ==="
log_info "HEALTH" "최대 재시도: $MAX_RETRIES회 (간격: ${RETRY_INTERVAL}초)"

# 예상되는 서비스 목록 (Production - NCP Managed DB 사용)
EXPECTED_SERVICES=("backend" "frontend" "redis")

log_info "HEALTH" "예상 서비스: ${EXPECTED_SERVICES[*]}"
echo ""

# Health check 함수
check_containers() {
    local all_running=true

    for service in "${EXPECTED_SERVICES[@]}"; do
        # 컨테이너 상태 확인 (docker compose ps 출력에서 "Up" 문자열 확인)
        if docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
            echo "   ✓ $service: 실행 중"
        else
            echo "   ✗ $service: 실행되지 않음"
            all_running=false
        fi
    done

    if [ "$all_running" = true ]; then
        return 0
    else
        return 1
    fi
}

# 재시도 로직
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_info "HEALTH" "검사 시도 $RETRY_COUNT/$MAX_RETRIES"

    if check_containers; then
        SUCCESS=true
        break
    else
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warn "HEALTH" "일부 서비스가 아직 준비되지 않았습니다. ${RETRY_INTERVAL}초 후 재시도..."
            sleep $RETRY_INTERVAL
        fi
    fi
done

echo ""

if [ "$SUCCESS" = true ]; then
    log_info "HEALTH" "=== Health Check 성공 ==="
    log_info "HEALTH" "모든 서비스가 정상적으로 실행 중입니다."
    echo ""

    # 추가 정보 출력
    log_info "HEALTH" "컨테이너 상세 정보:"
    docker compose -f "$COMPOSE_FILE" ps

    exit 0
else
    log_error "HEALTH" "=== Health Check 실패 ==="
    log_error "HEALTH" "일부 서비스가 실행되지 않았습니다."
    echo ""

    log_info "HEALTH" "현재 컨테이너 상태:"
    docker compose -f "$COMPOSE_FILE" ps

    echo ""
    log_info "HEALTH" "로그 확인이 필요합니다:"
    for service in "${EXPECTED_SERVICES[@]}"; do
        echo "  docker compose -f $COMPOSE_FILE logs $service"
    done

    exit 1
fi
