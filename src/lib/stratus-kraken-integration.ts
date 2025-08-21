/**
 * Stratus Engine <-> Kraken Real Trading Integration
 * 
 * Connects AI trading signals from Stratus Engine to REAL Kraken trading orders
 * WARNING: This uses live money - use with extreme caution!
 */

import { krakenApiService } from './kraken-api-service';
import { getAITradingSignal, recordAITradeResult, type AITradingDecision, type TradeOutcome } from './stratus-engine-ai';

export interface StratusTradeExecution {
  id: string;
  symbol: string;
  aiDecision: AITradingDecision;
  krakenOrderId?: string;
  status: 'pending' | 'placed' | 'filled' | 'failed';
  timestamp: Date;
  error?: string;
}

class StratusKrakenIntegration {
  private static instance: StratusKrakenIntegration;
  private activeExecutions: Map<string, StratusTradeExecution> = new Map();
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): StratusKrakenIntegration {
    if (!StratusKrakenIntegration.instance) {
      StratusKrakenIntegration.instance = new StratusKrakenIntegration();
    }
    return StratusKrakenIntegration.instance;
  }

  /**
   * Start monitoring AI signals and executing trades
   */
  async start(symbols: string[] = ['PI_XBTUSD', 'PI_ETHUSD']): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Stratus-Kraken integration already running');
      return;
    }

    console.log('🚀 Starting Stratus Engine <-> Kraken REAL TRADING integration...');
    console.log('⚠️ WARNING: This uses REAL MONEY! Use with extreme caution.');

    // Test connection first
    const authResult = await krakenApiService.testConnection();
    if (!authResult) {
      throw new Error('Failed to authenticate with Kraken LIVE API. Check API keys.');
    }

    this.isRunning = true;

    // Monitor AI signals every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkAndExecuteSignals(symbols);
    }, 30000);

    console.log(`✅ Stratus-Kraken REAL TRADING integration started for symbols: ${symbols.join(', ')}`);
  }

  /**
   * Stop the integration
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🛑 Stratus-Kraken integration stopped');
  }

  /**
   * Check AI signals and execute trades if confident enough
   */
  private async checkAndExecuteSignals(symbols: string[]): Promise<void> {
    try {
      for (const symbol of symbols) {
        await this.processSymbolSignal(symbol);
      }
    } catch (error) {
      console.error('❌ Error checking AI signals:', error);
    }
  }

  /**
   * Process AI signal for a specific symbol
   */
  private async processSymbolSignal(symbol: string): Promise<void> {
    try {
      // Get AI trading signal
      const aiDecision = await getAITradingSignal(symbol);
      
      // Only execute if confidence is high enough
      const minConfidence = 0.75; // 75% confidence threshold
      
      if (aiDecision.confidence < minConfidence) {
        console.log(`📊 ${symbol}: AI confidence too low (${(aiDecision.confidence * 100).toFixed(1)}% < ${minConfidence * 100}%)`);
        return;
      }

      if (aiDecision.decision === 'HOLD') {
        console.log(`📊 ${symbol}: AI recommends HOLD`);
        return;
      }

      // Check if we already have a recent execution for this symbol
      const recentExecution = Array.from(this.activeExecutions.values())
        .find(exec => exec.symbol === symbol && 
              (Date.now() - exec.timestamp.getTime()) < 300000); // 5 minutes

      if (recentExecution) {
        console.log(`📊 ${symbol}: Recent execution found, skipping`);
        return;
      }

      // Execute the trade
      await this.executeAITrade(symbol, aiDecision);

    } catch (error) {
      console.error(`❌ Error processing signal for ${symbol}:`, error);
    }
  }

  /**
   * Execute AI trade decision on Kraken REAL TRADING
   * WARNING: This uses live money!
   */
  private async executeAITrade(symbol: string, aiDecision: AITradingDecision): Promise<void> {
    const executionId = `${symbol}_${Date.now()}`;
    
    const execution: StratusTradeExecution = {
      id: executionId,
      symbol,
      aiDecision,
      status: 'pending',
      timestamp: new Date()
    };

    this.activeExecutions.set(executionId, execution);

    try {
      console.log(`🤖 Executing AI trade: ${aiDecision.decision} ${symbol} (confidence: ${(aiDecision.confidence * 100).toFixed(1)}%)`);

      // Calculate position size (conservative for demo)
      const baseSize = 1; // 1 contract for demo
      const confidenceMultiplier = Math.min(aiDecision.confidence * 2, 1.5); // Max 1.5x
      const positionSize = Math.floor(baseSize * confidenceMultiplier);

      // Place order on Kraken LIVE API
      const order = await krakenApiService.placeOrder({
        pair: symbol,
        type: aiDecision.decision.toLowerCase() as 'buy' | 'sell',
        ordertype: 'market',
        volume: positionSize.toString()
      });

      if (order) {
        execution.status = 'placed';
        execution.krakenOrderId = order.orderId;
        
        console.log(`✅ AI trade executed: Order ${order.orderId} placed for ${positionSize} contracts`);

        // Record the trade result with Stratus Engine
        const tradeOutcome: TradeOutcome = {
          symbol,
          entryPrice: order.price || 0,
          quantity: positionSize,
          side: aiDecision.decision === 'BUY' ? 'long' : 'short',
          timestamp: new Date(),
          confidence: aiDecision.confidence,
          orderId: order.orderId,
          success: true
        };

        await recordAITradeResult(tradeOutcome);

      } else {
        execution.status = 'failed';
        execution.error = 'Failed to place order';
        console.error(`❌ Failed to place AI trade order for ${symbol}`);
      }

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error executing AI trade for ${symbol}:`, error);
    }

    this.activeExecutions.set(executionId, execution);
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): StratusTradeExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution status
   */
  getStatus(): {
    isRunning: boolean;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    recentExecutions: StratusTradeExecution[];
  } {
    const executions = this.getActiveExecutions();
    const successful = executions.filter(e => e.status === 'placed' || e.status === 'filled');
    const failed = executions.filter(e => e.status === 'failed');
    const recent = executions
      .filter(e => (Date.now() - e.timestamp.getTime()) < 3600000) // Last hour
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      isRunning: this.isRunning,
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      recentExecutions: recent
    };
  }
}

// Export singleton instance
export const stratusKrakenIntegration = StratusKrakenIntegration.getInstance();

export default StratusKrakenIntegration;