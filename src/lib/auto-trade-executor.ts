/**
 * Auto Trade Executor
 * 
 * Automatically executes high-confidence trading signals
 * Monitors database for new signals and executes them based on rules
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExecutionConfig {
  minConfidence: number;  // Minimum confidence to auto-execute
  maxPositionSize: number; // Maximum position size in USD
  enablePaperTrading: boolean;
  enableLiveTrading: boolean;
  allowedStrategies: string[];
  symbols: string[];
}

class AutoTradeExecutor {
  private static instance: AutoTradeExecutor | null = null;
  private executionInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  private config: ExecutionConfig = {
    minConfidence: 0.7, // 70% minimum confidence
    maxPositionSize: 2000,
    enablePaperTrading: true,
    enableLiveTrading: false, // Safety: off by default
    allowedStrategies: ['RSI_OVERSOLD', 'RSI_OVERBOUGHT', 'MACD_CROSS', 'SUPPORT_BOUNCE'],
    symbols: ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'LINKUSD']
  };

  private constructor() {
    console.log('🤖 Auto Trade Executor initialized');
  }

  static getInstance(): AutoTradeExecutor {
    if (!AutoTradeExecutor.instance) {
      AutoTradeExecutor.instance = new AutoTradeExecutor();
    }
    return AutoTradeExecutor.instance;
  }

  /**
   * Start auto-execution of trades
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Auto Trade Executor already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Auto Trade Executor...');
    console.log(`📊 Config: Min confidence ${this.config.minConfidence * 100}%, Paper: ${this.config.enablePaperTrading}, Live: ${this.config.enableLiveTrading}`);

    // Check for new signals every 10 seconds
    this.executionInterval = setInterval(() => {
      this.checkAndExecuteSignals();
    }, 10000);

    // Execute immediately on start
    await this.checkAndExecuteSignals();

    console.log('✅ Auto Trade Executor started');
  }

  /**
   * Stop auto-execution
   */
  stop(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Auto Trade Executor stopped');
  }

  /**
   * Check for new signals and execute them
   */
  private async checkAndExecuteSignals(): Promise<void> {
    try {
      // Get unexecuted high-confidence signals
      const signals = await prisma.tradingSignal.findMany({
        where: {
          executed: false,
          confidence: { gte: this.config.minConfidence },
          symbol: { in: this.config.symbols },
          strategy: { in: this.config.allowedStrategies },
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes only
          }
        },
        orderBy: [
          { confidence: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 5 // Process up to 5 signals at a time
      });

      if (signals.length === 0) {
        return; // No signals to process
      }

      console.log(`📈 Found ${signals.length} high-confidence signals to execute`);

      for (const signal of signals) {
        await this.executeSignal(signal);
        
        // Wait 1 second between executions to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('❌ Error checking signals:', error);
    }
  }

  /**
   * Execute a single trading signal
   */
  private async executeSignal(signal: any): Promise<void> {
    try {
      console.log(`🎯 Executing signal: ${signal.signalType} ${signal.symbol} @ $${signal.currentPrice} (${signal.strategy})`);

      // Calculate position size
      const positionSize = this.calculatePositionSize(
        signal.currentPrice,
        signal.confidence
      );

      // Prepare trade payload
      const tradePayload = {
        symbol: signal.symbol,
        action: signal.signalType,
        quantity: positionSize,
        price: signal.currentPrice,
        strategy_id: signal.strategy,
        confidence: signal.confidence,
        signal_id: signal.id,
        timestamp: new Date().toISOString()
      };

      let executed = false;
      let executionMode = '';
      let executionResult: any = null;

      // Execute paper trade if enabled
      if (this.config.enablePaperTrading) {
        try {
          const response = await fetch('/api/execute-trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signalId: signal.id,
              mode: 'paper'
            })
          });

          if (response.ok) {
            executionResult = await response.json();
            executed = true;
            executionMode = 'PAPER';
            console.log(`✅ Paper trade executed: ${signal.signalType} ${positionSize} ${signal.symbol}`);
          }
        } catch (error) {
          console.error('Paper trade execution failed:', error);
        }
      }

      // Execute live trade if enabled and paper trade succeeded
      if (this.config.enableLiveTrading && executed) {
        try {
          // Add extra safety check for live trading
          if (signal.confidence >= 0.8) { // Even higher confidence for live
            const response = await fetch('/api/execute-trade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                signalId: signal.id,
                mode: 'live'
              })
            });

            if (response.ok) {
              executionMode = 'LIVE';
              console.log(`💰 LIVE trade executed: ${signal.signalType} ${positionSize} ${signal.symbol}`);
            }
          }
        } catch (error) {
          console.error('Live trade execution failed:', error);
        }
      }

      // Update signal status
      if (executed) {
        await prisma.tradingSignal.update({
          where: { id: signal.id },
          data: {
            executed: true,
            executedAt: new Date(),
            executionPrice: signal.currentPrice
          }
        });

        // Log execution
        console.log(`📊 Trade executed [${executionMode}]: ${signal.signalType} ${positionSize} ${signal.symbol} @ $${signal.currentPrice}`);
        console.log(`   Strategy: ${signal.strategy}, Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      }

    } catch (error) {
      console.error(`❌ Failed to execute signal ${signal.id}:`, error);
    }
  }

  /**
   * Calculate position size based on confidence and config
   */
  private calculatePositionSize(price: number, confidence: number): number {
    // Base position is a percentage of max position size based on confidence
    const basePosition = this.config.maxPositionSize * confidence;
    
    // Calculate quantity
    const quantity = basePosition / price;
    
    // Round to appropriate decimals
    if (price > 1000) {
      return Math.round(quantity * 10000) / 10000; // 4 decimals for BTC
    } else if (price > 10) {
      return Math.round(quantity * 100) / 100; // 2 decimals
    } else {
      return Math.round(quantity * 10) / 10; // 1 decimal
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ExecutionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Auto Trade Executor config updated:', this.config);
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(): Promise<any> {
    try {
      const executed = await prisma.tradingSignal.count({
        where: { executed: true }
      });

      const pending = await prisma.tradingSignal.count({
        where: { 
          executed: false,
          confidence: { gte: this.config.minConfidence }
        }
      });

      const recentTrades = await prisma.tradingSignal.findMany({
        where: { executed: true },
        orderBy: { executedAt: 'desc' },
        take: 10
      });

      return {
        executed,
        pending,
        recentTrades,
        isRunning: this.isRunning,
        config: this.config
      };

    } catch (error) {
      console.error('Failed to get execution stats:', error);
      return {
        executed: 0,
        pending: 0,
        recentTrades: [],
        isRunning: this.isRunning,
        config: this.config
      };
    }
  }
}

// Export singleton instance
export const autoTradeExecutor = AutoTradeExecutor.getInstance();

// Auto-start executor if in browser environment
if (typeof window !== 'undefined') {
  console.log('🤖 Auto-starting Trade Executor...');
  setTimeout(() => {
    autoTradeExecutor.start().catch(console.error);
  }, 5000); // Start after market data service
}