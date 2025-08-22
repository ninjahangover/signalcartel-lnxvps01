/**
 * Unified Telegram Alert Service for All Trading Strategies
 * Replaces NTFY due to daily message limits
 * Provides consistent alerting across all strategy engines
 */

import axios from 'axios';

interface AlertConfig {
  botToken: string;
  chatId: string;
  enableSummaries: boolean;
  summaryIntervalMs: number;
}

interface PendingAlert {
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  strategy?: string;
}

class TelegramAlertService {
  private config: AlertConfig;
  private pendingAlerts: PendingAlert[] = [];
  private summaryTimer: NodeJS.Timeout | null = null;
  private alertCounts = {
    trades: 0,
    optimizations: 0,
    errors: 0,
    milestones: 0
  };

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM',
      chatId: process.env.TELEGRAM_CHAT_ID || '1370390999',
      enableSummaries: true,
      summaryIntervalMs: 5 * 60 * 1000 // 5 minutes
    };

    if (this.config.enableSummaries) {
      this.startSummaryTimer();
    }

    console.log('📱 Telegram Alert Service initialized (replacing NTFY due to limits)');
  }

  /**
   * Send immediate alert to Telegram
   */
  async sendAlert(message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    try {
      // Format message with appropriate emoji based on priority
      const emoji = this.getPriorityEmoji(priority);
      const formattedMessage = `${emoji} ${message}`;

      // Send to Telegram
      const response = await axios.post(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          chat_id: this.config.chatId,
          text: formattedMessage,
          parse_mode: 'HTML'
        }
      );

      if (!response.data.ok) {
        console.error('Telegram alert failed:', response.data);
      }
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
      // Don't throw - we don't want alerting failures to break the trading system
    }
  }

  /**
   * Queue alert for summary (reduces spam)
   */
  queueAlert(message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'low', strategy?: string): void {
    this.pendingAlerts.push({
      message,
      timestamp: new Date(),
      priority,
      strategy
    });

    // Send critical alerts immediately
    if (priority === 'critical') {
      this.sendAlert(message, priority);
    }

    // Track alert types for summary stats
    if (message.toLowerCase().includes('trade')) {
      this.alertCounts.trades++;
    } else if (message.toLowerCase().includes('optimiz')) {
      this.alertCounts.optimizations++;
    } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('fail')) {
      this.alertCounts.errors++;
    } else if (message.toLowerCase().includes('milestone') || message.toLowerCase().includes('achievement')) {
      this.alertCounts.milestones++;
    }
  }

  /**
   * Send trade execution alert
   */
  async sendTradeAlert(trade: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    strategy?: string;
    confidence?: number;
    pnl?: number;
  }): Promise<void> {
    const emoji = trade.side === 'BUY' ? '🟢' : '🔴';
    const pnlText = trade.pnl !== undefined ? 
      ` | P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '';
    const confidenceText = trade.confidence !== undefined ?
      ` | Confidence: ${(trade.confidence * 100).toFixed(0)}%` : '';
    
    const message = `${emoji} <b>${trade.side} ${trade.symbol}</b>
Price: $${trade.price.toFixed(2)}
Quantity: ${trade.quantity}${confidenceText}${pnlText}
Strategy: ${trade.strategy || 'QUANTUM FORGE™'}`;

    await this.sendAlert(message, trade.pnl && trade.pnl < -100 ? 'high' : 'medium');
  }

  /**
   * Send strategy optimization alert
   */
  async sendOptimizationAlert(optimization: {
    strategy: string;
    oldParams: any;
    newParams: any;
    improvement: number;
    backtestResults?: {
      winRate: number;
      profitFactor: number;
      sharpeRatio: number;
    };
  }): Promise<void> {
    const message = `🔧 <b>Strategy Optimized: ${optimization.strategy}</b>
Performance Improvement: ${(optimization.improvement * 100).toFixed(1)}%
${optimization.backtestResults ? `
Win Rate: ${(optimization.backtestResults.winRate * 100).toFixed(1)}%
Profit Factor: ${optimization.backtestResults.profitFactor.toFixed(2)}
Sharpe Ratio: ${optimization.backtestResults.sharpeRatio.toFixed(2)}` : ''}`;

    await this.sendAlert(message, optimization.improvement > 0.1 ? 'high' : 'medium');
  }

  /**
   * Send system status alert
   */
  async sendStatusAlert(status: {
    system: string;
    health: 'healthy' | 'degraded' | 'critical';
    trades?: number;
    uptime?: string;
    message: string;
  }): Promise<void> {
    const emoji = status.health === 'healthy' ? '✅' : 
                  status.health === 'degraded' ? '⚠️' : '🚨';
    
    const message = `${emoji} <b>${status.system} Status: ${status.health.toUpperCase()}</b>
${status.message}${status.trades !== undefined ? `
Trades: ${status.trades}` : ''}${status.uptime ? `
Uptime: ${status.uptime}` : ''}`;

    const priority = status.health === 'critical' ? 'critical' :
                    status.health === 'degraded' ? 'high' : 'low';
    
    await this.sendAlert(message, priority);
  }

  /**
   * Send milestone achievement alert
   */
  async sendMilestoneAlert(milestone: {
    type: string;
    value: number;
    description: string;
  }): Promise<void> {
    const message = `🎯 <b>Milestone Achieved!</b>
${milestone.type}: ${milestone.value}
${milestone.description}`;

    await this.sendAlert(message, 'high');
  }

  /**
   * Send periodic summary of queued alerts
   */
  private async sendSummary(): Promise<void> {
    if (this.pendingAlerts.length === 0 && 
        this.alertCounts.trades === 0 && 
        this.alertCounts.optimizations === 0) {
      return;
    }

    const now = new Date();
    const summaryMessage = `📊 <b>QUANTUM FORGE™ 5-Minute Summary</b>
<i>${now.toLocaleTimeString()}</i>

<b>Activity:</b>
• Trades: ${this.alertCounts.trades}
• Optimizations: ${this.alertCounts.optimizations}
• Errors: ${this.alertCounts.errors}
• Milestones: ${this.alertCounts.milestones}

<b>Recent Alerts (${this.pendingAlerts.length}):</b>
${this.pendingAlerts.slice(-5).map(alert => 
  `• ${this.getPriorityEmoji(alert.priority)} ${alert.message.slice(0, 50)}...`
).join('\n')}

🚀 System running smoothly with Telegram alerts
💡 <i>NTFY replaced due to daily limits</i>`;

    await this.sendAlert(summaryMessage, 'low');

    // Reset counters
    this.pendingAlerts = [];
    this.alertCounts = {
      trades: 0,
      optimizations: 0,
      errors: 0,
      milestones: 0
    };
  }

  /**
   * Start the summary timer
   */
  private startSummaryTimer(): void {
    this.summaryTimer = setInterval(() => {
      this.sendSummary();
    }, this.config.summaryIntervalMs);
  }

  /**
   * Get emoji for priority level
   */
  private getPriorityEmoji(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📌';
      case 'low': return '📝';
      default: return '📝';
    }
  }

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    if (this.summaryTimer) {
      clearInterval(this.summaryTimer);
    }
    
    // Send final summary if there are pending alerts
    if (this.pendingAlerts.length > 0) {
      await this.sendSummary();
    }

    await this.sendAlert('🛑 Alert service shutting down', 'medium');
  }
}

// Export singleton instance
export const telegramAlerts = new TelegramAlertService();

// Also export the class for testing or multiple instances
export { TelegramAlertService };