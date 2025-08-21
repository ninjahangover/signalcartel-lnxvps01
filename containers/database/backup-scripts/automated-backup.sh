#!/bin/bash

# SignalCartel AI/ML Data Backup Script
# Preserves all trading data, AI models, and Markov chains

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
REMOTE_DIR="/remote-backups"
DATABASE_HOST="database"
DATABASE_NAME=${POSTGRES_DB:-signalcartel}
DATABASE_USER=${POSTGRES_USER:-postgres}

echo "[$TIMESTAMP] Starting SignalCartel AI/ML data backup..."

# Create backup directories
mkdir -p $BACKUP_DIR/$TIMESTAMP
mkdir -p $REMOTE_DIR

# 1. PostgreSQL Full Database Backup (includes all AI learning data)
echo "[$TIMESTAMP] Backing up PostgreSQL database..."
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  --format=custom --compress=9 --verbose \
  --file=$BACKUP_DIR/$TIMESTAMP/database_full.backup

# 2. AI Models and Neural Networks (from volumes)
echo "[$TIMESTAMP] Backing up AI models and neural networks..."
if [ -d "/app/models" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/ai_models.tar.gz -C /app models/
fi

if [ -d "/app/neural-networks" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/neural_networks.tar.gz -C /app neural-networks/
fi

# 3. Markov Chain Data
echo "[$TIMESTAMP] Backing up Markov chain models..."
if [ -d "/app/markov-chains" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/markov_chains.tar.gz -C /app markov-chains/
fi

# 4. Strategy Learning Data
echo "[$TIMESTAMP] Backing up strategy learning data..."
if [ -d "/app/strategy-learning" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/strategy_learning.tar.gz -C /app strategy-learning/
fi

# 5. Historical Market Data
echo "[$TIMESTAMP] Backing up historical market data..."
if [ -d "/app/historical" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/historical_data.tar.gz -C /app historical/
fi

# 6. Trading Performance Analytics
echo "[$TIMESTAMP] Backing up performance analytics..."
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  --table=trading_signals --table=market_data --table=paper_trading_transactions \
  --format=custom --compress=9 \
  --file=$BACKUP_DIR/$TIMESTAMP/trading_performance.backup

# 7. Create backup manifest
echo "[$TIMESTAMP] Creating backup manifest..."
cat > $BACKUP_DIR/$TIMESTAMP/manifest.json << EOF
{
  "timestamp": "$TIMESTAMP",
  "database_backup": "database_full.backup",
  "ai_models": "ai_models.tar.gz",
  "neural_networks": "neural_networks.tar.gz",
  "markov_chains": "markov_chains.tar.gz",
  "strategy_learning": "strategy_learning.tar.gz",
  "historical_data": "historical_data.tar.gz",
  "trading_performance": "trading_performance.backup",
  "backup_size": "$(du -sh $BACKUP_DIR/$TIMESTAMP | cut -f1)",
  "signalcartel_version": "microservices-v1.0"
}
EOF

# 8. Upload to remote storage (if enabled)
if [ "$REMOTE_BACKUP_ENABLED" = "true" ] && [ -n "$S3_BUCKET" ]; then
  echo "[$TIMESTAMP] Uploading to remote storage..."
  tar -czf $REMOTE_DIR/signalcartel_backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP/
  
  # Upload to S3 (requires aws-cli)
  if command -v aws &> /dev/null; then
    aws s3 cp $REMOTE_DIR/signalcartel_backup_$TIMESTAMP.tar.gz s3://$S3_BUCKET/signalcartel/backups/
    echo "[$TIMESTAMP] Remote backup uploaded to S3"
  fi
fi

# 9. Cleanup old backups (keep last 30 days)
echo "[$TIMESTAMP] Cleaning up old backups..."
find $BACKUP_DIR -type d -name "20*" -mtime +${BACKUP_RETENTION_DAYS:-30} -exec rm -rf {} +
find $REMOTE_DIR -type f -name "*.tar.gz" -mtime +${BACKUP_RETENTION_DAYS:-30} -delete

# 10. Verification
BACKUP_SIZE=$(du -sh $BACKUP_DIR/$TIMESTAMP | cut -f1)
echo "[$TIMESTAMP] Backup completed successfully!"
echo "[$TIMESTAMP] Backup size: $BACKUP_SIZE"
echo "[$TIMESTAMP] Location: $BACKUP_DIR/$TIMESTAMP"

# Send notification (if Telegram is configured)
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="🔄 SignalCartel AI/ML Backup Complete
Size: $BACKUP_SIZE
Time: $TIMESTAMP
✅ All trading data preserved"
fi

exit 0