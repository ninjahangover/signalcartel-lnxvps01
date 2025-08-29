#!/bin/bash
# Caddy Configuration Test Script
# Tests the fixed configuration before applying

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Caddy Configuration Test${NC}"
echo "=============================="
echo

# Function to test Caddy syntax
test_caddy_syntax() {
    local config_file="$1"
    local config_name="$2"
    
    echo -e "${YELLOW}Testing $config_name...${NC}"
    
    if caddy validate --config "$config_file" 2>/dev/null; then
        echo -e "${GREEN}✅ $config_name: Syntax valid${NC}"
        return 0
    else
        echo -e "${RED}❌ $config_name: Syntax error${NC}"
        caddy validate --config "$config_file"
        return 1
    fi
}

# Function to test local ports
test_local_ports() {
    echo -e "${YELLOW}🔍 Testing local service availability...${NC}"
    
    local ports=(5432 5433 5434 6379 3301)
    local port_names=("PostgreSQL Primary" "SignalCartel DB" "Analytics DB" "Redis Cache" "SigNoz")
    
    for i in "${!ports[@]}"; do
        port="${ports[i]}"
        name="${port_names[i]}"
        
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "${GREEN}✅ Port $port ($name): Available${NC}"
        else
            echo -e "${YELLOW}⚠️  Port $port ($name): Not available${NC}"
        fi
    done
    echo
}

# Function to show configuration differences
show_differences() {
    echo -e "${BLUE}📊 Configuration Changes Summary:${NC}"
    echo "=================================="
    echo
    echo -e "${RED}❌ Issues in original Caddyfile:${NC}"
    echo "• Duplicate 'db.pixelraidersystems.com' entries (3 times)"
    echo "• Multiple ports competing for same hostname"
    echo "• Typo: 'Strict-Transport-Secuirty' missing 'i'"
    echo "• Cascading logs due to conflicts"
    echo
    echo -e "${GREEN}✅ Fixed in new configurations:${NC}"
    echo "• Single hostname per service (subdomains approach)"
    echo "• OR path-based routing with handle_path (paths approach)"
    echo "• Fixed security header typo"
    echo "• Clear service separation"
    echo
}

# Main test execution
echo -e "${YELLOW}🧪 Running configuration tests...${NC}"
echo

# Test original config
if [ -f "Caddyfile" ]; then
    test_caddy_syntax "Caddyfile" "Original Caddyfile"
else
    echo -e "${RED}❌ Original Caddyfile not found${NC}"
fi

echo

# Test fixed configs
if [ -f "Caddyfile.fixed" ]; then
    test_caddy_syntax "Caddyfile.fixed" "Path-based routing fix"
else
    echo -e "${RED}❌ Caddyfile.fixed not found${NC}"
fi

echo

if [ -f "Caddyfile.subdomains" ]; then
    test_caddy_syntax "Caddyfile.subdomains" "Subdomain-based fix (RECOMMENDED)"
else
    echo -e "${RED}❌ Caddyfile.subdomains not found${NC}"
fi

echo

# Test local services
test_local_ports

# Show differences
show_differences

echo -e "${BLUE}🎯 Recommendations:${NC}"
echo "=================="
echo
echo -e "${GREEN}1. Use subdomain approach (Caddyfile.subdomains):${NC}"
echo "   • db-primary.pixelraidersystems.com → PostgreSQL Primary (5432)"
echo "   • db.pixelraidersystems.com → SignalCartel DB (5433)"
echo "   • analytics.pixelraidersystems.com → Analytics DB (5434)"
echo "   • cache.pixelraidersystems.com → Redis Cache (6379)"
echo
echo -e "${YELLOW}2. Update DNS records for new subdomains${NC}"
echo
echo -e "${BLUE}3. Apply the configuration:${NC}"
echo "   cp Caddyfile.subdomains Caddyfile"
echo "   caddy reload"
echo
echo -e "${GREEN}4. Test the configuration:${NC}"
echo "   curl -I https://db.pixelraidersystems.com"
echo "   curl -I https://analytics.pixelraidersystems.com"
echo "   curl -I https://cache.pixelraidersystems.com"
echo

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Configuration analysis complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"