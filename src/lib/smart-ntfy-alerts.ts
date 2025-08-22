/**
 * Smart NTFY Alert Service - Intelligent Batching & Summarization
 * 
 * Features:
 * ✅ Batches high-frequency alerts 
 * ✅ Creates smart summaries
 * ✅ Rate limiting to prevent spam
 * ✅ Priority-based alert escalation
 * ✅ Activity summaries every 5 minutes
 */

import { ntfyAlerts } from './ntfy-alerts';

interface TradingActivity {
  type: 'TRADE' | 'SIGNAL' | 'OPTIMIZATION' | 'SYSTEM';
  symbol?: string;
  action?: string;
  price?: number;
  pnl?: number;
  strategy?: string;
  confidence?: number;
  timestamp: Date;
  details: string;
}

interface BatchedSummary {
  trades: TradingActivity[];
  signals: TradingActivity[];
  optimizations: TradingActivity[];
  systemEvents: TradingActivity[];
  timeframe: { start: Date; end: Date };
}

class SmartNtfyAlertService {
  private static instance: SmartNtfyAlertService;
  private activityBuffer: TradingActivity[] = [];
  private lastSummaryTime = new Date();
  private batchInterval = 5 * 60 * 1000; // 5 minutes
  private maxBufferSize = 100;
  private alertCooldown = new Map<string, number>(); // Rate limiting
  private batchTimer?: NodeJS.Timeout;

  private constructor() {
    this.startBatchProcessor();
  }

  static getInstance(): SmartNtfyAlertService {
    if (!SmartNtfyAlertService.instance) {
      SmartNtfyAlertService.instance = new SmartNtfyAlertService();
    }
    return SmartNtfyAlertService.instance;
  }

  // Add activity to buffer for batching
  addActivity(activity: TradingActivity) {
    this.activityBuffer.push({
      ...activity,
      timestamp: new Date()
    });

    // Immediate alert for high-priority events
    if (this.shouldSendImmediateAlert(activity)) {
      this.sendImmediateAlert(activity);
    }

    // Prevent buffer overflow
    if (this.activityBuffer.length > this.maxBufferSize) {
      this.activityBuffer = this.activityBuffer.slice(-this.maxBufferSize);
    }
  }

  // Quick methods for common activities
  addTrade(symbol: string, action: 'BUY' | 'SELL', price: number, quantity: number, pnl?: number, strategy?: string) {
    this.addActivity({
      type: 'TRADE',
      symbol,
      action,
      price,
      pnl,
      strategy,
      timestamp: new Date(),
      details: `${action} ${quantity} ${symbol} @ $${price.toLocaleString()}`
    });
  }

  addSignal(symbol: string, signal: string, confidence: number, strategy: string) {
    this.addActivity({
      type: 'SIGNAL',
      symbol,
      action: signal,
      confidence,
      strategy,
      timestamp: new Date(),
      details: `${signal} signal for ${symbol} (${confidence}% confidence)`
    });
  }

  addOptimization(strategy: string, improvement: string) {
    this.addActivity({
      type: 'OPTIMIZATION',
      strategy,
      timestamp: new Date(),
      details: `${strategy}: ${improvement}`
    });
  }

  addSystemEvent(event: string, details?: string) {
    this.addActivity({
      type: 'SYSTEM',
      timestamp: new Date(),
      details: details || event
    });
  }

  // Determine if alert should be sent immediately
  private shouldSendImmediateAlert(activity: TradingActivity): boolean {
    // Immediate alerts for:
    // 1. Large trades (>$1000)
    // 2. High confidence signals (>90%)
    // 3. System errors
    // 4. Major P&L events (>$100 profit/loss)

    if (activity.type === 'SYSTEM') return true;
    
    if (activity.type === 'TRADE') {
      const tradeValue = (activity.price || 0) * 1; // Assume 1 unit for simplicity
      if (tradeValue > 1000) return true;
      if (Math.abs(activity.pnl || 0) > 100) return true;
    }

    if (activity.type === 'SIGNAL' && (activity.confidence || 0) > 90) {
      return true;
    }

    return false;
  }

  // Send immediate high-priority alert
  private async sendImmediateAlert(activity: TradingActivity) {
    const cooldownKey = `${activity.type}-${activity.symbol || 'system'}`;
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(cooldownKey) || 0;
    
    // Rate limit: 1 immediate alert per type per minute
    if (now - lastAlert < 60000) return;
    
    this.alertCooldown.set(cooldownKey, now);

    let emoji = '🚨';
    let title = 'SignalCartel Alert';
    
    switch (activity.type) {
      case 'TRADE':
        emoji = activity.action === 'BUY' ? '📈' : '📉';
        title = `${emoji} Large Trade Alert`;
        break;
      case 'SIGNAL':
        emoji = '🎯';
        title = `${emoji} High Confidence Signal`;
        break;
      case 'SYSTEM':
        emoji = '🚨';
        title = `${emoji} System Alert`;
        break;
    }

    await ntfyAlerts.sendAlert({
      title,
      message: `${activity.details}\n\nTime: ${activity.timestamp.toLocaleTimeString()}`,
      priority: 'high',
      tags: ['fire', 'chart_with_upwards_trend'],
      emoji
    });
  }

  // Start the batch processor
  private startBatchProcessor() {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  // Process and send batched summary
  private async processBatch() {
    if (this.activityBuffer.length === 0) return;

    const now = new Date();
    const timeframe = {
      start: this.lastSummaryTime,
      end: now
    };

    // Group activities by type
    const summary: BatchedSummary = {
      trades: this.activityBuffer.filter(a => a.type === 'TRADE'),
      signals: this.activityBuffer.filter(a => a.type === 'SIGNAL'),
      optimizations: this.activityBuffer.filter(a => a.type === 'OPTIMIZATION'),
      systemEvents: this.activityBuffer.filter(a => a.type === 'SYSTEM'),
      timeframe
    };

    // Generate smart summary message
    const summaryMessage = this.generateSummaryMessage(summary);
    
    if (summaryMessage) {
      await ntfyAlerts.sendAlert({
        title: '📊 Trading Activity Summary',
        message: summaryMessage,
        priority: 'default',
        tags: ['chart_with_upwards_trend', 'memo'],
        emoji: '📊'
      });
    }

    // Clear buffer and update timestamp
    this.activityBuffer = [];
    this.lastSummaryTime = now;
  }

  // Generate intelligent summary message
  private generateSummaryMessage(summary: BatchedSummary): string {
    const { trades, signals, optimizations, systemEvents, timeframe } = summary;
    const totalActivities = trades.length + signals.length + optimizations.length + systemEvents.length;
    
    if (totalActivities === 0) return '';

    let message = `📊 ${timeframe.start.toLocaleTimeString()} - ${timeframe.end.toLocaleTimeString()}\n\n`;

    // Trading Summary
    if (trades.length > 0) {
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const profitableTrades = trades.filter(t => (t.pnl || 0) > 0).length;
      const symbols = [...new Set(trades.map(t => t.symbol))];
      
      message += `💰 TRADING (${trades.length} trades)\n`;
      message += `• P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}\n`;
      message += `• Win Rate: ${((profitableTrades / trades.length) * 100).toFixed(1)}%\n`;
      message += `• Symbols: ${symbols.join(', ')}\n\n`;
    }

    // Signals Summary
    if (signals.length > 0) {
      const avgConfidence = signals.reduce((sum, s) => sum + (s.confidence || 0), 0) / signals.length;
      const signalTypes = [...new Set(signals.map(s => s.action))];
      
      message += `🎯 SIGNALS (${signals.length} generated)\n`;
      message += `• Avg Confidence: ${avgConfidence.toFixed(1)}%\n`;
      message += `• Types: ${signalTypes.join(', ')}\n\n`;
    }

    // Optimization Summary
    if (optimizations.length > 0) {
      message += `⚡ OPTIMIZATIONS (${optimizations.length} events)\n`;
      optimizations.slice(0, 3).forEach(opt => {
        message += `• ${opt.details}\n`;
      });
      if (optimizations.length > 3) {
        message += `• ... and ${optimizations.length - 3} more\n`;
      }
      message += '\n';
    }

    // System Events
    if (systemEvents.length > 0) {
      message += `🔧 SYSTEM (${systemEvents.length} events)\n`;
      systemEvents.slice(0, 2).forEach(evt => {
        message += `• ${evt.details}\n`;
      });
      if (systemEvents.length > 2) {
        message += `• ... and ${systemEvents.length - 2} more\n`;
      }
    }

    message += `\n🚀 Total Activity: ${totalActivities} events`;
    
    return message;
  }

  // Manual summary trigger
  async sendManualSummary() {
    await this.processBatch();
  }

  // Test the smart alert system
  async sendTestBatch() {
    // Add some test activities
    this.addTrade('BTCUSD', 'BUY', 67000, 0.001, 15.50, 'RSI_Strategy');
    this.addTrade('ETHUSD', 'SELL', 2400, 0.1, -8.20, 'Neural_Strategy');
    this.addSignal('SOLUSD', 'STRONG_BUY', 92, 'Quantum_Oscillator');
    this.addOptimization('RSI_Strategy', 'Increased win rate by 3.2%');
    this.addSystemEvent('Market data connection restored');

    // Send immediate summary
    await this.sendManualSummary();
  }

  // Cleanup
  destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
  }
}

export const smartNtfyAlerts = SmartNtfyAlertService.getInstance();
export default SmartNtfyAlertService;