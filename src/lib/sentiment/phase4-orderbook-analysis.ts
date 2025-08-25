/**
 * Phase 4: Order Book Analysis System
 * Real-time order book intelligence from Binance WebSocket streams
 * Analyzes bid/ask spreads, order flow, and market depth for trading edge
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

// Order Book Data Structures
export interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number; // Running total for market depth calculation
}

export interface OrderBookSnapshot {
  symbol: string;
  timestamp: Date;
  lastUpdateId: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  
  // Calculated metrics
  spreadPercent: number;
  midPrice: number;
  bidDepth: number;    // Total BTC in top 10 bids
  askDepth: number;    // Total BTC in top 10 asks
  imbalanceRatio: number; // Bid depth / Ask depth (>1 = bullish pressure)
  
  // Order flow metrics
  largeBidOrders: number;   // Orders > $100k
  largeAskOrders: number;   // Orders > $100k
  wallPressure: 'BUY' | 'SELL' | 'NEUTRAL'; // Large order wall detection
}

export interface OrderBookIntelligence {
  symbol: string;
  timestamp: Date;
  
  // Market Structure Analysis
  marketStructure: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number; // 0-100
    confidence: number; // 0-100
  };
  
  // Liquidity Analysis
  liquidity: {
    depth: 'HIGH' | 'MEDIUM' | 'LOW';
    spreadTightness: number; // Lower = better liquidity
    marketImpactScore: number; // Cost to move price 1%
  };
  
  // Order Flow Signals
  orderFlow: {
    whaleActivity: boolean;
    institutionalFlow: 'BUYING' | 'SELLING' | 'NEUTRAL';
    retailSentiment: 'BUYING' | 'SELLING' | 'NEUTRAL';
    urgency: number; // 0-100, high = aggressive market orders
  };
  
  // Trading Signals
  signals: {
    positionBias: 'LONG' | 'SHORT' | 'NEUTRAL';
    entryConfidence: number; // 0-100
    stopLossLevel: number;
    takeProfitLevel: number;
    riskRewardRatio: number;
  };
  
  // Raw metrics for ML
  rawMetrics: {
    bidAskSpread: number;
    orderBookSkew: number; // -1 to 1, negative = more sells
    volumeWeightedSpread: number;
    depthImbalance: number;
    largeOrderRatio: number;
  };
}

export class OrderBookAnalyzer extends EventEmitter {
  private ws: WebSocket | null = null;
  private orderBook: Map<string, OrderBookSnapshot> = new Map();
  private readonly symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Binance US WebSocket URLs (better for US-based servers)
  private readonly BINANCE_US_WS = 'wss://stream.binance.us:9443/ws';
  
  // Use single stream for now (easier to handle)  
  private currentSymbolIndex = 0;

  constructor() {
    super();
    this.connect();
  }

  private connect(): void {
    try {
      // Connect to single stream first (BTC)
      const symbol = this.symbols[this.currentSymbolIndex].toLowerCase();
      const streamUrl = `${this.BINANCE_US_WS}/${symbol}@depth20@100ms`;
      this.ws = new WebSocket(streamUrl);
      
      this.ws.on('open', () => {
        console.log('🔗 Connected to Binance US Order Book WebSocket');
        this.reconnectAttempts = 0;
        this.emit('connected');
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });
      
      this.ws.on('close', () => {
        console.log('❌ Binance WebSocket connection closed');
        this.reconnect();
      });
      
      this.ws.on('error', (error) => {
        console.error('🚨 Binance US WebSocket error:', error);
        this.reconnect();
      });
      
    } catch (error) {
      console.error('Failed to connect to Binance US WebSocket:', error);
      this.reconnect();
    }
  }
  
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }
  
  private handleMessage(data: any): void {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle both single stream and multi-stream formats
      if (message.stream && message.data) {
        // Multi-stream format
        const streamType = message.stream.split('@')[1];
        if (streamType.startsWith('depth')) {
          this.processDepthUpdate(message.data);
        }
      } else if (message.lastUpdateId && message.bids && message.asks) {
        // Direct single stream format (what we're actually getting)
        console.log('📊 Processing order book update for single stream');
        this.processDirectDepthUpdate(message);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  private processDepthUpdate(data: any): void {
    const symbol = data.s;
    const bids = data.bids.map(([price, qty]: string[]) => ({
      price: parseFloat(price),
      quantity: parseFloat(qty)
    }));
    
    const asks = data.asks.map(([price, qty]: string[]) => ({
      price: parseFloat(price),
      quantity: parseFloat(qty)
    }));
    
    // Calculate running totals for market depth
    let bidTotal = 0;
    const processedBids = bids.map((bid: OrderBookLevel) => {
      bidTotal += bid.quantity;
      return { ...bid, total: bidTotal };
    });
    
    let askTotal = 0;
    const processedAsks = asks.map((ask: OrderBookLevel) => {
      askTotal += ask.quantity;
      return { ...ask, total: askTotal };
    });
    
    const snapshot = this.calculateMetrics(symbol, processedBids, processedAsks, data.lastUpdateId);
    this.orderBook.set(symbol, snapshot);
    
    // Generate intelligence analysis
    const intelligence = this.generateIntelligence(snapshot);
    
    this.emit('orderBookUpdate', { snapshot, intelligence });
  }
  
  private processDirectDepthUpdate(data: any): void {
    // For direct single stream format - infer symbol from current connection
    const symbol = this.symbols[this.currentSymbolIndex];
    
    const bids = data.bids.map(([price, qty]: string[]) => ({
      price: parseFloat(price),
      quantity: parseFloat(qty)
    }));
    
    const asks = data.asks.map(([price, qty]: string[]) => ({
      price: parseFloat(price),
      quantity: parseFloat(qty)
    }));
    
    // Calculate running totals for market depth
    let bidTotal = 0;
    const processedBids = bids.map((bid: OrderBookLevel) => {
      bidTotal += bid.quantity;
      return { ...bid, total: bidTotal };
    });
    
    let askTotal = 0;
    const processedAsks = asks.map((ask: OrderBookLevel) => {
      askTotal += ask.quantity;
      return { ...ask, total: askTotal };
    });
    
    const snapshot = this.calculateMetrics(symbol, processedBids, processedAsks, data.lastUpdateId);
    this.orderBook.set(symbol, snapshot);
    
    // Generate intelligence analysis
    const intelligence = this.generateIntelligence(snapshot);
    
    console.log(`✅ Generated order book signal for ${symbol}: ${intelligence.signals.positionBias} (${intelligence.signals.entryConfidence}%)`);
    
    this.emit('orderBookUpdate', { snapshot, intelligence });
  }
  
  private calculateMetrics(
    symbol: string,
    bids: OrderBookLevel[],
    asks: OrderBookLevel[],
    lastUpdateId: number
  ): OrderBookSnapshot {
    
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / midPrice) * 100;
    
    // Calculate market depth (top 10 levels)
    const bidDepth = bids.slice(0, 10).reduce((sum, bid) => sum + (bid.quantity * bid.price), 0);
    const askDepth = asks.slice(0, 10).reduce((sum, ask) => sum + (ask.quantity * ask.price), 0);
    const imbalanceRatio = bidDepth / (askDepth || 1);
    
    // Detect large orders (>$100k USD equivalent)
    const LARGE_ORDER_THRESHOLD = 100000 / midPrice; // Convert $100k to BTC equivalent
    const largeBidOrders = bids.filter(bid => bid.quantity * bid.price > LARGE_ORDER_THRESHOLD).length;
    const largeAskOrders = asks.filter(ask => ask.quantity * ask.price > LARGE_ORDER_THRESHOLD).length;
    
    // Determine wall pressure
    let wallPressure: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (largeBidOrders > largeAskOrders * 1.5) {
      wallPressure = 'BUY';
    } else if (largeAskOrders > largeBidOrders * 1.5) {
      wallPressure = 'SELL';
    }
    
    return {
      symbol,
      timestamp: new Date(),
      lastUpdateId,
      bids,
      asks,
      spreadPercent,
      midPrice,
      bidDepth,
      askDepth,
      imbalanceRatio,
      largeBidOrders,
      largeAskOrders,
      wallPressure
    };
  }
  
  private generateIntelligence(snapshot: OrderBookSnapshot): OrderBookIntelligence {
    // Market Structure Analysis
    const marketStructure = this.analyzeMarketStructure(snapshot);
    
    // Liquidity Analysis  
    const liquidity = this.analyzeLiquidity(snapshot);
    
    // Order Flow Analysis
    const orderFlow = this.analyzeOrderFlow(snapshot);
    
    // Generate Trading Signals
    const signals = this.generateTradingSignals(snapshot, marketStructure, orderFlow);
    
    // Raw metrics for machine learning
    const rawMetrics = {
      bidAskSpread: snapshot.spreadPercent,
      orderBookSkew: (snapshot.bidDepth - snapshot.askDepth) / (snapshot.bidDepth + snapshot.askDepth),
      volumeWeightedSpread: this.calculateVWAP(snapshot),
      depthImbalance: snapshot.imbalanceRatio - 1, // Normalized around 0
      largeOrderRatio: (snapshot.largeBidOrders + snapshot.largeAskOrders) / 20 // Out of 20 total levels
    };
    
    return {
      symbol: snapshot.symbol,
      timestamp: snapshot.timestamp,
      marketStructure,
      liquidity,
      orderFlow,
      signals,
      rawMetrics
    };
  }
  
  private analyzeMarketStructure(snapshot: OrderBookSnapshot) {
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let strength = 50;
    let confidence = 50;
    
    // Imbalance ratio analysis
    if (snapshot.imbalanceRatio > 1.2) {
      trend = 'BULLISH';
      strength = Math.min(90, 50 + (snapshot.imbalanceRatio - 1) * 40);
    } else if (snapshot.imbalanceRatio < 0.8) {
      trend = 'BEARISH';
      strength = Math.max(10, 50 - (1 - snapshot.imbalanceRatio) * 40);
    }
    
    // Wall pressure confirmation
    if (snapshot.wallPressure === 'BUY' && trend === 'BULLISH') {
      confidence = Math.min(95, confidence + 30);
    } else if (snapshot.wallPressure === 'SELL' && trend === 'BEARISH') {
      confidence = Math.min(95, confidence + 30);
    }
    
    // Spread tightness (tight spread = higher confidence)
    if (snapshot.spreadPercent < 0.01) {
      confidence = Math.min(95, confidence + 20);
    }
    
    return { trend, strength, confidence };
  }
  
  private analyzeLiquidity(snapshot: OrderBookSnapshot) {
    let depth: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    const totalDepth = snapshot.bidDepth + snapshot.askDepth;
    
    // Depth thresholds (in USD equivalent)
    if (totalDepth > 10000000) { // >$10M
      depth = 'HIGH';
    } else if (totalDepth < 1000000) { // <$1M
      depth = 'LOW';
    }
    
    const spreadTightness = snapshot.spreadPercent;
    
    // Market impact score (cost to move price 1%)
    const marketImpactScore = this.calculateMarketImpact(snapshot);
    
    return {
      depth,
      spreadTightness,
      marketImpactScore
    };
  }
  
  private analyzeOrderFlow(snapshot: OrderBookSnapshot) {
    const whaleActivity = snapshot.largeBidOrders + snapshot.largeAskOrders > 3;
    
    let institutionalFlow: 'BUYING' | 'SELLING' | 'NEUTRAL' = 'NEUTRAL';
    if (snapshot.largeBidOrders > snapshot.largeAskOrders * 1.5) {
      institutionalFlow = 'BUYING';
    } else if (snapshot.largeAskOrders > snapshot.largeBidOrders * 1.5) {
      institutionalFlow = 'SELLING';
    }
    
    // Retail sentiment (opposite of institutional for contrarian signal)
    const retailSentiment = institutionalFlow === 'BUYING' ? 'SELLING' : 
                           institutionalFlow === 'SELLING' ? 'BUYING' : 'NEUTRAL';
    
    // Urgency based on spread and large order presence
    const urgency = Math.min(100, 
      (snapshot.spreadPercent * 1000) + 
      (snapshot.largeBidOrders + snapshot.largeAskOrders) * 10
    );
    
    return {
      whaleActivity,
      institutionalFlow,
      retailSentiment,
      urgency
    };
  }
  
  private generateTradingSignals(
    snapshot: OrderBookSnapshot,
    marketStructure: any,
    orderFlow: any
  ) {
    let positionBias: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let entryConfidence = 50;
    
    // Combine signals
    if (marketStructure.trend === 'BULLISH' && orderFlow.institutionalFlow === 'BUYING') {
      positionBias = 'LONG';
      entryConfidence = Math.min(95, marketStructure.confidence + 20);
    } else if (marketStructure.trend === 'BEARISH' && orderFlow.institutionalFlow === 'SELLING') {
      positionBias = 'SHORT';
      entryConfidence = Math.min(95, marketStructure.confidence + 20);
    }
    
    // Calculate levels
    const stopLossLevel = positionBias === 'LONG' ? 
      snapshot.midPrice * 0.98 : snapshot.midPrice * 1.02;
    
    const takeProfitLevel = positionBias === 'LONG' ?
      snapshot.midPrice * 1.04 : snapshot.midPrice * 0.96;
    
    const riskRewardRatio = Math.abs(takeProfitLevel - snapshot.midPrice) / 
                           Math.abs(snapshot.midPrice - stopLossLevel);
    
    return {
      positionBias,
      entryConfidence,
      stopLossLevel,
      takeProfitLevel,
      riskRewardRatio
    };
  }
  
  private calculateVWAP(snapshot: OrderBookSnapshot): number {
    const bidVWAP = snapshot.bids.slice(0, 5).reduce((sum, bid, i) => 
      sum + (bid.price * bid.quantity), 0) / 
      snapshot.bids.slice(0, 5).reduce((sum, bid) => sum + bid.quantity, 0);
    
    const askVWAP = snapshot.asks.slice(0, 5).reduce((sum, ask, i) => 
      sum + (ask.price * ask.quantity), 0) / 
      snapshot.asks.slice(0, 5).reduce((sum, ask) => sum + ask.quantity, 0);
    
    return Math.abs(askVWAP - bidVWAP) / ((askVWAP + bidVWAP) / 2) * 100;
  }
  
  private calculateMarketImpact(snapshot: OrderBookSnapshot): number {
    // Calculate cost to move price 1%
    const targetPrice = snapshot.midPrice * 1.01; // 1% higher
    let cumulative = 0;
    
    for (const ask of snapshot.asks) {
      cumulative += ask.quantity * ask.price;
      if (ask.price >= targetPrice) {
        break;
      }
    }
    
    return cumulative;
  }
  
  // Public methods
  public getOrderBook(symbol: string): OrderBookSnapshot | null {
    return this.orderBook.get(symbol) || null;
  }
  
  public getAllOrderBooks(): Map<string, OrderBookSnapshot> {
    return new Map(this.orderBook);
  }
  
  public getSymbols(): string[] {
    return this.symbols;
  }
  
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const orderBookAnalyzer = new OrderBookAnalyzer();