/**
 * Unified Trade Executor
 * Handles both paper trading and live trading with equal robustness
 */

import { alpacaPaperTradingService } from './alpaca-paper-trading-service';
import { telegramBotService } from './telegram-bot-service';
import { ntfyAlerts } from './ntfy-alerts';

export interface TradeOrder {
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  quantity: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface TradeResult {
  success: boolean;
  orderId?: string;
  executionPrice?: number;
  executionTime: Date;
  mode: 'paper' | 'live';
  error?: string;
  details?: any;
}

export interface TradingMode {
  type: 'paper' | 'live';
  paperProvider?: 'alpaca' | 'internal';
  liveProvider?: 'kraken' | 'alpaca_live';
  webhookUrl?: string;
}

class UnifiedTradeExecutor {
  private static instance: UnifiedTradeExecutor;
  private tradingMode: TradingMode = { type: 'paper', paperProvider: 'alpaca' };
  private executionHistory: Map<string, TradeResult[]> = new Map();
  private executionStats = {
    totalTrades: 0,
    paperTrades: 0,
    liveTrades: 0,
    successfulTrades: 0,
    failedTrades: 0
  };

  private constructor() {}

  static getInstance(): UnifiedTradeExecutor {
    if (!UnifiedTradeExecutor.instance) {
      UnifiedTradeExecutor.instance = new UnifiedTradeExecutor();
    }
    return UnifiedTradeExecutor.instance;
  }

  // Configure trading mode
  setTradingMode(mode: TradingMode) {
    this.tradingMode = mode;
    console.log(`🔧 Trading mode set to: ${mode.type.toUpperCase()}`, mode);
  }

  // Main trade execution method - handles both paper and live trades
  async executeTrade(order: TradeOrder): Promise<TradeResult> {
    const startTime = new Date();
    this.executionStats.totalTrades++;

    console.log(`\n🎯 EXECUTING ${this.tradingMode.type.toUpperCase()} TRADE`);
    console.log(`   Strategy: ${order.strategy}`);
    console.log(`   Action: ${order.action} ${order.quantity} ${order.symbol} @ $${order.price}`);
    console.log(`   Confidence: ${(order.confidence * 100).toFixed(1)}%`);

    try {
      let result: TradeResult;

      if (this.tradingMode.type === 'paper') {
        result = await this.executePaperTrade(order);
        this.executionStats.paperTrades++;
      } else {
        result = await this.executeLiveTrade(order);
        this.executionStats.liveTrades++;
      }

      if (result.success) {
        this.executionStats.successfulTrades++;
        console.log(`✅ TRADE EXECUTED SUCCESSFULLY`);
        console.log(`   Order ID: ${result.orderId}`);
        console.log(`   Execution Price: $${result.executionPrice}`);
        console.log(`   Mode: ${result.mode.toUpperCase()}`);
      } else {
        this.executionStats.failedTrades++;
        console.log(`❌ TRADE EXECUTION FAILED: ${result.error}`);
      }

      // Store execution history
      if (!this.executionHistory.has(order.strategy)) {
        this.executionHistory.set(order.strategy, []);
      }
      this.executionHistory.get(order.strategy)!.push(result);

      // Send Telegram notification
      await this.notifyTradeExecution(order, result);

      return result;

    } catch (error) {
      this.executionStats.failedTrades++;
      const errorResult: TradeResult = {
        success: false,
        executionTime: startTime,
        mode: this.tradingMode.type,
        error: error.message
      };

      console.log(`💥 TRADE EXECUTION ERROR: ${error.message}`);
      await this.notifyTradeExecution(order, errorResult);
      
      return errorResult;
    }
  }

  // Paper trading execution with multiple providers
  private async executePaperTrade(order: TradeOrder): Promise<TradeResult> {
    console.log(`📝 Executing paper trade via ${this.tradingMode.paperProvider}`);

    switch (this.tradingMode.paperProvider) {
      case 'alpaca':
        return await this.executeAlpacaPaperTrade(order);
      case 'internal':
        return await this.executeInternalPaperTrade(order);
      default:
        throw new Error(`Unknown paper trading provider: ${this.tradingMode.paperProvider}`);
    }
  }

  // Alpaca paper trading
  private async executeAlpacaPaperTrade(order: TradeOrder): Promise<TradeResult> {
    try {
      // Check if Alpaca credentials are available
      if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
        console.log(`⚠️  Alpaca credentials not available, falling back to internal paper trading`);
        return await this.executeInternalPaperTrade(order);
      }

      const alpacaOrder = {
        symbol: this.convertToAlpacaSymbol(order.symbol),
        qty: order.quantity,
        side: order.action === 'BUY' ? 'buy' as const : 'sell' as const,
        type: 'market' as const,
        timeInForce: 'day' as const
      };

      console.log(`📡 Sending order to Alpaca:`, alpacaOrder);
      const alpacaResult = await alpacaPaperTradingService.placeOrder(alpacaOrder);

      if (alpacaResult) {
        return {
          success: true,
          orderId: alpacaResult.id || `alpaca_${Date.now()}`,
          executionPrice: order.price, // Use order price as Alpaca might not return execution price immediately
          executionTime: new Date(),
          mode: 'paper',
          details: alpacaResult
        };
      } else {
        throw new Error('Alpaca API returned null/undefined result');
      }

    } catch (error) {
      console.log(`⚠️  Alpaca paper trading failed: ${error.message}`);
      console.log(`🔄 Falling back to internal paper trading`);
      return await this.executeInternalPaperTrade(order);
    }
  }

  // Internal paper trading (fallback/simulation)
  private async executeInternalPaperTrade(order: TradeOrder): Promise<TradeResult> {
    console.log(`🔧 Executing internal paper trade simulation`);

    // Simulate realistic execution delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Simulate slippage (0.1% to 0.3%)
    const slippage = 0.001 + Math.random() * 0.002;
    const slippageDirection = order.action === 'BUY' ? 1 : -1;
    const executionPrice = order.price * (1 + (slippageDirection * slippage));

    const result: TradeResult = {
      success: true,
      orderId: `internal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionPrice: executionPrice,
      executionTime: new Date(),
      mode: 'paper',
      details: {
        provider: 'internal',
        slippage: slippage,
        originalPrice: order.price,
        simulatedFill: true
      }
    };

    console.log(`✅ Internal paper trade simulated: ${result.orderId}`);
    return result;
  }

  // Live trading execution
  private async executeLiveTrade(order: TradeOrder): Promise<TradeResult> {
    console.log(`💰 Executing LIVE trade via ${this.tradingMode.liveProvider}`);

    const webhookPayload = this.buildWebhookPayload(order);
    const webhookUrl = this.tradingMode.webhookUrl || 'https://kraken.circuitcartel.com/webhook';

    console.log(`📡 Sending webhook to: ${webhookUrl}`);
    console.log(`📦 Payload:`, JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(15000)
    });

    if (response.ok) {
      const responseData = await response.json();
      return {
        success: true,
        orderId: responseData.orderId || `live_${Date.now()}`,
        executionPrice: order.price,
        executionTime: new Date(),
        mode: 'live',
        details: responseData
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  // Build webhook payload for live trading
  private buildWebhookPayload(order: TradeOrder): any {
    return {
      passphrase: "sdfqoei1898498",
      ticker: order.symbol,
      strategy: {
        order_action: order.action,
        order_type: "market",
        order_price: order.price.toString(),
        order_contracts: order.quantity.toString(),
        type: order.action,
        volume: order.quantity.toString(),
        pair: order.symbol,
        validate: "false", // Live trading
        close: {
          order_type: "market",
          price: order.price.toString()
        },
        stop_loss: order.stopLoss?.toString() || "0"
      },
      metadata: {
        strategy_name: order.strategy,
        confidence: order.confidence,
        timestamp: new Date().toISOString(),
        ...order.metadata
      }
    };
  }

  // Convert symbol formats
  private convertToAlpacaSymbol(symbol: string): string {
    const symbolMap: { [key: string]: string } = {
      'BTCUSD': 'BTC/USD',
      'ETHUSD': 'ETH/USD',
      'BTC/USD': 'BTC/USD',
      'ETH/USD': 'ETH/USD'
    };
    return symbolMap[symbol] || symbol;
  }

  // Send trade notifications via NTFY (much easier than Telegram!)
  private async notifyTradeExecution(order: TradeOrder, result: TradeResult) {
    try {
      // Send NTFY alert (primary notification method)
      if (result.success) {
        await ntfyAlerts.sendTradeAlert({
          action: order.action,
          symbol: order.symbol,
          price: result.executionPrice || order.price,
          quantity: order.quantity,
          strategy: order.strategy,
          confidence: Math.round(order.confidence * 100),
          mode: result.mode,
          orderId: result.orderId
        });
      } else {
        await ntfyAlerts.sendAlert({
          title: '❌ Trade Failed',
          message: `Strategy: ${order.strategy}
Action: ${order.action} ${order.quantity} ${order.symbol}
Price: $${order.price.toLocaleString()}
Error: ${result.error}
Time: ${result.executionTime.toLocaleString()}`,
          priority: 'high',
          tags: ['warning', 'chart_with_downwards_trend'],
          emoji: '❌'
        });
      }

      // Also try Telegram as backup (if configured)
      try {
        const status = result.success ? '✅ EXECUTED' : '❌ FAILED';
        const mode = result.mode.toUpperCase();
        
        let message = `${status} ${mode} TRADE\n\n`;
        message += `📊 Strategy: ${order.strategy}\n`;
        message += `💱 Action: ${order.action} ${order.quantity} ${order.symbol}\n`;
        message += `💰 Price: $${order.price.toLocaleString()}\n`;
        message += `🎯 Confidence: ${(order.confidence * 100).toFixed(1)}%\n`;
        
        if (result.success) {
          message += `🆔 Order ID: ${result.orderId}\n`;
          if (result.executionPrice) {
            message += `⚡ Execution: $${result.executionPrice.toLocaleString()}\n`;
          }
        } else {
          message += `❌ Error: ${result.error}\n`;
        }
        
        message += `⏰ Time: ${result.executionTime.toLocaleString()}`;

        if (telegramBotService && typeof telegramBotService.sendMessage === 'function') {
          await telegramBotService.sendMessage(message);
        }
      } catch (telegramError) {
        // Telegram failed but NTFY should have worked - no big deal
        console.log('Telegram notification failed (NTFY should have worked):', telegramError.message);
      }

    } catch (error) {
      console.warn('Failed to send trade notification:', error.message);
    }
  }

  // Get execution statistics
  getExecutionStats() {
    return {
      ...this.executionStats,
      successRate: this.executionStats.totalTrades > 0 
        ? (this.executionStats.successfulTrades / this.executionStats.totalTrades * 100).toFixed(1) + '%'
        : '0%',
      currentMode: this.tradingMode.type
    };
  }

  // Get execution history for a strategy
  getExecutionHistory(strategy: string): TradeResult[] {
    return this.executionHistory.get(strategy) || [];
  }

  // Get all execution history
  getAllExecutionHistory(): Map<string, TradeResult[]> {
    return this.executionHistory;
  }
}

export const unifiedTradeExecutor = UnifiedTradeExecutor.getInstance();
export default UnifiedTradeExecutor;