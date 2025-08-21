#!/usr/bin/env tsx

/**
 * Diagnose Stratus Engine Components
 * 
 * Check why engine components are showing as inactive
 * Run with: npx tsx diagnose-stratus-engine.ts
 */

// Load environment variables from .env.local and .env
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local first (takes priority)
try {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envLocalContent = readFileSync(envLocalPath, 'utf8');
  const envLocalVars = envLocalContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
  
  Object.assign(process.env, envLocalVars);
} catch (error) {
  console.log('⚠️ Could not load .env.local, using .env fallback');
}

// Load .env as fallback
config();

console.log('🔍 STRATUS ENGINE COMPONENT DIAGNOSIS');
console.log('='.repeat(60));

async function diagnoseComponents() {
  try {
    console.log('🧪 Starting component diagnosis...\n');

    // 1. Check Global Stratus Engine
    console.log('🧠 1. Global Stratus Engine Service:');
    try {
      const { globalStratusEngine, getStratusEngineStatus } = await import('./src/lib/global-stratus-engine-service');
      const status = await getStratusEngineStatus();
      
      console.log(`   Engine Running: ${status.isRunning ? '✅ YES' : '❌ NO'}`);
      console.log(`   Started At: ${status.startedAt || 'Never'}`);
      console.log(`   Last Update: ${status.lastUpdate || 'Never'}`);
      console.log(`   Components Available: ${status.components ? '✅ YES' : '❌ NO'}`);
      
      if (status.components) {
        console.log('   Component Status:');
        console.log(`     - Input Optimizer: ${status.components.inputOptimizer?.active ? '✅ ACTIVE' : '❌ INACTIVE'} (${status.components.inputOptimizer?.strategyCount || 0} strategies)`);
        console.log(`     - Market Monitor: ${status.components.marketMonitor?.active ? '✅ ACTIVE' : '❌ INACTIVE'} (${status.components.marketMonitor?.symbolCount || 0} symbols)`);
        console.log(`     - Market Data: ${status.components.marketData?.active ? '✅ ACTIVE' : '❌ INACTIVE'} (${status.components.marketData?.confidence?.toFixed(1) || 0}% confidence)`);
        console.log(`     - Alpaca Integration: ${status.components.alpacaIntegration?.active ? '✅ ACTIVE' : '❌ INACTIVE'} (${status.components.alpacaIntegration?.tradeCount || 0} trades)`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n📊 2. Market Data Collector:');
    try {
      const { marketDataCollector } = await import('./src/lib/market-data-collector');
      const isActive = marketDataCollector.isCollectionActive();
      const status = await marketDataCollector.getCollectionStatus();
      
      console.log(`   Collection Active: ${isActive ? '✅ YES' : '❌ NO'}`);
      console.log(`   Collection Status: ${status.length} symbols configured`);
      
      if (status.length > 0) {
        console.log('   Symbol Status:');
        status.slice(0, 5).forEach(s => {
          console.log(`     - ${s.symbol}: ${s.status} (${s.successCount}/${s.totalRequests} success)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n🎯 3. Pine Script Input Optimizer:');
    try {
      const { pineScriptInputOptimizer } = await import('./src/lib/pine-script-input-optimizer');
      const isRunning = pineScriptInputOptimizer.isRunning?.();
      const history = pineScriptInputOptimizer.getOptimizationHistory?.() || [];
      
      console.log(`   Optimizer Running: ${isRunning ? '✅ YES' : '❌ NO'}`);
      console.log(`   Optimization History: ${history.length} optimizations`);
      
      if (history.length > 0) {
        const latest = history[history.length - 1];
        console.log(`   Latest Optimization: ${latest.strategyId} (${latest.timestamp})`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n🌊 4. Real-Time Market Monitor:');
    try {
      const { realTimeMarketMonitor } = await import('./src/lib/real-time-market-monitor');
      const conditions = realTimeMarketMonitor.getCurrentConditions?.() || new Map();
      const events = realTimeMarketMonitor.getRecentEvents?.() || [];
      
      console.log(`   Monitor Active: ${conditions.size > 0 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Monitored Symbols: ${conditions.size}`);
      console.log(`   Recent Events: ${events.length}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n🦙 5. Alpaca Integration:');
    try {
      const { alpacaStratusIntegration } = await import('./src/lib/alpaca-stratus-integration');
      const history = alpacaStratusIntegration.getTradeHistory?.() || [];
      
      console.log(`   Integration Active: ${history.length > 0 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Trade History: ${history.length} trades`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n🔄 6. Persistent Engine Manager:');
    try {
      const { persistentEngine } = await import('./src/lib/persistent-engine-manager');
      const isRunning = persistentEngine.isRunning();
      const state = persistentEngine.getState();
      
      console.log(`   Persistent Engine Running: ${isRunning ? '✅ YES' : '❌ NO'}`);
      console.log(`   Engine Started At: ${state.startedAt || 'Never'}`);
      console.log(`   Last Activity: ${state.lastActivity || 'Never'}`);
      console.log(`   Component Stats Available: ${Object.keys(state.componentStats || {}).length} components`);
      
      if (state.componentStats) {
        console.log('   Component Stats:');
        Object.entries(state.componentStats).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value ? '✅' : '❌'}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // 7. Test API Endpoints
    console.log('\n🌐 7. API Endpoints (if server running):');
    try {
      // Test if we can reach the market data API
      const response = await fetch('http://localhost:3001/api/market-data/status');
      if (response.ok) {
        const data = await response.json();
        console.log(`   Market Data API: ✅ WORKING`);
        console.log(`   Collection Active: ${data.data?.isCollecting ? '✅ YES' : '❌ NO'}`);
        console.log(`   Symbols: ${data.data?.symbols?.length || 0}`);
      } else {
        console.log(`   Market Data API: ❌ HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   Market Data API: ❌ Server not running (${error.message})`);
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

async function main() {
  await diagnoseComponents();
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATIONS:');
  console.log('='.repeat(60));
  
  console.log('1. If Persistent Engine is not running:');
  console.log('   - The engine may need to be started properly');
  console.log('   - Try: await startGlobalStratusEngine() from the web interface');
  
  console.log('\n2. If Market Data Collector is inactive:');
  console.log('   - Market data collection may not be started');
  console.log('   - Try the "🚀 Start Real Data Collection" button');
  
  console.log('\n3. If components show as inactive:');
  console.log('   - Individual services may need initialization');
  console.log('   - Check if the web server is running (./start-server.sh)');
  
  console.log('\n4. If APIs are unreachable:');
  console.log('   - Start the web server: ./start-server.sh');
  console.log('   - Then try the Start System button again');

  console.log('\n🔧 Run this diagnosis again after making changes to see improvements');
}

main().catch(console.error);