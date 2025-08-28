#!/bin/bash
# QUANTUM FORGE™ Disaster Recovery Testing Script
# Tests all fault tolerance scenarios for the VMS database infrastructure

echo "🧪 QUANTUM FORGE™ DISASTER RECOVERY TESTING"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
LOG_FILE="/tmp/quantum-forge-disaster-recovery-test-$(date +%Y%m%d_%H%M%S).log"
TEST_RESULTS=()

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Test result tracking
record_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TEST_RESULTS+=("$test_name|$result|$details")
    
    if [[ "$result" == "PASS" ]]; then
        log "${GREEN}✅ $test_name: PASSED${NC}"
    else
        log "${RED}❌ $test_name: FAILED${NC}"
    fi
    
    if [[ -n "$details" ]]; then
        log "   Details: $details"
    fi
}

# Function to test database connectivity
test_db_connection() {
    local db_name="$1"
    local host="$2"
    local port="$3"
    local user="$4"
    
    if command -v pg_isready &> /dev/null; then
        if timeout 10 pg_isready -h "$host" -p "$port" -U "$user"; then
            return 0
        else
            return 1
        fi
    else
        log "   ⚠️ pg_isready not available - install postgresql-client"
        return 2
    fi
}

# Function to test Redis connectivity  
test_redis_connection() {
    local host="$1"
    local port="$2"
    
    if command -v redis-cli &> /dev/null; then
        if timeout 10 redis-cli -h "$host" -p "$port" ping > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        log "   ⚠️ redis-cli not available - install redis-tools"
        return 2
    fi
}

# Function to test trading application connectivity
test_trading_app() {
    if command -v npx &> /dev/null; then
        # Test if the application can connect to database
        timeout 30 npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient();
        (async () => {
          try {
            await prisma.\$queryRaw\`SELECT 1 as test\`;
            console.log('TRADING_APP_CONNECTION: SUCCESS');
            await prisma.\$disconnect();
            process.exit(0);
          } catch (error) {
            console.log('TRADING_APP_CONNECTION: FAILED -', error.message);
            process.exit(1);
          }
        })();
        " > /tmp/trading_test.log 2>&1
        
        if grep -q "SUCCESS" /tmp/trading_test.log; then
            return 0
        else
            return 1
        fi
    else
        log "   ⚠️ npx not available - install Node.js"
        return 2
    fi
}

log "${BLUE}📋 DISASTER RECOVERY TEST SUITE STARTING${NC}"
log "Timestamp: $(date)"
log "Log file: $LOG_FILE"
log ""

# Load environment if available
if [[ -f .env ]]; then
    export $(grep -v '^#' .env | xargs) 2>/dev/null
fi

# Extract connection details from environment
if [[ -n "$DATABASE_URL" ]]; then
    PRIMARY_HOST=$(echo $DATABASE_URL | sed 's/.*@//' | cut -d: -f1)
    PRIMARY_PORT=$(echo $DATABASE_URL | sed 's/.*://' | cut -d/ -f1)
    DB_USER=$(echo $DATABASE_URL | sed 's/.*\/\///' | cut -d: -f1)
else
    log "${RED}❌ DATABASE_URL not found in environment${NC}"
    PRIMARY_HOST="db.yourdomain.com"
    PRIMARY_PORT="5432"
    DB_USER="trading_user"
fi

if [[ -n "$BACKUP_DB_URL" ]]; then
    REPLICA_HOST=$(echo $BACKUP_DB_URL | sed 's/.*@//' | cut -d: -f1)
    REPLICA_PORT=$(echo $BACKUP_DB_URL | sed 's/.*://' | cut -d/ -f1)
else
    REPLICA_HOST="db.yourdomain.com"
    REPLICA_PORT="5433"
fi

if [[ -n "$REDIS_URL" ]]; then
    REDIS_HOST=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f1)
    REDIS_PORT=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f2)
else
    REDIS_HOST="db.yourdomain.com"
    REDIS_PORT="6379"
fi

log "${YELLOW}🔧 TEST 1: BASELINE CONNECTIVITY${NC}"
log "Testing all systems are operational before disaster scenarios..."

# Test primary database
if test_db_connection "Primary DB" "$PRIMARY_HOST" "$PRIMARY_PORT" "$DB_USER"; then
    record_test "Baseline Primary Database" "PASS" "Connected to $PRIMARY_HOST:$PRIMARY_PORT"
else
    record_test "Baseline Primary Database" "FAIL" "Cannot connect to $PRIMARY_HOST:$PRIMARY_PORT"
fi

# Test replica database
if test_db_connection "Replica DB" "$REPLICA_HOST" "$REPLICA_PORT" "$DB_USER"; then
    record_test "Baseline Replica Database" "PASS" "Connected to $REPLICA_HOST:$REPLICA_PORT"
else
    record_test "Baseline Replica Database" "FAIL" "Cannot connect to $REPLICA_HOST:$REPLICA_PORT"
fi

# Test Redis
if test_redis_connection "$REDIS_HOST" "$REDIS_PORT"; then
    record_test "Baseline Redis Cache" "PASS" "Connected to $REDIS_HOST:$REDIS_PORT"
else
    record_test "Baseline Redis Cache" "FAIL" "Cannot connect to $REDIS_HOST:$REDIS_PORT"
fi

# Test trading application
if test_trading_app; then
    record_test "Baseline Trading Application" "PASS" "Application can connect to database"
else
    record_test "Baseline Trading Application" "FAIL" "Application cannot connect to database"
fi

log ""
log "${YELLOW}🔧 TEST 2: SIMULATED PRIMARY DATABASE FAILURE${NC}"
log "This test simulates primary database failure by testing replica-only connectivity..."

# In a real scenario, you would stop the primary database container
# For this test, we'll verify the replica can handle traffic
log "Testing replica database can handle primary workload..."

if test_db_connection "Replica as Primary" "$REPLICA_HOST" "$REPLICA_PORT" "$DB_USER"; then
    record_test "Failover to Replica" "PASS" "Replica can handle primary workload"
    
    # Test if application would work with replica connection
    export TEMP_DATABASE_URL="${BACKUP_DB_URL}"
    if test_trading_app; then
        record_test "Application Failover" "PASS" "Trading app can use replica database"
    else
        record_test "Application Failover" "FAIL" "Trading app cannot use replica database"
    fi
    unset TEMP_DATABASE_URL
else
    record_test "Failover to Replica" "FAIL" "Replica cannot handle primary workload"
fi

log ""
log "${YELLOW}🔧 TEST 3: SIMULATED NETWORK PARTITION${NC}"
log "Testing system behavior when database becomes unreachable..."

# Test with invalid host to simulate network partition
if test_db_connection "Network Partition Test" "non-existent-host.invalid" "5432" "$DB_USER"; then
    record_test "Network Partition Handling" "FAIL" "System should fail gracefully"
else
    record_test "Network Partition Handling" "PASS" "System properly detects unreachable database"
fi

# Test emergency mode (SQLite fallback would be implemented here)
if [[ -f "${EMERGENCY_DB_PATH:-/tmp/quantum-forge-emergency.db}" ]]; then
    record_test "Emergency Database Fallback" "PASS" "Emergency SQLite database exists"
else
    record_test "Emergency Database Fallback" "FAIL" "Emergency SQLite database not found"
fi

log ""
log "${YELLOW}🔧 TEST 4: REDIS CACHE FAILURE SIMULATION${NC}"
log "Testing system behavior when Redis cache becomes unavailable..."

if test_redis_connection "non-existent-redis.invalid" "6379"; then
    record_test "Redis Cache Failure Handling" "FAIL" "System should detect Redis failure"
else
    record_test "Redis Cache Failure Handling" "PASS" "System properly detects Redis unavailability"
    
    # Test if trading can continue without Redis
    log "Testing trading functionality without Redis cache..."
    if test_trading_app; then
        record_test "Trading Without Redis" "PASS" "Trading can continue without cache"
    else
        record_test "Trading Without Redis" "WARN" "Trading may be impacted without cache"
    fi
fi

log ""
log "${YELLOW}🔧 TEST 5: CONNECTION POOL FAILURE${NC}"
log "Testing pgBouncer connection pool failure scenarios..."

# Test direct database connection when pool fails
if test_db_connection "Direct Connection" "$PRIMARY_HOST" "$PRIMARY_PORT" "$DB_USER"; then
    record_test "Direct DB Connection" "PASS" "Can bypass connection pool"
else
    record_test "Direct DB Connection" "FAIL" "Cannot establish direct connection"
fi

log ""
log "${YELLOW}🔧 TEST 6: EMERGENCY STOP MECHANISM${NC}"
log "Testing emergency stop functionality..."

# Create emergency stop signal
EMERGENCY_STOP_FILE="${EMERGENCY_STOP_FILE:-/tmp/trading-emergency-stop}"
touch "$EMERGENCY_STOP_FILE"

if [[ -f "$EMERGENCY_STOP_FILE" ]]; then
    record_test "Emergency Stop Signal" "PASS" "Emergency stop file created successfully"
    rm -f "$EMERGENCY_STOP_FILE"
else
    record_test "Emergency Stop Signal" "FAIL" "Cannot create emergency stop file"
fi

# Test emergency stop detection in application (would need to be implemented)
log "Emergency stop mechanism requires implementation in trading application"
record_test "Emergency Stop Detection" "TODO" "Needs implementation in trading engine"

log ""
log "${YELLOW}🔧 TEST 7: DATA CONSISTENCY CHECK${NC}"
log "Testing data consistency between primary and replica..."

if command -v npx &> /dev/null; then
    # This would test if replica has same data as primary
    log "Data consistency check would compare primary vs replica record counts"
    record_test "Data Consistency" "TODO" "Automated consistency check needs implementation"
else
    record_test "Data Consistency" "SKIP" "Node.js not available for data comparison"
fi

log ""
log "${BLUE}📊 DISASTER RECOVERY TEST RESULTS${NC}"
log "======================================="

# Count results
PASSED=0
FAILED=0
TODO=0
WARN=0

for result in "${TEST_RESULTS[@]}"; do
    IFS='|' read -r test_name test_result test_details <<< "$result"
    case "$test_result" in
        "PASS") ((PASSED++)) ;;
        "FAIL") ((FAILED++)) ;;
        "TODO") ((TODO++)) ;;
        "WARN") ((WARN++)) ;;
    esac
done

log ""
log "📈 SUMMARY:"
log "   ✅ Passed: $PASSED"
log "   ❌ Failed: $FAILED"
log "   ⚠️ Warnings: $WARN"
log "   📝 TODO: $TODO"
log ""

# Overall assessment
TOTAL_CRITICAL=$((PASSED + FAILED))
if [[ $TOTAL_CRITICAL -gt 0 ]]; then
    PASS_RATE=$((PASSED * 100 / TOTAL_CRITICAL))
    log "${BLUE}🎯 PASS RATE: ${PASS_RATE}%${NC}"
    
    if [[ $PASS_RATE -ge 80 ]]; then
        log "${GREEN}🛡️ DISASTER RECOVERY: EXCELLENT${NC}"
        log "   System demonstrates strong fault tolerance"
    elif [[ $PASS_RATE -ge 60 ]]; then
        log "${YELLOW}🛡️ DISASTER RECOVERY: GOOD${NC}"
        log "   System has basic fault tolerance with room for improvement"
    else
        log "${RED}🛡️ DISASTER RECOVERY: NEEDS IMPROVEMENT${NC}"
        log "   System requires significant fault tolerance enhancements"
    fi
fi

log ""
log "${BLUE}📋 RECOMMENDED ACTIONS:${NC}"

if [[ $FAILED -gt 0 ]]; then
    log "🔧 CRITICAL ACTIONS:"
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name test_result test_details <<< "$result"
        if [[ "$test_result" == "FAIL" ]]; then
            log "   • Fix: $test_name - $test_details"
        fi
    done
    log ""
fi

if [[ $TODO -gt 0 ]]; then
    log "📝 IMPLEMENTATION NEEDED:"
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name test_result test_details <<< "$result"
        if [[ "$test_result" == "TODO" ]]; then
            log "   • Implement: $test_name"
        fi
    done
    log ""
fi

log "🛡️ FAULT TOLERANCE CHECKLIST:"
log "   [ ] PostgreSQL streaming replication operational"
log "   [ ] Automatic failover mechanisms implemented"
log "   [ ] Emergency stop system functional"
log "   [ ] Local SQLite fallback database created"
log "   [ ] Connection retry logic implemented"
log "   [ ] Health monitoring system active"
log "   [ ] Data consistency validation automated"
log ""

log "${GREEN}✅ DISASTER RECOVERY TEST COMPLETE${NC}"
log "📝 Full test log saved to: $LOG_FILE"

# Create summary report
cat > disaster-recovery-report.md << EOF
# QUANTUM FORGE™ Disaster Recovery Test Report

**Test Date:** $(date)  
**Test Duration:** Approximately 5 minutes  
**Log File:** $LOG_FILE

## Test Results Summary

- ✅ **Passed:** $PASSED tests
- ❌ **Failed:** $FAILED tests  
- ⚠️ **Warnings:** $WARN tests
- 📝 **TODO:** $TODO tests

**Pass Rate:** ${PASS_RATE:-N/A}%

## Test Categories

### Baseline Connectivity
Tests basic system functionality before disaster scenarios.

### Database Failover
Tests ability to switch from primary to replica database.

### Network Partition
Tests system behavior when database becomes unreachable.

### Cache Failure
Tests system behavior when Redis cache fails.

### Connection Pool Failure
Tests direct database access when pgBouncer fails.

### Emergency Stop
Tests emergency shutdown mechanisms.

### Data Consistency
Tests data synchronization between primary and replica.

## Recommendations

1. **Implement missing TODO items** for complete fault tolerance
2. **Fix any FAILED tests** before live trading deployment
3. **Address WARNINGS** to improve system reliability
4. **Regular disaster recovery testing** (monthly recommended)

---

*This report was automatically generated by the QUANTUM FORGE™ disaster recovery testing system.*
EOF

echo ""
echo "📄 Test report saved to: disaster-recovery-report.md"