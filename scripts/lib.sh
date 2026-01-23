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
