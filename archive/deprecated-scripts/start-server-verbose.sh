#!/bin/bash

# Signal Cartel Trading System - Verbose Server Startup Script
# Shows all output directly in terminal for debugging

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} Signal Cartel Trading System - Verbose Startup${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}📺 All output will be shown in terminal${NC}"
echo -e "${YELLOW}📝 This mode is for debugging - services run in foreground${NC}"
echo ""

# Function to run command with output
run_with_output() {
    local name="$1"
    local command="$2"
    
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🚀 Starting: $name${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    
    # Run the command and show all output
    eval "$command" 2>&1 | while IFS= read -r line; do
        echo -e "${GREEN}[$name]${NC} $line"
    done
    
    local exit_code=${PIPESTATUS[0]}
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $name completed successfully${NC}"
    else
        echo -e "${RED}❌ $name failed with exit code $exit_code${NC}"
        return $exit_code
    fi
}

echo -e "\n${PURPLE}📋 STEP 1: Environment Check${NC}"
echo "================================================"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

echo -e "\n${PURPLE}📋 STEP 2: Dependencies${NC}"
echo "================================================"

if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    run_with_output "npm-install" "npm install"
fi

echo -e "\n${PURPLE}📋 STEP 3: Database Setup${NC}"
echo "================================================"

if [ -f "prisma/schema.prisma" ]; then
    echo -e "${CYAN}🗄️  Setting up database...${NC}"
    
    # Generate Prisma client
    run_with_output "prisma-generate" "npx prisma generate"
    
    # Run migrations
    if [ ! -f "prisma/dev.db" ]; then
        echo -e "${YELLOW}🔧 Creating database...${NC}"
        run_with_output "prisma-migrate" "npx prisma migrate dev --name init"
    else
        echo -e "${YELLOW}🔧 Applying migrations...${NC}"
        run_with_output "prisma-migrate" "npx prisma migrate deploy"
    fi
fi

echo -e "\n${PURPLE}📋 STEP 4: Start Development Server${NC}"
echo "================================================"

echo -e "${CYAN}🌐 Starting Next.js development server...${NC}"
echo -e "${YELLOW}💡 Server will start on http://localhost:3001${NC}"
echo -e "${YELLOW}⏰ First compile may take 30-60 seconds${NC}"
echo -e "${YELLOW}🛑 Press Ctrl+C to stop the server${NC}"
echo ""

# Start the dev server with all output visible
npm run dev 2>&1 | while IFS= read -r line; do
    # Color-code different types of messages
    case "$line" in
        *"Error"*|*"error"*|*"ERROR"*)
            echo -e "${RED}[Next.js]${NC} $line"
            ;;
        *"Warning"*|*"warning"*|*"WARN"*)
            echo -e "${YELLOW}[Next.js]${NC} $line"
            ;;
        *"Compiled"*|*"Ready"*|*"started"*)
            echo -e "${GREEN}[Next.js]${NC} $line"
            ;;
        *"GET"*|*"POST"*|*"PUT"*|*"DELETE"*)
            echo -e "${CYAN}[Next.js]${NC} $line"
            ;;
        *)
            echo -e "${NC}[Next.js] $line"
            ;;
    esac
done

echo -e "\n${RED}Server stopped${NC}"