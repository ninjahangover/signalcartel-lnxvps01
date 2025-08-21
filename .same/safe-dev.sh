#!/bin/bash

# Safe Development Workflow
# Prevents file corruption during development

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

# Function: Pre-development checks
pre_dev_checks() {
    log "🔍 Running pre-development checks..."

    # Stop any running dev servers
    if pgrep -f "next dev\|bun run dev\|turbopack" > /dev/null; then
        warn "Stopping running dev servers to prevent conflicts..."
        pkill -f "next dev" || true
        pkill -f "bun run dev" || true
        sleep 2
    fi

    # Check filesystem health
    ./.same/safe-file-ops.sh health || {
        error "Filesystem health check failed!"
        return 1
    }

    # Check file integrity
    ./.same/monitor-files.sh check || {
        warn "File integrity issues detected!"
        read -p "Attempt auto-restore? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./.same/monitor-files.sh restore
        fi
    }

    log "✅ Pre-development checks passed"
}

# Function: Start safe development environment
start_dev() {
    log "🚀 Starting safe development environment..."

    # Create fresh backups before starting
    ./.same/monitor-files.sh backup

    # Start file monitoring in background
    ./.same/monitor-files.sh watch &
    MONITOR_PID=$!
    log "👀 File monitoring started (PID: $MONITOR_PID)"

    # Start development server with safe settings
    log "🔧 Starting development server..."

    # Use --turbo=false to avoid Turbopack conflicts (if needed)
    bun run dev &
    DEV_PID=$!
    log "🌐 Development server started (PID: $DEV_PID)"

    # Setup cleanup on exit
    trap 'cleanup_dev $MONITOR_PID $DEV_PID' EXIT INT TERM

    log "✅ Safe development environment ready!"
    log "📝 Logs: tail -f .same/dev.log"
    log "🔍 Monitor: ./.same/monitor-files.sh status"
    log "🛑 Stop: Ctrl+C or kill $DEV_PID"

    # Wait for dev server
    wait $DEV_PID
}

# Function: Cleanup development environment
cleanup_dev() {
    local monitor_pid=${1:-}
    local dev_pid=${2:-}

    log "🧹 Cleaning up development environment..."

    # Stop file monitoring
    if [ -n "$monitor_pid" ] && kill -0 "$monitor_pid" 2>/dev/null; then
        kill "$monitor_pid" 2>/dev/null || true
        log "⏹️ File monitoring stopped"
    fi

    # Stop dev server
    if [ -n "$dev_pid" ] && kill -0 "$dev_pid" 2>/dev/null; then
        kill "$dev_pid" 2>/dev/null || true
        log "⏹️ Development server stopped"
    fi

    # Final integrity check
    log "🔍 Final file integrity check..."
    if ! ./.same/monitor-files.sh check; then
        error "File corruption detected after development session!"
        warn "Run: ./.same/monitor-files.sh restore"
    fi

    log "✅ Development session ended safely"
}

# Function: Safe build process
safe_build() {
    log "🔨 Starting safe build process..."

    # Pre-build checks
    pre_dev_checks || return 1

    # Backup before build
    ./.same/monitor-files.sh backup

    # Run build with error handling
    log "📦 Running build..."
    if bun run build; then
        log "✅ Build completed successfully"

        # Post-build integrity check
        if ./.same/monitor-files.sh check; then
            log "✅ File integrity maintained during build"
        else
            warn "File integrity issues after build"
        fi
    else
        error "Build failed!"
        ./.same/monitor-files.sh check
        return 1
    fi
}

# Function: Emergency file restore
emergency_restore() {
    error "🚨 Emergency file restore activated!"

    log "🔍 Checking file integrity..."
    ./.same/monitor-files.sh check

    log "🔧 Attempting auto-restore..."
    ./.same/monitor-files.sh restore

    log "🔍 Post-restore integrity check..."
    if ./.same/monitor-files.sh check; then
        log "✅ Emergency restore successful"
    else
        error "❌ Emergency restore failed - manual intervention required"
        echo ""
        echo "Manual recovery options:"
        echo "  1. Check backups: ls -la .same/backups/"
        echo "  2. Restore specific file: cp .same/backups/filename.bak src/path/filename"
        echo "  3. Regenerate baseline: ./.same/monitor-files.sh baseline"
    fi
}

# Function: Show development status
dev_status() {
    echo -e "${BLUE}📊 Development Environment Status${NC}"
    echo "=================================="

    # File monitoring status
    ./.same/monitor-files.sh status
    echo ""

    # Process status
    echo "🔄 Running Processes:"
    if pgrep -f "next dev" > /dev/null; then
        echo "  ✅ Next.js dev server running (PID: $(pgrep -f 'next dev'))"
    else
        echo "  ⚪ Next.js dev server not running"
    fi

    if pgrep -f "monitor-files.sh watch" > /dev/null; then
        echo "  ✅ File monitor running (PID: $(pgrep -f 'monitor-files.sh watch'))"
    else
        echo "  ⚪ File monitor not running"
    fi

    echo ""

    # Recent backups
    echo "💾 Recent Backups:"
    ls -la .same/backups/ | tail -5
}

# Main execution
case "${1:-help}" in
    "start")
        pre_dev_checks && start_dev
        ;;
    "build")
        safe_build
        ;;
    "check")
        pre_dev_checks
        ;;
    "restore")
        emergency_restore
        ;;
    "status")
        dev_status
        ;;
    "stop")
        log "🛑 Stopping all development processes..."
        pkill -f "next dev" || true
        pkill -f "monitor-files.sh watch" || true
        log "✅ All processes stopped"
        ;;
    *)
        echo -e "${BLUE}Safe Development Workflow${NC}"
        echo "Usage: $0 {start|build|check|restore|status|stop}"
        echo ""
        echo "Commands:"
        echo "  start    - Start safe development environment"
        echo "  build    - Run safe build process"
        echo "  check    - Run pre-development checks"
        echo "  restore  - Emergency file restore"
        echo "  status   - Show development status"
        echo "  stop     - Stop all development processes"
        echo ""
        echo "Workflow:"
        echo "  1. Run 'check' before starting work"
        echo "  2. Use 'start' for development"
        echo "  3. Use 'build' for safe builds"
        echo "  4. Use 'restore' if corruption occurs"
        ;;
esac
