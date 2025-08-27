/**
 * QUANTUM FORGE™ Live Trading Executor
 * 
 * Bridges QUANTUM FORGE™ AI signals to live Kraken API execution
 * with commission-aware position sizing and risk management
 */

import { createLiveTradingManager, LiveTradingConfigManager } from './live-trading-config';
import { CommissionAwarePositionSizer } from './commission-aware-sizing';
import { webhookClient } from '../webhooks/webhook-client';
import { prisma } from '../prisma';

// Import your existing Kraken services
import { krakenApiService } from '../kraken-api-service';

export interface LiveTradeExecution {
  success: boolean;
  orderId?: string;
  message: string;
  positionSize: number;
  expectedProfit: number;
  fees: number;
}

export interface LiveTradingStatus {
  enabled: boolean;
  accountBalance: number;
  currentDrawdown: number;
  recentLossCount: number;
  lastLossTime?: Date;
  dailyTradesCount: number;
  dailyPnL: number;
}

export class QuantumForgeLiveExecutor {
  private tradingManager: LiveTradingConfigManager;
  private positionSizer: CommissionAwarePositionSizer;
  private krakenService: typeof krakenApiService;
  private liveTradingEnabled: boolean = false;
  
  constructor(accountSize: number) {
    this.tradingManager = createLiveTradingManager(accountSize);
    this.positionSizer = this.tradingManager.getPositionSizer();
    this.krakenService = krakenApiService;
    
    console.log('🚀 QUANTUM FORGE™ Live Executor initialized for $' + accountSize);
  }
  
  /**
   * Main entry point: Process a QUANTUM FORGE™ signal for live execution
   */
  async processSignalForLiveExecution(
    signal: {
      action: 'BUY' | 'SELL' | 'HOLD';
      symbol: string;
      price: number;
      confidence: number;
      strategy: string;
      aiSystemsUsed: string[];
      expectedMove: number;
      reason?: string;
    },
    currentPhase: number
  ): Promise<LiveTradeExecution> {
    
    console.log('📡 Processing QUANTUM FORGE™ signal for live execution:');
    console.log(`   ${signal.action} ${signal.symbol} @ $${signal.price}`);
    console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    console.log(`   Strategy: ${signal.strategy}`);
    
    // Skip HOLD signals for live trading
    if (signal.action === 'HOLD') {
      return {
        success: false,
        orderId: undefined,
        message: 'HOLD signals not executed in live trading',
        positionSize: 0,
        expectedProfit: 0,
        fees: 0
      };
    }
    
    // Check if live trading is enabled
    if (!this.liveTradingEnabled) {
      return {
        success: false,
        orderId: undefined,  
        message: 'Live trading is disabled - would execute in paper mode',
        positionSize: 0,
        expectedProfit: 0,
        fees: 0
      };
    }
    
    try {
      // Get current trading status
      const status = await this.getTradingStatus();
      
      // Check if signal meets live trading criteria
      const liveCheck = this.tradingManager.shouldExecuteLiveSignal(
        signal.confidence,
        currentPhase,
        signal.aiSystemsUsed,
        {
          currentDrawdown: status.currentDrawdown,
          recentLossCount: status.recentLossCount,
          lastLossTime: status.lastLossTime
        }
      );
      
      if (!liveCheck.execute) {
        return {
          success: false,
          orderId: undefined,
          message: `Live trade rejected: ${liveCheck.reason}`,
          positionSize: 0,
          expectedProfit: 0,
          fees: 0
        };
      }
      
      // Calculate commission-aware position size
      const sizing = this.positionSizer.calculatePositionSize(
        signal.confidence,
        signal.expectedMove,
        'limit' // Prefer limit orders for better fees
      );
      
      if (!sizing.shouldTrade) {
        return {
          success: false,
          orderId: undefined,
          message: `Position sizing rejected: ${sizing.reason}`,
          positionSize: 0,
          expectedProfit: 0,
          fees: 0
        };
      }
      
      // Execute the trade on Kraken
      const execution = await this.executeLiveTradeOnKraken(
        signal,
        sizing.positionSize,
        'limit'
      );
      
      // Send webhook notification for live trade
      if (execution.success) {
        await webhookClient.sendTradeExecuted({
          tradeId: execution.orderId!,
          symbol: signal.symbol,
          side: signal.action.toLowerCase() as 'buy' | 'sell',
          quantity: sizing.positionSize / signal.price,
          price: signal.price,
          value: sizing.positionSize,
          fees: sizing.positionSize * 0.0016, // Kraken maker fee
          strategy: signal.strategy,
          sessionId: 'live-trading-session'
        });
      }
      
      return {
        success: execution.success,
        orderId: execution.orderId,
        message: execution.success ? 
          `Live trade executed: ${signal.action} $${sizing.positionSize.toFixed(0)} ${signal.symbol}` :
          `Trade execution failed: ${execution.message}`,
        positionSize: sizing.positionSize,
        expectedProfit: sizing.expectedProfit,
        fees: sizing.positionSize * 0.0032 // Round-trip fees
      };
      
    } catch (error) {
      console.error('❌ Live trade execution error:', error);
      
      return {
        success: false,
        orderId: undefined,
        message: `Execution error: ${error.message}`,
        positionSize: 0,
        expectedProfit: 0,
        fees: 0
      };
    }
  }
  
  /**
   * Execute trade on Kraken API
   */
  private async executeLiveTradeOnKraken(
    signal: { action: 'BUY' | 'SELL'; symbol: string; price: number },
    positionSizeUSD: number,
    orderType: 'market' | 'limit'
  ): Promise<{ success: boolean; orderId?: string; message: string }> {
    
    try {
      // Convert USD position size to crypto quantity
      const quantity = positionSizeUSD / signal.price;
      
      // Format for Kraken API (e.g., 'BTCUSD' -> 'XBTUSD')
      const krakenPair = this.formatSymbolForKraken(signal.symbol);
      
      console.log(`🔥 Executing live ${signal.action} on Kraken:`);
      console.log(`   Pair: ${krakenPair}`);
      console.log(`   Quantity: ${quantity.toFixed(8)}`);
      console.log(`   Position Size: $${positionSizeUSD.toFixed(2)}`);
      console.log(`   Order Type: ${orderType}`);
      
      // Create order request
      const orderRequest = {
        pair: krakenPair,
        type: signal.action.toLowerCase() as 'buy' | 'sell',
        ordertype: orderType,
        volume: quantity.toFixed(8),
        price: orderType === 'limit' ? signal.price.toFixed(2) : undefined,
        validate: true // Set to false for actual execution, true for validation testing
      };
      
      // Execute on Kraken (using your existing placeOrder method)
      const result = await this.krakenService.placeOrder(orderRequest);
      
      if (result && result.txid) {
        const orderId = Array.isArray(result.txid) ? result.txid[0] : result.txid;
        
        console.log(`✅ Kraken order executed successfully:`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Description: ${result.descr?.order}`);
        
        return {
          success: true,
          orderId: orderId,
          message: `Order placed successfully: ${orderId}`
        };
      } else {
        return {
          success: false,
          message: 'Kraken API returned no order ID'
        };
      }
      
    } catch (error) {
      console.error('❌ Kraken API execution failed:', error);
      return {
        success: false,
        message: `Kraken API error: ${error.message}`
      };
    }
  }
  
  /**
   * Get current trading status and risk metrics
   */
  private async getTradingStatus(): Promise<LiveTradingStatus> {
    try {
      // Get account balance from Kraken
      const balance = await this.krakenService.getAccountBalance();
      const accountBalance = balance?.USD || 407.60; // Fallback to your current balance
      
      // Get recent trades from database for risk calculations
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentTrades = await prisma.managedTrade.findMany({
        where: { 
          executedAt: { gte: oneDayAgo },
          strategy: { contains: 'live' } // Only live trades
        },
        select: { pnl: true, executedAt: true }
      });
      
      const dailyPnL = recentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const lossingTrades = recentTrades.filter(t => (t.pnl || 0) < 0);
      const currentDrawdown = Math.abs(Math.min(0, dailyPnL)) / accountBalance;
      
      return {
        enabled: this.liveTradingEnabled,
        accountBalance: accountBalance,
        currentDrawdown: currentDrawdown,
        recentLossCount: lossingTrades.length,
        lastLossTime: lossingTrades.length > 0 ? 
          new Date(Math.max(...lossingTrades.map(t => t.executedAt.getTime()))) : 
          undefined,
        dailyTradesCount: recentTrades.length,
        dailyPnL: dailyPnL
      };
      
    } catch (error) {
      console.error('Error getting trading status:', error);
      
      // Return safe defaults
      return {
        enabled: false,
        accountBalance: 407.60,
        currentDrawdown: 0,
        recentLossCount: 0,
        dailyTradesCount: 0,
        dailyPnL: 0
      };
    }
  }
  
  /**
   * Format symbol for Kraken API (BTCUSD -> XBTUSD)
   */
  private formatSymbolForKraken(symbol: string): string {
    const symbolMap: { [key: string]: string } = {
      'BTCUSD': 'XBTUSD',
      'ETHUSD': 'ETHUSD',  
      'ADAUSD': 'ADAUSD',
      'SOLUSD': 'SOLUSD',
      'AVAXUSD': 'AVAXUSD'
    };
    
    return symbolMap[symbol] || symbol;
  }
  
  /**
   * Enable/disable live trading
   */
  setLiveTradingEnabled(enabled: boolean): void {
    this.liveTradingEnabled = enabled;
    console.log(`🔄 Live trading ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  /**
   * Get current configuration summary
   */
  getStatus(): object {
    return {
      liveTradingEnabled: this.liveTradingEnabled,
      configuration: this.tradingManager.getConfigSummary(),
      krakenAuthenticated: this.krakenService.getConnectionStatus()
    };
  }
}

// Create singleton instance for your account
export const quantumForgeLiveExecutor = new QuantumForgeLiveExecutor(407.60);