# Используем Node.js образ
FROM node:18-alpine AS base

# Устанавливаем зависимости только для production
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
RUN npm ci --only=production

# Собираем приложение
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Собираем Next.js приложение
RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Устанавливаем правильные разрешения
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем собранное приложение
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8171

ENV PORT 8171

# Запускаем приложение
CMD ["node", "server.js"]