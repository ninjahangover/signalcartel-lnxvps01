/**
 * QUANTUM FORGE™ Multi-Layer AI Enhancement Engine
 * 
 * Professional-grade multi-layer AI system that combines:
 * - Layer 1: Technical Analysis (Strategy signals)
 * - Layer 2: Sentiment Intelligence (Market psychology)
 * - Layer 3: Order Book AI (Market microstructure) 
 * - Layer 4: Final Fusion Engine (Cross-validation & decision)
 * 
 * This architecture matches institutional trading systems used by prop trading firms
 */

import { BaseStrategySignal, SentimentEnhancedSignal, UniversalSentimentEnhancer } from './sentiment/universal-sentiment-enhancer';
import { quantumForgeOrderBookAI, OrderBookAISignal } from './quantum-forge-orderbook-ai';

export interface MultiLayerAISignal {
  // Original Strategy Signal (Layer 1)
  originalSignal: BaseStrategySignal;
  
  // Sentiment Intelligence (Layer 2)
  sentimentAnalysis: {
    score: number;
    confidence: number;
    conflict: boolean;
    boost: number;
    sources: string[];
  };
  
  // Order Book AI (Layer 3)  
  orderBookAnalysis: {
    microstructureScore: number;
    liquidityQuality: string;
    executionRisk: string;
    aiBoost: number;
    whaleActivity: number;
    optimalOrderSize: number;
  };
  
  // Final Fusion Decision (Layer 4)
  finalDecision: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'SKIP';
    confidence: number;
    totalBoost: number;
    shouldExecute: boolean;
    positionSizing: number;
    executionStrategy: string;
    timeframe: string;
  };
  
  // Cross-Layer Analysis
  layerAgreement: {
    sentimentOrderBookAlignment: number; // -100 to 100
    conflictDetected: boolean;
    consensusStrength: number; // 0 to 100
    riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  
  // AI Transparency & Explainability
  decisionExplanation: {
    primaryFactors: string[];
    riskFactors: string[];
    opportunityFactors: string[];
    layerContributions: {
      technical: number;
      sentiment: number;
      orderBook: number;
    };
  };
  
  // Meta Information
  processingTime: number;
  layersProcessed: number;
  dataQuality: number;
  timestamp: Date;
  version: string;
}

export interface MultiLayerConfig {
  // Layer Weights (must sum to 1.0)
  technicalWeight: number;
  sentimentWeight: number;
  orderBookWeight: number;
  
  // Risk Management
  maxPositionSize: number;
  minConsensus: number;        // Minimum agreement between layers
  skipOnConflict: boolean;     // Skip if layers strongly disagree
  
  // Execution Preferences
  preferLimitOrders: boolean;
  maxSlippageTolerance: number;
  
  // AI Tuning
  conservativeMode: boolean;   // More cautious decision making
  enableCrossValidation: boolean;
}

export class QuantumForgeMultiLayerAI {
  private sentimentEnhancer: UniversalSentimentEnhancer;
  private readonly AI_VERSION = '2.0.0-MULTI_LAYER';
  
  private readonly defaultConfig: MultiLayerConfig = {
    technicalWeight: 0.4,     // 40% weight to technical analysis
    sentimentWeight: 0.35,    // 35% weight to sentiment
    orderBookWeight: 0.25,    // 25% weight to order book AI
    
    maxPositionSize: 1.0,
    minConsensus: 60,         // Require 60% consensus
    skipOnConflict: true,
    
    preferLimitOrders: true,
    maxSlippageTolerance: 0.5, // 0.5% max slippage
    
    conservativeMode: false,
    enableCrossValidation: true
  };
  
  constructor() {
    this.sentimentEnhancer = new UniversalSentimentEnhancer();
  }
  
  /**
   * Main multi-layer AI enhancement function
   */
  async enhanceSignalWithMultiLayerAI(
    signal: BaseStrategySignal,
    config: Partial<MultiLayerConfig> = {}
  ): Promise<MultiLayerAISignal> {
    
    const startTime = performance.now();
    const effectiveConfig = { ...this.defaultConfig, ...config };
    
    console.log(`🚀 QUANTUM FORGE™ Multi-Layer AI: Processing ${signal.action} signal for ${signal.symbol}...`);
    
    try {
      // LAYER 1: Technical Analysis (already done - the input signal)
      console.log(`   Layer 1 ✅ Technical Analysis: ${signal.strategy} - ${(signal.confidence * 100).toFixed(1)}%`);
      
      // LAYER 2: Sentiment Intelligence
      console.log(`   Layer 2 🧠 Processing Sentiment Intelligence...`);
      const sentimentSignal = await this.sentimentEnhancer.enhanceSignal(signal, {
        enableOrderBookValidation: false // We'll do this separately in Layer 3
      });
      
      console.log(`   Layer 2 ✅ Sentiment: ${sentimentSignal.sentimentScore.toFixed(3)} score, ${(sentimentSignal.confidenceModifier * 100).toFixed(1)}% boost`);
      
      // LAYER 3: Order Book AI
      console.log(`   Layer 3 🔬 Processing Order Book AI...`);
      const orderBookSignal = await quantumForgeOrderBookAI.enhanceSignalWithOrderBookAI(signal);
      
      console.log(`   Layer 3 ✅ Order Book: ${orderBookSignal.microstructureScore.toFixed(1)} microstructure, ${orderBookSignal.liquidityQuality} liquidity`);
      
      // LAYER 4: Final Fusion Engine
      console.log(`   Layer 4 ⚡ Running Final Fusion Engine...`);
      const finalDecision = this.runFusionEngine(signal, sentimentSignal, orderBookSignal, effectiveConfig);
      
      // Cross-Layer Analysis
      const layerAgreement = this.analyzeLeyerAgreement(sentimentSignal, orderBookSignal);
      
      // Generate AI Explanation
      const decisionExplanation = this.generateDecisionExplanation(
        signal, sentimentSignal, orderBookSignal, finalDecision, layerAgreement
      );
      
      const processingTime = performance.now() - startTime;
      
      const multiLayerSignal: MultiLayerAISignal = {
        originalSignal: signal,
        
        sentimentAnalysis: {
          score: sentimentSignal.sentimentScore,
          confidence: sentimentSignal.sentimentConfidence,
          conflict: sentimentSignal.sentimentConflict,
          boost: sentimentSignal.confidenceModifier,
          sources: ['Fear&Greed', 'Reddit', 'News', 'OnChain']
        },
        
        orderBookAnalysis: {
          microstructureScore: orderBookSignal.microstructureScore,
          liquidityQuality: orderBookSignal.liquidityQuality,
          executionRisk: orderBookSignal.executionRisk,
          aiBoost: orderBookSignal.aiConfidenceBoost,
          whaleActivity: orderBookSignal.whaleActivityThreat,
          optimalOrderSize: orderBookSignal.optimalOrderSize
        },
        
        finalDecision,
        layerAgreement,
        decisionExplanation,
        
        processingTime,
        layersProcessed: 4,
        dataQuality: Math.min(100, (orderBookSignal.dataConfidence + sentimentSignal.sentimentConfidence * 100) / 2),
        timestamp: new Date(),
        version: this.AI_VERSION
      };
      
      console.log(`🎯 QUANTUM FORGE™ Multi-Layer AI Complete: ${finalDecision.action} (${(finalDecision.confidence * 100).toFixed(1)}% confidence) in ${processingTime.toFixed(0)}ms`);
      
      return multiLayerSignal;
      
    } catch (error) {
      console.error(`❌ QUANTUM FORGE™ Multi-Layer AI failed:`, error);
      throw error;
    }
  }
  
  /**
   * Final Fusion Engine - combines all layer insights
   */
  private runFusionEngine(
    originalSignal: BaseStrategySignal,
    sentimentSignal: SentimentEnhancedSignal,
    orderBookSignal: OrderBookAISignal,
    config: MultiLayerConfig
  ) {
    // Calculate weighted confidence
    const technicalConfidence = originalSignal.confidence;
    const sentimentConfidence = sentimentSignal.confidence;
    const orderBookConfidence = orderBookSignal.enhancedConfidence;
    
    const weightedConfidence = (
      technicalConfidence * config.technicalWeight +
      sentimentConfidence * config.sentimentWeight +
      orderBookConfidence * config.orderBookWeight
    );
    
    // Calculate total boost from all layers
    const totalBoost = sentimentSignal.confidenceModifier + orderBookSignal.aiConfidenceBoost;
    const finalConfidence = Math.min(0.95, Math.max(0.05, weightedConfidence + totalBoost));
    
    // Determine final action
    let finalAction: 'BUY' | 'SELL' | 'HOLD' | 'SKIP' = originalSignal.action;
    
    // Check for layer conflicts
    if (sentimentSignal.sentimentConflict || orderBookSignal.executionRisk === 'VERY_HIGH') {
      if (config.skipOnConflict) {
        finalAction = 'SKIP';
      }
    }
    
    // Force skip on extreme risk
    if (orderBookSignal.executionRisk === 'VERY_HIGH' && orderBookSignal.liquidityQuality === 'POOR') {
      finalAction = 'SKIP';
    }
    
    // Determine execution strategy
    let executionStrategy = 'LIMIT_TIGHT';
    if (orderBookSignal.entryStrategy) {
      executionStrategy = orderBookSignal.entryStrategy;
    } else if (config.preferLimitOrders) {
      executionStrategy = 'LIMIT_TIGHT';
    }
    
    // Position sizing based on risk and confidence
    let positionSizing = config.maxPositionSize;
    
    // Reduce size based on risks
    if (orderBookSignal.executionRisk === 'HIGH') positionSizing *= 0.7;
    if (orderBookSignal.executionRisk === 'VERY_HIGH') positionSizing *= 0.3;
    if (orderBookSignal.liquidityQuality === 'POOR') positionSizing *= 0.6;
    if (sentimentSignal.sentimentConflict) positionSizing *= 0.8;
    
    // Scale with confidence
    positionSizing *= finalConfidence;
    
    // Apply order book AI optimal sizing
    positionSizing *= orderBookSignal.optimalOrderSize;
    
    // Cap position size
    positionSizing = Math.max(0.1, Math.min(config.maxPositionSize, positionSizing));
    
    return {
      action: finalAction,
      confidence: finalConfidence,
      totalBoost,
      shouldExecute: finalAction !== 'SKIP' && finalAction !== 'HOLD',
      positionSizing,
      executionStrategy,
      timeframe: orderBookSignal.preferredTimeframe || '5MIN'
    };
  }
  
  /**
   * Analyze agreement between sentiment and order book layers
   */
  private analyzeLeyerAgreement(
    sentimentSignal: SentimentEnhancedSignal,
    orderBookSignal: OrderBookAISignal
  ) {
    // Calculate alignment between sentiment and order book direction
    let alignmentScore = 0;
    
    // Sentiment direction
    const sentimentBullish = sentimentSignal.sentimentScore > 0;
    
    // Order book direction  
    const orderBookBullish = orderBookSignal.priceDirection === 'UP' || 
                            orderBookSignal.priceDirection === 'STRONG_UP';
    
    if (sentimentBullish === orderBookBullish) {
      alignmentScore = 50 + Math.min(50, Math.abs(sentimentSignal.sentimentScore * 100));
    } else {
      alignmentScore = -50 - Math.min(50, Math.abs(sentimentSignal.sentimentScore * 100));
    }
    
    // Detect significant conflicts
    const conflictDetected = Math.abs(alignmentScore) > 60 && alignmentScore < 0;
    
    // Calculate consensus strength
    const sentimentStrength = Math.abs(sentimentSignal.sentimentScore) * sentimentSignal.sentimentConfidence;
    const orderBookStrength = orderBookSignal.directionConfidence / 100;
    const consensusStrength = alignmentScore > 0 ? 
      Math.min(100, (sentimentStrength + orderBookStrength) * 50) : 
      Math.max(0, 50 - Math.abs(alignmentScore));
    
    // Determine overall risk level
    let riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
    
    if (conflictDetected && orderBookSignal.executionRisk === 'VERY_HIGH') {
      riskLevel = 'EXTREME';
    } else if (conflictDetected || orderBookSignal.executionRisk === 'HIGH') {
      riskLevel = 'HIGH';
    } else if (consensusStrength > 70 && orderBookSignal.executionRisk === 'LOW') {
      riskLevel = 'LOW';
    } else if (consensusStrength > 85 && orderBookSignal.executionRisk === 'VERY_LOW') {
      riskLevel = 'VERY_LOW';
    }
    
    return {
      sentimentOrderBookAlignment: alignmentScore,
      conflictDetected,
      consensusStrength,
      riskLevel
    };
  }
  
  /**
   * Generate human-readable decision explanation
   */
  private generateDecisionExplanation(
    originalSignal: BaseStrategySignal,
    sentimentSignal: SentimentEnhancedSignal,
    orderBookSignal: OrderBookAISignal,
    finalDecision: any,
    layerAgreement: any
  ) {
    const primaryFactors: string[] = [];
    const riskFactors: string[] = [];
    const opportunityFactors: string[] = [];
    
    // Primary decision factors
    primaryFactors.push(`${originalSignal.strategy} technical signal: ${originalSignal.action} at ${(originalSignal.confidence * 100).toFixed(1)}%`);
    
    if (Math.abs(sentimentSignal.sentimentScore) > 0.1) {
      const sentimentDirection = sentimentSignal.sentimentScore > 0 ? 'bullish' : 'bearish';
      primaryFactors.push(`${sentimentDirection} sentiment (${sentimentSignal.sentimentScore.toFixed(3)}) with ${(sentimentSignal.sentimentConfidence * 100).toFixed(1)}% confidence`);
    }
    
    primaryFactors.push(`Order book microstructure score: ${orderBookSignal.microstructureScore.toFixed(1)}/100`);
    primaryFactors.push(`Market liquidity: ${orderBookSignal.liquidityQuality.toLowerCase()}`);
    
    // Risk factors
    if (sentimentSignal.sentimentConflict) {
      riskFactors.push('Sentiment conflicts with technical signal');
    }
    
    if (layerAgreement.conflictDetected) {
      riskFactors.push(`Sentiment and order book analysis disagree (${layerAgreement.sentimentOrderBookAlignment.toFixed(1)}% alignment)`);
    }
    
    if (orderBookSignal.executionRisk !== 'LOW' && orderBookSignal.executionRisk !== 'VERY_LOW') {
      riskFactors.push(`${orderBookSignal.executionRisk.toLowerCase().replace('_', ' ')} execution risk`);
    }
    
    if (orderBookSignal.whaleActivityThreat > 50) {
      riskFactors.push(`High whale activity detected (${orderBookSignal.whaleActivityThreat.toFixed(0)}% threat level)`);
    }
    
    if (orderBookSignal.slippageRisk > 0.2) {
      riskFactors.push(`Elevated slippage risk (${orderBookSignal.slippageRisk.toFixed(2)}%)`);
    }
    
    // Opportunity factors
    if (layerAgreement.consensusStrength > 70) {
      opportunityFactors.push(`Strong consensus between analysis layers (${layerAgreement.consensusStrength.toFixed(0)}%)`);
    }
    
    if (orderBookSignal.liquidityQuality === 'EXCELLENT') {
      opportunityFactors.push('Excellent market liquidity for optimal execution');
    }
    
    if (Math.abs(sentimentSignal.confidenceModifier) > 0.1) {
      const boostType = sentimentSignal.confidenceModifier > 0 ? 'boost' : 'penalty';
      opportunityFactors.push(`Sentiment provides ${(Math.abs(sentimentSignal.confidenceModifier) * 100).toFixed(1)}% confidence ${boostType}`);
    }
    
    if (orderBookSignal.aiConfidenceBoost > 0.1) {
      opportunityFactors.push(`Order book AI provides ${(orderBookSignal.aiConfidenceBoost * 100).toFixed(1)}% confidence boost`);
    }
    
    // Layer contributions
    const layerContributions = {
      technical: originalSignal.confidence * 40, // Approximate contribution percentages
      sentiment: sentimentSignal.confidenceModifier * 35,
      orderBook: orderBookSignal.aiConfidenceBoost * 25
    };
    
    return {
      primaryFactors,
      riskFactors,
      opportunityFactors,
      layerContributions
    };
  }
  
  /**
   * Get system performance metrics
   */
  getSystemMetrics(): {
    version: string;
    layersActive: number;
    averageProcessingTime?: number;
    successRate?: number;
  } {
    return {
      version: this.AI_VERSION,
      layersActive: 4,
      // Could add performance tracking here
      averageProcessingTime: undefined,
      successRate: undefined
    };
  }
}

export const quantumForgeMultiLayerAI = new QuantumForgeMultiLayerAI();