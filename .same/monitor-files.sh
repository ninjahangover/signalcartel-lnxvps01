#!/bin/bash

# File Integrity Monitor
# Detects and prevents file corruption in real-time

set -euo pipefail

MONITOR_FILES=(
    "src/lib/kraken-api-service.ts"
    "src/lib/market-data-service.ts"
    "src/lib/strategy-manager.ts"
    "src/lib/hooks.ts"
    "src/components/kraken-auth.tsx"
    "src/components/kraken-account-dashboard.tsx"
    "src/components/live-trading-dashboard.tsx"
    "src/components/kraken-chart.tsx"
)

CHECKSUMS_FILE=".same/file-checksums.txt"
BACKUP_DIR=".same/backups"

mkdir -p "$BACKUP_DIR"

# Function: Generate checksums
generate_checksums() {
    echo "📝 Generating file checksums..."
    > "$CHECKSUMS_FILE"

    for file in "${MONITOR_FILES[@]}"; do
        if [ -f "$file" ]; then
            local checksum=$(sha256sum "$file" | cut -d' ' -f1)
            local size=$(wc -c < "$file")
            echo "$file:$checksum:$size" >> "$CHECKSUMS_FILE"
            echo "✅ $file: $size bytes, checksum: ${checksum:0:8}..."
        else
            echo "⚠️  File not found: $file"
        fi
    done
}

# Function: Check file integrity
check_integrity() {
    echo "🔍 Checking file integrity..."
    local corrupted=0

    if [ ! -f "$CHECKSUMS_FILE" ]; then
        echo "❌ No baseline checksums found. Run: $0 baseline"
        return 1
    fi

    while IFS=: read -r file expected_checksum expected_size; do
        if [ ! -f "$file" ]; then
            echo "❌ MISSING: $file"
            ((corrupted++))
            continue
        fi

        local current_size=$(wc -c < "$file")
        if [ "$current_size" -eq 0 ]; then
            echo "❌ CORRUPTED (0 bytes): $file"
            ((corrupted++))
            continue
        fi

        if [ "$current_size" -ne "$expected_size" ]; then
            echo "⚠️  SIZE CHANGED: $file ($expected_size → $current_size bytes)"
        fi

        local current_checksum=$(sha256sum "$file" | cut -d' ' -f1)
        if [ "$current_checksum" != "$expected_checksum" ]; then
            echo "⚠️  CONTENT CHANGED: $file"
        else
            echo "✅ OK: $file ($current_size bytes)"
        fi

    done < "$CHECKSUMS_FILE"

    if [ "$corrupted" -gt 0 ]; then
        echo "❌ Found $corrupted corrupted files!"
        return 1
    fi

    echo "✅ All files integrity verified"
    return 0
}

# Function: Auto-restore corrupted files
auto_restore() {
    echo "🔧 Auto-restoring corrupted files..."

    while IFS=: read -r file expected_checksum expected_size; do
        if [ ! -f "$file" ] || [ ! -s "$file" ]; then
            echo "🔄 Attempting to restore: $file"

            # Try to restore from backup
            local latest_backup=$(ls -t "$BACKUP_DIR/$(basename "$file")".*.bak 2>/dev/null | head -1)

            if [ -n "$latest_backup" ]; then
                cp "$latest_backup" "$file"
                echo "✅ Restored $file from backup"
            else
                echo "❌ No backup available for $file"
            fi
        fi
    done < "$CHECKSUMS_FILE"
}

# Function: Watch files in real-time
watch_files() {
    echo "👀 Starting real-time file monitoring..."
    echo "Press Ctrl+C to stop"

    while true; do
        if ! check_integrity >/dev/null 2>&1; then
            echo "🚨 CORRUPTION DETECTED! $(date)"
            check_integrity
            echo ""
            echo "🔧 Attempting auto-restore..."
            auto_restore
            echo ""
        fi
        sleep 5
    done
}

# Function: Create backups of all monitored files
backup_all() {
    echo "💾 Creating backups of all monitored files..."

    for file in "${MONITOR_FILES[@]}"; do
        if [ -f "$file" ] && [ -s "$file" ]; then
            local backup_name="$(basename "$file").$(date +%s).bak"
            cp "$file" "$BACKUP_DIR/$backup_name"
            echo "✅ Backed up: $file → $backup_name"
        fi
    done
}

# Main execution
case "${1:-help}" in
    "baseline")
        backup_all
        generate_checksums
        ;;
    "check")
        check_integrity
        ;;
    "restore")
        auto_restore
        ;;
    "watch")
        watch_files
        ;;
    "backup")
        backup_all
        ;;
    "status")
        echo "📊 File Monitoring Status:"
        echo "Monitored files: ${#MONITOR_FILES[@]}"
        echo "Checksum file: $CHECKSUMS_FILE"
        echo "Backup directory: $BACKUP_DIR"
        echo ""
        if [ -f "$CHECKSUMS_FILE" ]; then
            echo "Last baseline: $(stat -c %y "$CHECKSUMS_FILE")"
            check_integrity
        else
            echo "❌ No baseline established. Run: $0 baseline"
        fi
        ;;
    *)
        echo "File Integrity Monitor"
        echo "Usage: $0 {baseline|check|restore|watch|backup|status}"
        echo ""
        echo "Commands:"
        echo "  baseline  - Create checksums baseline and backups"
        echo "  check     - Check current file integrity"
        echo "  restore   - Auto-restore corrupted files"
        echo "  watch     - Monitor files in real-time"
        echo "  backup    - Create backups of all files"
        echo "  status    - Show monitoring status"
        ;;
esac
