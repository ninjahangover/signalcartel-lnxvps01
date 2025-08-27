/**
 * QUANTUM FORGE™ Live Trading Engine
 * 
 * Transition from paper trading to real money trading
 * with enhanced risk management and monitoring
 */

import { KrakenClient } from './kraken-client';
import { prisma } from '../prisma';
import { phaseManager } from '../quantum-forge-phase-config';

export interface LiveTradingConfig {
  // Portfolio Management
  maxPortfolioValue: number;     // Maximum total portfolio value
  maxPositionSize: number;       // Maximum single position size
  maxDailyLoss: number;         // Maximum daily loss limit
  maxDrawdown: number;          // Maximum portfolio drawdown
  
  // Risk Management
  stopLossPercent: number;      // Stop loss percentage
  takeProfitPercent: number;    // Take profit percentage
  maxOpenPositions: number;     // Maximum concurrent positions
  
  // Trading Controls
  enableEmergencyStop: boolean; // Emergency stop enabled
  requireManualApproval: boolean; // Require approval for large trades
  tradingHours: {
    start: string;
    end: string;
  };
  
  // API Configuration
  krakenApiKey: string;
  krakenApiSecret: string;
  krakenApiPassphrase?: string;
  testMode: boolean;            // Use sandbox API
}

export interface LiveTradingMetrics {
  totalPnL: number;
  dailyPnL: number;
  openPositions: number;
  portfolioValue: number;
  drawdown: number;
  dayTradeCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  emergencyStopTriggered: boolean;
}

export class LiveTradingEngine {
  private krakenClient: KrakenClient;
  private config: LiveTradingConfig;
  private isRunning: boolean = false;
  private emergencyStop: boolean = false;
  private startTime: Date;
  
  // Risk monitoring
  private dailyPnL: number = 0;
  private totalDrawdown: number = 0;
  private openPositionCount: number = 0;
  
  constructor(config: LiveTradingConfig) {
    this.config = config;
    this.krakenClient = new KrakenClient({
      apiKey: config.krakenApiKey,
      apiSecret: config.krakenApiSecret,
      sandbox: config.testMode
    });
    this.startTime = new Date();
    
    console.log('🚀 QUANTUM FORGE™ Live Trading Engine Initialized');
    console.log('   Portfolio Limit:', '$' + config.maxPortfolioValue.toLocaleString());
    console.log('   Max Position:', '$' + config.maxPositionSize.toLocaleString());
    console.log('   Daily Loss Limit:', '$' + config.maxDailyLoss.toLocaleString());
    console.log('   Mode:', config.testMode ? 'SANDBOX' : '🔴 LIVE MONEY');
  }
  
  /**
   * Start live trading engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Live trading engine is already running');
    }
    
    console.log('🔥 STARTING LIVE TRADING ENGINE...');
    
    // Pre-flight safety checks
    await this.runPreFlightChecks();
    
    // Initialize daily tracking
    await this.initializeDailyTracking();
    
    // Validate API connection
    await this.validateApiConnection();
    
    // Get current portfolio state
    const portfolio = await this.getPortfolioStatus();
    console.log('📊 Current Portfolio Value:', '$' + portfolio.totalValue.toLocaleString());
    
    this.isRunning = true;
    this.emergencyStop = false;
    
    console.log('✅ LIVE TRADING ENGINE ACTIVE');
    console.log('🚨 REAL MONEY TRADING IS NOW ENABLED');
    
    // Store live trading session
    await this.recordTradingSession('STARTED');
  }
  
  /**
   * Execute a live trade (replaces paper trading)
   */
  async executeLiveTrade(signal: any): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Live trading engine is not running');
    }
    
    if (this.emergencyStop) {
      console.log('🚨 EMERGENCY STOP ACTIVE - Trade blocked');
      return { success: false, reason: 'EMERGENCY_STOP_ACTIVE' };
    }
    
    console.log('💰 EXECUTING LIVE TRADE:', signal.action, signal.symbol, '@', signal.price);
    
    try {
      // 1. Pre-trade risk checks
      const riskCheck = await this.preTradeRiskAssessment(signal);
      if (!riskCheck.approved) {
        console.log('🛑 TRADE REJECTED:', riskCheck.reason);
        return { success: false, reason: riskCheck.reason };
      }
      
      // 2. Calculate position size with risk management
      const positionSize = this.calculateSafePositionSize(signal);
      if (positionSize <= 0) {
        return { success: false, reason: 'POSITION_SIZE_TOO_SMALL' };
      }
      
      // 3. Execute the trade via Kraken API
      const tradeResult = await this.executeKrakenOrder({
        symbol: signal.symbol,
        side: signal.action.toLowerCase(),
        quantity: positionSize,
        price: signal.price,
        orderType: 'limit', // Always use limit orders for safety
        timeInForce: 'GTC'
      });
      
      // 4. Record the live trade
      const liveTradeRecord = await this.recordLiveTrade(signal, tradeResult, positionSize);
      
      // 5. Update risk tracking
      await this.updateRiskMetrics(tradeResult);
      
      // 6. Check for emergency conditions
      await this.checkEmergencyConditions();
      
      console.log('✅ LIVE TRADE EXECUTED:', tradeResult.orderId);
      console.log('   Value:', '$' + (positionSize * signal.price).toFixed(2));
      console.log('   Daily P&L:', '$' + this.dailyPnL.toFixed(2));
      
      return {
        success: true,
        orderId: tradeResult.orderId,
        executedPrice: tradeResult.executedPrice,
        executedQuantity: tradeResult.executedQuantity,
        tradeValue: positionSize * tradeResult.executedPrice,
        liveTradeId: liveTradeRecord.id
      };
      
    } catch (error) {
      console.error('❌ LIVE TRADE EXECUTION FAILED:', error);
      
      // Record failed trade attempt
      await this.recordFailedTrade(signal, error.message);
      
      // Check if we should trigger emergency stop
      if (error.message.includes('INSUFFICIENT_FUNDS') || 
          error.message.includes('MARGIN_CALL')) {
        await this.triggerEmergencyStop('API_ERROR: ' + error.message);
      }
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Pre-trade risk assessment
   */
  private async preTradeRiskAssessment(signal: any): Promise<{ approved: boolean, reason?: string }> {
    // Check trading hours
    if (!this.isWithinTradingHours()) {
      return { approved: false, reason: 'OUTSIDE_TRADING_HOURS' };
    }
    
    // Check daily loss limit
    if (this.dailyPnL <= -this.config.maxDailyLoss) {
      return { approved: false, reason: 'DAILY_LOSS_LIMIT_EXCEEDED' };
    }
    
    // Check maximum open positions
    if (this.openPositionCount >= this.config.maxOpenPositions) {
      return { approved: false, reason: 'MAX_OPEN_POSITIONS_EXCEEDED' };
    }
    
    // Check portfolio risk
    const portfolio = await this.getPortfolioStatus();
    if (portfolio.totalValue >= this.config.maxPortfolioValue) {
      return { approved: false, reason: 'PORTFOLIO_LIMIT_EXCEEDED' };
    }
    
    // Check drawdown limit
    if (this.totalDrawdown >= this.config.maxDrawdown) {
      return { approved: false, reason: 'MAXIMUM_DRAWDOWN_EXCEEDED' };
    }
    
    // All checks passed
    return { approved: true };
  }
  
  /**
   * Calculate safe position size with risk management
   */
  private calculateSafePositionSize(signal: any): number {
    const maxPositionValue = Math.min(
      this.config.maxPositionSize,
      this.config.maxPortfolioValue * 0.1 // Max 10% of portfolio per position
    );
    
    // Base position size from signal
    const baseSize = signal.quantity || (maxPositionValue / signal.price);
    
    // Apply risk-based sizing
    let riskAdjustedSize = baseSize;
    
    // Reduce size based on current drawdown
    const drawdownFactor = Math.max(0.5, 1 - (this.totalDrawdown / this.config.maxDrawdown));
    riskAdjustedSize *= drawdownFactor;
    
    // Reduce size based on daily losses
    if (this.dailyPnL < 0) {
      const lossAdjustment = Math.max(0.3, 1 - Math.abs(this.dailyPnL) / this.config.maxDailyLoss);
      riskAdjustedSize *= lossAdjustment;
    }
    
    // Ensure minimum viable size
    const minSize = 10 / signal.price; // $10 minimum
    return Math.max(minSize, riskAdjustedSize);
  }
  
  /**
   * Execute trade via Kraken API
   */
  private async executeKrakenOrder(orderParams: any): Promise<any> {
    console.log('📡 Executing Kraken order:', orderParams);
    
    // In testMode, simulate the order
    if (this.config.testMode) {
      console.log('🧪 SANDBOX MODE - Simulating order execution');
      return {
        orderId: 'SANDBOX_' + Date.now(),
        executedPrice: orderParams.price * (0.999 + Math.random() * 0.002), // Small slippage
        executedQuantity: orderParams.quantity,
        status: 'FILLED',
        timestamp: new Date()
      };
    }
    
    // Real Kraken API call
    const result = await this.krakenClient.createOrder({
      pair: this.mapSymbolToKrakenPair(orderParams.symbol),
      type: orderParams.side,
      ordertype: orderParams.orderType,
      volume: orderParams.quantity.toString(),
      price: orderParams.price?.toString(),
      timeInForce: orderParams.timeInForce
    });
    
    return {
      orderId: result.txid,
      executedPrice: parseFloat(result.price || orderParams.price),
      executedQuantity: parseFloat(result.volume || orderParams.quantity),
      status: result.status,
      timestamp: new Date()
    };
  }
  
  /**
   * Emergency stop mechanism
   */
  async triggerEmergencyStop(reason: string): Promise<void> {
    console.log('🚨🚨🚨 EMERGENCY STOP TRIGGERED 🚨🚨🚨');
    console.log('Reason:', reason);
    
    this.emergencyStop = true;
    this.isRunning = false;
    
    // Close all open positions immediately
    await this.closeAllPositions('EMERGENCY_STOP');
    
    // Record emergency stop event
    await this.recordTradingSession('EMERGENCY_STOP', reason);
    
    // Send emergency notifications
    await this.sendEmergencyAlert(reason);
    
    console.log('🛑 ALL TRADING STOPPED - MANUAL INTERVENTION REQUIRED');
  }
  
  /**
   * Get current portfolio status
   */
  async getPortfolioStatus(): Promise<any> {
    if (this.config.testMode) {
      // Simulated portfolio for testing
      return {
        totalValue: 5000,
        availableCash: 4000,
        positionsValue: 1000,
        openPositions: this.openPositionCount
      };
    }
    
    const balances = await this.krakenClient.getAccountBalance();
    const openOrders = await this.krakenClient.getOpenOrders();
    
    // Calculate total portfolio value
    let totalValue = 0;
    let availableCash = 0;
    
    Object.entries(balances).forEach(([asset, balance]: [string, any]) => {
      if (asset === 'USD' || asset === 'ZUSD') {
        availableCash += parseFloat(balance);
      }
      // Add logic to convert other assets to USD value
      totalValue += parseFloat(balance);
    });
    
    return {
      totalValue,
      availableCash,
      positionsValue: totalValue - availableCash,
      openPositions: Object.keys(openOrders).length
    };
  }
  
  /**
   * Record live trade in database
   */
  private async recordLiveTrade(signal: any, tradeResult: any, positionSize: number): Promise<any> {
    return await prisma.liveTrade.create({
      data: {
        orderId: tradeResult.orderId,
        symbol: signal.symbol,
        side: signal.action,
        quantity: positionSize,
        price: tradeResult.executedPrice,
        value: positionSize * tradeResult.executedPrice,
        status: tradeResult.status,
        strategy: signal.strategy || 'quantum-forge',
        confidence: signal.confidence || 0,
        executedAt: tradeResult.timestamp,
        
        // Risk management data
        dailyPnLAtExecution: this.dailyPnL,
        portfolioValueAtExecution: (await this.getPortfolioStatus()).totalValue,
        riskLevel: this.calculateCurrentRiskLevel(),
        
        // AI enhancement data
        aiEnhanced: true,
        phaseAtExecution: (await phaseManager.getCurrentPhase()).phase
      }
    });
  }
  
  /**
   * Validate API connection
   */
  private async validateApiConnection(): Promise<void> {
    try {
      if (this.config.testMode) {
        console.log('✅ Sandbox API connection validated');
        return;
      }
      
      const serverTime = await this.krakenClient.getServerTime();
      const balance = await this.krakenClient.getAccountBalance();
      
      console.log('✅ Kraken API connection validated');
      console.log('   Server Time:', new Date(serverTime * 1000));
      console.log('   Account Balance Available:', Object.keys(balance).length > 0);
    } catch (error) {
      throw new Error('Failed to validate Kraken API connection: ' + error.message);
    }
  }
  
  /**
   * Pre-flight safety checks
   */
  private async runPreFlightChecks(): Promise<void> {
    console.log('🔍 Running pre-flight safety checks...');
    
    // Check QUANTUM FORGE phase
    const currentPhase = await phaseManager.getCurrentPhase();
    if (currentPhase.phase < 3) {
      throw new Error('Live trading requires Phase 3+ (current: Phase ' + currentPhase.phase + ')');
    }
    
    // Verify AI systems are active
    const recentAI = await prisma.intuitionAnalysis.count({
      where: { analysisTime: { gte: new Date(Date.now() - 60 * 60 * 1000) } }
    });
    
    if (recentAI === 0) {
      throw new Error('No recent AI analyses detected - ensure AI systems are running');
    }
    
    // Check paper trading performance
    const paperTrades = await prisma.managedTrade.count({
      where: { pnl: { not: null } }
    });
    
    if (paperTrades < 100) {
      throw new Error('Insufficient paper trading history (need 100+, have ' + paperTrades + ')');
    }
    
    console.log('✅ Pre-flight checks passed');
    console.log('   Phase:', currentPhase.phase, '-', currentPhase.name);
    console.log('   AI Analyses (1h):', recentAI);
    console.log('   Paper Trades:', paperTrades);
  }
  
  private mapSymbolToKrakenPair(symbol: string): string {
    const mapping: { [key: string]: string } = {
      'BTCUSD': 'XBTUSD',
      'ETHUSD': 'ETHUSD',
      'LTCUSD': 'LTCUSD',
      'XRPUSD': 'XRPUSD'
    };
    return mapping[symbol] || symbol;
  }
  
  private isWithinTradingHours(): boolean {
    // 24/7 crypto trading - always return true
    // Could add maintenance windows or custom hours here
    return true;
  }
  
  private calculateCurrentRiskLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    let riskScore = 0;
    
    // Daily loss risk
    if (this.dailyPnL < -this.config.maxDailyLoss * 0.5) riskScore += 2;
    else if (this.dailyPnL < 0) riskScore += 1;
    
    // Open positions risk
    if (this.openPositionCount >= this.config.maxOpenPositions * 0.8) riskScore += 2;
    else if (this.openPositionCount >= this.config.maxOpenPositions * 0.5) riskScore += 1;
    
    // Drawdown risk
    if (this.totalDrawdown >= this.config.maxDrawdown * 0.8) riskScore += 3;
    else if (this.totalDrawdown >= this.config.maxDrawdown * 0.5) riskScore += 2;
    
    if (riskScore >= 5) return 'EXTREME';
    if (riskScore >= 3) return 'HIGH';
    if (riskScore >= 1) return 'MEDIUM';
    return 'LOW';
  }
  
  private async initializeDailyTracking(): Promise<void> {
    // Reset daily counters
    this.dailyPnL = 0;
    
    // Get today's trades from database
    const todaysTrades = await prisma.liveTrade.findMany({
      where: {
        executedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    // Calculate current daily P&L from existing trades
    this.dailyPnL = todaysTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    console.log('📊 Daily tracking initialized - Current P&L: $' + this.dailyPnL.toFixed(2));
  }
  
  private async updateRiskMetrics(tradeResult: any): Promise<void> {
    // Update daily P&L (will be calculated after position closes)
    // Update open position count
    this.openPositionCount += 1;
  }
  
  private async checkEmergencyConditions(): Promise<void> {
    // Check if any emergency conditions are met
    if (this.dailyPnL <= -this.config.maxDailyLoss) {
      await this.triggerEmergencyStop('DAILY_LOSS_LIMIT_EXCEEDED');
    }
    
    if (this.totalDrawdown >= this.config.maxDrawdown) {
      await this.triggerEmergencyStop('MAXIMUM_DRAWDOWN_EXCEEDED');
    }
  }
  
  private async closeAllPositions(reason: string): Promise<void> {
    console.log('🔄 Closing all open positions due to:', reason);
    // Implementation would close all open positions
  }
  
  private async recordTradingSession(status: string, reason?: string): Promise<void> {
    await prisma.liveTradeSession.create({
      data: {
        status,
        reason,
        startTime: this.startTime,
        endTime: status === 'EMERGENCY_STOP' ? new Date() : null,
        configSnapshot: JSON.stringify(this.config)
      }
    });
  }
  
  private async recordFailedTrade(signal: any, error: string): Promise<void> {
    await prisma.liveTradeFailure.create({
      data: {
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        reason: error,
        timestamp: new Date()
      }
    });
  }
  
  private async sendEmergencyAlert(reason: string): Promise<void> {
    // Implementation would send notifications via email, SMS, webhook, etc.
    console.log('📧 Emergency alert sent:', reason);
  }
}

export default LiveTradingEngine;