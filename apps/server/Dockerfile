# ═══════════════════════════════════════════════════════════════
# NexaStore Backend — Production Dockerfile
# Multi-stage build for TypeScript / Express server in a Turborepo monorepo
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine AS base

# ─── 1. Dependencies stage ────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root lockfiles and package JSON descriptors
COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# ─── 2. Builder stage ─────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

# Generate Prisma Client & Build TypeScript code
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma
RUN npx turbo build --filter=@nexastore/server...

# ─── 3. Production Runner stage ───────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy runtime bundles and builds
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma

USER expressjs

EXPOSE 5000

CMD ["node", "apps/server/dist/server.js"]
