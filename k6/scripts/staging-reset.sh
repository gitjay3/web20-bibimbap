#!/bin/bash
# k6 staging 테스트 데이터 초기화 스크립트
#
# 환경변수:
#   STAGING_SSH_KEY: SSH 키 경로 (기본: ~/Desktop/ncloud-bookstcamp-authkey.pem)
#   STAGING_HOST: 서버 호스트 (기본: 175.45.192.131)
#   EVENT_ID: 이벤트 ID (기본: 100)
#   USER_COUNT: 사용자 수 (기본: 200)

set -e

SSH_KEY="${STAGING_SSH_KEY:-$HOME/Desktop/ncloud-bookstcamp-authkey.pem}"
HOST="${STAGING_HOST:-175.45.192.131}"
EVENT_ID="${EVENT_ID:-100}"
SLOT_ID="${SLOT_ID:-100}"
USER_COUNT="${USER_COUNT:-200}"
SKIP_QUEUE_TOKENS="${SKIP_QUEUE_TOKENS:-false}"

echo "🔄 Staging 테스트 데이터 초기화 중..."
echo "   Host: $HOST"
echo "   EVENT_ID: $EVENT_ID, SLOT_ID: $SLOT_ID, USER_COUNT: $USER_COUNT"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@"$HOST" << EOF
cd ~/bookstcamp/k6/scripts

# Docker 컨테이너에서 환경변수 가져오기
export DATABASE_URL=\$(docker exec bookstcamp-staging-backend-1 printenv DATABASE_URL)
export JWT_SECRET=\$(docker exec bookstcamp-staging-backend-1 printenv JWT_SECRET)
export REDIS_PASSWORD=\$(docker exec bookstcamp-staging-backend-1 printenv REDIS_PASSWORD)

export EVENT_ID=$EVENT_ID
export SLOT_ID=$SLOT_ID
export USER_COUNT=$USER_COUNT
export SKIP_QUEUE_TOKENS=$SKIP_QUEUE_TOKENS
export REDIS_CONTAINER=bookstcamp-redis

npx tsx setup-load-test.ts
EOF

echo "📥 토큰 파일 다운로드 중..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no root@"$HOST":~/bookstcamp/k6/test-tokens.json "$(dirname "$0")/../test-tokens.json"

echo "✅ 초기화 완료!"
