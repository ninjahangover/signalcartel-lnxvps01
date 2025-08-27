#!/usr/bin/env npx tsx
/**
 * Phase Transition Status Monitor
 * Shows current phase and analyzes readiness for next phase
 */

import { phaseManager } from '../src/lib/quantum-forge-phase-config';
import { adaptivePhaseManager } from '../src/lib/quantum-forge-adaptive-phase-manager';

async function checkPhaseTransitionStatus() {
  console.log('🎯 QUANTUM FORGE™ PHASE TRANSITION ANALYSIS');
  console.log('=' .repeat(80));
  
  try {
    // Get current phase status
    const currentPhase = await phaseManager.getCurrentPhase();
    const progress = await phaseManager.getProgressToNextPhase();
    const overrideStatus = phaseManager.getOverrideStatus();
    
    console.log('📊 CURRENT PHASE STATUS:');
    console.log(`   Phase: ${currentPhase.phase} - ${currentPhase.name}`);
    console.log(`   Mode: ${overrideStatus.mode.toUpperCase()}`);
    console.log(`   Completed Trades: ${progress.currentTrades}`);
    console.log(`   Progress: ${progress.progress}% to next phase`);
    console.log(`   Trades Needed: ${progress.tradesNeeded} more`);
    console.log(`   Description: ${currentPhase.description}`);
    
    // Show current phase features
    console.log('\n🎛️ ACTIVE FEATURES:');
    console.log(`   Confidence Threshold: ${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`   Sentiment Analysis: ${currentPhase.features.sentimentEnabled ? '✅' : '❌'}`);
    console.log(`   Order Book Intelligence: ${currentPhase.features.orderBookEnabled ? '✅' : '❌'}`);
    console.log(`   Multi-Layer AI: ${currentPhase.features.multiLayerAIEnabled ? '✅' : '❌'}`);
    console.log(`   Mathematical Intuition: ${currentPhase.features.mathematicalIntuitionEnabled ? '✅' : '❌'}`);
    console.log(`   Position Size: ${(currentPhase.features.positionSizing * 100).toFixed(1)}% per trade`);
    
    // Analyze adaptive readiness if we have enough data
    if (progress.currentTrades >= 10) {
      console.log('\n🧠 ADAPTIVE PHASE INTELLIGENCE ANALYSIS:');
      console.log('='.repeat(60));
      
      const readiness = await adaptivePhaseManager.analyzePhaseReadiness();
      
      console.log('📈 PERFORMANCE METRICS:');
      console.log(`   Total Trades: ${readiness.metrics.totalTrades}`);
      console.log(`   Win Rate: ${(readiness.metrics.winRate * 100).toFixed(1)}%`);
      console.log(`   Average P&L: $${readiness.metrics.avgPnL.toFixed(2)}`);
      console.log(`   Profit Factor: ${readiness.metrics.profitFactor.toFixed(2)}`);
      console.log(`   Max Drawdown: ${(readiness.metrics.maxDrawdown * 100).toFixed(1)}%`);
      console.log(`   Consistency: ${(readiness.metrics.consistency * 100).toFixed(1)}%`);
      console.log(`   Data Quality: ${(readiness.metrics.dataQuality * 100).toFixed(1)}%`);
      
      console.log('\n🔍 READINESS ANALYSIS:');
      readiness.analysis.forEach(score => {
        const percentage = (score.score * 100).toFixed(1);
        const status = score.score >= 0.7 ? '✅' : score.score >= 0.4 ? '⚠️' : '❌';
        console.log(`   ${status} ${score.metric}: ${percentage}% (${score.reasoning})`);
      });
      
      console.log(`\n🎯 OVERALL READINESS: ${(readiness.readinessScore * 100).toFixed(1)}%`);
      console.log(`📊 RECOMMENDED PHASE: ${readiness.recommendedPhase}`);
      console.log(`🔮 CONFIDENCE: ${(readiness.confidence * 100).toFixed(1)}%`);
      console.log(`💡 RECOMMENDATION: ${readiness.recommendation}`);
      
      // Get decision
      const decision = await adaptivePhaseManager.makePhaseDecision();
      console.log('\n⚡ ADAPTIVE DECISION:');
      console.log(`   Action: ${decision.action.toUpperCase()}`);
      console.log(`   Target Phase: ${decision.targetPhase}`);
      console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${decision.reasoning}`);
      
    } else {
      console.log('\n📊 ADAPTIVE ANALYSIS:');
      console.log(`   ⏳ Need ${10 - progress.currentTrades} more trades for performance analysis`);
      console.log(`   🎯 Focus: Data collection in Phase 0 with ultra-low barriers`);
    }
    
    // Show next phases preview
    console.log('\n🗺️ PHASE ROADMAP:');
    const phases = [
      { phase: 0, name: 'Data Collection', trades: '0-100', features: 'Raw signals only' },
      { phase: 1, name: 'Basic Sentiment', trades: '100-500', features: 'Fear&Greed + Reddit' },
      { phase: 2, name: 'Multi-Source Sentiment', trades: '500-1000', features: '9 sentiment sources' },
      { phase: 3, name: 'Order Book Intelligence', trades: '1000-2000', features: 'Market microstructure' },
      { phase: 4, name: 'Full QUANTUM FORGE™', trades: '2000+', features: 'Complete AI suite' }
    ];
    
    phases.forEach(p => {
      const current = p.phase === currentPhase.phase ? ' ← CURRENT' : '';
      const status = p.phase < currentPhase.phase ? '✅' : p.phase === currentPhase.phase ? '🔥' : '⏳';
      console.log(`   ${status} Phase ${p.phase}: ${p.name} (${p.trades} trades) - ${p.features}${current}`);
    });
    
    console.log('\n💡 TRANSITION STRATEGY:');
    console.log('   📈 HARDCODED MINIMUMS: Safety thresholds based on trade count');
    console.log('   🧠 ADAPTIVE INTELLIGENCE: Performance-based advancement');
    console.log('   🎯 HYBRID APPROACH: Uses both for optimal phase timing');
    
  } catch (error) {
    console.error('❌ Phase analysis error:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 PHASE TRANSITION ANALYSIS COMPLETE');
  console.log('\nNEXT STEPS:');
  console.log('   1. Start trading with current phase configuration');
  console.log('   2. Monitor this status regularly as trades accumulate');
  console.log('   3. System will auto-advance when ready OR you can force transitions');
}

checkPhaseTransitionStatus().catch(console.error);