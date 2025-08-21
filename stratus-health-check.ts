#!/usr/bin/env node

/**
 * Stratus Engine Health Check
 * 
 * Verifies that all components including the new Markov chain integration
 * are working correctly.
 */

import { getStratusEngineStatus } from './src/lib/global-stratus-engine-service';
import { markovPredictor } from './src/lib/markov-chain-predictor';
import { stratusEngine } from './src/lib/stratus-engine-ai';

interface HealthCheckResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function runHealthCheck(): Promise<void> {
  console.log('🏥 Stratus Engine Health Check');
  console.log('═'.repeat(50));
  
  const results: HealthCheckResult[] = [];
  let overallHealth = true;

  try {
    // 1. Check Global Engine Status
    console.log('\n📊 Checking Global Engine Status...');
    try {
      const status = await getStratusEngineStatus();
      
      if (status.isRunning) {
        results.push({
          component: 'Global Engine',
          status: 'PASS',
          message: `Running since ${status.startedAt?.toLocaleString()}`
        });
      } else {
        results.push({
          component: 'Global Engine',
          status: 'FAIL',
          message: 'Engine is not running'
        });
        overallHealth = false;
      }

      // Check individual components
      const components = status.components;
      const componentChecks = [
        { name: 'Market Data', data: components.marketData },
        { name: 'Input Optimizer', data: components.inputOptimizer },
        { name: 'Market Monitor', data: components.marketMonitor },
        { name: 'Alpaca Integration', data: components.alpacaIntegration },
        { name: 'Markov Predictor', data: components.markovPredictor }
      ];

      componentChecks.forEach(({ name, data }) => {
        if (data.active) {
          results.push({
            component: name,
            status: 'PASS',
            message: 'Active and running',
            details: data
          });
        } else {
          results.push({
            component: name,
            status: 'WARN',
            message: 'Component inactive'
          });
        }
      });

    } catch (error) {
      results.push({
        component: 'Global Engine',
        status: 'FAIL',
        message: `Status check failed: ${error instanceof Error ? error.message : String(error)}`
      });
      overallHealth = false;
    }

    // 2. Check Markov Chain Neural Predictor
    console.log('\n🧠 Checking Stratus Neural Predictor...');
    try {
      const llnMetrics = markovPredictor.getLLNConfidenceMetrics();
      
      results.push({
        component: 'Neural Predictor Core',
        status: 'PASS',
        message: `Status: ${llnMetrics.convergenceStatus}`,
        details: {
          reliability: `${(llnMetrics.overallReliability * 100).toFixed(1)}%`,
          confidence: `${(llnMetrics.currentAverageConfidence * 100).toFixed(1)}%`,
          tradesNeeded: llnMetrics.recommendedMinTrades
        }
      });

      // Check convergence status
      if (llnMetrics.convergenceStatus === 'CONVERGED') {
        results.push({
          component: 'Neural Learning',
          status: 'PASS',
          message: 'Fully converged - maximum prediction accuracy'
        });
      } else if (llnMetrics.convergenceStatus === 'CONVERGING') {
        results.push({
          component: 'Neural Learning',
          status: 'PASS',
          message: 'Actively converging - predictions improving'
        });
      } else {
        results.push({
          component: 'Neural Learning',
          status: 'WARN',
          message: `Still learning - needs ${llnMetrics.recommendedMinTrades} more trades`
        });
      }

    } catch (error) {
      results.push({
        component: 'Neural Predictor',
        status: 'FAIL',
        message: `Markov predictor error: ${error instanceof Error ? error.message : String(error)}`
      });
      overallHealth = false;
    }

    // 3. Test AI Trading Signal Generation
    console.log('\n🤖 Testing AI Signal Generation...');
    try {
      const testSymbol = 'BTCUSD';
      const decision = await stratusEngine.generateAITradingDecision(testSymbol);
      
      // Check if Markov enhancement is working
      if (decision.markovPrediction) {
        results.push({
          component: 'AI Signal Generation',
          status: 'PASS',
          message: 'Enhanced with Markov predictions',
          details: {
            aiScore: decision.aiScore,
            confidence: `${(decision.confidence * 100).toFixed(1)}%`,
            currentState: decision.markovPrediction.currentState,
            llnConfidence: decision.llnConfidence ? `${(decision.llnConfidence * 100).toFixed(1)}%` : 'N/A'
          }
        });
      } else {
        results.push({
          component: 'AI Signal Generation',
          status: 'WARN',
          message: 'Working but Markov enhancement missing'
        });
      }

    } catch (error) {
      results.push({
        component: 'AI Signal Generation',
        status: 'FAIL',
        message: `Signal generation failed: ${error instanceof Error ? error.message : String(error)}`
      });
      overallHealth = false;
    }

    // 4. Check Model Persistence
    console.log('\n💾 Checking Model Persistence...');
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const modelDir = path.join(process.cwd(), 'data', 'models');
      
      try {
        await fs.access(modelDir);
        results.push({
          component: 'Model Storage',
          status: 'PASS',
          message: 'Data directory exists'
        });
      } catch {
        results.push({
          component: 'Model Storage',
          status: 'WARN',
          message: 'Data directory not found (will be created)'
        });
      }

      // Test model export
      const modelData = markovPredictor.exportModel();
      if (modelData && JSON.parse(modelData)) {
        results.push({
          component: 'Model Export/Import',
          status: 'PASS',
          message: 'Model serialization working'
        });
      } else {
        results.push({
          component: 'Model Export/Import',
          status: 'FAIL',
          message: 'Model serialization failed'
        });
        overallHealth = false;
      }

    } catch (error) {
      results.push({
        component: 'Model Persistence',
        status: 'FAIL',
        message: `Persistence check failed: ${error instanceof Error ? error.message : String(error)}`
      });
      overallHealth = false;
    }

  } catch (error) {
    console.error('❌ Health check failed:', error);
    overallHealth = false;
  }

  // Display Results
  console.log('\n' + '═'.repeat(50));
  console.log('📋 HEALTH CHECK RESULTS');
  console.log('═'.repeat(50));

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component}: ${result.message}`);
    
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   │ ${key}: ${value}`);
      });
    }
  });

  // Overall Status
  console.log('\n' + '═'.repeat(50));
  const passCount = results.filter(r => r.status === 'PASS').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  console.log(`📊 Summary: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

  if (overallHealth && failCount === 0) {
    console.log('🎉 OVERALL STATUS: HEALTHY');
    console.log('✨ Stratus Engine with Neural Predictor is fully operational!');
  } else if (failCount === 0) {
    console.log('⚠️ OVERALL STATUS: FUNCTIONAL (with warnings)');
    console.log('💡 System is working but has some optimization opportunities');
  } else {
    console.log('❌ OVERALL STATUS: ISSUES DETECTED');
    console.log('🔧 Please resolve the failed components before trading');
  }

  console.log('\n🧠 Neural Predictor Status:');
  const llnMetrics = markovPredictor.getLLNConfidenceMetrics();
  console.log(`   Learning Stage: ${llnMetrics.convergenceStatus}`);
  console.log(`   Neural Confidence: ${(llnMetrics.overallReliability * 100).toFixed(1)}%`);
  if (llnMetrics.recommendedMinTrades > 0) {
    console.log(`   🚀 Evolution Points Needed: ${llnMetrics.recommendedMinTrades} trades to level up!`);
  } else {
    console.log('   🎯 Fully evolved - maximum prediction power unlocked!');
  }

  process.exit(overallHealth && failCount === 0 ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Health check interrupted');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Health check interrupted');
  process.exit(1);
});

// Run the health check
runHealthCheck().catch(error => {
  console.error('\n💥 Health check crashed:', error);
  process.exit(1);
});