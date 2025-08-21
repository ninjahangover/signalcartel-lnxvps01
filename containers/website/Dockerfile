# Multi-stage build for SignalCartel Website
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files (context is set to root in docker-compose)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install production dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

# Copy built application and necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

USER nextjs

EXPOSE 3001

ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

# Use Next.js start command instead of standalone server
CMD ["npm", "start"]