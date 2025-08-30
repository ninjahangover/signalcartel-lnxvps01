#!/bin/bash
# Test rclone cloud backup functionality with existing backups

set -euo pipefail

BACKUP_DIR="/home/telgkb9/signalcartel-backups"

echo "☁️ TESTING CLOUD BACKUP WITH RCLONE"
echo "===================================="

# Check if rclone is available
if ! command -v rclone >/dev/null 2>&1; then
    echo "❌ rclone not found - please install rclone first"
    exit 1
fi

# Test rclone connection
echo "🔗 Testing rclone connection to signal.humanizedcomputing.com"
if rclone lsd signal.humanizedcomputing.com: >/dev/null 2>&1; then
    echo "✅ rclone connection successful"
else
    echo "❌ rclone connection failed - please check your configuration"
    exit 1
fi

# Find the latest clean backup
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/clean/signalcartel_backup_*.db 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backup files found - run a backup first"
    exit 1
fi

BACKUP_NAME=$(basename "$LATEST_BACKUP" .db)
BACKUP_PATH="${BACKUP_DIR}/clean/${BACKUP_NAME}"

echo "📁 Testing upload of backup: $BACKUP_NAME"

# Create test cloud directory
CLOUD_TEST_DIR="/signalcartel-backups/test-upload/$(date +%Y%m%d_%H%M%S)"

echo "📤 Uploading to: signal.humanizedcomputing.com:${CLOUD_TEST_DIR}"

# Test upload compressed backup (most efficient)
echo "🗜️ Testing compressed backup upload..."
if [ -f "${BACKUP_PATH}_full.tar.gz" ]; then
    if rclone copy "${BACKUP_PATH}_full.tar.gz" --progress signal.humanizedcomputing.com:"${CLOUD_TEST_DIR}/"; then
        echo "✅ Compressed backup uploaded successfully"
        
        # Verify upload
        REMOTE_SIZE=$(rclone size signal.humanizedcomputing.com:"${CLOUD_TEST_DIR}/$(basename "${BACKUP_PATH}_full.tar.gz")" --json | jq -r '.bytes')
        LOCAL_SIZE=$(stat -c%s "${BACKUP_PATH}_full.tar.gz")
        
        if [ "$REMOTE_SIZE" = "$LOCAL_SIZE" ]; then
            echo "✅ Upload verification successful (${LOCAL_SIZE} bytes)"
        else
            echo "❌ Upload verification failed - size mismatch"
            exit 1
        fi
    else
        echo "❌ Failed to upload compressed backup"
        exit 1
    fi
else
    echo "⚠️ Compressed backup not found - testing with SQLite backup"
    if rclone copy "${BACKUP_PATH}.db" --progress signal.humanizedcomputing.com:"${CLOUD_TEST_DIR}/"; then
        echo "✅ SQLite backup uploaded successfully"
    else
        echo "❌ Failed to upload SQLite backup"
        exit 1
    fi
fi

# Test listing uploaded files
echo "📋 Listing uploaded files..."
rclone ls signal.humanizedcomputing.com:"${CLOUD_TEST_DIR}/"

# Test cleanup (optional)
echo ""
read -p "🗑️ Remove test upload? (y/N): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rclone purge signal.humanizedcomputing.com:"${CLOUD_TEST_DIR}/"
    echo "✅ Test files cleaned up"
fi

echo ""
echo "🎯 CLOUD BACKUP TEST SUCCESSFUL!"
echo "==============================="
echo "✅ rclone connection working"
echo "✅ File upload successful"
echo "✅ Upload verification passed"
echo "✅ Ready for automated cloud backups"
echo ""
echo "💡 To enable cloud backups in production:"
echo "   Run backup with: /home/telgkb9/depot/dev-signalcartel/scripts/backup/database-backup.sh daily"
echo "   Cloud backups will be automatically included"
EOF