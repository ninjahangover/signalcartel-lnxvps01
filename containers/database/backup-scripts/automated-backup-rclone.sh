#!/bin/bash

# SignalCartel AI/ML Data Backup Script with rclone
# Supports 70+ cloud providers: AWS S3, Google Drive, Dropbox, OneDrive, etc.

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
REMOTE_DIR="/remote-backups"
DATABASE_HOST="database"
DATABASE_NAME=${POSTGRES_DB:-signalcartel}
DATABASE_USER=${POSTGRES_USER:-postgres}
RCLONE_REMOTE="${RCLONE_REMOTE_NAME:-signalcartel}"
RCLONE_PATH="${RCLONE_REMOTE_PATH:-signalcartel.sync/backups}"

echo "[$TIMESTAMP] Starting SignalCartel AI/ML backup with rclone..."

# Create backup directories
mkdir -p $BACKUP_DIR/$TIMESTAMP
mkdir -p $REMOTE_DIR

# 1. PostgreSQL Full Database Backup
echo "[$TIMESTAMP] Backing up PostgreSQL database..."
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  --format=custom --compress=9 --verbose \
  --file=$BACKUP_DIR/$TIMESTAMP/database_full.backup

# 2. AI Models and Neural Networks
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

# 6. Market Analysis and Predictions
echo "[$TIMESTAMP] Backing up market analysis data..."
if [ -d "/app/analysis" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/market_analysis.tar.gz -C /app analysis/
fi

if [ -d "/app/predictions" ]; then
  tar -czf $BACKUP_DIR/$TIMESTAMP/price_predictions.tar.gz -C /app predictions/
fi

# 7. Trading Performance Analytics
echo "[$TIMESTAMP] Backing up performance analytics..."
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  --table=trading_signals --table=market_data --table=paper_trading_transactions \
  --format=custom --compress=9 \
  --file=$BACKUP_DIR/$TIMESTAMP/trading_performance.backup

# 8. Create comprehensive backup manifest
echo "[$TIMESTAMP] Creating backup manifest..."
BACKUP_SIZE=$(du -sh $BACKUP_DIR/$TIMESTAMP | cut -f1)
cat > $BACKUP_DIR/$TIMESTAMP/manifest.json << EOF
{
  "timestamp": "$TIMESTAMP",
  "signalcartel_version": "microservices-v1.0",
  "backup_size": "$BACKUP_SIZE",
  "ai_ml_components": {
    "database_backup": "database_full.backup",
    "ai_models": "ai_models.tar.gz",
    "neural_networks": "neural_networks.tar.gz",
    "markov_chains": "markov_chains.tar.gz",
    "strategy_learning": "strategy_learning.tar.gz",
    "historical_data": "historical_data.tar.gz",
    "market_analysis": "market_analysis.tar.gz",
    "price_predictions": "price_predictions.tar.gz",
    "trading_performance": "trading_performance.backup"
  },
  "rclone_remote": "$RCLONE_REMOTE",
  "rclone_path": "$RCLONE_PATH"
}
EOF

# 9. Upload to remote storage with rclone (supports 70+ providers!)
if [ "$REMOTE_BACKUP_ENABLED" = "true" ]; then
  echo "[$TIMESTAMP] Uploading to remote storage via rclone..."
  
  # Create compressed archive
  tar -czf $REMOTE_DIR/signalcartel_ai_backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP/
  
  # Test rclone connection
  if rclone lsd $RCLONE_REMOTE: > /dev/null 2>&1; then
    echo "[$TIMESTAMP] rclone connection successful"
    
    # Upload to configured remote using your existing pattern
    rclone copy $REMOTE_DIR/signalcartel_ai_backup_$TIMESTAMP.tar.gz $RCLONE_REMOTE:/$RCLONE_PATH/ \
      --progress --checksum --verbose
    
    # Verify upload
    if rclone ls $RCLONE_REMOTE:/$RCLONE_PATH/signalcartel_ai_backup_$TIMESTAMP.tar.gz > /dev/null 2>&1; then
      echo "[$TIMESTAMP] Remote backup uploaded successfully!"
      REMOTE_SUCCESS="✅"
    else
      echo "[$TIMESTAMP] Warning: Remote backup verification failed"
      REMOTE_SUCCESS="⚠️"
    fi
  else
    echo "[$TIMESTAMP] Warning: rclone remote not configured or accessible"
    REMOTE_SUCCESS="❌"
  fi
else
  echo "[$TIMESTAMP] Remote backup disabled"
  REMOTE_SUCCESS="🔒"
fi

# 10. Cleanup old local backups
echo "[$TIMESTAMP] Cleaning up old backups..."
find $BACKUP_DIR -type d -name "20*" -mtime +${BACKUP_RETENTION_DAYS:-30} -exec rm -rf {} + 2>/dev/null || true
find $REMOTE_DIR -type f -name "*.tar.gz" -mtime +${BACKUP_RETENTION_DAYS:-30} -delete 2>/dev/null || true

# 11. Cleanup old remote backups
if [ "$REMOTE_BACKUP_ENABLED" = "true" ] && rclone lsd $RCLONE_REMOTE: > /dev/null 2>&1; then
  echo "[$TIMESTAMP] Cleaning up old remote backups..."
  # List and delete old remote backups (older than retention period)
  rclone delete $RCLONE_REMOTE:/$RCLONE_PATH/ --min-age ${BACKUP_RETENTION_DAYS:-30}d --include "signalcartel_ai_backup_*.tar.gz"
fi

# 12. Final verification and reporting
FINAL_SIZE=$(du -sh $BACKUP_DIR/$TIMESTAMP | cut -f1)
echo "[$TIMESTAMP] Backup completed successfully!"
echo "[$TIMESTAMP] Local backup size: $FINAL_SIZE"
echo "[$TIMESTAMP] Location: $BACKUP_DIR/$TIMESTAMP"
echo "[$TIMESTAMP] Remote backup: $REMOTE_SUCCESS"

# 13. Send comprehensive Telegram notification
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d parse_mode="Markdown" \
    -d text="🤖 *SignalCartel AI/ML Backup Complete*

📊 *Data Protected:*
• Database: Full PostgreSQL backup
• AI Models: Neural networks preserved  
• Markov Chains: Prediction models saved
• Strategy Learning: All optimization knowledge
• Historical Data: Complete market history
• Performance Analytics: Trading metrics

📦 *Backup Details:*
• Size: \`$FINAL_SIZE\`
• Time: \`$TIMESTAMP\`
• Remote: $REMOTE_SUCCESS
• Provider: \`$RCLONE_REMOTE\`

✅ *All AI/ML knowledge safely preserved!*"
fi

exit 0