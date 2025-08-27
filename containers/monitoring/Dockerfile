# Multi-stage build for SignalCartel Monitoring Service
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
ENV NODE_OPTIONS="--max-old-space-size=512"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 monitor

# Copy necessary files from builder
COPY --from=builder --chown=monitor:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=monitor:nodejs /app/package*.json ./
COPY --from=builder --chown=monitor:nodejs /app/prisma ./prisma

# Copy resource monitor script and libraries
COPY --chown=monitor:nodejs scripts/engines/resource-monitor.ts ./scripts/engines/
COPY --chown=monitor:nodejs src/lib ./src/lib

# Copy configuration files
COPY --chown=monitor:nodejs tsconfig.json ./

# Create directories for volumes with proper permissions
RUN mkdir -p logs data monitoring && \
    chown -R monitor:nodejs logs data monitoring && \
    chmod 755 logs data monitoring

USER monitor

# Default command to run the resource monitor
CMD ["npx", "tsx", "scripts/engines/resource-monitor.ts"]