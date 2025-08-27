/**
 * QUANTUM FORGE™ PHASED INTELLIGENCE ACTIVATION
 * Gradually enables AI/ML features based on data accumulation
 */

import { prisma } from './prisma';

export interface PhaseConfig {
  phase: number;
  name: string;
  minTrades: number;
  maxTrades: number;
  features: {
    // Core Strategy Settings
    baseStrategyEnabled: boolean;
    confidenceThreshold: number;
    
    // Sentiment Intelligence
    sentimentEnabled: boolean;
    sentimentSources: string[];
    sentimentThreshold: number;
    
    // Order Book Intelligence
    orderBookEnabled: boolean;
    orderBookThreshold: number;
    
    // Advanced AI Features
    multiLayerAIEnabled: boolean;
    mathematicalIntuitionEnabled: boolean;
    markovChainEnabled: boolean;
    
    // Risk Management
    positionSizing: number; // % of portfolio
    stopLossEnabled: boolean;
    stopLossPercent: number;
    takeProfitEnabled: boolean;
    takeProfitPercent: number;
    
    // Validation Requirements
    requireSentimentAlignment: boolean;
    requireOrderBookConfirmation: boolean;
    requireMultiLayerConsensus: boolean;
  };
  targetWinRate: number;
  description: string;
}

const PHASE_CONFIGURATIONS: PhaseConfig[] = [
  {
    phase: 0,
    name: "Maximum Data Collection Phase",
    minTrades: 0,
    maxTrades: 100,
    features: {
      // ULTRA-LOW barriers for maximum trades
      baseStrategyEnabled: true,
      confidenceThreshold: 0.10, // Extremely low - accept almost any signal
      
      // No intelligent filters
      sentimentEnabled: false,
      sentimentSources: [],
      sentimentThreshold: 0,
      
      // No advanced features
      orderBookEnabled: false,
      orderBookThreshold: 0,
      
      // All AI disabled - raw signals only
      multiLayerAIEnabled: false,
      mathematicalIntuitionEnabled: false,
      markovChainEnabled: false,
      
      // Small positions to minimize risk while learning
      positionSizing: 0.01, // 1% per trade - smaller risk
      stopLossEnabled: true,
      stopLossPercent: 10, // Wide stop loss - let trades breathe
      takeProfitEnabled: true, 
      takeProfitPercent: 10, // Wide take profit
      
      // No validation - execute everything
      requireSentimentAlignment: false,
      requireOrderBookConfirmation: false,
      requireMultiLayerConsensus: false
    },
    targetWinRate: 30, // Don't care about win rate yet
    description: "MAXIMUM TRADES: Gathering raw market data. Win rate doesn't matter."
  },
  
  {
    phase: 1,
    name: "Basic Sentiment Phase",
    minTrades: 100,
    maxTrades: 500,
    features: {
      baseStrategyEnabled: true,
      confidenceThreshold: 0.40,
      
      // Enable basic sentiment
      sentimentEnabled: true,
      sentimentSources: ['fear_greed', 'reddit'],
      sentimentThreshold: 0.30,
      
      orderBookEnabled: false,
      orderBookThreshold: 0,
      
      multiLayerAIEnabled: false,
      mathematicalIntuitionEnabled: false,
      markovChainEnabled: false,
      
      positionSizing: 0.015,
      stopLossEnabled: true,
      stopLossPercent: 4,
      takeProfitEnabled: true,
      takeProfitPercent: 6,
      
      requireSentimentAlignment: false, // Still loose
      requireOrderBookConfirmation: false,
      requireMultiLayerConsensus: false
    },
    targetWinRate: 42,
    description: "Adding basic sentiment validation. Slight improvement expected."
  },
  
  {
    phase: 2,
    name: "Multi-Source Sentiment Phase",
    minTrades: 500,
    maxTrades: 1000,
    features: {
      baseStrategyEnabled: true,
      confidenceThreshold: 0.50,
      
      // Enable all sentiment sources
      sentimentEnabled: true,
      sentimentSources: [
        'fear_greed', 'reddit', 'news', 'on_chain',
        'twitter', 'whale_movements', 'exchange_flows',
        'google_trends', 'economic_indicators'
      ],
      sentimentThreshold: 0.40,
      
      orderBookEnabled: false,
      orderBookThreshold: 0,
      
      // Start testing advanced features
      multiLayerAIEnabled: false,
      mathematicalIntuitionEnabled: true, // Enable intuition
      markovChainEnabled: false,
      
      positionSizing: 0.012,
      stopLossEnabled: true,
      stopLossPercent: 3,
      takeProfitEnabled: true,
      takeProfitPercent: 7,
      
      requireSentimentAlignment: true, // Now required
      requireOrderBookConfirmation: false,
      requireMultiLayerConsensus: false
    },
    targetWinRate: 48,
    description: "Full sentiment suite active. Mathematical intuition testing."
  },
  
  {
    phase: 3,
    name: "Order Book Intelligence Phase",
    minTrades: 1000,
    maxTrades: 2000,
    features: {
      baseStrategyEnabled: true,
      confidenceThreshold: 0.60,
      
      sentimentEnabled: true,
      sentimentSources: [
        'fear_greed', 'reddit', 'news', 'on_chain',
        'twitter', 'whale_movements', 'exchange_flows',
        'google_trends', 'economic_indicators'
      ],
      sentimentThreshold: 0.50,
      
      // Enable order book
      orderBookEnabled: true,
      orderBookThreshold: 0.40,
      
      // More AI features
      multiLayerAIEnabled: false, // Still building data
      mathematicalIntuitionEnabled: true,
      markovChainEnabled: true, // Enable Markov chains
      
      positionSizing: 0.010,
      stopLossEnabled: true,
      stopLossPercent: 2.5,
      takeProfitEnabled: true,
      takeProfitPercent: 8,
      
      requireSentimentAlignment: true,
      requireOrderBookConfirmation: true, // Now required
      requireMultiLayerConsensus: false
    },
    targetWinRate: 52,
    description: "Order book microstructure active. Approaching profitable territory."
  },
  
  {
    phase: 4,
    name: "Full QUANTUM FORGE™ Phase",
    minTrades: 2000,
    maxTrades: 999999,
    features: {
      baseStrategyEnabled: true,
      confidenceThreshold: 0.70,
      
      sentimentEnabled: true,
      sentimentSources: [
        'fear_greed', 'reddit', 'news', 'on_chain',
        'twitter', 'whale_movements', 'exchange_flows',
        'google_trends', 'economic_indicators', 'social_volume',
        'defi_metrics', 'options_flow'
      ],
      sentimentThreshold: 0.60,
      
      orderBookEnabled: true,
      orderBookThreshold: 0.50,
      
      // FULL AI POWER
      multiLayerAIEnabled: true,
      mathematicalIntuitionEnabled: true,
      markovChainEnabled: true,
      
      positionSizing: 0.008,
      stopLossEnabled: true,
      stopLossPercent: 2,
      takeProfitEnabled: true,
      takeProfitPercent: 10,
      
      requireSentimentAlignment: true,
      requireOrderBookConfirmation: true,
      requireMultiLayerConsensus: true // Full consensus required
    },
    targetWinRate: 58,
    description: "Full QUANTUM FORGE™ intelligence suite. Maximum precision trading."
  }
];

export class QuantumForgePhaseManager {
  private static instance: QuantumForgePhaseManager | null = null;
  private currentPhase: PhaseConfig | null = null;
  private tradeCount: number = 0;
  private isInitialized: boolean = false;
  
  // Manual override controls
  private manualOverride: boolean = false;
  private forcedPhase: number | null = null;
  private disableAllRestrictions: boolean = false;

  static getInstance(): QuantumForgePhaseManager {
    if (!QuantumForgePhaseManager.instance) {
      QuantumForgePhaseManager.instance = new QuantumForgePhaseManager();
    }
    return QuantumForgePhaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Count entry trades as the primary phase progression metric
      // Entry trades represent actual AI trading decisions made
      const completedTrades = await prisma.managedTrade.count({
        where: {
          isEntry: true
        }
      });
      
      this.tradeCount = completedTrades;
      this.currentPhase = this.getPhaseForTradeCount(completedTrades);
      this.isInitialized = true;
      
      console.log(`🎯 QUANTUM FORGE™ Phase Manager Initialized`);
      console.log(`📊 Completed Trades: ${completedTrades}`);
      console.log(`🔥 Current Phase: ${this.currentPhase.phase} - ${this.currentPhase.name}`);
      console.log(`🎯 Target Win Rate: ${this.currentPhase.targetWinRate}%`);
      console.log(`📈 Next Phase at: ${this.currentPhase.maxTrades} trades`);
      
    } catch (error) {
      console.error('Failed to initialize phase manager:', error);
      // Default to Phase 0 on error
      this.currentPhase = PHASE_CONFIGURATIONS[0];
      this.isInitialized = true;
    }
  }

  private getPhaseForTradeCount(tradeCount: number): PhaseConfig {
    for (const phase of PHASE_CONFIGURATIONS) {
      if (tradeCount >= phase.minTrades && tradeCount < phase.maxTrades) {
        return phase;
      }
    }
    // Default to highest phase if beyond all ranges
    return PHASE_CONFIGURATIONS[PHASE_CONFIGURATIONS.length - 1];
  }

  async getCurrentPhase(): Promise<PhaseConfig> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check for manual overrides
    if (this.disableAllRestrictions) {
      // Return Phase 0 config with all restrictions disabled
      return {
        ...PHASE_CONFIGURATIONS[0],
        name: "UNRESTRICTED MODE",
        features: {
          ...PHASE_CONFIGURATIONS[0].features,
          confidenceThreshold: 0.01, // Virtually no threshold
          requireSentimentAlignment: false,
          requireOrderBookConfirmation: false,
          requireMultiLayerConsensus: false
        },
        description: "All restrictions disabled - Maximum trade generation"
      };
    }
    
    if (this.manualOverride && this.forcedPhase !== null) {
      const forcedConfig = PHASE_CONFIGURATIONS.find(p => p.phase === this.forcedPhase);
      if (forcedConfig) {
        return {
          ...forcedConfig,
          name: `${forcedConfig.name} (MANUAL OVERRIDE)`
        };
      }
    }
    
    return this.currentPhase!;
  }
  
  // Manual control methods
  setManualPhase(phase: number): void {
    this.manualOverride = true;
    this.forcedPhase = phase;
    this.disableAllRestrictions = false;
    console.log(`⚡ Manual override: Forced to Phase ${phase}`);
  }
  
  disablePhaseSystem(): void {
    this.disableAllRestrictions = true;
    this.manualOverride = false;
    console.log(`🔥 UNRESTRICTED MODE: All phase restrictions disabled`);
  }
  
  enableAutoPhase(): void {
    this.manualOverride = false;
    this.forcedPhase = null;
    this.disableAllRestrictions = false;
    console.log(`✅ Auto-phase mode re-enabled`);
  }
  
  getOverrideStatus(): {
    mode: 'auto' | 'manual' | 'unrestricted';
    forcedPhase?: number;
  } {
    if (this.disableAllRestrictions) {
      return { mode: 'unrestricted' };
    }
    if (this.manualOverride) {
      return { mode: 'manual', forcedPhase: this.forcedPhase || undefined };
    }
    return { mode: 'auto' };
  }

  async updateTradeCount(): Promise<PhaseConfig> {
    const completedTrades = await prisma.managedTrade.count({
      where: {
        isEntry: true
      }
    });
    
    const previousPhase = this.currentPhase?.phase || 0;
    this.tradeCount = completedTrades;
    this.currentPhase = this.getPhaseForTradeCount(completedTrades);
    
    // Check for phase transition
    if (this.currentPhase.phase > previousPhase) {
      console.log(`🚀 PHASE TRANSITION! Advancing to Phase ${this.currentPhase.phase}`);
      console.log(`🔥 ${this.currentPhase.name}`);
      console.log(`✨ New features enabled: ${this.getNewFeaturesDescription(this.currentPhase)}`);
    }
    
    return this.currentPhase;
  }

  private getNewFeaturesDescription(phase: PhaseConfig): string {
    const features = [];
    
    if (phase.features.sentimentEnabled) {
      features.push(`Sentiment (${phase.features.sentimentSources.length} sources)`);
    }
    if (phase.features.orderBookEnabled) {
      features.push('Order Book Intelligence');
    }
    if (phase.features.multiLayerAIEnabled) {
      features.push('Multi-Layer AI');
    }
    if (phase.features.mathematicalIntuitionEnabled) {
      features.push('Mathematical Intuition');
    }
    if (phase.features.markovChainEnabled) {
      features.push('Markov Chain Analysis');
    }
    
    return features.join(', ') || 'Basic trading only';
  }

  async shouldEnableFeature(feature: keyof PhaseConfig['features']): Promise<boolean> {
    const phase = await this.getCurrentPhase();
    return !!phase.features[feature];
  }

  async getProgressToNextPhase(): Promise<{
    currentPhase: number;
    currentTrades: number;
    tradesNeeded: number;
    progress: number;
  }> {
    const phase = await this.getCurrentPhase();
    const tradesNeeded = phase.maxTrades - this.tradeCount;
    const phaseRange = phase.maxTrades - phase.minTrades;
    const phaseProgress = this.tradeCount - phase.minTrades;
    const progress = Math.round((phaseProgress / phaseRange) * 100);
    
    return {
      currentPhase: phase.phase,
      currentTrades: this.tradeCount,
      tradesNeeded,
      progress
    };
  }

  // Check if we have enough data for machine learning
  async isReadyForML(): Promise<boolean> {
    return this.tradeCount >= 1000; // Need substantial data for ML
  }

  // Check if we should use historical data from other sources
  async shouldUseExternalData(): Promise<boolean> {
    return this.tradeCount < 500; // Use external data to bootstrap
  }
}

// Export singleton instance
export const phaseManager = QuantumForgePhaseManager.getInstance();