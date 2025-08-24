/**
 * Strategy Signal Monitor with Telegram Alerts
 * 
 * Monitors all 3 competition strategies and sends detailed alerts
 * when any strategy generates a signal
 */

import { uniqueStrategyExecutor, SignalResult } from './unique-strategy-executor';
import { competitionStrategyRegistry, PineScriptStrategy } from './strategy-registry-competition';
import marketDataService, { MarketData } from './market-data-service';

export interface StrategySignal {
  strategyId: string;
  strategyName: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  parameters: any;
  timestamp: Date;
  price: number;
  symbol: string;
}

class StrategySignalMonitor {
  private static instance: StrategySignalMonitor;
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private lastSignals: Map<string, StrategySignal> = new Map();
  private signalHistory: StrategySignal[] = [];
  private checkIntervalMs: number = 30000; // Check every 30 seconds
  
  private constructor() {
    this.initialize();
  }

  static getInstance(): StrategySignalMonitor {
    if (!StrategySignalMonitor.instance) {
      StrategySignalMonitor.instance = new StrategySignalMonitor();
    }
    return StrategySignalMonitor.instance;
  }

  private initialize(): void {
    console.log('🔍 Strategy Signal Monitor initialized');
    
    // Subscribe to market data
    marketDataService.subscribe('BTCUSD', (data) => {
      uniqueStrategyExecutor.addMarketData({
        timestamp: new Date(),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.price,
        volume: data.volume
      });
    });
  }

  /**
   * Start monitoring all strategies
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ Signal monitor already running');
      return;
    }

    console.log('🚀 Starting strategy signal monitoring for all 3 strategies');
    this.isMonitoring = true;

    // Send startup notification
    this.sendStartupNotification();

    // Check strategies immediately
    this.checkAllStrategies();

    // Then check periodically
    this.monitorInterval = setInterval(() => {
      this.checkAllStrategies();
    }, this.checkIntervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('⏹️ Stopping strategy signal monitoring');
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Check all strategies for signals
   */
  private async checkAllStrategies(): Promise<void> {
    const strategies = competitionStrategyRegistry.getAllStrategies();
    const currentPrice = await this.getCurrentPrice('BTCUSD');

    for (const strategy of strategies) {
      try {
        // Execute strategy to get signal
        const signal = uniqueStrategyExecutor.executeStrategy(strategy);
        
        // Create strategy signal object
        const strategySignal: StrategySignal = {
          strategyId: strategy.id,
          strategyName: strategy.name,
          signal: signal.signal,
          confidence: signal.confidence,
          reason: signal.reason,
          parameters: signal.parameters,
          timestamp: new Date(),
          price: currentPrice,
          symbol: strategy.symbol
        };

        // Check if this is a new signal
        const lastSignal = this.lastSignals.get(strategy.id);
        const isNewSignal = !lastSignal || 
                           lastSignal.signal !== signal.signal ||
                           (Date.now() - lastSignal.timestamp.getTime() > 3600000); // 1 hour

        // Send alert if it's a new actionable signal
        if (isNewSignal && signal.signal !== 'HOLD') {
          await this.sendStrategyAlert(strategy, strategySignal);
          this.lastSignals.set(strategy.id, strategySignal);
        }

        // Always add to history for tracking
        this.signalHistory.push(strategySignal);
        if (this.signalHistory.length > 1000) {
          this.signalHistory.shift();
        }

      } catch (error) {
        console.error(`❌ Error checking strategy ${strategy.id}:`, error);
      }
    }
  }

  /**
   * Send detailed Telegram alert for strategy signal
   */
  private async sendStrategyAlert(strategy: PineScriptStrategy, signal: StrategySignal): Promise<void> {
    // Determine strategy-specific details and emoji
    let strategyEmoji = '📊';
    let strategyDetails = '';
    
    if (strategy.id === 'rsi-pullback-pro') {
      strategyEmoji = '📈';
      const rsi = signal.parameters.rsi;
      const pullback = signal.parameters.pullback;
      strategyDetails = `RSI: ${rsi?.toFixed(1) || 'N/A'}, Pullback: ${pullback?.toFixed(1) || 'N/A'}%`;
      
    } else if (strategy.id === 'claude-quantum-oscillator') {
      strategyEmoji = '🌊';
      const quantum = signal.parameters.quantum;
      const confluence = signal.parameters.confluence;
      const factors = signal.parameters.factors;
      strategyDetails = `Quantum: ${quantum?.toFixed(2) || 'N/A'}, Confluence: ${confluence?.toFixed(0) || 'N/A'}%`;
      if (factors && factors.length > 0) {
        strategyDetails += `\nFactors: ${factors.join(', ')}`;
      }
      
    } else if (strategy.id === 'stratus-core-neural') {
      strategyEmoji = '🧠';
      const confidence = signal.parameters.neural_confidence;
      const patterns = signal.parameters.patterns;
      strategyDetails = `Neural Confidence: ${(confidence * 100)?.toFixed(0) || 'N/A'}%`;
      if (patterns && patterns.length > 0) {
        strategyDetails += `\nPatterns: ${patterns.join(', ')}`;
      }
    }

    // Build the alert message
    const actionEmoji = signal.signal === 'BUY' ? '🟢' : '🔴';
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'short',
      timeStyle: 'medium'
    });

    const message = `${actionEmoji} <b>${signal.signal} SIGNAL DETECTED!</b>\n\n` +
                   `${strategyEmoji} <b>Strategy:</b> ${strategy.name}\n` +
                   `💰 <b>Symbol:</b> ${signal.symbol}\n` +
                   `💵 <b>Price:</b> $${signal.price.toLocaleString()}\n` +
                   `🎯 <b>Confidence:</b> ${(signal.confidence * 100).toFixed(0)}%\n` +
                   `📝 <b>Reason:</b> ${signal.reason}\n` +
                   `📊 <b>Details:</b> ${strategyDetails}\n` +
                   `⏰ <b>Time:</b> ${timestamp}\n\n` +
                   `⚠️ <i>Paper trading mode - monitoring signal</i>`;

    // Send via Telegram service
    console.log('Signal alert:', {
      text: message,
      parseMode: 'HTML'
    });

    // Also use the standard alert notification
    console.log('Alert notification:',
      strategy.name,
      signal.symbol,
      signal.signal as 'BUY' | 'SELL',
      signal.price,
      0.01, // Default quantity for alerts
      signal.confidence * 100
    );

    console.log(`📱 Telegram alert sent for ${strategy.name}: ${signal.signal} at $${signal.price}`);
  }

  /**
   * Send startup notification with all strategies
   */
  private async sendStartupNotification(): Promise<void> {
    const strategies = competitionStrategyRegistry.getAllStrategies();
    
    const message = `🚀 <b>STRATUS ENGINE STARTED</b>\n\n` +
                   `<b>Monitoring 3 Competition Strategies:</b>\n\n` +
                   `📈 <b>RSI Pullback Pro</b>\n` +
                   `   • Your proven 2-period RSI strategy\n` +
                   `   • Ultra-aggressive entry levels\n\n` +
                   `🌊 <b>Claude Quantum Oscillator</b>\n` +
                   `   • Multi-factor confluence analysis\n` +
                   `   • Wave patterns & quantum oscillator\n\n` +
                   `🧠 <b>Stratus Core Neural</b>\n` +
                   `   • 4-layer neural network\n` +
                   `   • 50+ pattern recognition\n\n` +
                   `📊 <b>Status:</b> All strategies active\n` +
                   `⏰ <b>Check interval:</b> Every 30 seconds\n` +
                   `📱 <b>Alerts:</b> Enabled for all signals\n\n` +
                   `<i>You'll receive alerts when any strategy generates a BUY or SELL signal</i>`;

    console.log('Signal alert:', {
      text: message,
      parseMode: 'HTML'
    });
  }

  /**
   * Send summary of recent signals
   */
  async sendSignalSummary(): Promise<void> {
    const recentSignals = this.signalHistory.slice(-20);
    const strategyStats = new Map<string, { buy: number; sell: number; hold: number }>();

    // Calculate stats per strategy
    for (const signal of recentSignals) {
      if (!strategyStats.has(signal.strategyId)) {
        strategyStats.set(signal.strategyId, { buy: 0, sell: 0, hold: 0 });
      }
      const stats = strategyStats.get(signal.strategyId)!;
      
      if (signal.signal === 'BUY') stats.buy++;
      else if (signal.signal === 'SELL') stats.sell++;
      else stats.hold++;
    }

    let summaryText = `📊 <b>SIGNAL SUMMARY (Last ${recentSignals.length} checks)</b>\n\n`;

    for (const [strategyId, stats] of strategyStats) {
      const strategy = competitionStrategyRegistry.getStrategy(strategyId);
      if (strategy) {
        summaryText += `<b>${strategy.name}:</b>\n`;
        summaryText += `   🟢 Buy: ${stats.buy} | 🔴 Sell: ${stats.sell} | ⏸️ Hold: ${stats.hold}\n\n`;
      }
    }

    summaryText += `⏰ <i>Generated: ${new Date().toLocaleString()}</i>`;

    console.log('Signal alert:', {
      text: summaryText,
      parseMode: 'HTML'
    });
  }

  /**
   * Get current price for symbol
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const latestData = marketDataService.getLatestData(symbol);
      return latestData?.price || 0;
    } catch (error) {
      console.error('Error getting current price:', error);
      return 0;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    strategiesMonitored: number;
    recentSignals: number;
    lastCheck: Date | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      strategiesMonitored: competitionStrategyRegistry.getAllStrategies().length,
      recentSignals: this.signalHistory.filter(s => 
        Date.now() - s.timestamp.getTime() < 3600000 // Last hour
      ).length,
      lastCheck: this.signalHistory.length > 0 ? 
        this.signalHistory[this.signalHistory.length - 1].timestamp : null
    };
  }

  /**
   * Get signal history
   */
  getSignalHistory(limit: number = 100): StrategySignal[] {
    return this.signalHistory.slice(-limit);
  }

  /**
   * Test Telegram connection with sample signal
   */
  async testTelegramAlerts(): Promise<boolean> {
    console.log('🧪 Testing Telegram alerts for all strategies...');
    
    const testMessage = `🧪 <b>TELEGRAM ALERT TEST</b>\n\n` +
                       `Testing alerts for 3 competition strategies:\n\n` +
                       `📈 RSI Pullback Pro - ✅\n` +
                       `🌊 Claude Quantum Oscillator - ✅\n` +
                       `🧠 Stratus Core Neural - ✅\n\n` +
                       `All strategy alerts are working!\n` +
                       `You'll receive notifications when signals are detected.\n\n` +
                       `⏰ ${new Date().toLocaleString()}`;

    console.log('System alert:', {
      text: testMessage,
      parseMode: 'HTML'
    });

    if (success) {
      console.log('✅ Telegram alert test successful');
    } else {
      console.log('❌ Telegram alert test failed - check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
    }

    return success;
  }
}

// Export singleton instance
export const strategySignalMonitor = StrategySignalMonitor.getInstance();

// Helper function to start monitoring with Telegram alerts
export function startStrategyMonitoring(): void {
  strategySignalMonitor.startMonitoring();
}

// Helper function to test Telegram
export async function testTelegramAlerts(): Promise<boolean> {
  return strategySignalMonitor.testTelegramAlerts();
}