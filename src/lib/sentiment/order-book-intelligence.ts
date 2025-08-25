/**
 * Order Book Intelligence Processor
 * Integrates real-time order book analysis with QUANTUM FORGE sentiment engine
 * Provides advanced market structure insights for trading decisions
 */

import { OrderBookAnalyzer, OrderBookSnapshot, OrderBookIntelligence } from './phase4-orderbook-analysis';
import { prisma } from '../prisma';

export interface OrderBookSignal {
  symbol: string;
  timestamp: Date;
  
  // Market Microstructure Signals
  liquidityScore: number;        // 0-100, higher = better liquidity
  marketPressure: number;        // -100 to 100, negative = sell pressure
  institutionalFlow: number;     // -100 to 100, positive = institutional buying
  whaleActivityLevel: number;    // 0-100, whale order detection
  
  // Trading Edge Metrics
  entrySignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidenceScore: number;       // 0-100
  timeframe: 'SCALP' | 'SHORT_TERM' | 'MEDIUM_TERM'; // Best trading timeframe
  
  // Risk Management
  stopLossDistance: number;      // % from current price
  takeProfitDistance: number;    // % from current price
  positionSizeRecommendation: number; // 0-100, % of capital
  
  // Advanced Metrics
  orderFlowImbalance: number;    // Bid/Ask flow imbalance
  priceDiscoveryEfficiency: number; // How efficiently price moves
  marketMakerActivity: number;   // MM presence indicator
  
  // Integration with other sentiment sources
  sentimentAlignment: number;    // -100 to 100, alignment with other sources
  conflictWarning: boolean;      // True if order book conflicts with sentiment
}

export class OrderBookIntelligenceProcessor {
  private orderBookAnalyzer: OrderBookAnalyzer;
  private historicalData: Map<string, OrderBookIntelligence[]> = new Map();
  private readonly maxHistoryLength = 1000; // Keep 1000 data points per symbol
  
  constructor() {
    this.orderBookAnalyzer = new OrderBookAnalyzer();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.orderBookAnalyzer.on('orderBookUpdate', ({ snapshot, intelligence }) => {
      this.processIntelligence(snapshot, intelligence);
    });
    
    this.orderBookAnalyzer.on('connected', () => {
      console.log('📊 Order Book Intelligence Processor connected');
    });
  }
  
  private processIntelligence(snapshot: OrderBookSnapshot, intelligence: OrderBookIntelligence): void {
    // Store historical data
    this.storeHistoricalData(intelligence);
    
    // Generate trading signal
    const signal = this.generateOrderBookSignal(snapshot, intelligence);
    
    // Store in database for ML training (temporarily disabled for demo)
    // this.storeSignalInDatabase(signal);
    
    // Emit for real-time processing
    process.nextTick(() => {
      this.emit('orderBookSignal', signal);
    });
  }
  
  private storeHistoricalData(intelligence: OrderBookIntelligence): void {
    const symbol = intelligence.symbol;
    
    if (!this.historicalData.has(symbol)) {
      this.historicalData.set(symbol, []);
    }
    
    const history = this.historicalData.get(symbol)!;
    history.push(intelligence);
    
    // Keep only recent data
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }
  
  public generateOrderBookSignal(
    snapshot: OrderBookSnapshot,
    intelligence: OrderBookIntelligence
  ): OrderBookSignal {
    
    // Calculate liquidity score
    const liquidityScore = this.calculateLiquidityScore(intelligence);
    
    // Market pressure analysis
    const marketPressure = this.calculateMarketPressure(snapshot, intelligence);
    
    // Institutional flow detection
    const institutionalFlow = this.calculateInstitutionalFlow(intelligence);
    
    // Whale activity level
    const whaleActivityLevel = intelligence.orderFlow.whaleActivity ? 
      Math.min(100, (snapshot.largeBidOrders + snapshot.largeAskOrders) * 10) : 0;
    
    // Generate entry signal
    const { entrySignal, confidenceScore } = this.generateEntrySignal(
      marketPressure, institutionalFlow, intelligence
    );
    
    // Determine optimal timeframe
    const timeframe = this.determineTimeframe(intelligence, liquidityScore);
    
    // Risk management calculations
    const { stopLossDistance, takeProfitDistance, positionSizeRecommendation } = 
      this.calculateRiskManagement(intelligence, confidenceScore);
    
    // Advanced metrics
    const advancedMetrics = this.calculateAdvancedMetrics(snapshot, intelligence);
    
    // Sentiment alignment (will be calculated when integrated with main engine)
    const sentimentAlignment = 0; // Placeholder - will be updated during integration
    const conflictWarning = false; // Placeholder
    
    return {
      symbol: snapshot.symbol,
      timestamp: snapshot.timestamp,
      liquidityScore,
      marketPressure,
      institutionalFlow,
      whaleActivityLevel,
      entrySignal,
      confidenceScore,
      timeframe,
      stopLossDistance,
      takeProfitDistance,
      positionSizeRecommendation,
      ...advancedMetrics,
      sentimentAlignment,
      conflictWarning
    };
  }
  
  private calculateLiquidityScore(intelligence: OrderBookIntelligence): number {
    let score = 50; // Base score
    
    // Depth scoring
    if (intelligence.liquidity.depth === 'HIGH') score += 30;
    else if (intelligence.liquidity.depth === 'LOW') score -= 30;
    
    // Spread tightness (lower spread = better liquidity)
    const spreadBonus = Math.max(0, 20 - (intelligence.rawMetrics.bidAskSpread * 2000));
    score += spreadBonus;
    
    // Market impact (lower = better)
    const impactPenalty = Math.min(20, intelligence.liquidity.marketImpactScore / 100000);
    score -= impactPenalty;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateMarketPressure(
    snapshot: OrderBookSnapshot,
    intelligence: OrderBookIntelligence
  ): number {
    // Base pressure from order book imbalance
    let pressure = intelligence.rawMetrics.orderBookSkew * 50; // -50 to +50
    
    // Wall pressure adjustment
    if (snapshot.wallPressure === 'BUY') pressure += 25;
    else if (snapshot.wallPressure === 'SELL') pressure -= 25;
    
    // Large order influence
    const orderDiff = snapshot.largeBidOrders - snapshot.largeAskOrders;
    pressure += orderDiff * 5; // Each large order = 5 pressure points
    
    return Math.max(-100, Math.min(100, pressure));
  }
  
  private calculateInstitutionalFlow(intelligence: OrderBookIntelligence): number {
    let flow = 0;
    
    if (intelligence.orderFlow.institutionalFlow === 'BUYING') {
      flow = 50 + (intelligence.orderFlow.urgency / 2);
    } else if (intelligence.orderFlow.institutionalFlow === 'SELLING') {
      flow = -50 - (intelligence.orderFlow.urgency / 2);
    }
    
    // Whale activity boost
    if (intelligence.orderFlow.whaleActivity) {
      flow *= 1.3;
    }
    
    return Math.max(-100, Math.min(100, flow));
  }
  
  private generateEntrySignal(
    marketPressure: number,
    institutionalFlow: number,
    intelligence: OrderBookIntelligence
  ): { entrySignal: any, confidenceScore: number } {
    
    const combinedScore = (marketPressure + institutionalFlow) / 2;
    const confidenceScore = intelligence.marketStructure.confidence;
    
    let entrySignal: any = 'NEUTRAL';
    
    if (combinedScore > 60 && confidenceScore > 70) {
      entrySignal = 'STRONG_BUY';
    } else if (combinedScore > 30 && confidenceScore > 60) {
      entrySignal = 'BUY';
    } else if (combinedScore < -60 && confidenceScore > 70) {
      entrySignal = 'STRONG_SELL';
    } else if (combinedScore < -30 && confidenceScore > 60) {
      entrySignal = 'SELL';
    }
    
    return { entrySignal, confidenceScore };
  }
  
  private determineTimeframe(
    intelligence: OrderBookIntelligence,
    liquidityScore: number
  ): 'SCALP' | 'SHORT_TERM' | 'MEDIUM_TERM' {
    
    if (liquidityScore > 80 && intelligence.orderFlow.urgency > 70) {
      return 'SCALP'; // High liquidity + urgency = scalping opportunity
    } else if (intelligence.marketStructure.strength > 70) {
      return 'MEDIUM_TERM'; // Strong trend = longer hold
    } else {
      return 'SHORT_TERM'; // Default for most setups
    }
  }
  
  private calculateRiskManagement(
    intelligence: OrderBookIntelligence,
    confidenceScore: number
  ): {
    stopLossDistance: number;
    takeProfitDistance: number;
    positionSizeRecommendation: number;
  } {
    
    // Base risk based on spread and volatility
    const baseRisk = Math.max(0.5, intelligence.rawMetrics.bidAskSpread * 100 + 1);
    
    const stopLossDistance = baseRisk * (100 - confidenceScore) / 50; // Lower confidence = wider stop
    const takeProfitDistance = stopLossDistance * intelligence.signals.riskRewardRatio;
    
    // Position size: higher confidence = larger size (but capped at 25%)
    const positionSizeRecommendation = Math.min(25, (confidenceScore / 4));
    
    return {
      stopLossDistance,
      takeProfitDistance,
      positionSizeRecommendation
    };
  }
  
  private calculateAdvancedMetrics(
    snapshot: OrderBookSnapshot,
    intelligence: OrderBookIntelligence
  ): {
    orderFlowImbalance: number;
    priceDiscoveryEfficiency: number;
    marketMakerActivity: number;
  } {
    
    // Order flow imbalance (bid vs ask volume)
    const orderFlowImbalance = intelligence.rawMetrics.depthImbalance * 100;
    
    // Price discovery efficiency (tight spread + high volume = efficient)
    const priceDiscoveryEfficiency = 100 - (intelligence.rawMetrics.bidAskSpread * 5000) + 
                                    (intelligence.liquidity.depth === 'HIGH' ? 20 : 0);
    
    // Market maker activity (multiple small orders at various levels)
    const totalOrders = snapshot.bids.length + snapshot.asks.length;
    const largeOrders = snapshot.largeBidOrders + snapshot.largeAskOrders;
    const marketMakerActivity = ((totalOrders - largeOrders) / totalOrders) * 100;
    
    return {
      orderFlowImbalance: Math.max(-100, Math.min(100, orderFlowImbalance)),
      priceDiscoveryEfficiency: Math.max(0, Math.min(100, priceDiscoveryEfficiency)),
      marketMakerActivity: Math.max(0, Math.min(100, marketMakerActivity))
    };
  }
  
  private async storeSignalInDatabase(signal: OrderBookSignal): Promise<void> {
    try {
      // Store in enhancedTradingSignal table for ML training
      await prisma.enhancedTradingSignal.create({
        data: {
          symbol: signal.symbol,
          timestamp: signal.timestamp,
          strategy: 'ORDER_BOOK_INTELLIGENCE',
          signalType: 'ORDER_BOOK',
          technicalScore: signal.liquidityScore / 100, // Use liquidity as technical score
          technicalAction: signal.entrySignal,
          combinedConfidence: signal.confidenceScore / 100,
          marketSentiment: signal.marketPressure / 100,
          socialSentiment: 0, // Order book doesn't provide social sentiment
          newsImpact: 0, // Order book doesn't provide news impact
          volumeConfirmation: signal.liquidityScore / 100,
          riskLevel: (100 - signal.positionSizeRecommendation) / 100,
          expectedMove: signal.takeProfitDistance / 100,
          
          // Store additional order book metrics in metadata (JSON field)
          metadata: {
            orderBookSignal: {
              liquidityScore: signal.liquidityScore,
              marketPressure: signal.marketPressure,
              institutionalFlow: signal.institutionalFlow,
              whaleActivityLevel: signal.whaleActivityLevel,
              timeframe: signal.timeframe,
              stopLossDistance: signal.stopLossDistance,
              takeProfitDistance: signal.takeProfitDistance,
              orderFlowImbalance: signal.orderFlowImbalance,
              priceDiscoveryEfficiency: signal.priceDiscoveryEfficiency,
              marketMakerActivity: signal.marketMakerActivity
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to store order book signal:', error);
    }
  }
  
  // EventEmitter-like functionality
  private listeners: Map<string, Function[]> = new Map();
  
  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }
  
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }
  
  // Public methods for integration
  public getCurrentSignal(symbol: string): OrderBookSignal | null {
    const orderBook = this.orderBookAnalyzer.getOrderBook(symbol);
    if (!orderBook) return null;
    
    // Generate intelligence from current order book
    const history = this.historicalData.get(symbol);
    if (!history || history.length === 0) return null;
    
    const latestIntelligence = history[history.length - 1];
    return this.generateOrderBookSignal(orderBook, latestIntelligence);
  }
  
  public getHistoricalIntelligence(symbol: string, limit: number = 100): OrderBookIntelligence[] {
    const history = this.historicalData.get(symbol) || [];
    return history.slice(-limit);
  }
  
  public getAllSymbols(): string[] {
    return this.orderBookAnalyzer.getSymbols();
  }
  
  public getConnectionStatus(): boolean {
    return this.orderBookAnalyzer.ws !== null;
  }
  
  public disconnect(): void {
    this.orderBookAnalyzer.disconnect();
  }
}

// Export singleton instance
export const orderBookIntelligence = new OrderBookIntelligenceProcessor();