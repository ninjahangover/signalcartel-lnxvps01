#!/bin/bash

# Signal Cartel Live - Debian 12 Server Deployment Script
# Optimized for external server deployment (not Netlify)

set -e

echo "🚀 Signal Cartel Live - Debian 12 Server Deployment"
echo "===================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the signal-cartel-live directory."
    exit 1
fi

echo "📂 Current directory: $(pwd)"
echo "🐧 Debian 12 server deployment (API routes enabled)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if command -v bun &> /dev/null; then
    echo "Using Bun..."
    bun install
else
    echo "Using npm..."
    npm install
fi

# Build for production
echo ""
echo "🔨 Building for external server..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

echo ""
echo "✅ Build successful! API routes enabled:"
echo "   ƒ /api/kraken-proxy (Dynamic)"

# Check if PM2 is available
echo ""
if command -v pm2 &> /dev/null; then
    echo "🚀 Starting with PM2..."
    pm2 stop signal-cartel 2>/dev/null || true
    pm2 delete signal-cartel 2>/dev/null || true
    pm2 start npm --name "signal-cartel" -- start
    pm2 save
    echo ""
    echo "✅ Signal Cartel is now running with PM2!"
    echo "📊 Check status: pm2 status"
    echo "📋 View logs: pm2 logs signal-cartel"
    echo "🔄 Restart: pm2 restart signal-cartel"
    echo "🌐 App running on: http://localhost:3000"
else
    echo "⚠️  PM2 not found. Starting directly..."
    echo "💡 For production, consider installing PM2: npm install -g pm2"
    echo ""
    echo "🚀 Starting Signal Cartel on port 3000..."
    echo "Press Ctrl+C to stop"
    npm start
fi

echo ""
echo "🎯 Deployment complete!"
echo "🌐 Configure your reverse proxy to point to port 3000"
echo "🧪 Test the '🧪 Test API' button to verify Kraken integration"
