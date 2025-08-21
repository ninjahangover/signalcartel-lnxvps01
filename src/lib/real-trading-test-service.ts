import { realMarketData } from './real-market-data';
import { safeJSONStringify } from './json-sanitizer';

export type TradingTestMode = 'micro-real' | 'small-real' | 'full-live';

export interface RealTradingTestConfig {
  mode: TradingTestMode;
  maxPositionSize: number; // Maximum position size in USD
  maxDailyRisk: number;    // Maximum daily risk in USD
  testDuration: number;    // Test duration in minutes
  allowedPairs: string[];  // Which trading pairs to allow
}

export interface RealTradeExecution {
  id: string;
  timestamp: Date;
  pair: string;
  side: 'buy' | 'sell';
  quantity: number;
  executedPrice: number;
  executedValue: number; // quantity * price
  fees: number;
  status: 'executed' | 'failed' | 'pending';
  orderId?: string; // From exchange
  strategy: string;
  testMode: TradingTestMode;
}

export interface RealTestSession {
  id: string;
  strategyName: string;
  startTime: Date;
  endTime?: Date;
  config: RealTradingTestConfig;
  status: 'active' | 'completed' | 'stopped' | 'failed';
  trades: RealTradeExecution[];
  realizedPnL: number;
  unrealizedPnL: number;
  totalFees: number;
  maxDrawdown: number;
  peakValue: number;
  currentValue: number;
}

class RealTradingTestService {
  private static instance: RealTradingTestService | null = null;
  private activeSessions: Map<string, RealTestSession> = new Map();
  private completedSessions: RealTestSession[] = [];

  static getInstance(): RealTradingTestService {
    if (!RealTradingTestService.instance) {
      RealTradingTestService.instance = new RealTradingTestService();
    }
    return RealTradingTestService.instance;
  }

  // Start a real trading test session
  async startRealTestSession(
    strategyName: string, 
    mode: TradingTestMode = 'micro-real'
  ): Promise<string> {
    const sessionId = `real_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const config: RealTradingTestConfig = this.getConfigForMode(mode);
    
    const session: RealTestSession = {
      id: sessionId,
      strategyName,
      startTime: new Date(),
      config,
      status: 'active',
      trades: [],
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalFees: 0,
      maxDrawdown: 0,
      peakValue: 0,
      currentValue: 0
    };

    this.activeSessions.set(sessionId, session);

    console.log(`🔥 Started REAL TRADING test session: ${sessionId}`, {
      strategy: strategyName,
      mode,
      maxPositionSize: config.maxPositionSize,
      maxDailyRisk: config.maxDailyRisk
    });

    return sessionId;
  }

  // Execute a real trade (this is the critical method)
  async executeRealTrade(
    sessionId: string,
    pair: string,
    side: 'buy' | 'sell',
    usdAmount: number, // Amount in USD to trade
    strategy: string
  ): Promise<RealTradeExecution> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'active') {
      throw new Error(`Session not active: ${session.status}`);
    }

    // Get real current market price
    const currentPrice = await realMarketData.getCurrentPrice(pair);
    
    // Calculate quantity based on USD amount
    const quantity = usdAmount / currentPrice;
    
    // Validate against session limits
    if (usdAmount > session.config.maxPositionSize) {
      throw new Error(`Trade size ${usdAmount} exceeds max position size ${session.config.maxPositionSize}`);
    }

    // Check daily risk limits
    const todaysPnL = this.calculateDailyPnL(session);
    if (Math.abs(todaysPnL) + usdAmount > session.config.maxDailyRisk) {
      throw new Error(`Trade would exceed daily risk limit`);
    }

    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      // **THIS IS WHERE THE REAL TRADING HAPPENS**
      const executionResult = await this.executeRealOrderViaWebhook(
        pair, 
        side, 
        quantity, 
        currentPrice,
        session.config.mode
      );

      const trade: RealTradeExecution = {
        id: tradeId,
        timestamp: new Date(),
        pair,
        side,
        quantity,
        executedPrice: executionResult.executedPrice || currentPrice,
        executedValue: quantity * (executionResult.executedPrice || currentPrice),
        fees: executionResult.fees || (quantity * currentPrice * 0.001), // 0.1% fee estimate
        status: executionResult.success ? 'executed' : 'failed',
        orderId: executionResult.orderId,
        strategy,
        testMode: session.config.mode
      };

      // Add to session
      session.trades.push(trade);
      
      // Update session metrics
      this.updateSessionMetrics(session);

      console.log(`🔥 REAL TRADE EXECUTED:`, {
        sessionId,
        tradeId,
        pair,
        side,
        quantity,
        executedPrice: trade.executedPrice,
        executedValue: trade.executedValue,
        fees: trade.fees,
        mode: session.config.mode
      });

      return trade;

    } catch (error) {
      console.error(`❌ Real trade execution failed:`, error);
      
      const failedTrade: RealTradeExecution = {
        id: tradeId,
        timestamp: new Date(),
        pair,
        side,
        quantity,
        executedPrice: 0,
        executedValue: 0,
        fees: 0,
        status: 'failed',
        strategy,
        testMode: session.config.mode
      };

      session.trades.push(failedTrade);
      return failedTrade;
    }
  }

  // Execute real order via webhook (the core trading function)
  private async executeRealOrderViaWebhook(
    pair: string,
    side: 'buy' | 'sell',
    quantity: number,
    currentPrice: number,
    mode: TradingTestMode
  ): Promise<{
    success: boolean;
    executedPrice?: number;
    orderId?: string;
    fees?: number;
    error?: string;
  }> {
    const webhook_payload = {
      "passphrase": "sdfqoei1898498",
      "ticker": pair,
      "strategy": { 
        "order_action": side,
        "order_type": "market", // Market orders for immediate execution
        "order_contracts": quantity.toString(),
        "type": side,
        "volume": quantity.toString(),
        "pair": pair,
        "validate": "false", // REAL EXECUTION - no validation mode
        "real_trading_test": true,
        "test_mode": mode,
        "timestamp": new Date().toISOString()
      }
    };

    try {
      const response = await fetch('https://kraken.circuitcartel.com/webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'SignalCartel-RealTradingTest/1.0'
        },
        body: safeJSONStringify(webhook_payload, { maxSize: 50000 }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Real trading webhook response:', result);
        
        return {
          success: true,
          executedPrice: result.executed_price || currentPrice,
          orderId: result.order_id || result.txid,
          fees: result.fees || (quantity * currentPrice * 0.001)
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Webhook execution failed:', response.status, errorText);
        
        return {
          success: false,
          error: `Webhook failed: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Network error in real trade execution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Configuration for different trading test modes
  private getConfigForMode(mode: TradingTestMode): RealTradingTestConfig {
    switch (mode) {
      case 'micro-real':
        return {
          mode: 'micro-real',
          maxPositionSize: 10, // $10 maximum per position
          maxDailyRisk: 25,    // $25 maximum daily risk
          testDuration: 60,    // 1 hour test
          allowedPairs: ['BTCUSD', 'ETHUSD']
        };
      
      case 'small-real':
        return {
          mode: 'small-real',
          maxPositionSize: 50,  // $50 maximum per position
          maxDailyRisk: 100,    // $100 maximum daily risk
          testDuration: 240,    // 4 hour test
          allowedPairs: ['BTCUSD', 'ETHUSD', 'ADAUSD']
        };
      
      case 'full-live':
        return {
          mode: 'full-live',
          maxPositionSize: 1000,  // $1000 maximum per position
          maxDailyRisk: 2500,     // $2500 maximum daily risk
          testDuration: 1440,     // 24 hour test
          allowedPairs: ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOGEUSD']
        };
      
      default:
        return this.getConfigForMode('micro-real');
    }
  }

  // Calculate daily P&L for risk management
  private calculateDailyPnL(session: RealTestSession): number {
    const today = new Date().toDateString();
    const todayTrades = session.trades.filter(
      trade => trade.timestamp.toDateString() === today
    );

    return todayTrades.reduce((sum, trade) => {
      if (trade.status === 'executed') {
        // Simple P&L calculation - needs to be enhanced with position tracking
        return sum + trade.executedValue - trade.fees;
      }
      return sum;
    }, 0);
  }

  // Update session performance metrics
  private updateSessionMetrics(session: RealTestSession): void {
    const executedTrades = session.trades.filter(t => t.status === 'executed');
    
    // Calculate realized P&L from closed positions
    session.realizedPnL = executedTrades.reduce((sum, trade) => {
      return sum + trade.executedValue - trade.fees;
    }, 0);

    // Calculate total fees
    session.totalFees = executedTrades.reduce((sum, trade) => sum + trade.fees, 0);

    // Track peak value and drawdown
    session.currentValue = session.realizedPnL + session.unrealizedPnL;
    if (session.currentValue > session.peakValue) {
      session.peakValue = session.currentValue;
    }
    
    const drawdown = session.peakValue - session.currentValue;
    if (drawdown > session.maxDrawdown) {
      session.maxDrawdown = drawdown;
    }
  }

  // Get active session
  getActiveSession(sessionId: string): RealTestSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  // Complete a session
  completeSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.endTime = new Date();
    session.status = 'completed';
    
    // Move to completed sessions
    this.completedSessions.push(session);
    this.activeSessions.delete(sessionId);

    const duration = session.endTime.getTime() - session.startTime.getTime();
    console.log(`🏁 Completed REAL trading test session: ${sessionId}`, {
      duration: Math.round(duration / 1000 / 60) + ' minutes',
      trades: session.trades.length,
      realizedPnL: session.realizedPnL,
      totalFees: session.totalFees,
      maxDrawdown: session.maxDrawdown
    });

    return true;
  }

  // Emergency stop all sessions
  emergencyStopAllSessions(): void {
    console.log('🚨 EMERGENCY STOP: Stopping all active real trading sessions');
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      session.status = 'stopped';
      session.endTime = new Date();
      this.completedSessions.push(session);
    }
    
    this.activeSessions.clear();
  }

  // Get all active sessions
  getAllActiveSessions(): RealTestSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Get completed sessions
  getCompletedSessions(limit?: number): RealTestSession[] {
    const sessions = this.completedSessions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return limit ? sessions.slice(0, limit) : sessions;
  }
}

// Export singleton instance
export const realTradingTestService = RealTradingTestService.getInstance();

// Export helper functions for different modes
export async function startMicroRealTest(strategyName: string): Promise<string> {
  return realTradingTestService.startRealTestSession(strategyName, 'micro-real');
}

export async function startSmallRealTest(strategyName: string): Promise<string> {
  return realTradingTestService.startRealTestSession(strategyName, 'small-real');
}

export async function startFullLiveTest(strategyName: string): Promise<string> {
  return realTradingTestService.startRealTestSession(strategyName, 'full-live');
}

// Export types
export type { RealTestSession, RealTradeExecution, RealTradingTestConfig };