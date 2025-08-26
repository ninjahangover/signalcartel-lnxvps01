/**
 * Order Book Validation Engine
 * 
 * Integrates real-time order book analysis with trading signals
 * Provides advanced market structure validation for QUANTUM FORGE™
 * Validates trading signals against order book dynamics
 */

export interface OrderBookData {
  symbol: string;
  timestamp: string;
  bids: Array<{ price: number; quantity: number; total: number }>;
  asks: Array<{ price: number; quantity: number; total: number }>;
  spreadPercent: number;
  midPrice: number;
  liquidityScore: number;
  marketPressure: number;
  institutionalFlow: number;
  whaleActivityLevel: number;
  entrySignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidenceScore: number;
  timeframe: 'SCALP' | 'SHORT_TERM' | 'MEDIUM_TERM';
  orderFlowImbalance: number;
  priceDiscoveryEfficiency: number;
  marketMakerActivity: number;
  bidDepth: number;
  askDepth: number;
  imbalanceRatio: number;
  source: string;
}

export interface OrderBookValidationResult {
  isValidated: boolean;
  validationStrength: number; // 0-100
  orderBookSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  signalAlignment: number; // -100 to 100 (how well strategy signal aligns with order book)
  liquidityWarning: boolean;
  whaleActivityWarning: boolean;
  spreadWarning: boolean;
  validationReason: string;
  recommendedAction: 'EXECUTE' | 'SKIP' | 'REDUCE_SIZE' | 'WAIT';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  symbol: string;
  strategy: string;
  reason: string;
}

export class OrderBookValidator {
  private static instance: OrderBookValidator | null = null;
  private orderBookCache: Map<string, { data: OrderBookData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  private constructor() {}

  static getInstance(): OrderBookValidator {
    if (!OrderBookValidator.instance) {
      OrderBookValidator.instance = new OrderBookValidator();
    }
    return OrderBookValidator.instance;
  }

  /**
   * Fetch fresh order book data for a symbol
   */
  private async fetchOrderBookData(symbol: string): Promise<OrderBookData> {
    try {
      // Check cache first
      const cached = this.orderBookCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      console.log(`📊 Fetching real-time order book data for ${symbol}...`);
      
      const response = await fetch(`http://localhost:3001/api/order-book?symbol=${symbol}USD`);
      if (!response.ok) {
        throw new Error(`Order book API returned ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch order book data');
      }

      // Cache the result
      this.orderBookCache.set(symbol, {
        data: result.data,
        timestamp: Date.now()
      });

      console.log(`✅ Order book data cached for ${symbol}: ${result.data.entrySignal} signal`);
      return result.data;

    } catch (error) {
      console.error(`❌ Failed to fetch order book for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Validate a trading signal against order book dynamics
   */
  async validateSignal(signal: TradingSignal): Promise<OrderBookValidationResult> {
    try {
      console.log(`🔍 Validating ${signal.action} signal for ${signal.symbol} against order book...`);
      
      // Fetch real-time order book data
      const orderBookData = await this.fetchOrderBookData(signal.symbol);
      
      // Calculate signal alignment
      const signalAlignment = this.calculateSignalAlignment(signal, orderBookData);
      
      // Assess validation strength
      const validationStrength = this.calculateValidationStrength(signalAlignment, orderBookData);
      
      // Check for warnings
      const liquidityWarning = orderBookData.liquidityScore < 30;
      const whaleActivityWarning = orderBookData.whaleActivityLevel > 70;
      const spreadWarning = orderBookData.spreadPercent > 0.1; // 0.1% spread warning
      
      // Determine risk level
      const riskLevel = this.assessRiskLevel(orderBookData, liquidityWarning, whaleActivityWarning, spreadWarning);
      
      // Make validation decision
      const isValidated = validationStrength >= 60 && !this.hasBlockingWarnings(liquidityWarning, whaleActivityWarning, spreadWarning);
      
      // Generate recommendation
      const recommendedAction = this.generateRecommendation(isValidated, validationStrength, riskLevel, signalAlignment);
      
      // Create validation reason
      const validationReason = this.generateValidationReason(signalAlignment, orderBookData, liquidityWarning, whaleActivityWarning, spreadWarning);
      
      const result: OrderBookValidationResult = {
        isValidated,
        validationStrength,
        orderBookSignal: orderBookData.entrySignal,
        signalAlignment,
        liquidityWarning,
        whaleActivityWarning,
        spreadWarning,
        validationReason,
        recommendedAction,
        riskLevel
      };

      console.log(`📋 Order book validation complete for ${signal.symbol}:`);
      console.log(`   Alignment: ${signalAlignment.toFixed(1)}%`);
      console.log(`   Validation: ${validationStrength.toFixed(1)}%`);
      console.log(`   Recommendation: ${recommendedAction}`);
      console.log(`   Risk Level: ${riskLevel}`);

      return result;

    } catch (error) {
      console.error(`❌ Order book validation failed for ${signal.symbol}:`, error);
      
      // Return safe default on error
      return {
        isValidated: false,
        validationStrength: 0,
        orderBookSignal: 'NEUTRAL',
        signalAlignment: 0,
        liquidityWarning: true,
        whaleActivityWarning: false,
        spreadWarning: true,
        validationReason: `Order book validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendedAction: 'SKIP',
        riskLevel: 'EXTREME'
      };
    }
  }

  /**
   * Calculate how well the trading signal aligns with order book sentiment
   */
  private calculateSignalAlignment(signal: TradingSignal, orderBook: OrderBookData): number {
    const signalIsBullish = signal.action === 'BUY';
    const orderBookIsBullish = orderBook.entrySignal === 'BUY' || orderBook.entrySignal === 'STRONG_BUY';
    
    // Base alignment on signal direction match
    let alignment = 0;
    
    if (signalIsBullish && orderBookIsBullish) {
      // Both bullish - positive alignment
      alignment = 50 + (orderBook.marketPressure / 2); // Convert market pressure to alignment
    } else if (!signalIsBullish && !orderBookIsBullish) {
      // Both bearish - positive alignment
      alignment = 50 - (orderBook.marketPressure / 2); // Negative pressure = good for sell signals
    } else {
      // Conflicting signals - negative alignment
      alignment = -Math.abs(orderBook.marketPressure / 2);
    }
    
    // Enhance alignment based on order book confidence
    alignment = alignment * (orderBook.confidenceScore / 100);
    
    // Cap between -100 and 100
    return Math.max(-100, Math.min(100, alignment));
  }

  /**
   * Calculate validation strength based on multiple factors
   */
  private calculateValidationStrength(signalAlignment: number, orderBook: OrderBookData): number {
    let strength = 0;
    
    // Base strength on signal alignment (0-40 points)
    strength += Math.max(0, signalAlignment) * 0.4;
    
    // Add points for good liquidity (0-20 points)
    strength += (orderBook.liquidityScore / 100) * 20;
    
    // Add points for order book confidence (0-25 points)
    strength += (orderBook.confidenceScore / 100) * 25;
    
    // Add points for price discovery efficiency (0-15 points)
    strength += (orderBook.priceDiscoveryEfficiency / 100) * 15;
    
    // Penalty for high spread
    if (orderBook.spreadPercent > 0.05) { // 0.05% penalty threshold
      strength -= Math.min(20, (orderBook.spreadPercent - 0.05) * 1000);
    }
    
    // Penalty for extreme whale activity (could indicate manipulation)
    if (orderBook.whaleActivityLevel > 80) {
      strength -= (orderBook.whaleActivityLevel - 80);
    }
    
    return Math.max(0, Math.min(100, strength));
  }

  /**
   * Assess overall risk level
   */
  private assessRiskLevel(orderBook: OrderBookData, liquidityWarning: boolean, whaleActivityWarning: boolean, spreadWarning: boolean): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    let riskScore = 0;
    
    if (liquidityWarning) riskScore += 30;
    if (whaleActivityWarning) riskScore += 25;
    if (spreadWarning) riskScore += 20;
    if (orderBook.confidenceScore < 30) riskScore += 15;
    if (orderBook.priceDiscoveryEfficiency < 50) riskScore += 10;
    
    if (riskScore >= 70) return 'EXTREME';
    if (riskScore >= 45) return 'HIGH';
    if (riskScore >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Check if there are blocking warnings
   */
  private hasBlockingWarnings(liquidityWarning: boolean, whaleActivityWarning: boolean, spreadWarning: boolean): boolean {
    // Block on extreme liquidity issues or very high spread
    return liquidityWarning || spreadWarning;
  }

  /**
   * Generate action recommendation
   */
  private generateRecommendation(isValidated: boolean, validationStrength: number, riskLevel: string, signalAlignment: number): 'EXECUTE' | 'SKIP' | 'REDUCE_SIZE' | 'WAIT' {
    if (!isValidated || riskLevel === 'EXTREME') {
      return 'SKIP';
    }
    
    if (validationStrength >= 80 && riskLevel === 'LOW') {
      return 'EXECUTE';
    }
    
    if (validationStrength >= 60 && riskLevel === 'MEDIUM') {
      return 'REDUCE_SIZE';
    }
    
    if (signalAlignment < 0) {
      return 'SKIP'; // Conflicting signals
    }
    
    return 'WAIT'; // Wait for better conditions
  }

  /**
   * Generate human-readable validation reason
   */
  private generateValidationReason(signalAlignment: number, orderBook: OrderBookData, liquidityWarning: boolean, whaleActivityWarning: boolean, spreadWarning: boolean): string {
    const reasons: string[] = [];
    
    if (signalAlignment > 50) {
      reasons.push(`Strong signal alignment (${signalAlignment.toFixed(1)}%)`);
    } else if (signalAlignment > 0) {
      reasons.push(`Moderate signal alignment (${signalAlignment.toFixed(1)}%)`);
    } else {
      reasons.push(`Signal conflict detected (${signalAlignment.toFixed(1)}%)`);
    }
    
    reasons.push(`Order book shows ${orderBook.entrySignal} with ${orderBook.confidenceScore.toFixed(1)}% confidence`);
    
    if (liquidityWarning) {
      reasons.push(`⚠️ Low liquidity (${orderBook.liquidityScore.toFixed(1)})`);
    }
    
    if (whaleActivityWarning) {
      reasons.push(`🐋 High whale activity (${orderBook.whaleActivityLevel.toFixed(1)})`);
    }
    
    if (spreadWarning) {
      reasons.push(`📊 Wide spread (${orderBook.spreadPercent.toFixed(4)}%)`);
    }
    
    reasons.push(`Market pressure: ${orderBook.marketPressure.toFixed(1)}%`);
    
    return reasons.join('; ');
  }
}

export const orderBookValidator = OrderBookValidator.getInstance();