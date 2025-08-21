#!/bin/bash

# Log rotation script to prevent disk/memory issues
MAX_SIZE=50M  # Max size before rotation
ARCHIVE_DIR="logs/archive"

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Function to rotate a log file
rotate_log() {
    local logfile=$1
    if [ -f "$logfile" ]; then
        local size=$(du -h "$logfile" | cut -f1)
        local size_bytes=$(stat -c%s "$logfile" 2>/dev/null || stat -f%z "$logfile" 2>/dev/null)
        
        # If file is larger than 50MB, rotate it
        if [ "$size_bytes" -gt 52428800 ]; then
            local timestamp=$(date +%Y%m%d_%H%M%S)
            local basename=$(basename "$logfile" .log)
            mv "$logfile" "$ARCHIVE_DIR/${basename}_${timestamp}.log"
            touch "$logfile"
            echo "Rotated $logfile (was $size)"
        fi
    fi
}

# Rotate all log files
for logfile in *.log; do
    rotate_log "$logfile"
done

echo "Log rotation complete at $(date)"