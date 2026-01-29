# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20.19.6-alpine3.23 AS deps

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# 루트 package.json과 pnpm-lock.yaml 복사 (monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# frontend package.json 복사
COPY frontend/package.json ./frontend/

# 의존성 설치 (frozen-lockfile로 정확한 버전 사용, prepare 스크립트 무시)
# BuildKit cache mount로 pnpm store 재사용 (빌드 속도 50-70% 향상)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ========================================
# Stage 2: Build
# ========================================
FROM node:20.19.6-alpine3.23 AS builder

# 빌드 인자 (환경별 API URL 등 설정)
ARG VITE_API_URL
ARG VITE_ENV=production

# 환경변수로 설정 (Vite 빌드 시 사용)
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENV=$VITE_ENV

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# 루트 설정 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# frontend 파일 복사
COPY frontend ./frontend/

# node_modules 복사 (deps stage에서)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# TypeScript 컴파일 및 Vite 빌드
RUN cd frontend && pnpm run build

# ========================================
# Stage 3: Production (Nginx)
# ========================================
FROM nginx:1.28.1-alpine3.23 AS production

# 보안을 위해 non-root 사용자 생성
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# 빌드된 정적 파일을 Nginx html 디렉토리로 복사
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# 커스텀 Nginx 설정 복사
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Nginx 로그 및 PID 파일 디렉토리 권한 설정 (non-root 사용자용)
RUN touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# non-root 사용자로 전환
USER nginx-app

# 포트 노출 (non-root 사용자는 8080 사용)
EXPOSE 8080

# Nginx 실행 (daemon off로 포그라운드 실행)
CMD ["nginx", "-g", "daemon off;"]
