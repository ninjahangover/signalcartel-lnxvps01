/**
 * Market Correlation Analyzer
 * 
 * Analyzes correlations between multiple symbols to improve state predictions.
 * Uses statistical methods to identify leading/lagging relationships and
 * co-movement patterns that enhance Markov chain accuracy.
 */

// Extended MarketData for OHLC support
export interface MarketDataOHLC {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
import { EnhancedMarketState, MarketStateMetrics } from './enhanced-market-state-classifier';

export interface CorrelationMetrics {
  symbol1: string;
  symbol2: string;
  correlation: number;           // Pearson correlation (-1 to 1)
  rollingCorrelation: number[];  // Recent correlation history
  leadLag: {
    leader: string;             // Which symbol leads
    lagPeriods: number;         // How many periods ahead
    confidence: number;         // Statistical confidence
  };
  cointegration: {
    isCointegrated: boolean;
    spread: number;
    zScore: number;             // Standard deviations from mean
    halfLife: number;           // Mean reversion half-life
  };
  volatilitySpillover: {
    direction: 'symbol1_to_symbol2' | 'symbol2_to_symbol1' | 'bidirectional' | 'none';
    strength: number;           // 0-1
  };
}

export interface CrossMarketState {
  primarySymbol: string;
  primaryState: EnhancedMarketState;
  correlatedStates: Map<string, {
    state: EnhancedMarketState;
    correlation: number;
    influence: number;          // How much this affects primary
  }>;
  marketRegime: 'risk_on' | 'risk_off' | 'decorrelated' | 'transitioning';
  sectorRotation: boolean;
  contagionRisk: number;        // 0-1, risk of cascade effects
}

export interface IntermarketSignal {
  type: 'divergence' | 'convergence' | 'breakout' | 'reversal' | 'regime_change';
  strength: number;              // 0-100
  symbols: string[];
  description: string;
  actionableInsight: string;
}

export class MarketCorrelationAnalyzer {
  private correlationMatrix: Map<string, CorrelationMetrics> = new Map();
  private priceHistories: Map<string, MarketDataOHLC[]> = new Map();
  private stateHistories: Map<string, EnhancedMarketState[]> = new Map();
  private readonly minDataPoints = 50;
  private readonly correlationWindow = 20;
  
  constructor() {}
  
  /**
   * Update price and state data for a symbol
   */
  public updateSymbolData(
    symbol: string, 
    marketData: MarketDataOHLC, 
    state: EnhancedMarketState
  ): void {
    // Update price history
    if (!this.priceHistories.has(symbol)) {
      this.priceHistories.set(symbol, []);
    }
    const history = this.priceHistories.get(symbol)!;
    history.push(marketData);
    
    // Keep only recent data (last 500 points)
    if (history.length > 500) {
      history.shift();
    }
    
    // Update state history
    if (!this.stateHistories.has(symbol)) {
      this.stateHistories.set(symbol, []);
    }
    const stateHistory = this.stateHistories.get(symbol)!;
    stateHistory.push(state);
    
    if (stateHistory.length > 500) {
      stateHistory.shift();
    }
    
    // Recalculate correlations with other symbols
    this.updateCorrelations(symbol);
  }
  
  /**
   * Calculate correlations between a symbol and all others
   */
  private updateCorrelations(symbol: string): void {
    const symbols = Array.from(this.priceHistories.keys());
    
    for (const otherSymbol of symbols) {
      if (otherSymbol === symbol) continue;
      
      const history1 = this.priceHistories.get(symbol)!;
      const history2 = this.priceHistories.get(otherSymbol)!;
      
      if (history1.length < this.minDataPoints || history2.length < this.minDataPoints) {
        continue;
      }
      
      const metrics = this.calculateCorrelationMetrics(symbol, otherSymbol, history1, history2);
      const key = this.getCorrelationKey(symbol, otherSymbol);
      this.correlationMatrix.set(key, metrics);
    }
  }
  
  /**
   * Calculate comprehensive correlation metrics between two symbols
   */
  private calculateCorrelationMetrics(
    symbol1: string,
    symbol2: string,
    history1: MarketDataOHLC[],
    history2: MarketDataOHLC[]
  ): CorrelationMetrics {
    // Align histories by timestamp
    const aligned = this.alignHistories(history1, history2);
    
    // Calculate returns
    const returns1 = this.calculateReturns(aligned.history1);
    const returns2 = this.calculateReturns(aligned.history2);
    
    // Pearson correlation
    const correlation = this.calculatePearsonCorrelation(returns1, returns2);
    
    // Rolling correlation
    const rollingCorrelation = this.calculateRollingCorrelation(
      returns1, 
      returns2, 
      this.correlationWindow
    );
    
    // Lead-lag analysis
    const leadLag = this.analyzeLeadLag(returns1, returns2);
    
    // Cointegration analysis
    const prices1 = aligned.history1.map(d => d.close);
    const prices2 = aligned.history2.map(d => d.close);
    const cointegration = this.analyzeCointegration(prices1, prices2);
    
    // Volatility spillover
    const volatilitySpillover = this.analyzeVolatilitySpillover(returns1, returns2);
    
    return {
      symbol1,
      symbol2,
      correlation,
      rollingCorrelation,
      leadLag,
      cointegration,
      volatilitySpillover
    };
  }
  
  /**
   * Align two price histories by timestamp
   */
  private alignHistories(history1: MarketDataOHLC[], history2: MarketDataOHLC[]): {
    history1: MarketDataOHLC[];
    history2: MarketDataOHLC[];
  } {
    const aligned1: MarketDataOHLC[] = [];
    const aligned2: MarketDataOHLC[] = [];
    
    const map1 = new Map(history1.map(d => [d.timestamp.getTime(), d]));
    const map2 = new Map(history2.map(d => [d.timestamp.getTime(), d]));
    
    const commonTimestamps = Array.from(map1.keys()).filter(t => map2.has(t));
    
    for (const timestamp of commonTimestamps) {
      aligned1.push(map1.get(timestamp)!);
      aligned2.push(map2.get(timestamp)!);
    }
    
    return { history1: aligned1, history2: aligned2 };
  }
  
  /**
   * Calculate returns from price data
   */
  private calculateReturns(data: MarketDataOHLC[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    return returns;
  }
  
  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * Calculate rolling correlation over time
   */
  private calculateRollingCorrelation(x: number[], y: number[], window: number): number[] {
    const correlations: number[] = [];
    
    for (let i = window; i <= x.length; i++) {
      const windowX = x.slice(i - window, i);
      const windowY = y.slice(i - window, i);
      correlations.push(this.calculatePearsonCorrelation(windowX, windowY));
    }
    
    return correlations;
  }
  
  /**
   * Analyze lead-lag relationships
   */
  private analyzeLeadLag(returns1: number[], returns2: number[]): CorrelationMetrics['leadLag'] {
    let maxCorr = 0;
    let bestLag = 0;
    let leader = '';
    
    // Test different lag periods (-5 to +5)
    for (let lag = -5; lag <= 5; lag++) {
      if (lag === 0) continue;
      
      let correlation: number;
      if (lag > 0) {
        // Symbol1 leads symbol2 by 'lag' periods
        const aligned1 = returns1.slice(0, -lag);
        const aligned2 = returns2.slice(lag);
        correlation = Math.abs(this.calculatePearsonCorrelation(aligned1, aligned2));
      } else {
        // Symbol2 leads symbol1 by '-lag' periods
        const aligned1 = returns1.slice(-lag);
        const aligned2 = returns2.slice(0, lag);
        correlation = Math.abs(this.calculatePearsonCorrelation(aligned1, aligned2));
      }
      
      if (correlation > maxCorr) {
        maxCorr = correlation;
        bestLag = lag;
      }
    }
    
    return {
      leader: bestLag > 0 ? 'symbol1' : 'symbol2',
      lagPeriods: Math.abs(bestLag),
      confidence: maxCorr
    };
  }
  
  /**
   * Analyze cointegration between two price series
   */
  private analyzeCointegration(prices1: number[], prices2: number[]): CorrelationMetrics['cointegration'] {
    // Simple cointegration test using spread analysis
    const ratio = prices1.map((p, i) => p / prices2[i]);
    const meanRatio = ratio.reduce((a, b) => a + b, 0) / ratio.length;
    const spread = ratio.map(r => r - meanRatio);
    
    // Calculate spread statistics
    const spreadMean = spread.reduce((a, b) => a + b, 0) / spread.length;
    const spreadStd = Math.sqrt(
      spread.reduce((sum, s) => sum + (s - spreadMean) ** 2, 0) / spread.length
    );
    
    const currentSpread = spread[spread.length - 1];
    const zScore = spreadStd === 0 ? 0 : (currentSpread - spreadMean) / spreadStd;
    
    // Estimate half-life (simplified Ornstein-Uhlenbeck)
    const spreadChanges = spread.slice(1).map((s, i) => s - spread[i]);
    const meanReversion = -this.calculatePearsonCorrelation(
      spread.slice(0, -1),
      spreadChanges
    );
    const halfLife = meanReversion > 0 ? Math.log(2) / meanReversion : Infinity;
    
    // Determine if cointegrated (simplified test)
    const isCointegrated = Math.abs(zScore) < 2 && halfLife < 50 && halfLife > 0;
    
    return {
      isCointegrated,
      spread: currentSpread,
      zScore,
      halfLife
    };
  }
  
  /**
   * Analyze volatility spillover effects
   */
  private analyzeVolatilitySpillover(returns1: number[], returns2: number[]): CorrelationMetrics['volatilitySpillover'] {
    // Calculate squared returns (proxy for volatility)
    const vol1 = returns1.map(r => r * r);
    const vol2 = returns2.map(r => r * r);
    
    // Check Granger causality (simplified)
    const lag1to2 = this.calculatePearsonCorrelation(
      vol1.slice(0, -1),
      vol2.slice(1)
    );
    const lag2to1 = this.calculatePearsonCorrelation(
      vol2.slice(0, -1),
      vol1.slice(1)
    );
    
    let direction: CorrelationMetrics['volatilitySpillover']['direction'] = 'none';
    let strength = 0;
    
    if (Math.abs(lag1to2) > 0.3 && Math.abs(lag2to1) > 0.3) {
      direction = 'bidirectional';
      strength = (Math.abs(lag1to2) + Math.abs(lag2to1)) / 2;
    } else if (Math.abs(lag1to2) > 0.3) {
      direction = 'symbol1_to_symbol2';
      strength = Math.abs(lag1to2);
    } else if (Math.abs(lag2to1) > 0.3) {
      direction = 'symbol2_to_symbol1';
      strength = Math.abs(lag2to1);
    }
    
    return { direction, strength };
  }
  
  /**
   * Analyze cross-market state relationships
   */
  public analyzeCrossMarketState(primarySymbol: string): CrossMarketState | null {
    const primaryHistory = this.stateHistories.get(primarySymbol);
    if (!primaryHistory || primaryHistory.length === 0) return null;
    
    const primaryState = primaryHistory[primaryHistory.length - 1];
    const correlatedStates = new Map<string, {
      state: EnhancedMarketState;
      correlation: number;
      influence: number;
    }>();
    
    // Analyze each correlated symbol
    for (const [symbol, stateHistory] of this.stateHistories) {
      if (symbol === primarySymbol) continue;
      
      const currentState = stateHistory[stateHistory.length - 1];
      const key = this.getCorrelationKey(primarySymbol, symbol);
      const metrics = this.correlationMatrix.get(key);
      
      if (metrics) {
        // Calculate influence based on correlation and lead-lag
        let influence = Math.abs(metrics.correlation);
        if (metrics.leadLag.leader === symbol) {
          influence *= 1.5; // Boost influence for leading indicators
        }
        
        correlatedStates.set(symbol, {
          state: currentState,
          correlation: metrics.correlation,
          influence
        });
      }
    }
    
    // Determine overall market regime
    const marketRegime = this.determineMarketRegime(correlatedStates);
    
    // Check for sector rotation
    const sectorRotation = this.detectSectorRotation(correlatedStates);
    
    // Calculate contagion risk
    const contagionRisk = this.calculateContagionRisk(correlatedStates);
    
    return {
      primarySymbol,
      primaryState,
      correlatedStates,
      marketRegime,
      sectorRotation,
      contagionRisk
    };
  }
  
  /**
   * Determine overall market regime from correlations
   */
  private determineMarketRegime(
    correlatedStates: Map<string, { state: EnhancedMarketState; correlation: number; influence: number }>
  ): 'risk_on' | 'risk_off' | 'decorrelated' | 'transitioning' {
    const states = Array.from(correlatedStates.values());
    
    // Calculate average correlation
    const avgCorrelation = states.reduce((sum, s) => sum + Math.abs(s.correlation), 0) / states.length;
    
    // Count bullish vs bearish states
    const bullishStates = states.filter(s => 
      s.state.includes('UPTREND') || s.state.includes('BULLISH')
    ).length;
    const bearishStates = states.filter(s => 
      s.state.includes('DOWNTREND') || s.state.includes('BEARISH')
    ).length;
    
    if (avgCorrelation < 0.3) return 'decorrelated';
    if (avgCorrelation > 0.7) {
      if (bullishStates > bearishStates * 2) return 'risk_on';
      if (bearishStates > bullishStates * 2) return 'risk_off';
    }
    
    return 'transitioning';
  }
  
  /**
   * Detect sector rotation patterns
   */
  private detectSectorRotation(
    correlatedStates: Map<string, { state: EnhancedMarketState; correlation: number; influence: number }>
  ): boolean {
    // Look for diverging states with previously high correlation
    const states = Array.from(correlatedStates.values());
    const divergingPairs = states.filter(s => 
      Math.abs(s.correlation) < 0.3 && s.influence > 0.5
    );
    
    return divergingPairs.length > states.length * 0.3;
  }
  
  /**
   * Calculate risk of contagion effects
   */
  private calculateContagionRisk(
    correlatedStates: Map<string, { state: EnhancedMarketState; correlation: number; influence: number }>
  ): number {
    const states = Array.from(correlatedStates.values());
    
    // High correlation + volatile states = high contagion risk
    const riskyStates = states.filter(s => 
      Math.abs(s.correlation) > 0.7 && 
      (s.state.includes('CLIMAX') || s.state.includes('WHIPSAW') || s.state.includes('VOLATILITY'))
    );
    
    return Math.min(1, riskyStates.length / Math.max(1, states.length));
  }
  
  /**
   * Generate intermarket signals based on correlation analysis
   */
  public generateIntermarketSignals(): IntermarketSignal[] {
    const signals: IntermarketSignal[] = [];
    
    // Check each pair of symbols
    for (const [key, metrics] of this.correlationMatrix) {
      // Divergence signal
      if (this.detectDivergence(metrics)) {
        signals.push({
          type: 'divergence',
          strength: Math.abs(metrics.correlation - metrics.rollingCorrelation[metrics.rollingCorrelation.length - 1]) * 100,
          symbols: [metrics.symbol1, metrics.symbol2],
          description: `${metrics.symbol1} and ${metrics.symbol2} showing divergence`,
          actionableInsight: 'Consider pairs trading or hedging strategy'
        });
      }
      
      // Convergence signal
      if (this.detectConvergence(metrics)) {
        signals.push({
          type: 'convergence',
          strength: metrics.rollingCorrelation[metrics.rollingCorrelation.length - 1] * 100,
          symbols: [metrics.symbol1, metrics.symbol2],
          description: `${metrics.symbol1} and ${metrics.symbol2} converging`,
          actionableInsight: 'Correlation returning to normal - reduce hedges'
        });
      }
      
      // Regime change signal
      if (this.detectRegimeChange(metrics)) {
        signals.push({
          type: 'regime_change',
          strength: 75,
          symbols: [metrics.symbol1, metrics.symbol2],
          description: 'Correlation regime shift detected',
          actionableInsight: 'Recalibrate position sizes and risk models'
        });
      }
    }
    
    return signals;
  }
  
  /**
   * Detect divergence between correlated assets
   */
  private detectDivergence(metrics: CorrelationMetrics): boolean {
    if (metrics.rollingCorrelation.length < 10) return false;
    
    const recent = metrics.rollingCorrelation.slice(-5);
    const historical = metrics.rollingCorrelation.slice(-20, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const historicalAvg = historical.reduce((a, b) => a + b, 0) / historical.length;
    
    // Divergence if correlation dropping significantly
    return historicalAvg > 0.6 && recentAvg < 0.3;
  }
  
  /**
   * Detect convergence after divergence
   */
  private detectConvergence(metrics: CorrelationMetrics): boolean {
    if (metrics.rollingCorrelation.length < 10) return false;
    
    const recent = metrics.rollingCorrelation.slice(-5);
    const historical = metrics.rollingCorrelation.slice(-20, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const historicalAvg = historical.reduce((a, b) => a + b, 0) / historical.length;
    
    // Convergence if correlation returning to historical levels
    return Math.abs(recentAvg - metrics.correlation) < 0.1 && 
           Math.abs(historicalAvg - metrics.correlation) > 0.3;
  }
  
  /**
   * Detect regime change in correlation structure
   */
  private detectRegimeChange(metrics: CorrelationMetrics): boolean {
    if (metrics.rollingCorrelation.length < 30) return false;
    
    // Calculate correlation volatility
    const correlationChanges = metrics.rollingCorrelation.slice(1).map((c, i) => 
      Math.abs(c - metrics.rollingCorrelation[i])
    );
    
    const recentVolatility = correlationChanges.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const historicalVolatility = correlationChanges.slice(-30, -10).reduce((a, b) => a + b, 0) / 20;
    
    // Regime change if correlation volatility doubled
    return recentVolatility > historicalVolatility * 2;
  }
  
  /**
   * Get correlation metrics between two symbols
   */
  public getCorrelation(symbol1: string, symbol2: string): CorrelationMetrics | null {
    const key = this.getCorrelationKey(symbol1, symbol2);
    return this.correlationMatrix.get(key) || null;
  }
  
  /**
   * Get all correlations for a symbol
   */
  public getSymbolCorrelations(symbol: string): CorrelationMetrics[] {
    const correlations: CorrelationMetrics[] = [];
    
    for (const [key, metrics] of this.correlationMatrix) {
      if (metrics.symbol1 === symbol || metrics.symbol2 === symbol) {
        correlations.push(metrics);
      }
    }
    
    return correlations;
  }
  
  /**
   * Helper to create consistent correlation keys
   */
  private getCorrelationKey(symbol1: string, symbol2: string): string {
    return [symbol1, symbol2].sort().join('_');
  }
}

export const marketCorrelationAnalyzer = new MarketCorrelationAnalyzer();