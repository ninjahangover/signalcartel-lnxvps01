# Multi-stage build for SignalCartel Market Data Collector
FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files (context is set to root in docker-compose)
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm ci --only=production && \
    npx prisma generate

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy all source files
COPY . .

# Build TypeScript files if build script exists
RUN if [ -f "package.json" ] && grep -q '"build"' package.json; then \
      npm run build || true; \
    fi

# Production stage
FROM base AS runner
WORKDIR /app

# Install process monitoring tools and tsx for TypeScript execution
RUN apk add --no-cache procps && \
    npm install -g tsx

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 marketdata

# Copy necessary files from builder
COPY --from=builder --chown=marketdata:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=marketdata:nodejs /app/package*.json ./
COPY --from=builder --chown=marketdata:nodejs /app/prisma ./prisma

# Copy market data collector script and libraries
COPY --chown=marketdata:nodejs scripts/engines/market-data-collector.ts ./scripts/engines/
COPY --chown=marketdata:nodejs src/lib ./src/lib

# Copy configuration files
COPY --chown=marketdata:nodejs tsconfig.json ./

# Copy environment files from the container directory
COPY --chown=marketdata:nodejs containers/market-data/.env ./
COPY --chown=marketdata:nodejs containers/market-data/.env.local ./

# Create directories for volumes
RUN mkdir -p logs data historical analysis predictions correlations && \
    chown -R marketdata:nodejs logs data historical analysis predictions correlations

USER marketdata

# Default command to run the market data collector
CMD ["npx", "tsx", "scripts/engines/market-data-collector.ts"]