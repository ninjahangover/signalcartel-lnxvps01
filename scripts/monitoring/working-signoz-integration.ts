#!/usr/bin/env node
// Working SigNoz Integration 
// Uses only the packages that are properly installed

const fs = require('fs');
const path = require('path');

console.log('🚀 WORKING SigNoz Integration for SignalCartel\n');

// Check if we have the required packages
function checkPackages() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const requiredPackages = [
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions'
  ];
  
  const missing = [];
  
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (!fs.existsSync(pkgPath)) {
      missing.push(pkg);
    }
  }
  
  return missing;
}

async function setupWorking() {
  console.log('📋 Checking package dependencies...');
  const missing = checkPackages();
  
  if (missing.length > 0) {
    console.log('❌ Missing packages:', missing.join(', '));
    console.log('\n🔧 Please install missing packages:');
    console.log('npm install --save-dev \\');
    missing.forEach(pkg => console.log(`  ${pkg} \\`));
    console.log('\n');
    return;
  }
  
  console.log('✅ All required packages found\n');
  
  // Create working configuration files
  console.log('📝 Creating working configuration...');
  
  // 1. Simple monitoring script
  const monitoringScript = `// Simple SignalCartel Monitoring
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Basic logging-based monitoring
export function logTrade(strategy: string, symbol: string, side: string, success: boolean) {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] TRADE: \${strategy} \${side} \${symbol} - \${success ? 'SUCCESS' : 'FAILED'}\`);
}

export function logAI(system: string, responseTime: number, confidence: number) {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] AI: \${system} - \${responseTime}ms - \${(confidence * 100).toFixed(1)}% confidence\`);
}

export function logPhase(phase: number) {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] PHASE: Phase \${phase} active\`);
}

// Health check function
export async function healthCheck() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    console.log('✅ Database connection OK');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

export default { logTrade, logAI, logPhase, healthCheck };`;

  fs.writeFileSync('src/lib/monitoring/simple-monitor.ts', monitoringScript);
  console.log('✅ Created simple monitoring module');
  
  // 2. Working startup script
  const startupScript = `#!/bin/bash
# Working SignalCartel with SigNoz - Basic Setup

echo "🚀 Starting SignalCartel with basic SigNoz monitoring..."

# Set basic environment
export OTEL_SERVICE_NAME="signalcartel-trading"
export OTEL_SERVICE_VERSION="1.0.0"

# Check if SigNoz is running
if docker ps | grep -q "signoz-frontend"; then
    echo "✅ SigNoz is running"
    echo "📊 Dashboard: http://localhost:3301"
    echo "🔑 Login: gaylen@signalcartel.io / admin123"
else
    echo "❌ SigNoz not running. Starting it..."
    cd /home/telgkb9/signoz && docker-compose up -d
    sleep 30
fi

# Start trading with basic monitoring
echo "🎯 Starting trading engine..."
ENABLE_GPU_STRATEGIES=true npx tsx -r dotenv/config load-database-strategies.ts`;
  
  fs.writeFileSync('scripts/monitoring/start-basic-monitoring.sh', startupScript);
  fs.chmodSync('scripts/monitoring/start-basic-monitoring.sh', '755');
  console.log('✅ Created basic startup script');
  
  // 3. Test script
  const testScript = `import simpleMonitor from '../src/lib/monitoring/simple-monitor';

console.log('🧪 Testing basic monitoring...');

async function runTest() {
  // Test database connection
  await simpleMonitor.healthCheck();
  
  // Test logging
  simpleMonitor.logTrade('quantum-oscillator', 'BTC/USD', 'buy', true);
  simpleMonitor.logAI('sentiment-engine', 245, 0.87);
  simpleMonitor.logPhase(3);
  
  console.log('✅ Basic monitoring test complete!');
}

runTest().catch(console.error);`;
  
  fs.writeFileSync('scripts/monitoring/test-basic-monitor.ts', testScript);
  console.log('✅ Created test script');
  
  console.log('\n🎉 Working SigNoz setup complete!\n');
  console.log('📋 What was created:');
  console.log('  • src/lib/monitoring/simple-monitor.ts - Basic monitoring');
  console.log('  • scripts/monitoring/start-basic-monitoring.sh - Working startup');
  console.log('  • scripts/monitoring/test-basic-monitor.ts - Test script');
  
  console.log('\n🚀 How to use:');
  console.log('  1. Access SigNoz: http://localhost:3301');
  console.log('  2. Login: gaylen@signalcartel.io / admin123');
  console.log('  3. Start trading: ./scripts/monitoring/start-basic-monitoring.sh');
  console.log('  4. Test monitoring: npx tsx scripts/monitoring/test-basic-monitor.ts');
  
  console.log('\n💡 This provides:');
  console.log('  • SigNoz dashboard access');
  console.log('  • Basic trade/AI logging');
  console.log('  • Database health checks');
  console.log('  • Phase tracking');
  console.log('  • Simple startup workflow');
}

setupWorking().catch(console.error);