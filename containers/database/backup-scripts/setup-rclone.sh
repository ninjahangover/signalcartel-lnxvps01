#!/bin/bash

# SignalCartel rclone Setup Script
# Helps configure cloud storage providers for AI/ML data backups

echo "🔧 SignalCartel rclone Setup"
echo "================================"

RCLONE_CONFIG_DIR="/home/telgkb9/depot/dev-signalcartel/containers/database/rclone-config"

# 1. Check if rclone is available
if ! command -v rclone &> /dev/null; then
    echo "📦 Installing rclone..."
    curl https://rclone.org/install.sh | sudo bash
fi

echo "✅ rclone version: $(rclone version --check=false | head -1)"

# 2. Provider selection menu
echo ""
echo "📡 Select your backup storage provider:"
echo "1) AWS S3"
echo "2) Google Drive" 
echo "3) Dropbox"
echo "4) Microsoft OneDrive"
echo "5) Backblaze B2"
echo "6) Google Cloud Storage"
echo "7) Azure Blob Storage"
echo "8) SFTP/FTP Server"
echo "9) Custom configuration"
echo ""
read -p "Enter choice (1-9): " choice

case $choice in
    1)
        echo "🔧 Configuring AWS S3..."
        rclone config create signalcartel-backup s3 \
            provider=AWS \
            env_auth=false \
            access_key_id="$AWS_ACCESS_KEY_ID" \
            secret_access_key="$AWS_SECRET_ACCESS_KEY" \
            region="${AWS_REGION:-us-east-1}"
        ;;
    2)
        echo "🔧 Configuring Google Drive..."
        echo "⚠️  You'll need to complete OAuth authentication"
        rclone config create signalcartel-backup drive
        ;;
    3)
        echo "🔧 Configuring Dropbox..."
        echo "⚠️  You'll need to complete OAuth authentication"
        rclone config create signalcartel-backup dropbox
        ;;
    4)
        echo "🔧 Configuring Microsoft OneDrive..."
        echo "⚠️  You'll need to complete OAuth authentication"
        rclone config create signalcartel-backup onedrive
        ;;
    5)
        echo "🔧 Configuring Backblaze B2..."
        read -p "Enter Account ID: " account_id
        read -s -p "Enter Application Key: " app_key
        echo ""
        rclone config create signalcartel-backup b2 \
            account="$account_id" \
            key="$app_key"
        ;;
    6)
        echo "🔧 Configuring Google Cloud Storage..."
        read -p "Enter Project Number: " project_num
        read -p "Enter service account file path: " service_account
        rclone config create signalcartel-backup googlecloudstorage \
            project_number="$project_num" \
            service_account_file="$service_account"
        ;;
    7)
        echo "🔧 Configuring Azure Blob Storage..."
        read -p "Enter Storage Account: " storage_account
        read -s -p "Enter Account Key: " account_key
        echo ""
        rclone config create signalcartel-backup azureblob \
            account="$storage_account" \
            key="$account_key"
        ;;
    8)
        echo "🔧 Configuring SFTP Server..."
        read -p "Enter hostname: " hostname
        read -p "Enter username: " username
        read -p "Enter port (22): " port
        port=${port:-22}
        rclone config create signalcartel-backup sftp \
            host="$hostname" \
            user="$username" \
            port="$port"
        ;;
    9)
        echo "🔧 Starting interactive configuration..."
        rclone config
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# 3. Test connection
echo ""
echo "🧪 Testing connection..."
if rclone lsd signalcartel-backup: > /dev/null 2>&1; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed. Please check your configuration."
    exit 1
fi

# 4. Copy config to container directory
echo ""
echo "📁 Copying configuration..."
mkdir -p "$RCLONE_CONFIG_DIR"
cp ~/.config/rclone/rclone.conf "$RCLONE_CONFIG_DIR/"

# 5. Update environment variables
echo ""
echo "🔧 Update your .env.local file with:"
echo "REMOTE_BACKUP_ENABLED=true"
echo "RCLONE_REMOTE_NAME=signalcartel-backup"
echo "RCLONE_REMOTE_PATH=signalcartel/ai-ml-backups"

# 6. Test backup (optional)
read -p "🧪 Run test backup now? (y/n): " test_backup
if [[ $test_backup =~ ^[Yy]$ ]]; then
    echo "🚀 Running test backup..."
    docker-compose exec backup-service /scripts/automated-backup-rclone.sh
fi

echo ""
echo "🎉 rclone setup complete!"
echo "📋 Next steps:"
echo "   1. Update your .env.local with the settings above"
echo "   2. Restart the backup service: docker-compose restart backup-service"
echo "   3. Monitor backups: docker-compose logs -f backup-service"
echo ""
echo "🔄 Your AI/ML data will now be backed up every 6 hours to your cloud storage!"