# Multi-stage build for SignalCartel AI/ML Engine
FROM node:20-alpine AS base

# Install Python only - no ML packages for now
RUN apk add --no-cache \
    python3 \
    py3-pip \
    libc6-compat

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files (context is set to root in docker-compose)
COPY package*.json ./
# Use PostgreSQL-specific schema for AI-ML
COPY prisma/schema-postgres.prisma ./prisma/schema.prisma

# Install Node.js production dependencies
RUN npm install --production && \
    npx prisma generate

# Note: Python ML packages removed for now to avoid build issues
# Can be added later when specifically needed for AI features

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy all source files
COPY . .
# Restore PostgreSQL schema that may have been overwritten
COPY prisma/schema-postgres.prisma ./prisma/schema.prisma

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

# Note: Python ML packages removed for simpler build
# Basic Python is available for future ML integration

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV PYTHON_PATH=/app/python
ENV TF_CPP_MIN_LOG_LEVEL=2

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 aiml

# Copy necessary files from builder
COPY --from=builder --chown=aiml:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=aiml:nodejs /app/package*.json ./
COPY --from=builder --chown=aiml:nodejs /app/prisma ./prisma

# Copy AI optimization engine and libraries
COPY --chown=aiml:nodejs scripts/engines/ai-optimization-engine.ts ./scripts/engines/
COPY --chown=aiml:nodejs scripts/engines/stratus-engine.ts ./scripts/engines/
COPY --chown=aiml:nodejs src/lib ./src/lib

# Copy configuration files
COPY --chown=aiml:nodejs tsconfig.json ./

# Create directories for volumes
RUN mkdir -p logs models markov-chains neural-networks training-data checkpoints features predictions metrics && \
    chown -R aiml:nodejs logs models markov-chains neural-networks training-data checkpoints features predictions metrics

USER aiml

# Default command to run the AI optimization engine
CMD ["npx", "tsx", "scripts/engines/ai-optimization-engine.ts"]