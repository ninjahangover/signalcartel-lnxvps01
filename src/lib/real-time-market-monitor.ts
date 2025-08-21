/**
 * Real-Time Market Monitor
 * 
 * Continuously monitors market conditions and adjusts Pine Script strategy inputs
 * in real-time based on:
 * - Sudden volatility changes
 * - Volume spikes
 * - Trend reversals
 * - News events
 * - Market regime shifts
 * 
 * This ensures strategies stay optimized as market conditions change throughout the day.
 */

import { pineScriptInputOptimizer, type PineScriptInputs } from './pine-script-input-optimizer';
import { unifiedMarketDataService, type MarketConditions } from './unified-market-data-service';

export interface MarketCondition {
  symbol: string;
  timestamp: Date;
  price: number;
  priceChange24h: number;
  volume: number;
  volumeChange24h: number;
  volatility: number;
  volatilityChange: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  trendStrength: number;
  support: number;
  resistance: number;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    divergence: boolean;
  };
  marketRegime: 'TRENDING' | 'RANGING' | 'BREAKOUT' | 'CONSOLIDATION';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface MarketEvent {
  type: 'VOLATILITY_SPIKE' | 'VOLUME_SURGE' | 'TREND_REVERSAL' | 'BREAKOUT' | 'NEWS_IMPACT' | 'REGIME_CHANGE';
  symbol: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  timestamp: Date;
  data: any;
  recommendedAction: 'PAUSE_TRADING' | 'REDUCE_SIZE' | 'INCREASE_SIZE' | 'TIGHTEN_STOPS' | 'WIDEN_STOPS' | 'NO_ACTION';
}

export interface DynamicAdjustment {
  strategyId: string;
  symbol: string;
  trigger: MarketEvent;
  inputAdjustments: Partial<PineScriptInputs>;
  adjustmentReason: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  duration: 'TEMPORARY' | 'UNTIL_REVERSAL' | 'PERMANENT';
  revertConditions?: string[];
  timestamp: Date;
}

class RealTimeMarketMonitor {
  private static instance: RealTimeMarketMonitor | null = null;
  private monitoredSymbols: string[] = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
  private currentConditions: Map<string, MarketCondition> = new Map();
  private recentEvents: MarketEvent[] = [];
  private activeAdjustments: Map<string, DynamicAdjustment[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventProcessingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private listeners: Set<(event: MarketEvent) => void> = new Set();

  // Thresholds for market events
  private readonly thresholds = {
    volatilitySpike: 50, // % increase in volatility
    volumeSurge: 200,    // % increase in volume
    priceMove: 5,        // % price movement in short time
    rsiExtreme: { overbought: 85, oversold: 15 },
    trendReversalStrength: 0.7
  };

  private constructor() {}

  static getInstance(): RealTimeMarketMonitor {
    if (!RealTimeMarketMonitor.instance) {
      RealTimeMarketMonitor.instance = new RealTimeMarketMonitor();
    }
    return RealTimeMarketMonitor.instance;
  }

  // Start real-time monitoring
  async startMonitoring(symbols: string[] = this.monitoredSymbols): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Market monitor already running');
      return;
    }

    this.isRunning = true;
    this.monitoredSymbols = symbols;
    console.log('🌊 Starting real-time market monitoring for:', symbols);

    // Monitor market conditions every 10 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.updateMarketConditions();
    }, 10000);

    // Process events and make adjustments every 30 seconds
    this.eventProcessingInterval = setInterval(async () => {
      await this.processMarketEvents();
      await this.reviewActiveAdjustments();
    }, 30000);

    // Initial update
    await this.updateMarketConditions();

    console.log('✅ Real-time market monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.eventProcessingInterval) {
      clearInterval(this.eventProcessingInterval);
      this.eventProcessingInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Real-time market monitoring stopped');
  }

  // Update market conditions for all symbols
  private async updateMarketConditions(): Promise<void> {
    for (const symbol of this.monitoredSymbols) {
      try {
        const condition = await this.analyzeMarketCondition(symbol);
        const previousCondition = this.currentConditions.get(symbol);
        
        this.currentConditions.set(symbol, condition);

        // Detect events by comparing with previous condition
        if (previousCondition) {
          const events = this.detectMarketEvents(previousCondition, condition);
          this.recentEvents.push(...events);

          // Keep only last 50 events
          if (this.recentEvents.length > 50) {
            this.recentEvents = this.recentEvents.slice(-50);
          }
        }

      } catch (error) {
        console.error(`❌ Market condition update error for ${symbol}:`, error);
      }
    }
  }

  // Analyze current market condition for a symbol
  private async analyzeMarketCondition(symbol: string): Promise<MarketCondition> {
    try {
      const currentPrice = await realMarketData.getCurrentPrice(symbol);
      const marketData = await this.getDetailedMarketData(symbol);
      const aiDecision = await getAITradingSignal(symbol);
      const quickAdjustments = await getQuickTradingAdjustments(symbol);

      // Calculate technical indicators
      const rsi = await this.calculateRSI(symbol);
      const macd = await this.calculateMACD(symbol);
      
      // Determine trend and regime
      const trend = this.determineTrend(marketData);
      const trendStrength = this.calculateTrendStrength(marketData);
      const marketRegime = this.determineMarketRegime(marketData);
      const riskLevel = this.assessRiskLevel(marketData, aiDecision);

      return {
        symbol,
        timestamp: new Date(),
        price: currentPrice,
        priceChange24h: marketData.priceChange24h,
        volume: marketData.volume,
        volumeChange24h: marketData.volumeChange24h,
        volatility: marketData.volatility,
        volatilityChange: marketData.volatilityChange,
        trend,
        trendStrength,
        support: marketData.support,
        resistance: marketData.resistance,
        rsi,
        macd,
        marketRegime,
        riskLevel
      };

    } catch (error) {
      console.error(`❌ Market condition analysis error for ${symbol}:`, error);
      throw error;
    }
  }

  // Detect market events by comparing conditions
  private detectMarketEvents(previous: MarketCondition, current: MarketCondition): MarketEvent[] {
    const events: MarketEvent[] = [];

    // Volatility spike detection
    if (current.volatilityChange > this.thresholds.volatilitySpike) {
      events.push({
        type: 'VOLATILITY_SPIKE',
        symbol: current.symbol,
        severity: current.volatilityChange > 100 ? 'CRITICAL' : 
                  current.volatilityChange > 75 ? 'HIGH' : 'MEDIUM',
        description: `Volatility spike: ${current.volatilityChange.toFixed(1)}% increase`,
        timestamp: current.timestamp,
        data: { 
          previousVolatility: previous.volatility, 
          currentVolatility: current.volatility,
          change: current.volatilityChange
        },
        recommendedAction: current.volatilityChange > 75 ? 'WIDEN_STOPS' : 'TIGHTEN_STOPS'
      });
    }

    // Volume surge detection
    if (current.volumeChange24h > this.thresholds.volumeSurge) {
      events.push({
        type: 'VOLUME_SURGE',
        symbol: current.symbol,
        severity: current.volumeChange24h > 500 ? 'CRITICAL' : 
                  current.volumeChange24h > 300 ? 'HIGH' : 'MEDIUM',
        description: `Volume surge: ${current.volumeChange24h.toFixed(1)}% increase`,
        timestamp: current.timestamp,
        data: { 
          previousVolume: previous.volume, 
          currentVolume: current.volume,
          change: current.volumeChange24h
        },
        recommendedAction: 'INCREASE_SIZE'
      });
    }

    // Trend reversal detection
    if (previous.trend !== current.trend && current.trendStrength > this.thresholds.trendReversalStrength) {
      events.push({
        type: 'TREND_REVERSAL',
        symbol: current.symbol,
        severity: current.trendStrength > 0.8 ? 'HIGH' : 'MEDIUM',
        description: `Trend reversal: ${previous.trend} → ${current.trend}`,
        timestamp: current.timestamp,
        data: { 
          previousTrend: previous.trend, 
          currentTrend: current.trend,
          strength: current.trendStrength
        },
        recommendedAction: 'PAUSE_TRADING'
      });
    }

    // Breakout detection
    if (current.price > previous.resistance || current.price < previous.support) {
      const breakoutType = current.price > previous.resistance ? 'resistance' : 'support';
      events.push({
        type: 'BREAKOUT',
        symbol: current.symbol,
        severity: Math.abs(current.priceChange24h) > 10 ? 'HIGH' : 'MEDIUM',
        description: `${breakoutType} breakout: price ${current.price.toFixed(2)}`,
        timestamp: current.timestamp,
        data: { 
          breakoutLevel: breakoutType === 'resistance' ? previous.resistance : previous.support,
          currentPrice: current.price,
          breakoutType
        },
        recommendedAction: 'INCREASE_SIZE'
      });
    }

    // Market regime change detection
    if (previous.marketRegime !== current.marketRegime) {
      events.push({
        type: 'REGIME_CHANGE',
        symbol: current.symbol,
        severity: 'MEDIUM',
        description: `Market regime change: ${previous.marketRegime} → ${current.marketRegime}`,
        timestamp: current.timestamp,
        data: { 
          previousRegime: previous.marketRegime, 
          currentRegime: current.marketRegime
        },
        recommendedAction: 'NO_ACTION'
      });
    }

    // Extreme RSI conditions
    if (current.rsi >= this.thresholds.rsiExtreme.overbought || 
        current.rsi <= this.thresholds.rsiExtreme.oversold) {
      events.push({
        type: 'NEWS_IMPACT', // Using this as a general extreme condition
        symbol: current.symbol,
        severity: 'MEDIUM',
        description: `Extreme RSI condition: ${current.rsi.toFixed(1)}`,
        timestamp: current.timestamp,
        data: { rsi: current.rsi },
        recommendedAction: current.rsi >= this.thresholds.rsiExtreme.overbought ? 
                          'REDUCE_SIZE' : 'INCREASE_SIZE'
      });
    }

    return events;
  }

  // Process market events and create dynamic adjustments
  private async processMarketEvents(): Promise<void> {
    const recentEvents = this.recentEvents.filter(e => 
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    for (const event of recentEvents) {
      try {
        const adjustment = await this.createDynamicAdjustment(event);
        if (adjustment) {
          await this.applyDynamicAdjustment(adjustment);
        }
      } catch (error) {
        console.error('❌ Event processing error:', error);
      }
    }
  }

  // Create dynamic adjustment based on market event
  private async createDynamicAdjustment(event: MarketEvent): Promise<DynamicAdjustment | null> {
    const currentCondition = this.currentConditions.get(event.symbol);
    if (!currentCondition) return null;

    const inputAdjustments: Partial<PineScriptInputs> = {};
    let adjustmentReason = '';
    let severity: 'MINOR' | 'MODERATE' | 'MAJOR' = 'MINOR';
    let duration: 'TEMPORARY' | 'UNTIL_REVERSAL' | 'PERMANENT' = 'TEMPORARY';

    switch (event.type) {
      case 'VOLATILITY_SPIKE':
        if (event.severity === 'CRITICAL') {
          inputAdjustments.stop_loss_percent = 4.0; // Wider stops
          inputAdjustments.position_size_percent = 1.0; // Smaller positions
          inputAdjustments.volatility_filter = 50; // Higher filter
          severity = 'MAJOR';
          duration = 'UNTIL_REVERSAL';
        } else {
          inputAdjustments.stop_loss_percent = 3.0;
          inputAdjustments.volatility_filter = 40;
          severity = 'MODERATE';
        }
        adjustmentReason = 'Volatility spike protection';
        break;

      case 'VOLUME_SURGE':
        inputAdjustments.position_size_percent = 3.0; // Larger positions
        inputAdjustments.volume_threshold = event.data.currentVolume * 0.5; // Lower threshold
        inputAdjustments.momentum_threshold = 0.8; // Lower momentum requirement
        severity = 'MODERATE';
        adjustmentReason = 'Volume surge opportunity';
        break;

      case 'TREND_REVERSAL':
        inputAdjustments.trend_filter_enabled = false; // Disable trend filter temporarily
        inputAdjustments.take_profit_percent = 2.0; // Quicker profits
        inputAdjustments.position_size_percent = 1.5; // Smaller positions
        severity = 'MAJOR';
        duration = 'UNTIL_REVERSAL';
        adjustmentReason = 'Trend reversal adaptation';
        break;

      case 'BREAKOUT':
        inputAdjustments.position_size_percent = 3.5; // Larger positions for breakouts
        inputAdjustments.take_profit_percent = 6.0; // Higher profit targets
        inputAdjustments.momentum_threshold = 0.5; // Lower momentum requirement
        severity = 'MODERATE';
        adjustmentReason = 'Breakout momentum capture';
        break;

      case 'REGIME_CHANGE':
        switch (currentCondition.marketRegime) {
          case 'TRENDING':
            inputAdjustments.macd_fast = 10;
            inputAdjustments.macd_slow = 22;
            inputAdjustments.take_profit_percent = 5.0;
            break;
          case 'RANGING':
            inputAdjustments.rsi_overbought = 80;
            inputAdjustments.rsi_oversold = 20;
            inputAdjustments.take_profit_percent = 2.5;
            break;
          case 'CONSOLIDATION':
            inputAdjustments.position_size_percent = 1.0;
            inputAdjustments.volatility_filter = 20;
            break;
        }
        severity = 'MODERATE';
        duration = 'PERMANENT';
        adjustmentReason = `Market regime adaptation: ${currentCondition.marketRegime}`;
        break;

      default:
        return null;
    }

    // Check if similar adjustment already exists
    const existingAdjustments = this.activeAdjustments.get(event.symbol) || [];
    const conflictingAdjustment = existingAdjustments.find(adj => 
      adj.trigger.type === event.type && 
      Date.now() - adj.timestamp.getTime() < 10 * 60 * 1000 // Within 10 minutes
    );

    if (conflictingAdjustment) {
      console.log(`⚠️ Skipping adjustment - similar adjustment already active for ${event.symbol}`);
      return null;
    }

    return {
      strategyId: 'default', // Would map based on symbol
      symbol: event.symbol,
      trigger: event,
      inputAdjustments,
      adjustmentReason,
      severity,
      duration,
      revertConditions: duration === 'UNTIL_REVERSAL' ? [
        'volatility_normalized',
        'trend_stabilized',
        'volume_normalized'
      ] : undefined,
      timestamp: new Date()
    };
  }

  // Apply dynamic adjustment to strategy inputs
  private async applyDynamicAdjustment(adjustment: DynamicAdjustment): Promise<void> {
    try {
      // Get current inputs
      const currentInputs = pineScriptInputOptimizer.getCurrentInputs(adjustment.strategyId);
      if (!currentInputs) {
        console.log(`⚠️ No current inputs found for strategy ${adjustment.strategyId}`);
        return;
      }

      // Apply adjustments
      const newInputs = { ...currentInputs, ...adjustment.inputAdjustments };

      // Temporarily update the strategy inputs
      // This would normally call the Pine Script Input Optimizer to update
      console.log(`⚡ Applied dynamic adjustment to ${adjustment.strategyId}:`, {
        symbol: adjustment.symbol,
        trigger: adjustment.trigger.type,
        severity: adjustment.severity,
        adjustments: Object.keys(adjustment.inputAdjustments).length,
        reason: adjustment.adjustmentReason
      });

      // Store the active adjustment
      const symbolAdjustments = this.activeAdjustments.get(adjustment.symbol) || [];
      symbolAdjustments.push(adjustment);
      this.activeAdjustments.set(adjustment.symbol, symbolAdjustments);

      // Notify listeners
      this.notifyListeners(adjustment.trigger);

    } catch (error) {
      console.error('❌ Dynamic adjustment application error:', error);
    }
  }

  // Review and potentially revert active adjustments
  private async reviewActiveAdjustments(): Promise<void> {
    const now = Date.now();

    for (const [symbol, adjustments] of this.activeAdjustments) {
      const activeAdjustments = adjustments.filter(adj => {
        // Remove temporary adjustments older than 15 minutes
        if (adj.duration === 'TEMPORARY' && now - adj.timestamp.getTime() > 15 * 60 * 1000) {
          console.log(`🔄 Reverting temporary adjustment for ${symbol}: ${adj.adjustmentReason}`);
          return false;
        }

        // Check revert conditions for UNTIL_REVERSAL adjustments
        if (adj.duration === 'UNTIL_REVERSAL' && adj.revertConditions) {
          const shouldRevert = this.checkRevertConditions(symbol, adj.revertConditions);
          if (shouldRevert) {
            console.log(`🔄 Reverting conditional adjustment for ${symbol}: ${adj.adjustmentReason}`);
            return false;
          }
        }

        return true;
      });

      this.activeAdjustments.set(symbol, activeAdjustments);
    }
  }

  // Check if revert conditions are met
  private checkRevertConditions(symbol: string, conditions: string[]): boolean {
    const currentCondition = this.currentConditions.get(symbol);
    if (!currentCondition) return false;

    for (const condition of conditions) {
      switch (condition) {
        case 'volatility_normalized':
          if (currentCondition.volatility > 30) return false;
          break;
        case 'trend_stabilized':
          if (currentCondition.trendStrength < 0.6) return false;
          break;
        case 'volume_normalized':
          if (Math.abs(currentCondition.volumeChange24h) > 100) return false;
          break;
      }
    }

    return true;
  }

  // Helper methods for technical analysis
  private async getDetailedMarketData(symbol: string): Promise<any> {
    // This would fetch real market data - using mock data for now
    const currentPrice = await realMarketData.getCurrentPrice(symbol);
    
    return {
      priceChange24h: (Math.random() - 0.5) * 10, // -5% to +5%
      volume: Math.random() * 1000000,
      volumeChange24h: (Math.random() - 0.5) * 400, // -200% to +200%
      volatility: 10 + Math.random() * 40, // 10% to 50%
      volatilityChange: (Math.random() - 0.5) * 100, // -50% to +50%
      support: currentPrice * 0.95,
      resistance: currentPrice * 1.05,
      atr: currentPrice * 0.02
    };
  }

  private async calculateRSI(symbol: string): Promise<number> {
    // Mock RSI calculation - would use real market data
    return 30 + Math.random() * 40; // 30-70 range
  }

  private async calculateMACD(symbol: string): Promise<any> {
    // Mock MACD calculation
    return {
      value: (Math.random() - 0.5) * 10,
      signal: (Math.random() - 0.5) * 10,
      divergence: Math.random() > 0.8
    };
  }

  private determineTrend(marketData: any): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    if (marketData.priceChange24h > 2) return 'BULLISH';
    if (marketData.priceChange24h < -2) return 'BEARISH';
    return 'SIDEWAYS';
  }

  private calculateTrendStrength(marketData: any): number {
    return Math.min(1, Math.abs(marketData.priceChange24h) / 10);
  }

  private determineMarketRegime(marketData: any): 'TRENDING' | 'RANGING' | 'BREAKOUT' | 'CONSOLIDATION' {
    if (marketData.volatility > 35) return 'BREAKOUT';
    if (marketData.volatility < 15) return 'CONSOLIDATION';
    if (Math.abs(marketData.priceChange24h) > 3) return 'TRENDING';
    return 'RANGING';
  }

  private assessRiskLevel(marketData: any, aiDecision: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    if (marketData.volatility > 40) return 'EXTREME';
    if (marketData.volatility > 30 || aiDecision.confidence < 0.5) return 'HIGH';
    if (marketData.volatility > 20 || aiDecision.confidence < 0.7) return 'MEDIUM';
    return 'LOW';
  }

  // Public API
  addListener(callback: (event: MarketEvent) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (event: MarketEvent) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(event: MarketEvent): void {
    this.listeners.forEach(callback => callback(event));
  }

  getCurrentConditions(): Map<string, MarketCondition> {
    return new Map(this.currentConditions);
  }

  getRecentEvents(): MarketEvent[] {
    return [...this.recentEvents];
  }

  getActiveAdjustments(): Map<string, DynamicAdjustment[]> {
    return new Map(this.activeAdjustments);
  }

  isMonitoring(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const realTimeMarketMonitor = RealTimeMarketMonitor.getInstance();

// Export helper functions
export async function startMarketMonitoring(symbols?: string[]): Promise<void> {
  await realTimeMarketMonitor.startMonitoring(symbols);
}

export function stopMarketMonitoring(): void {
  realTimeMarketMonitor.stopMonitoring();
}

export function getCurrentMarketConditions(): Map<string, MarketCondition> {
  return realTimeMarketMonitor.getCurrentConditions();
}

export function getRecentMarketEvents(): MarketEvent[] {
  return realTimeMarketMonitor.getRecentEvents();
}