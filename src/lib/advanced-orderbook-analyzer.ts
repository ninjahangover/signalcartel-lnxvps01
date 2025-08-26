/**
 * Advanced Cryptocurrency Order Book Analyzer
 * 
 * Inspired by professional crypto order book projects:
 * - Bytewax crypto-orderbook-app (real-time streaming analysis)
 * - Kraken real-time order book implementations  
 * - Deep learning order book predictability research
 * 
 * Features:
 * - Real-time order flow analysis
 * - Market microstructure insights
 * - Predictive order book patterns
 * - Cryptocurrency-specific optimizations
 */

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  timestamp: number;
  exchange: string;
}

export interface OrderBookSnapshot {
  symbol: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midPrice: number;
  spread: number;
  spreadBps: number; // Basis points
  sequence?: number; // For tracking order updates
}

export interface OrderBookDelta {
  symbol: string;
  timestamp: number;
  side: 'bid' | 'ask';
  price: number;
  quantity: number;
  action: 'insert' | 'update' | 'delete';
}

export interface OrderFlowMetrics {
  // Volume Analysis
  bidVolume1pct: number;    // Volume within 1% of mid price (bids)
  askVolume1pct: number;    // Volume within 1% of mid price (asks)
  bidVolumeTotal: number;   // Total bid volume
  askVolumeTotal: number;   // Total ask volume
  volumeImbalance: number;  // (bid - ask) / (bid + ask)
  
  // Price Level Analysis
  bestBid: number;
  bestAsk: number;
  bidCount: number;         // Number of bid levels
  askCount: number;         // Number of ask levels
  
  // Microstructure Metrics
  marketImpact: number;     // Price impact of large orders
  liquidityScore: number;   // Overall liquidity assessment
  resilience: number;       // Order book resilience to shocks
  
  // Flow Imbalance (like Coinbase analysis)
  flowImbalance5min: number;   // 5-minute flow imbalance
  flowImbalance1min: number;   // 1-minute flow imbalance
  
  // Predictive Features (inspired by deep learning research)
  pressureScore: number;       // Buy/sell pressure
  momentumScore: number;       // Order book momentum
  volatilityPrediction: number; // Expected volatility
  
  // Whale Activity Detection
  whaleOrders: Array<{
    price: number;
    quantity: number;
    side: 'bid' | 'ask';
    notionalValue: number;
  }>;
}

export class AdvancedOrderBookAnalyzer {
  private orderBookHistory: Map<string, OrderBookSnapshot[]> = new Map();
  private deltaHistory: Map<string, OrderBookDelta[]> = new Map();
  private readonly maxHistoryLength = 1000; // Keep 1000 snapshots
  private readonly maxDeltaHistory = 5000;  // Keep 5000 deltas
  
  // Thresholds for cryptocurrency markets
  private readonly WHALE_THRESHOLD_BTC = 10; // 10 BTC orders considered large
  private readonly WHALE_THRESHOLD_ETH = 100; // 100 ETH orders considered large
  private readonly WHALE_THRESHOLD_USD = 100000; // $100k+ orders considered large
  
  /**
   * Process new order book snapshot (like Bytewax streaming)
   */
  processSnapshot(snapshot: OrderBookSnapshot): OrderFlowMetrics {
    this.storeSnapshot(snapshot);
    
    // Calculate deltas if we have previous snapshots
    const previousSnapshot = this.getPreviousSnapshot(snapshot.symbol);
    if (previousSnapshot) {
      const deltas = this.calculateDeltas(previousSnapshot, snapshot);
      this.storeDeltas(snapshot.symbol, deltas);
    }
    
    return this.calculateMetrics(snapshot);
  }
  
  /**
   * Calculate comprehensive order flow metrics
   */
  private calculateMetrics(snapshot: OrderBookSnapshot): OrderFlowMetrics {
    const { bids, asks, midPrice, symbol } = snapshot;
    
    // Basic volume calculations
    const bidVolumeTotal = bids.reduce((sum, level) => sum + level.total, 0);
    const askVolumeTotal = asks.reduce((sum, level) => sum + level.total, 0);
    
    // Volume within 1% of mid price (critical for crypto)
    const priceRange = midPrice * 0.01; // 1% range
    const bidVolume1pct = bids
      .filter(level => level.price >= midPrice - priceRange)
      .reduce((sum, level) => sum + level.total, 0);
    
    const askVolume1pct = asks
      .filter(level => level.price <= midPrice + priceRange)  
      .reduce((sum, level) => sum + level.total, 0);
    
    // Volume imbalance (key crypto metric)
    const totalVolume = bidVolumeTotal + askVolumeTotal;
    const volumeImbalance = totalVolume > 0 ? 
      (bidVolumeTotal - askVolumeTotal) / totalVolume : 0;
    
    // Market impact calculation (crypto-specific)
    const marketImpact = this.calculateMarketImpact(bids, asks, midPrice);
    
    // Liquidity score (crypto markets are often less liquid)
    const liquidityScore = this.calculateLiquidityScore(bids, asks, midPrice);
    
    // Flow imbalance analysis (inspired by Coinbase research)
    const flowImbalance5min = this.calculateFlowImbalance(symbol, 300); // 5 minutes
    const flowImbalance1min = this.calculateFlowImbalance(symbol, 60);  // 1 minute
    
    // Predictive features (inspired by deep learning research)
    const pressureScore = this.calculatePressureScore(bids, asks, midPrice);
    const momentumScore = this.calculateMomentumScore(symbol);
    const volatilityPrediction = this.predictVolatility(symbol);
    
    // Whale detection (crucial for crypto)
    const whaleOrders = this.detectWhaleOrders(bids, asks, midPrice, symbol);
    
    // Resilience score
    const resilience = this.calculateResilience(bids, asks, midPrice);
    
    return {
      bidVolume1pct,
      askVolume1pct,
      bidVolumeTotal,
      askVolumeTotal,
      volumeImbalance,
      bestBid: bids[0]?.price || 0,
      bestAsk: asks[0]?.price || 0,
      bidCount: bids.length,
      askCount: asks.length,
      marketImpact,
      liquidityScore,
      resilience,
      flowImbalance5min,
      flowImbalance1min,
      pressureScore,
      momentumScore,
      volatilityPrediction,
      whaleOrders
    };
  }
  
  /**
   * Calculate market impact (how much price moves for large orders)
   */
  private calculateMarketImpact(bids: OrderBookLevel[], asks: OrderBookLevel[], midPrice: number): number {
    // Test impact of a $50k order (typical large retail order)
    const testOrderSize = 50000;
    
    let remainingValue = testOrderSize;
    let weightedPrice = 0;
    let totalQuantity = 0;
    
    // Simulate market buy (consuming asks)
    for (const ask of asks) {
      if (remainingValue <= 0) break;
      
      const orderValue = Math.min(remainingValue, ask.total);
      const quantity = orderValue / ask.price;
      
      weightedPrice += ask.price * quantity;
      totalQuantity += quantity;
      remainingValue -= orderValue;
    }
    
    if (totalQuantity === 0) return 0;
    
    const executionPrice = weightedPrice / totalQuantity;
    return ((executionPrice - midPrice) / midPrice) * 100; // Return as percentage
  }
  
  /**
   * Calculate liquidity score (crypto-specific)
   */
  private calculateLiquidityScore(bids: OrderBookLevel[], asks: OrderBookLevel[], midPrice: number): number {
    // Measure liquidity within tight spreads (important for crypto)
    const tightRange = midPrice * 0.005; // 0.5% range
    
    const tightBidLiquidity = bids
      .filter(level => level.price >= midPrice - tightRange)
      .reduce((sum, level) => sum + level.total, 0);
      
    const tightAskLiquidity = asks
      .filter(level => level.price <= midPrice + tightRange)
      .reduce((sum, level) => sum + level.total, 0);
    
    const totalTightLiquidity = tightBidLiquidity + tightAskLiquidity;
    
    // Normalize to 0-100 scale based on market size
    const baseScore = Math.min(100, (totalTightLiquidity / (midPrice * 100)) * 100);
    
    // Penalty for wide spreads (common in crypto)
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spreadPenalty = bestBid > 0 && bestAsk > 0 ? 
      Math.min(50, ((bestAsk - bestBid) / midPrice) * 10000) : 50;
    
    return Math.max(0, baseScore - spreadPenalty);
  }
  
  /**
   * Calculate order book pressure score
   */
  private calculatePressureScore(bids: OrderBookLevel[], asks: OrderBookLevel[], midPrice: number): number {
    // Analyze order distribution around current price
    const range = midPrice * 0.02; // 2% range
    
    const nearBids = bids.filter(level => level.price >= midPrice - range);
    const nearAsks = asks.filter(level => level.price <= midPrice + range);
    
    const nearBidVolume = nearBids.reduce((sum, level) => sum + level.total, 0);
    const nearAskVolume = nearAsks.reduce((sum, level) => sum + level.total, 0);
    
    const totalNearVolume = nearBidVolume + nearAskVolume;
    
    return totalNearVolume > 0 ? 
      ((nearBidVolume - nearAskVolume) / totalNearVolume) * 100 : 0;
  }
  
  /**
   * Calculate momentum score based on recent order book changes
   */
  private calculateMomentumScore(symbol: string): number {
    const history = this.orderBookHistory.get(symbol) || [];
    if (history.length < 3) return 0;
    
    const recent = history.slice(-3);
    let momentumSum = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const current = recent[i];
      const previous = recent[i - 1];
      
      const priceChange = (current.midPrice - previous.midPrice) / previous.midPrice;
      momentumSum += priceChange;
    }
    
    return (momentumSum / (recent.length - 1)) * 100;
  }
  
  /**
   * Predict volatility based on order book structure
   */
  private predictVolatility(symbol: string): number {
    const history = this.orderBookHistory.get(symbol) || [];
    if (history.length < 10) return 0;
    
    const recent = history.slice(-10);
    const spreads = recent.map(snapshot => snapshot.spread / snapshot.midPrice);
    
    // Calculate spread volatility as proxy for price volatility
    const meanSpread = spreads.reduce((sum, spread) => sum + spread, 0) / spreads.length;
    const spreadVariance = spreads.reduce((sum, spread) => 
      sum + Math.pow(spread - meanSpread, 2), 0) / spreads.length;
    
    return Math.sqrt(spreadVariance) * 100;
  }
  
  /**
   * Detect whale orders (crucial for crypto markets)
   */
  private detectWhaleOrders(bids: OrderBookLevel[], asks: OrderBookLevel[], midPrice: number, symbol: string): Array<{price: number, quantity: number, side: 'bid' | 'ask', notionalValue: number}> {
    const whales: Array<{price: number, quantity: number, side: 'bid' | 'ask', notionalValue: number}> = [];
    
    // Dynamic thresholds based on symbol and price
    let quantityThreshold = this.WHALE_THRESHOLD_USD / midPrice; // Default USD threshold
    
    if (symbol.includes('BTC')) {
      quantityThreshold = this.WHALE_THRESHOLD_BTC;
    } else if (symbol.includes('ETH')) {
      quantityThreshold = this.WHALE_THRESHOLD_ETH;
    }
    
    // Check bids for whale orders
    bids.forEach(bid => {
      if (bid.quantity >= quantityThreshold) {
        whales.push({
          price: bid.price,
          quantity: bid.quantity,
          side: 'bid',
          notionalValue: bid.total
        });
      }
    });
    
    // Check asks for whale orders
    asks.forEach(ask => {
      if (ask.quantity >= quantityThreshold) {
        whales.push({
          price: ask.price,
          quantity: ask.quantity,
          side: 'ask',
          notionalValue: ask.total
        });
      }
    });
    
    return whales.sort((a, b) => b.notionalValue - a.notionalValue).slice(0, 10);
  }
  
  /**
   * Calculate order book resilience
   */
  private calculateResilience(bids: OrderBookLevel[], asks: OrderBookLevel[], midPrice: number): number {
    // Measure how deep the order book is at various price levels
    const priceRanges = [0.01, 0.02, 0.05, 0.1]; // 1%, 2%, 5%, 10%
    let resilienceScore = 0;
    
    priceRanges.forEach((range, index) => {
      const bidDepth = bids
        .filter(level => level.price >= midPrice * (1 - range))
        .reduce((sum, level) => sum + level.total, 0);
        
      const askDepth = asks
        .filter(level => level.price <= midPrice * (1 + range))
        .reduce((sum, level) => sum + level.total, 0);
      
      const totalDepth = bidDepth + askDepth;
      const rangeWeight = (priceRanges.length - index) / priceRanges.length;
      
      resilienceScore += (totalDepth / (midPrice * 1000)) * rangeWeight * 25;
    });
    
    return Math.min(100, resilienceScore);
  }
  
  /**
   * Calculate flow imbalance over time period
   */
  private calculateFlowImbalance(symbol: string, timeWindowSeconds: number): number {
    const deltas = this.deltaHistory.get(symbol) || [];
    const cutoff = Date.now() - (timeWindowSeconds * 1000);
    
    const recentDeltas = deltas.filter(delta => delta.timestamp >= cutoff);
    
    let buyFlow = 0;
    let sellFlow = 0;
    
    recentDeltas.forEach(delta => {
      const volume = delta.quantity * delta.price;
      if (delta.side === 'bid') {
        buyFlow += volume;
      } else {
        sellFlow += volume;
      }
    });
    
    const totalFlow = buyFlow + sellFlow;
    return totalFlow > 0 ? ((buyFlow - sellFlow) / totalFlow) * 100 : 0;
  }
  
  /**
   * Store snapshot in history
   */
  private storeSnapshot(snapshot: OrderBookSnapshot): void {
    const history = this.orderBookHistory.get(snapshot.symbol) || [];
    history.push(snapshot);
    
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
    
    this.orderBookHistory.set(snapshot.symbol, history);
  }
  
  /**
   * Store deltas in history
   */
  private storeDeltas(symbol: string, deltas: OrderBookDelta[]): void {
    const history = this.deltaHistory.get(symbol) || [];
    history.push(...deltas);
    
    if (history.length > this.maxDeltaHistory) {
      history.splice(0, history.length - this.maxDeltaHistory);
    }
    
    this.deltaHistory.set(symbol, history);
  }
  
  /**
   * Get previous snapshot for delta calculation
   */
  private getPreviousSnapshot(symbol: string): OrderBookSnapshot | null {
    const history = this.orderBookHistory.get(symbol) || [];
    return history.length > 0 ? history[history.length - 1] : null;
  }
  
  /**
   * Calculate deltas between snapshots (like real-time streaming)
   */
  private calculateDeltas(previous: OrderBookSnapshot, current: OrderBookSnapshot): OrderBookDelta[] {
    const deltas: OrderBookDelta[] = [];
    
    // Compare bids
    const bidDeltas = this.compareLevels(previous.bids, current.bids, 'bid', current.timestamp);
    const askDeltas = this.compareLevels(previous.asks, current.asks, 'ask', current.timestamp);
    
    return [...bidDeltas, ...askDeltas];
  }
  
  /**
   * Compare order book levels to find changes
   */
  private compareLevels(previousLevels: OrderBookLevel[], currentLevels: OrderBookLevel[], side: 'bid' | 'ask', timestamp: number): OrderBookDelta[] {
    const deltas: OrderBookDelta[] = [];
    const previousMap = new Map(previousLevels.map(level => [level.price, level]));
    const currentMap = new Map(currentLevels.map(level => [level.price, level]));
    
    // Find updates and inserts
    currentLevels.forEach(current => {
      const previous = previousMap.get(current.price);
      if (!previous) {
        // New level
        deltas.push({
          symbol: '',
          timestamp,
          side,
          price: current.price,
          quantity: current.quantity,
          action: 'insert'
        });
      } else if (previous.quantity !== current.quantity) {
        // Updated level
        deltas.push({
          symbol: '',
          timestamp,
          side,
          price: current.price,
          quantity: current.quantity,
          action: 'update'
        });
      }
    });
    
    // Find deletions
    previousLevels.forEach(previous => {
      if (!currentMap.has(previous.price)) {
        deltas.push({
          symbol: '',
          timestamp,
          side,
          price: previous.price,
          quantity: 0,
          action: 'delete'
        });
      }
    });
    
    return deltas;
  }
  
  /**
   * Get comprehensive analysis for a symbol
   */
  getSymbolAnalysis(symbol: string): {
    currentMetrics: OrderFlowMetrics | null;
    historicalSnapshots: number;
    recentDeltas: number;
    analysisQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const history = this.orderBookHistory.get(symbol) || [];
    const deltas = this.deltaHistory.get(symbol) || [];
    
    let analysisQuality: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (history.length > 100 && deltas.length > 500) {
      analysisQuality = 'HIGH';
    } else if (history.length > 20 && deltas.length > 100) {
      analysisQuality = 'MEDIUM';
    }
    
    return {
      currentMetrics: history.length > 0 ? this.calculateMetrics(history[history.length - 1]) : null,
      historicalSnapshots: history.length,
      recentDeltas: deltas.filter(d => d.timestamp > Date.now() - 300000).length, // 5 minutes
      analysisQuality
    };
  }
}