#!/bin/bash

# SignalCartel AI/ML Data Restore Script
# Restores all trading data, AI models, and Markov chains

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_timestamp>"
  echo "Available backups:"
  ls -la /backups/ | grep "^d" | grep "20"
  exit 1
fi

BACKUP_TIMESTAMP=$1
BACKUP_DIR="/backups/$BACKUP_TIMESTAMP"
DATABASE_HOST="database"
DATABASE_NAME=${POSTGRES_DB:-signalcartel}
DATABASE_USER=${POSTGRES_USER:-postgres}

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory $BACKUP_DIR not found"
  exit 1
fi

echo "[$BACKUP_TIMESTAMP] Starting SignalCartel AI/ML data restore..."

# 1. Restore PostgreSQL Database
if [ -f "$BACKUP_DIR/database_full.backup" ]; then
  echo "[$BACKUP_TIMESTAMP] Restoring PostgreSQL database..."
  pg_restore -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
    --clean --if-exists --verbose $BACKUP_DIR/database_full.backup
fi

# 2. Restore AI Models
if [ -f "$BACKUP_DIR/ai_models.tar.gz" ]; then
  echo "[$BACKUP_TIMESTAMP] Restoring AI models..."
  mkdir -p /app/models
  tar -xzf $BACKUP_DIR/ai_models.tar.gz -C /app/
fi

# 3. Restore Neural Networks
if [ -f "$BACKUP_DIR/neural_networks.tar.gz" ]; then
  echo "[$BACKUP_TIMESTAMP] Restoring neural networks..."
  mkdir -p /app/neural-networks
  tar -xzf $BACKUP_DIR/neural_networks.tar.gz -C /app/
fi

# 4. Restore Markov Chains
if [ -f "$BACKUP_DIR/markov_chains.tar.gz" ]; then
  echo "[$BACKUP_TIMESTAMP] Restoring Markov chain models..."
  mkdir -p /app/markov-chains
  tar -xzf $BACKUP_DIR/markov_chains.tar.gz -C /app/
fi

# 5. Restore Strategy Learning Data
if [ -f "$BACKUP_DIR/strategy_learning.tar.gz" ]; then
  echo "[$BACKUP_TIMESTAMP] Restoring strategy learning data..."
  mkdir -p /app/strategy-learning
  tar -xzf $BACKUP_DIR/strategy_learning.tar.gz -C /app/
fi

# 6. Restore Historical Market Data
if [ -f "$BACKUP_DIR/historical_data.tar.gz" ]; then
  echo "[$BACKUP_TIMESTAMP] Restoring historical market data..."
  mkdir -p /app/historical
  tar -xzf $BACKUP_DIR/historical_data.tar.gz -C /app/
fi

echo "[$BACKUP_TIMESTAMP] Restore completed successfully!"
echo "[$BACKUP_TIMESTAMP] All AI/ML and trading data has been restored"

# Send notification
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="🔄 SignalCartel Data Restore Complete
Timestamp: $BACKUP_TIMESTAMP
✅ All AI/ML knowledge preserved"
fi

exit 0