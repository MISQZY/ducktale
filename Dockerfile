FROM node:22-alpine AS base

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json source.config.ts next.config.mjs ./
# Копируем схему Prisma и render-site-schema.js — оба нужны postinstall
# (prisma generate / site-db:render), который npm ci запускает сам
COPY src/prisma ./src/prisma
COPY scripts ./scripts

# site-db:render bakes this into the generated client's @@map() table names
# at `prisma generate` time (below, via npm ci's postinstall) — Prisma can't
# read it dynamically at runtime, so it has to be set here, not just in the
# container's runtime environment, or every site-db query 404s on a table
# name that was never actually created (e.g. "user" instead of "site_user").
ARG SITE_DB_TABLE_PREFIX
ENV SITE_DB_TABLE_PREFIX=${SITE_DB_TABLE_PREFIX}

RUN npm ci

# --- builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URL нужен только для `prisma generate` (генерация типов),
# не для реального подключения на этапе сборки.
# Передаётся через --build-arg: docker build --build-arg DATABASE_URL=...
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run build

# --- runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.source ./.source

# Prisma Query Engine (нативный бинарник) нужен в рантайме
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
