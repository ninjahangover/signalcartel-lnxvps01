#!/bin/bash

# Safe File Operations Script
# Prevents file corruption during edits

set -euo pipefail

BACKUP_DIR=".same/backups"
mkdir -p "$BACKUP_DIR"

# Function: Safe file backup
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local backup_name="$(basename "$file").$(date +%s).bak"
        cp "$file" "$BACKUP_DIR/$backup_name"
        echo "✅ Backed up $file to $BACKUP_DIR/$backup_name"
    fi
}

# Function: Verify file integrity
verify_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo "❌ File doesn't exist: $file"
        return 1
    fi

    if [ ! -s "$file" ]; then
        echo "❌ File is empty (0 bytes): $file"
        return 1
    fi

    # Check if it's a valid TypeScript/JavaScript file
    if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
        if ! node -c "$file" 2>/dev/null; then
            echo "❌ File has syntax errors: $file"
            return 1
        fi
    fi

    echo "✅ File verified: $file ($(wc -c < "$file") bytes)"
    return 0
}

# Function: Safe file restore
restore_file() {
    local file="$1"
    local latest_backup=$(ls -t "$BACKUP_DIR/$(basename "$file")".*.bak 2>/dev/null | head -1)

    if [ -n "$latest_backup" ]; then
        cp "$latest_backup" "$file"
        echo "✅ Restored $file from $latest_backup"
        return 0
    else
        echo "❌ No backup found for $file"
        return 1
    fi
}

# Function: Check for dev server conflicts
check_dev_server() {
    if pgrep -f "next dev\|bun run dev\|turbopack" > /dev/null; then
        echo "⚠️  Dev server is running - this may cause file corruption!"
        echo "   Run: pkill -f 'next dev' && pkill -f 'bun run dev'"
        return 1
    fi
    echo "✅ No dev server conflicts detected"
    return 0
}

# Function: Monitor file system health
check_filesystem() {
    echo "📊 Filesystem Health Check:"

    # Check disk space
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo "❌ Disk usage critical: ${disk_usage}%"
        return 1
    fi
    echo "✅ Disk usage OK: ${disk_usage}%"

    # Check inodes
    local inode_usage=$(df -i . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$inode_usage" -gt 90 ]; then
        echo "❌ Inode usage critical: ${inode_usage}%"
        return 1
    fi
    echo "✅ Inode usage OK: ${inode_usage}%"

    return 0
}

# Main execution
case "${1:-help}" in
    "backup")
        backup_file "$2"
        ;;
    "verify")
        verify_file "$2"
        ;;
    "restore")
        restore_file "$2"
        ;;
    "check-dev")
        check_dev_server
        ;;
    "check-fs")
        check_filesystem
        ;;
    "health")
        check_filesystem && check_dev_server
        ;;
    *)
        echo "Usage: $0 {backup|verify|restore|check-dev|check-fs|health} [file]"
        echo ""
        echo "Commands:"
        echo "  backup <file>   - Create timestamped backup"
        echo "  verify <file>   - Check file integrity"
        echo "  restore <file>  - Restore from latest backup"
        echo "  check-dev       - Check for dev server conflicts"
        echo "  check-fs        - Check filesystem health"
        echo "  health          - Full system health check"
        ;;
esac
