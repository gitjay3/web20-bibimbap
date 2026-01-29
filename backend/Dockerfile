# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20.19.6-alpine3.23 AS deps

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# 루트 package.json과 pnpm-lock.yaml 복사 (monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# backend package.json 복사
COPY backend/package.json ./backend/

# 의존성 설치 (frozen-lockfile로 정확한 버전 사용, prepare 스크립트 무시)
# BuildKit cache mount로 pnpm store 재사용 (빌드 속도 50-70% 향상)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ========================================
# Stage 2: Build
# ========================================
FROM node:20.19.6-alpine3.23 AS builder

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# 루트 설정 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# backend 파일 복사 (prisma 포함)
COPY backend ./backend/

# node_modules 복사 (deps stage에서)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Prisma 클라이언트 생성
RUN cd backend && pnpm exec prisma generate

# TypeScript 컴파일
RUN cd backend && pnpm run build

# pnpm deploy로 프로덕션 의존성만 추출 (symlink 없이 실제 파일로)
RUN pnpm --filter backend deploy --prod --legacy /prod/backend

# ========================================
# Stage 3: Production
# ========================================
FROM node:20.19.6-alpine3.23 AS production

# Prisma에 필요한 openssl 설치
RUN apk add --no-cache openssl

# 보안을 위해 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# pnpm deploy로 추출된 프로덕션 파일 복사 (symlink 없이 실제 파일)
COPY --from=builder /prod/backend ./

# 빌드된 파일 복사
COPY --from=builder /app/backend/dist ./dist

# Prisma 스키마 복사 및 클라이언트 생성
COPY --from=builder /app/backend/prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# migrate deploy용 ESM config 생성
RUN printf '%s\n' \
    "import { defineConfig } from 'prisma/config';" \
    "export default defineConfig({" \
    "  schema: 'prisma/schema.prisma'," \
    "  migrations: { path: 'prisma/migrations' }," \
    "  datasource: { url: process.env.DATABASE_URL }" \
    "});" > prisma.config.mjs

# 소유권 변경
RUN chown -R nestjs:nodejs /app

# non-root 사용자로 전환
USER nestjs

# 포트 노출
EXPOSE 3001

# 애플리케이션 실행
CMD ["node", "dist/src/main.js"]
