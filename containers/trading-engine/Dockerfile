# Multi-stage build for SignalCartel Trading Engine
FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
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

# Install process monitoring tools and tsx for TypeScript execution
RUN apk add --no-cache procps && \
    npm install -g tsx

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 trading

# Copy necessary files from builder
COPY --from=builder --chown=trading:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=trading:nodejs /app/package*.json ./
COPY --from=builder --chown=trading:nodejs /app/prisma ./prisma

# Copy engine scripts and libraries
COPY --chown=trading:nodejs scripts/engines ./scripts/engines
COPY --chown=trading:nodejs src/lib ./src/lib

# Copy strategies if they exist
COPY --chown=trading:nodejs src/strategies ./src/strategies

# Copy configuration files
COPY --chown=trading:nodejs tsconfig.json ./
COPY --chown=trading:nodejs next.config.js ./

# Create directories for volumes
RUN mkdir -p logs models markov-chains strategy-learning neural-networks && \
    chown -R trading:nodejs logs models markov-chains strategy-learning neural-networks

USER trading

# Default command to run the strategy execution engine
CMD ["npx", "tsx", "scripts/engines/strategy-execution-engine.ts"]