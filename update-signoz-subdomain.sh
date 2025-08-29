#!/bin/bash
# Update SigNoz to use monitor.pixelraidersystems.com

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Updating SigNoz Subdomain Configuration${NC}"
echo "=============================================="
echo

echo -e "${YELLOW}📋 Changes being made:${NC}"
echo "• FROM: monitor.pixelraiders.tech"
echo "• TO:   monitor.pixelraidersystems.com"
echo

echo -e "${BLUE}📊 Complete Infrastructure Layout:${NC}"
echo "=================================="
echo "🌐 Main Sites:"
echo "  • pixelraidersystems.com → WordPress"
echo "  • pixelraiders.tech → App (port 3000)"
echo ""
echo "📊 Monitoring & Analytics:"
echo "  • monitor.pixelraidersystems.com → SigNoz (port 3301)"
echo ""
echo "🗄️ Databases:"
echo "  • db-primary.pixelraidersystems.com → PostgreSQL Primary (port 5432)"
echo "  • db.pixelraidersystems.com → SignalCartel DB (port 5433)"
echo "  • analytics.pixelraidersystems.com → Analytics DB (port 5434)"
echo ""
echo "🔄 Cache:"
echo "  • cache.pixelraidersystems.com → Redis (port 6379)"
echo

echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "============="
echo "1. Update DNS record:"
echo "   Create A record: monitor.pixelraidersystems.com → Your server IP"
echo ""
echo "2. Apply the new configuration:"
echo "   cp Caddyfile.final Caddyfile"
echo ""
echo "3. Reload Caddy:"
echo "   caddy reload  # or restart your Caddy container"
echo ""
echo "4. Wait for DNS propagation (5-15 minutes)"
echo ""
echo "5. Test the new URL:"
echo "   curl -I https://monitor.pixelraidersystems.com"
echo "   # Should show SigNoz interface"
echo ""
echo "6. Update any bookmarks/links to use new URL"

echo
echo -e "${GREEN}✅ Benefits of this change:${NC}"
echo "• Consistent subdomain structure (all .pixelraidersystems.com)"
echo "• Better organization and management"
echo "• Clearer separation of services"
echo "• Future-proof for additional monitoring tools"

echo
echo -e "${BLUE}🧪 Test Commands (after DNS update):${NC}"
echo "====================================="
echo "# Test SigNoz access:"
echo "curl -I https://monitor.pixelraidersystems.com"
echo ""
echo "# Test login page:"
echo "curl -s https://monitor.pixelraidersystems.com | grep -i signoz"
echo ""
echo "# Test API endpoint:"
echo "curl -s https://monitor.pixelraidersystems.com/api/v1/version"

echo
echo -e "${YELLOW}📝 SigNoz Login Details:${NC}"
echo "========================"
echo "URL: https://monitor.pixelraidersystems.com"
echo "Email: gaylen@signalcartel.io"
echo "Password: admin123"

echo
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 Ready to update subdomain!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"