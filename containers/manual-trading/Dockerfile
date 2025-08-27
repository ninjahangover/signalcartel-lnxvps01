# Multi-stage build for SignalCartel Manual Trading Service
FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files (context is set to root in docker-compose)
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm install --production && \
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

# Install process monitoring tools, tsx, and curl for health checks
RUN apk add --no-cache procps curl && \
    npm install -g tsx

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV PORT=3002

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 manualtrader

# Copy necessary files from builder
COPY --from=builder --chown=manualtrader:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=manualtrader:nodejs /app/package*.json ./
COPY --from=builder --chown=manualtrader:nodejs /app/prisma ./prisma

# Copy manual trading service files
COPY --chown=manualtrader:nodejs src/lib ./src/lib
COPY --chown=manualtrader:nodejs src/components/manual-trading ./src/components/manual-trading

# Copy configuration files
COPY --chown=manualtrader:nodejs tsconfig.json ./

# Create directories for volumes
RUN mkdir -p logs data history && \
    chown -R manualtrader:nodejs logs data history

USER manualtrader

EXPOSE 3002

# Default command to run the manual trading service
CMD ["npx", "tsx", "src/services/manual-trading-server.ts"]