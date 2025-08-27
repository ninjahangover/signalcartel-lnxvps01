/**
 * QUANTUM FORGE™ Order Book AI Intelligence Engine
 * 
 * Integrates advanced cryptocurrency order book analysis techniques from:
 * - Bytewax crypto-orderbook-app (real-time streaming analysis)
 * - Kraken real-time order book implementations
 * - Deep learning order book predictability research
 * 
 * This AI engine enhances trading decisions with sophisticated market microstructure analysis
 */

import { AdvancedOrderBookAnalyzer, OrderFlowMetrics, OrderBookSnapshot } from './advanced-orderbook-analyzer';
import { BaseStrategySignal, SentimentEnhancedSignal } from './sentiment/universal-sentiment-enhancer';
import consolidatedDataService from './consolidated-ai-data-service.js';

export interface OrderBookAISignal {
  // Basic Signal Enhancement
  originalConfidence: number;
  enhancedConfidence: number;
  aiConfidenceBoost: number;
  
  // AI-Driven Insights
  microstructureScore: number;    // Overall market microstructure health (0-100)
  liquidityQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  marketRegime: 'TRENDING' | 'RANGING' | 'VOLATILE' | 'ILLIQUID';
  
  // Predictive Features (inspired by deep learning research)
  priceDirection: 'STRONG_UP' | 'UP' | 'NEUTRAL' | 'DOWN' | 'STRONG_DOWN';
  directionConfidence: number;    // AI confidence in price direction
  volatilityForecast: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  
  // Risk Assessment
  executionRisk: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  slippageRisk: number;          // Expected slippage percentage
  liquidityRisk: number;         // Risk of liquidity drying up (0-100)
  
  // Advanced Trading Signals
  optimalOrderSize: number;      // AI-suggested position size
  preferredTimeframe: '1MIN' | '5MIN' | '15MIN' | '1H';
  entryStrategy: 'MARKET' | 'LIMIT_TIGHT' | 'LIMIT_WIDE' | 'ICEBERG' | 'TWAP';
  
  // Whale Intelligence
  whaleActivityThreat: number;   // Risk from large orders (0-100)
  institutionalFlow: 'BUYING' | 'SELLING' | 'NEUTRAL' | 'ACCUMULATING';
  
  // Meta Information
  aiVersion: string;
  analysisQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  dataConfidence: number;        // Quality of underlying data (0-100)
  
  // Explanation (AI transparency)
  decisionFactors: string[];     // Human-readable decision factors
  warnings: string[];            // Potential concerns
  opportunities: string[];       // Market opportunities detected
}

export class QuantumForgeOrderBookAI {
  private analyzer: AdvancedOrderBookAnalyzer;
  private readonly AI_VERSION = '1.0.0';
  
  // AI Learning Parameters (could be ML model weights in production)
  private readonly CONFIDENCE_WEIGHTS = {
    liquidityScore: 0.25,
    flowImbalance: 0.20,
    pressureScore: 0.15,
    resilience: 0.15,
    whaleActivity: -0.10, // Negative weight - whales increase risk
    volatilityPrediction: -0.10, // Negative weight - volatility increases risk
    momentumScore: 0.05
  };
  
  // Market Regime Classification Thresholds
  private readonly REGIME_THRESHOLDS = {
    trending: { momentum: 0.5, volatility: 15 },
    ranging: { momentum: 0.2, volatility: 8 },
    volatile: { volatility: 25 },
    illiquid: { liquidityScore: 30 }
  };
  
  constructor() {
    this.analyzer = new AdvancedOrderBookAnalyzer();
  }
  
  /**
   * Main AI analysis function - enhances any trading signal with order book intelligence
   */
  async enhanceSignalWithOrderBookAI(
    signal: BaseStrategySignal,
    orderBookSnapshot?: OrderBookSnapshot
  ): Promise<OrderBookAISignal> {
    
    console.log(`🧠 QUANTUM FORGE™ AI: Analyzing order book for ${signal.symbol}...`);
    
    try {
      // Get or fetch order book data
      let snapshot: OrderBookSnapshot;
      let metrics: OrderFlowMetrics;
      
      if (orderBookSnapshot) {
        snapshot = orderBookSnapshot;
        metrics = this.analyzer.processSnapshot(snapshot);
      } else {
        // Fetch real order book data
        const orderBookData = await this.fetchOrderBookData(signal.symbol);
        snapshot = this.convertToSnapshot(orderBookData, signal.symbol);
        metrics = this.analyzer.processSnapshot(snapshot);
      }
      
      // Run AI analysis
      const aiSignal = await this.runOrderBookAIAnalysis(signal, snapshot, metrics);
      
      console.log(`✅ QUANTUM FORGE™ AI: Analysis complete - ${aiSignal.microstructureScore.toFixed(1)} microstructure score`);
      
      return aiSignal;
      
    } catch (error) {
      console.error(`❌ QUANTUM FORGE™ AI: Order book analysis failed for ${signal.symbol}:`, error);
      
      // Return safe fallback analysis
      return this.createFallbackAnalysis(signal);
    }
  }
  
  /**
   * Core AI analysis engine
   */
  private async runOrderBookAIAnalysis(
    signal: BaseStrategySignal,
    snapshot: OrderBookSnapshot,
    metrics: OrderFlowMetrics
  ): Promise<OrderBookAISignal> {
    
    // 1. Calculate microstructure health score
    const microstructureScore = this.calculateMicrostructureScore(metrics);
    
    // 2. Classify market regime using AI
    const marketRegime = this.classifyMarketRegime(metrics);
    
    // 3. Predict price direction with confidence
    const { priceDirection, directionConfidence } = this.predictPriceDirection(metrics, signal);
    
    // 4. Assess execution and liquidity risk
    const executionRisk = this.assessExecutionRisk(metrics, signal);
    const slippageRisk = this.calculateSlippageRisk(metrics, signal);
    const liquidityRisk = this.assessLiquidityRisk(metrics);
    
    // 5. Calculate AI confidence enhancement
    const aiConfidenceBoost = this.calculateAIConfidenceBoost(metrics, signal, marketRegime);
    
    // 5.5. Cross-Site Historical Pattern Enhancement
    const crossSiteBoost = await this.enhanceWithCrossSiteOrderBookPatterns(signal, metrics);
    console.log(`   🌐 Order Book Cross-Site Enhancement: ${(crossSiteBoost.patternBoost * 100).toFixed(1)}% boost from ${crossSiteBoost.historicalPatterns} historical patterns`);
    
    const totalAiBoost = aiConfidenceBoost + crossSiteBoost.patternBoost;
    const enhancedConfidence = Math.min(0.95, signal.confidence + totalAiBoost);
    
    // 6. Determine optimal execution strategy
    const { optimalOrderSize, entryStrategy, preferredTimeframe } = this.determineOptimalExecution(
      metrics, signal, marketRegime
    );
    
    // 7. Analyze whale activity and institutional flow
    const whaleActivityThreat = this.assessWhaleActivity(metrics);
    const institutionalFlow = this.detectInstitutionalFlow(metrics);
    
    // 8. Generate AI explanations and insights
    const { decisionFactors, warnings, opportunities } = this.generateAIInsights(
      metrics, signal, marketRegime, executionRisk
    );
    
    // 9. Assess data quality
    const analysisQuality = this.assessAnalysisQuality(snapshot, metrics);
    const dataConfidence = this.calculateDataConfidence(snapshot, metrics);
    
    return {
      originalConfidence: signal.confidence,
      enhancedConfidence,
      aiConfidenceBoost: totalAiBoost,
      microstructureScore,
      liquidityQuality: this.categorizeLiquidityQuality(metrics.liquidityScore),
      marketRegime,
      priceDirection,
      directionConfidence,
      volatilityForecast: this.categorizeVolatility(metrics.volatilityPrediction),
      executionRisk,
      slippageRisk,
      liquidityRisk,
      optimalOrderSize,
      preferredTimeframe,
      entryStrategy,
      whaleActivityThreat,
      institutionalFlow,
      aiVersion: this.AI_VERSION,
      analysisQuality,
      dataConfidence,
      decisionFactors,
      warnings,
      opportunities
    };
  }
  
  /**
   * Calculate overall market microstructure health (AI composite score)
   */
  private calculateMicrostructureScore(metrics: OrderFlowMetrics): number {
    let score = 0;
    
    // Weight each factor according to AI-learned importance
    score += metrics.liquidityScore * this.CONFIDENCE_WEIGHTS.liquidityScore;
    score += Math.abs(metrics.volumeImbalance * 100) * this.CONFIDENCE_WEIGHTS.flowImbalance;
    score += Math.abs(metrics.pressureScore) * this.CONFIDENCE_WEIGHTS.pressureScore;
    score += metrics.resilience * this.CONFIDENCE_WEIGHTS.resilience;
    score += (100 - metrics.whaleOrders.length * 10) * Math.abs(this.CONFIDENCE_WEIGHTS.whaleActivity);
    score += (100 - metrics.volatilityPrediction) * Math.abs(this.CONFIDENCE_WEIGHTS.volatilityPrediction);
    score += Math.abs(metrics.momentumScore) * this.CONFIDENCE_WEIGHTS.momentumScore;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * AI-based market regime classification
   */
  private classifyMarketRegime(metrics: OrderFlowMetrics): 'TRENDING' | 'RANGING' | 'VOLATILE' | 'ILLIQUID' {
    // Check for illiquid markets first
    if (metrics.liquidityScore < this.REGIME_THRESHOLDS.illiquid.liquidityScore) {
      return 'ILLIQUID';
    }
    
    // Check for volatile markets
    if (metrics.volatilityPrediction > this.REGIME_THRESHOLDS.volatile.volatility) {
      return 'VOLATILE';
    }
    
    // Check for trending markets
    if (Math.abs(metrics.momentumScore) > this.REGIME_THRESHOLDS.trending.momentum &&
        metrics.volatilityPrediction > this.REGIME_THRESHOLDS.trending.volatility) {
      return 'TRENDING';
    }
    
    // Default to ranging
    return 'RANGING';
  }
  
  /**
   * AI price direction prediction with confidence
   */
  private predictPriceDirection(metrics: OrderFlowMetrics, signal: BaseStrategySignal): {
    priceDirection: 'STRONG_UP' | 'UP' | 'NEUTRAL' | 'DOWN' | 'STRONG_DOWN';
    directionConfidence: number;
  } {
    // Combine multiple signals for direction prediction
    let directionScore = 0;
    let confidenceFactors = 0;
    
    // Factor 1: Volume imbalance
    directionScore += metrics.volumeImbalance * 40; // Scale to -40 to +40
    confidenceFactors += Math.abs(metrics.volumeImbalance) * 20;
    
    // Factor 2: Pressure score
    directionScore += metrics.pressureScore * 0.3; // Scale to contribution
    confidenceFactors += Math.abs(metrics.pressureScore) * 0.2;
    
    // Factor 3: Flow imbalance
    directionScore += metrics.flowImbalance1min * 0.2;
    confidenceFactors += Math.abs(metrics.flowImbalance1min) * 0.15;
    
    // Factor 4: Momentum
    directionScore += metrics.momentumScore * 2;
    confidenceFactors += Math.abs(metrics.momentumScore) * 1.5;
    
    // Factor 5: Original signal direction
    if (signal.action === 'BUY') directionScore += 15;
    if (signal.action === 'SELL') directionScore -= 15;
    confidenceFactors += signal.confidence * 10;
    
    // Normalize confidence
    const directionConfidence = Math.min(95, Math.max(5, confidenceFactors));
    
    // Classify direction
    let priceDirection: 'STRONG_UP' | 'UP' | 'NEUTRAL' | 'DOWN' | 'STRONG_DOWN';
    if (directionScore > 20) priceDirection = 'STRONG_UP';
    else if (directionScore > 5) priceDirection = 'UP';
    else if (directionScore > -5) priceDirection = 'NEUTRAL';
    else if (directionScore > -20) priceDirection = 'DOWN';
    else priceDirection = 'STRONG_DOWN';
    
    return { priceDirection, directionConfidence };
  }
  
  /**
   * Calculate AI confidence boost based on order book analysis
   */
  private calculateAIConfidenceBoost(
    metrics: OrderFlowMetrics,
    signal: BaseStrategySignal,
    marketRegime: string
  ): number {
    let boost = 0;
    
    // Positive factors
    if (metrics.liquidityScore > 70) boost += 0.1;
    if (Math.abs(metrics.volumeImbalance) > 0.3) boost += 0.15; // Strong imbalance
    if (metrics.resilience > 60) boost += 0.08;
    
    // Regime-specific boosts
    switch (marketRegime) {
      case 'TRENDING':
        if ((signal.action === 'BUY' && metrics.momentumScore > 0) ||
            (signal.action === 'SELL' && metrics.momentumScore < 0)) {
          boost += 0.12; // Trend following
        }
        break;
      case 'RANGING':
        if (Math.abs(metrics.pressureScore) > 30) boost += 0.08; // Mean reversion opportunity
        break;
    }
    
    // Negative factors (risk reduction)
    if (metrics.whaleOrders.length > 3) boost -= 0.15; // Too many whales
    if (metrics.liquidityScore < 30) boost -= 0.20; // Poor liquidity
    if (metrics.volatilityPrediction > 30) boost -= 0.10; // High volatility
    
    return Math.max(-0.3, Math.min(0.3, boost)); // Cap boost at ±30%
  }
  
  /**
   * Generate human-readable AI insights and explanations
   */
  private generateAIInsights(
    metrics: OrderFlowMetrics,
    signal: BaseStrategySignal,
    marketRegime: string,
    executionRisk: string
  ): {
    decisionFactors: string[];
    warnings: string[];
    opportunities: string[];
  } {
    const decisionFactors: string[] = [];
    const warnings: string[] = [];
    const opportunities: string[] = [];
    
    // Decision factors
    decisionFactors.push(`Market regime: ${marketRegime} (${metrics.volatilityPrediction.toFixed(1)}% volatility)`);
    decisionFactors.push(`Liquidity score: ${metrics.liquidityScore.toFixed(1)}/100`);
    decisionFactors.push(`Volume imbalance: ${(metrics.volumeImbalance * 100).toFixed(1)}%`);
    decisionFactors.push(`Market pressure: ${metrics.pressureScore.toFixed(1)}%`);
    
    // Warnings
    if (metrics.whaleOrders.length > 2) {
      warnings.push(`${metrics.whaleOrders.length} large orders detected - increased volatility risk`);
    }
    if (metrics.liquidityScore < 40) {
      warnings.push(`Low liquidity (${metrics.liquidityScore.toFixed(1)}) - higher slippage risk`);
    }
    if (metrics.volatilityPrediction > 25) {
      warnings.push(`High volatility forecast (${metrics.volatilityPrediction.toFixed(1)}%) - consider smaller position`);
    }
    if (executionRisk === 'HIGH' || executionRisk === 'VERY_HIGH') {
      warnings.push(`${executionRisk.toLowerCase().replace('_', ' ')} execution risk - consider limit orders`);
    }
    
    // Opportunities
    if (Math.abs(metrics.volumeImbalance) > 0.4) {
      const direction = metrics.volumeImbalance > 0 ? 'bullish' : 'bearish';
      opportunities.push(`Strong ${direction} volume imbalance - trend following opportunity`);
    }
    if (metrics.resilience > 70) {
      opportunities.push(`High order book resilience - stable execution environment`);
    }
    if (metrics.liquidityScore > 80) {
      opportunities.push(`Excellent liquidity - favorable for larger position sizes`);
    }
    if (Math.abs(metrics.momentumScore) > 2 && marketRegime === 'TRENDING') {
      opportunities.push(`Strong momentum with trending regime - consider position scaling`);
    }
    
    return { decisionFactors, warnings, opportunities };
  }
  
  // Helper methods for risk assessment and categorization
  private assessExecutionRisk(metrics: OrderFlowMetrics, signal: BaseStrategySignal): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    let riskScore = 0;
    
    if (metrics.liquidityScore < 30) riskScore += 3;
    else if (metrics.liquidityScore < 50) riskScore += 2;
    else if (metrics.liquidityScore < 70) riskScore += 1;
    
    if (metrics.whaleOrders.length > 3) riskScore += 2;
    else if (metrics.whaleOrders.length > 1) riskScore += 1;
    
    if (metrics.volatilityPrediction > 30) riskScore += 2;
    else if (metrics.volatilityPrediction > 20) riskScore += 1;
    
    if (riskScore >= 6) return 'VERY_HIGH';
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    if (riskScore >= 1) return 'LOW';
    return 'VERY_LOW';
  }
  
  private calculateSlippageRisk(metrics: OrderFlowMetrics, signal: BaseStrategySignal): number {
    // Base slippage on market impact and liquidity
    let slippage = metrics.marketImpact;
    
    // Adjust for liquidity
    if (metrics.liquidityScore < 50) {
      slippage *= (100 - metrics.liquidityScore) / 50;
    }
    
    // Adjust for whale activity
    slippage += metrics.whaleOrders.length * 0.05;
    
    return Math.max(0, Math.min(5, slippage)); // Cap at 5%
  }
  
  private assessLiquidityRisk(metrics: OrderFlowMetrics): number {
    return Math.max(0, 100 - metrics.liquidityScore);
  }
  
  private assessWhaleActivity(metrics: OrderFlowMetrics): number {
    return Math.min(100, metrics.whaleOrders.length * 15);
  }
  
  private detectInstitutionalFlow(metrics: OrderFlowMetrics): 'BUYING' | 'SELLING' | 'NEUTRAL' | 'ACCUMULATING' {
    const flowScore = metrics.flowImbalance5min;
    const whaleActivity = metrics.whaleOrders.length;
    
    if (flowScore > 20 && whaleActivity > 2) return 'ACCUMULATING';
    if (flowScore > 10) return 'BUYING';
    if (flowScore < -10) return 'SELLING';
    return 'NEUTRAL';
  }
  
  private determineOptimalExecution(metrics: OrderFlowMetrics, signal: BaseStrategySignal, marketRegime: string): {
    optimalOrderSize: number;
    entryStrategy: 'MARKET' | 'LIMIT_TIGHT' | 'LIMIT_WIDE' | 'ICEBERG' | 'TWAP';
    preferredTimeframe: '1MIN' | '5MIN' | '15MIN' | '1H';
  } {
    // Base position size on liquidity and volatility
    let sizeMultiplier = 1.0;
    if (metrics.liquidityScore > 80) sizeMultiplier = 1.3;
    else if (metrics.liquidityScore < 30) sizeMultiplier = 0.4;
    
    if (metrics.volatilityPrediction > 25) sizeMultiplier *= 0.7;
    
    // Determine execution strategy
    let entryStrategy: 'MARKET' | 'LIMIT_TIGHT' | 'LIMIT_WIDE' | 'ICEBERG' | 'TWAP' = 'LIMIT_TIGHT';
    
    if (marketRegime === 'TRENDING' && Math.abs(metrics.momentumScore) > 2) {
      entryStrategy = 'MARKET'; // Fast execution in trends
    } else if (metrics.whaleOrders.length > 3) {
      entryStrategy = 'ICEBERG'; // Hide from whales
    } else if (metrics.liquidityScore < 40) {
      entryStrategy = 'TWAP'; // Time-weighted in illiquid markets
    } else if (metrics.volatilityPrediction > 20) {
      entryStrategy = 'LIMIT_WIDE'; // Wider limits in volatile markets
    }
    
    // Determine timeframe
    let preferredTimeframe: '1MIN' | '5MIN' | '15MIN' | '1H' = '5MIN';
    if (marketRegime === 'TRENDING') preferredTimeframe = '1MIN';
    else if (marketRegime === 'RANGING') preferredTimeframe = '15MIN';
    else if (marketRegime === 'ILLIQUID') preferredTimeframe = '1H';
    
    return {
      optimalOrderSize: sizeMultiplier,
      entryStrategy,
      preferredTimeframe
    };
  }
  
  // Utility methods
  private categorizeLiquidityQuality(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  }
  
  private categorizeVolatility(prediction: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    if (prediction >= 30) return 'EXTREME';
    if (prediction >= 20) return 'HIGH';
    if (prediction >= 10) return 'MEDIUM';
    return 'LOW';
  }
  
  private assessAnalysisQuality(snapshot: OrderBookSnapshot, metrics: OrderFlowMetrics): 'HIGH' | 'MEDIUM' | 'LOW' {
    const bidCount = snapshot.bids.length;
    const askCount = snapshot.asks.length;
    
    if (bidCount > 15 && askCount > 15 && metrics.liquidityScore > 50) return 'HIGH';
    if (bidCount > 8 && askCount > 8 && metrics.liquidityScore > 30) return 'MEDIUM';
    return 'LOW';
  }
  
  private calculateDataConfidence(snapshot: OrderBookSnapshot, metrics: OrderFlowMetrics): number {
    let confidence = 50; // Base confidence
    
    // More order book levels = higher confidence
    confidence += Math.min(25, (snapshot.bids.length + snapshot.asks.length) / 2);
    
    // Recent data = higher confidence
    const dataAge = Date.now() - snapshot.timestamp;
    if (dataAge < 5000) confidence += 15; // < 5 seconds
    else if (dataAge < 30000) confidence += 5; // < 30 seconds
    
    // Liquidity quality affects confidence
    confidence += (metrics.liquidityScore - 50) * 0.3;
    
    return Math.max(10, Math.min(95, confidence));
  }
  
  private createFallbackAnalysis(signal: BaseStrategySignal): OrderBookAISignal {
    return {
      originalConfidence: signal.confidence,
      enhancedConfidence: signal.confidence,
      aiConfidenceBoost: 0,
      microstructureScore: 50,
      liquidityQuality: 'FAIR',
      marketRegime: 'RANGING',
      priceDirection: 'NEUTRAL',
      directionConfidence: 25,
      volatilityForecast: 'MEDIUM',
      executionRisk: 'MEDIUM',
      slippageRisk: 0.1,
      liquidityRisk: 50,
      optimalOrderSize: 1.0,
      preferredTimeframe: '5MIN',
      entryStrategy: 'LIMIT_TIGHT',
      whaleActivityThreat: 25,
      institutionalFlow: 'NEUTRAL',
      aiVersion: this.AI_VERSION,
      analysisQuality: 'LOW',
      dataConfidence: 25,
      decisionFactors: ['Order book analysis unavailable - using fallback values'],
      warnings: ['Order book data could not be analyzed - trading risk may be higher'],
      opportunities: []
    };
  }
  
  // Data fetching and conversion methods
  private async fetchOrderBookData(symbol: string): Promise<any> {
    const response = await fetch(`http://localhost:3001/api/order-book?symbol=${symbol}USD`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'API error');
    
    return data.data;
  }
  
  private convertToSnapshot(orderBookData: any, symbol: string): OrderBookSnapshot {
    return {
      symbol,
      timestamp: Date.now(),
      bids: orderBookData.bids || [],
      asks: orderBookData.asks || [],
      midPrice: orderBookData.midPrice || 0,
      spread: orderBookData.spreadPercent || 0,
      spreadBps: (orderBookData.spreadPercent || 0) * 100
    };
  }
  
  /**
   * Cross-Site Historical Order Book Pattern Enhancement
   */
  private async enhanceWithCrossSiteOrderBookPatterns(
    signal: BaseStrategySignal,
    metrics: OrderFlowMetrics
  ): Promise<any> {
    try {
      // Get market condition insights from all sites for similar order book scenarios
      const marketInsights = await consolidatedDataService.getMarketConditionInsights(signal.symbol);
      
      // Get best performing AI systems for current market microstructure
      const bestAIForCondition = await consolidatedDataService.getBestAIForMarketCondition(
        signal.symbol,
        metrics.volatilityEstimate || 0.02, // Default 2% volatility
        signal.action === 'BUY' ? 'bullish' : signal.action === 'SELL' ? 'bearish' : 'neutral'
      );
      
      // Get historical pattern data for phase progression
      const phaseInsights = await consolidatedDataService.getPhaseProgressionInsights();
      
      // Calculate pattern strength based on historical data
      let patternStrength = 0;
      let historicalPatterns = 0;
      
      if (marketInsights.length > 0) {
        historicalPatterns = marketInsights.length;
        // Higher pattern strength if we have similar market conditions
        patternStrength += Math.min(0.1, historicalPatterns * 0.005);
      }
      
      if (bestAIForCondition.length > 0) {
        // Boost confidence if current conditions match historically successful AI patterns
        const avgWinRate = bestAIForCondition.reduce((sum: number, ai: any) => sum + (ai.global_win_rate || 0), 0) / bestAIForCondition.length;
        patternStrength += Math.min(0.05, (avgWinRate - 0.5) * 0.2); // Up to 5% boost for high win rate patterns
      }
      
      if (phaseInsights.length > 0) {
        // Add phase progression boost for pattern recognition
        patternStrength += Math.min(0.03, phaseInsights.length * 0.001);
      }
      
      // Apply liquidity and microstructure pattern multipliers
      const liquidityMultiplier = metrics.liquidityScore > 70 ? 1.2 : metrics.liquidityScore < 30 ? 0.8 : 1.0;
      const microstructureMultiplier = metrics.spreadBps < 10 ? 1.1 : metrics.spreadBps > 50 ? 0.9 : 1.0;
      
      const finalPatternBoost = patternStrength * liquidityMultiplier * microstructureMultiplier;
      
      return {
        patternBoost: Math.min(0.15, finalPatternBoost), // Cap at 15% boost
        historicalPatterns,
        liquidityMultiplier,
        microstructureMultiplier,
        crossSiteEnabled: true,
        enhancementLevel: 'ORDER_BOOK_INTELLIGENCE'
      };
      
    } catch (error) {
      // Return neutral enhancement if consolidation fails
      return {
        patternBoost: 0,
        historicalPatterns: 0,
        liquidityMultiplier: 1.0,
        microstructureMultiplier: 1.0,
        crossSiteEnabled: false,
        enhancementLevel: 'STANDALONE'
      };
    }
  }
}

export const quantumForgeOrderBookAI = new QuantumForgeOrderBookAI();