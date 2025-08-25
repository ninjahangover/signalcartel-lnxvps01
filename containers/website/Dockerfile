# Multi-stage build for SignalCartel Website
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files (context is set to root in docker-compose)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
# Install dependencies and generate Prisma client for Alpine Linux
RUN npm ci
RUN npx prisma generate --schema=prisma/schema.prisma

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create minimal environment for build
ENV NODE_ENV=production
ENV NEXTAUTH_URL=http://localhost:3001
ENV NEXTAUTH_SECRET=docker-build-secret
ENV DATABASE_URL="file:./dev.db"

# Skip build-time database connection requirements
ENV SKIP_ENV_VALIDATION=true

# Build Next.js application with build-time env vars
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