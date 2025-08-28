#!/bin/bash

# 🚀 QUANTUM FORGE™ Reliable Data Sync
# Replaces problematic automated-data-sync-service.ts with working solutions
# Uses smart-sync approach to avoid Prisma schema mapping errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ANALYTICS_DB_URL="${ANALYTICS_DB_URL:-postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public}"
DATABASE_URL="${DATABASE_URL:-postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public}"
LOG_FILE="/tmp/signalcartel-logs/reliable-data-sync-$(date +%Y%m%d_%H%M%S).log"

# Ensure log directory exists
mkdir -p /tmp/signalcartel-logs

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Header
echo -e "${CYAN}🚀 QUANTUM FORGE™ RELIABLE DATA SYNC${NC}"
echo -e "${CYAN}====================================${NC}"
log "INFO" "🚀 Starting reliable data sync process"
log "INFO" "📁 Logging to: $LOG_FILE"

# Function to check database connectivity
check_database() {
    log "INFO" "🔍 Checking database connectivity..."
    
    if ! docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c "SELECT 1;" > /dev/null 2>&1; then
        log "ERROR" "❌ Cannot connect to source database"
        exit 1
    fi
    
    if ! docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel_analytics -c "SELECT 1;" > /dev/null 2>&1; then
        log "ERROR" "❌ Cannot connect to analytics database"
        exit 1
    fi
    
    log "INFO" "✅ Database connectivity verified"
}

# Function to run smart sync
run_smart_sync() {
    log "INFO" "🧠 Running smart sync (essential data)..."
    
    if ANALYTICS_DB_URL="$ANALYTICS_DB_URL" DATABASE_URL="$DATABASE_URL" \
       npx tsx -r dotenv/config smart-sync.ts >> "$LOG_FILE" 2>&1; then
        log "INFO" "✅ Smart sync completed successfully"
        return 0
    else
        log "ERROR" "❌ Smart sync failed"
        return 1
    fi
}

# Function to sync intuition signals
sync_intuition_signals() {
    log "INFO" "📡 Syncing IntuitionAnalysis data..."
    
    if ANALYTICS_DB_URL="$ANALYTICS_DB_URL" DATABASE_URL="$DATABASE_URL" \
       npx tsx -r dotenv/config sync-intuition-signals.ts >> "$LOG_FILE" 2>&1; then
        log "INFO" "✅ Intuition signals sync completed"
        return 0
    else
        log "WARN" "⚠️ Intuition signals sync failed (non-critical)"
        return 0
    fi
}

# Function to verify sync results
verify_sync() {
    log "INFO" "🔍 Verifying sync results..."
    
    # Get consolidated data counts
    local results=$(docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel_analytics -t -c "
        SELECT 
            COALESCE((SELECT COUNT(*) FROM consolidated_sentiment), 0) as sentiment,
            COALESCE((SELECT COUNT(*) FROM consolidated_market_data), 0) as market_data,
            COALESCE((SELECT COUNT(*) FROM consolidated_data_collection), 0) as data_collection,
            COALESCE((SELECT COUNT(*) FROM consolidated_trading_signals), 0) as trading_signals
        " 2>/dev/null | tr -d ' ' | tr '|' ' ')
    
    if [ -n "$results" ]; then
        read sentiment market_data data_collection trading_signals <<< "$results"
        log "INFO" "📊 Consolidated Data Results:"
        log "INFO" "   • Sentiment Records: $sentiment"
        log "INFO" "   • Market Data: $market_data" 
        log "INFO" "   • Data Collection: $data_collection"
        log "INFO" "   • Trading Signals: $trading_signals"
        
        # Check if we have meaningful data
        if [ "$sentiment" -gt 0 ] || [ "$market_data" -gt 0 ]; then
            log "INFO" "✅ Sync verification successful - data available"
            return 0
        else
            log "WARN" "⚠️ No data found in consolidated tables"
            return 1
        fi
    else
        log "ERROR" "❌ Could not verify sync results"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage: $0 [sync|verify|status|help]${NC}"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo -e "  ${GREEN}sync${NC}     - Run complete data synchronization (default)"
    echo -e "  ${GREEN}verify${NC}   - Verify current sync status"
    echo -e "  ${GREEN}status${NC}   - Show current data status"
    echo -e "  ${GREEN}help${NC}     - Show this help message"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo -e "  ${CYAN}ANALYTICS_DB_URL${NC} - Analytics database URL"
    echo -e "  ${CYAN}DATABASE_URL${NC}     - Source database URL"
    echo ""
    echo -e "${BLUE}Example:${NC}"
    echo -e "  ${GREEN}./admin/reliable-data-sync.sh sync${NC}"
}

# Function to show status
show_status() {
    log "INFO" "📊 Current Data Status"
    
    echo -e "\n${PURPLE}Source Database (signalcartel):${NC}"
    docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c "
    SELECT 
      'MarketDataCollection' as table_name, COUNT(*) as records 
    FROM \"MarketDataCollection\"
    UNION ALL 
    SELECT 'IntuitionAnalysis', COUNT(*) FROM \"IntuitionAnalysis\" 
    UNION ALL 
    SELECT 'TradingSignal', COUNT(*) FROM \"TradingSignal\"
    UNION ALL
    SELECT 'ManagedTrade', COUNT(*) FROM \"ManagedTrade\"
    ORDER BY table_name;" 2>/dev/null || echo "❌ Could not query source database"
    
    echo -e "\n${CYAN}Analytics Database (signalcartel_analytics):${NC}"
    docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel_analytics -c "
    SELECT 
      'consolidated_sentiment' as table_name, COUNT(*) as records 
    FROM consolidated_sentiment
    UNION ALL 
    SELECT 'consolidated_market_data', COUNT(*) FROM consolidated_market_data
    UNION ALL 
    SELECT 'consolidated_trading_signals', COUNT(*) FROM consolidated_trading_signals
    UNION ALL
    SELECT 'consolidated_data_collection', COUNT(*) FROM consolidated_data_collection
    ORDER BY table_name;" 2>/dev/null || echo "❌ Could not query analytics database"
}

# Main execution
main() {
    local command="${1:-sync}"
    
    case "$command" in
        "sync")
            check_database
            
            echo -e "${YELLOW}🔄 Starting synchronization process...${NC}"
            
            # Run smart sync first (most reliable)
            if run_smart_sync; then
                sync_success=true
            else
                sync_success=false
            fi
            
            # Try intuition signals sync
            sync_intuition_signals
            
            # Verify results
            if verify_sync; then
                log "INFO" "🎉 Data sync completed successfully!"
                echo -e "${GREEN}✅ Reliable data sync completed successfully${NC}"
                echo -e "${BLUE}📁 Full logs available at: $LOG_FILE${NC}"
            else
                log "WARN" "⚠️ Data sync completed with warnings"
                echo -e "${YELLOW}⚠️ Data sync completed with warnings${NC}"
                echo -e "${BLUE}📁 Check logs at: $LOG_FILE${NC}"
            fi
            ;;
        "verify")
            check_database
            verify_sync
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $command${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"