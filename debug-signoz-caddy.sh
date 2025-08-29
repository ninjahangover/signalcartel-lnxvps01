#!/bin/bash
# SigNoz Caddy Configuration Debug Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 SigNoz Caddy Configuration Debug${NC}"
echo "===================================="
echo

# Function to test service availability
test_service() {
    local url="$1"
    local description="$2"
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "URL: $url"
    
    if curl -I -k --connect-timeout 10 "$url" 2>/dev/null | head -1; then
        echo -e "${GREEN}✅ $description: Accessible${NC}"
    else
        echo -e "${RED}❌ $description: Not accessible${NC}"
    fi
    echo
}

# Check local SigNoz service
echo -e "${BLUE}📋 Step 1: Local Service Check${NC}"
echo "==============================="

test_service "http://localhost:3301" "SigNoz Local HTTP"
test_service "http://127.0.0.1:3301" "SigNoz Local 127.0.0.1"

# Check SigNoz API endpoints
echo -e "${BLUE}📋 Step 2: SigNoz API Check${NC}"
echo "==========================="

test_service "http://localhost:3301/api/v1/health" "SigNoz Health API"
test_service "http://localhost:3301/api/v1/version" "SigNoz Version API"

# Check external IP if specified
echo -e "${BLUE}📋 Step 3: External IP Check${NC}"
echo "=========================="

test_service "http://173.208.142.43:3301" "SigNoz External IP"

# Check domain resolution
echo -e "${BLUE}📋 Step 4: DNS Resolution Check${NC}"
echo "=============================="

echo -e "${YELLOW}DNS Lookup for monitor.pixelraiders.tech:${NC}"
nslookup monitor.pixelraiders.tech 2>/dev/null | grep -A 2 "Name:"

echo
echo -e "${YELLOW}DNS Lookup for monitor.pixelraider.tech:${NC}"
nslookup monitor.pixelraider.tech 2>/dev/null | grep -A 2 "Name:"

# Test HTTPS access
echo
echo -e "${BLUE}📋 Step 5: HTTPS Access Test${NC}"
echo "============================"

test_service "https://monitor.pixelraiders.tech" "monitor.pixelraiders.tech HTTPS"
test_service "https://monitor.pixelraider.tech" "monitor.pixelraider.tech HTTPS"

# Check Caddy logs (if accessible)
echo -e "${BLUE}📋 Step 6: Configuration Analysis${NC}"
echo "==============================="

echo -e "${YELLOW}Current Caddyfile issues:${NC}"
if [ -f "Caddyfile" ]; then
    echo "• Line 17 has typo: 'Strict-Transport-Secuirty' (missing 'i')"
    if grep -q "173.208.142.43:3301" Caddyfile; then
        echo "• Using external IP instead of localhost"
    fi
    if grep -c "monitor.pixelraiders.tech" Caddyfile; then
        echo "• Found monitor.pixelraiders.tech configuration"
    fi
else
    echo "• Caddyfile not found in current directory"
fi

echo
echo -e "${GREEN}Recommended fixes:${NC}"
echo "• Fix typo: Change 'Secuirty' to 'Security'"
echo "• Use 'localhost:3301' instead of '173.208.142.43:3301'"
echo "• Ensure DNS record points to correct server"
echo "• Add proper proxy headers for SigNoz"

echo
echo -e "${BLUE}📋 Step 7: SigNoz Container Status${NC}"
echo "==============================="

echo -e "${YELLOW}Checking SigNoz containers:${NC}"
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -i signoz || echo "No SigNoz containers found"
else
    echo "Docker command not available"
fi

echo
echo -e "${BLUE}📋 Recommended Actions:${NC}"
echo "======================="
echo
echo "1. Fix Caddyfile configuration:"
echo "   cp Caddyfile.corrected Caddyfile"
echo
echo "2. Verify DNS record for monitor.pixelraiders.tech points to your server"
echo
echo "3. Reload Caddy configuration:"
echo "   caddy reload  # or restart your Caddy container"
echo
echo "4. Test after changes:"
echo "   curl -I https://monitor.pixelraiders.tech"
echo
echo "5. Check Caddy logs for any SSL certificate issues"

echo
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 Debug analysis complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"