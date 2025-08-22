/**
 * Telegram Bot Service for Trade Alerts
 * 
 * Sends real-time notifications about:
 * - Trade executions
 * - Strategy alerts
 * - System status updates
 * - Performance summaries
 */

export interface TelegramMessage {
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
}

export interface TradeAlert {
  type: 'TRADE_EXECUTED' | 'ALERT_GENERATED' | 'STRATEGY_OPTIMIZED' | 'SYSTEM_STATUS';
  strategy: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  price: number;
  quantity: number;
  confidence?: number;
  profit?: number;
  timestamp: Date;
  details?: any;
}

class TelegramBotService {
  private static instance: TelegramBotService | null = null;
  private botToken: string = '';
  private chatId: string = '';
  private isEnabled: boolean = false;
  private messageQueue: TelegramMessage[] = [];
  private sendInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  private initialize(): void {
    // Load configuration from environment variables
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '';
    
    this.isEnabled = !!(this.botToken && this.chatId);
    
    if (this.isEnabled) {
      console.log('📱 Telegram bot service initialized');
      this.startMessageProcessor();
    } else {
      console.log('📱 Telegram bot disabled - missing credentials');
      console.log('💡 Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable notifications');
    }
  }

  /**
   * Configure Telegram bot manually
   */
  configure(botToken: string, chatId: string): void {
    this.botToken = botToken;
    this.chatId = chatId;
    this.isEnabled = !!(botToken && chatId);
    
    if (this.isEnabled && !this.sendInterval) {
      this.startMessageProcessor();
    }
    
    console.log(`📱 Telegram bot ${this.isEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Start the message processing queue
   */
  private startMessageProcessor(): void {
    if (this.sendInterval) return;
    
    // Process messages every 2 seconds to avoid rate limits
    this.sendInterval = setInterval(() => {
      this.processMessageQueue();
    }, 2000);
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;
    
    const message = this.messageQueue.shift();
    if (message) {
      await this.sendMessageDirect(message);
    }
  }

  /**
   * Send message directly to Telegram
   */
  private async sendMessageDirect(message: TelegramMessage): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const payload = {
        chat_id: this.chatId,
        text: message.text,
        parse_mode: message.parseMode || 'HTML',
        disable_web_page_preview: message.disableWebPagePreview !== false
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Telegram send failed:', response.status, error);
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram send error:', error);
      return false;
    }
  }

  /**
   * Send trade alert notification
   */
  async sendTradeAlert(alert: TradeAlert): Promise<void> {
    if (!this.isEnabled) return;

    const emoji = this.getAlertEmoji(alert);
    const timestamp = alert.timestamp.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      dateStyle: 'short',
      timeStyle: 'medium'
    });
    
    let message = '';
    
    if (alert.type === 'TRADE_EXECUTED') {
      message = `${emoji} <b>TRADE EXECUTED</b>\n\n` +
                `📊 <b>Strategy:</b> ${alert.strategy}\n` +
                `💰 <b>Action:</b> ${alert.action} ${alert.quantity} ${alert.symbol}\n` +
                `💵 <b>Price:</b> $${alert.price.toLocaleString()}\n` +
                `💎 <b>Value:</b> $${(alert.price * alert.quantity).toLocaleString()}\n`;
      
      if (alert.confidence) {
        message += `🎯 <b>Confidence:</b> ${alert.confidence}%\n`;
      }
      
      if (alert.profit !== undefined) {
        const profitEmoji = alert.profit >= 0 ? '📈' : '📉';
        message += `${profitEmoji} <b>P&L:</b> $${alert.profit.toFixed(2)}\n`;
      }
      
      message += `⏰ <b>Time:</b> ${timestamp}`;
      
    } else if (alert.type === 'ALERT_GENERATED') {
      message = `🚨 <b>STRATEGY ALERT</b>\n\n` +
                `📊 <b>Strategy:</b> ${alert.strategy}\n` +
                `🎯 <b>Signal:</b> ${alert.action} ${alert.symbol}\n` +
                `💵 <b>Price:</b> $${alert.price.toLocaleString()}\n` +
                `🎲 <b>Confidence:</b> ${alert.confidence || 0}%\n` +
                `⏰ <b>Time:</b> ${timestamp}`;
                
    } else if (alert.type === 'STRATEGY_OPTIMIZED') {
      message = `⚡ <b>STRATEGY OPTIMIZED</b>\n\n` +
                `📊 <b>Strategy:</b> ${alert.strategy}\n` +
                `🎯 <b>Symbol:</b> ${alert.symbol}\n` +
                `🧠 <b>AI Optimization Applied</b>\n` +
                `⏰ <b>Time:</b> ${timestamp}`;
                
    } else if (alert.type === 'SYSTEM_STATUS') {
      message = `🔧 <b>SYSTEM UPDATE</b>\n\n` +
                `📊 <b>Status:</b> ${alert.details?.status || 'Running'}\n` +
                `⏰ <b>Time:</b> ${timestamp}`;
    }

    this.queueMessage({ text: message, parseMode: 'HTML' });
  }

  /**
   * Send daily performance summary
   */
  async sendDailySummary(summary: {
    totalTrades: number;
    winningTrades: number;
    winRate: number;
    totalProfit: number;
    bestTrade: number;
    worstTrade: number;
    activeStrategies: number;
  }): Promise<void> {
    if (!this.isEnabled) return;

    const winRateEmoji = summary.winRate >= 80 ? '🎉' : summary.winRate >= 60 ? '📈' : summary.winRate >= 40 ? '📊' : '📉';
    const profitEmoji = summary.totalProfit >= 0 ? '💰' : '💸';
    
    const message = `📊 <b>DAILY TRADING SUMMARY</b>\n\n` +
                   `${winRateEmoji} <b>Win Rate:</b> ${summary.winRate.toFixed(1)}% (${summary.winningTrades}/${summary.totalTrades})\n` +
                   `${profitEmoji} <b>Total P&L:</b> $${summary.totalProfit.toFixed(2)}\n` +
                   `🚀 <b>Best Trade:</b> $${summary.bestTrade.toFixed(2)}\n` +
                   `📉 <b>Worst Trade:</b> $${summary.worstTrade.toFixed(2)}\n` +
                   `⚡ <b>Active Strategies:</b> ${summary.activeStrategies}\n` +
                   `📅 <b>Date:</b> ${new Date().toLocaleDateString()}`;

    this.queueMessage({ text: message, parseMode: 'HTML' });
  }

  /**
   * Send system startup notification
   */
  async sendSystemStartup(): Promise<void> {
    if (!this.isEnabled) return;

    const message = `🚀 <b>Signal Cartel Trading System</b>\n\n` +
                   `✅ <b>Paper Trading Started</b>\n` +
                   `📊 Monitoring market conditions\n` +
                   `🧠 AI optimization active\n` +
                   `📱 Telegram alerts enabled\n\n` +
                   `⏰ Started: ${new Date().toLocaleString('en-US', { 
                     timeZone: 'America/Los_Angeles',
                     dateStyle: 'short',
                     timeStyle: 'medium'
                   })}`;

    this.queueMessage({ text: message, parseMode: 'HTML' });
  }

  /**
   * Test Telegram bot connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('❌ Telegram bot not configured');
      return false;
    }

    const testMessage = `🧪 <b>Telegram Bot Test</b>\n\n` +
                       `✅ Connection successful!\n` +
                       `📱 Trade alerts are working\n` +
                       `⏰ ${new Date().toLocaleString('en-US', { 
                         timeZone: 'America/Los_Angeles',
                         dateStyle: 'short',
                         timeStyle: 'medium'
                       })}`;

    const success = await this.sendMessageDirect({ 
      text: testMessage, 
      parseMode: 'HTML' 
    });

    if (success) {
      console.log('✅ Telegram bot test successful');
    } else {
      console.log('❌ Telegram bot test failed');
    }

    return success;
  }

  /**
   * Queue a message for sending
   */
  private queueMessage(message: TelegramMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > 50) {
      this.messageQueue.shift();
    }
  }

  /**
   * Get appropriate emoji for alert type
   */
  private getAlertEmoji(alert: TradeAlert): string {
    switch (alert.type) {
      case 'TRADE_EXECUTED':
        return alert.action === 'BUY' ? '🟢' : alert.action === 'SELL' ? '🔴' : '🟡';
      case 'ALERT_GENERATED':
        return '🚨';
      case 'STRATEGY_OPTIMIZED':
        return '⚡';
      case 'SYSTEM_STATUS':
        return '🔧';
      default:
        return '📊';
    }
  }

  /**
   * Get service status
   */
  getStatus(): { enabled: boolean; configured: boolean; queueSize: number } {
    return {
      enabled: this.isEnabled,
      configured: !!(this.botToken && this.chatId),
      queueSize: this.messageQueue.length
    };
  }

  /**
   * Stop the service
   */
  stop(): void {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
  }
}

// Export singleton instance
export const telegramBotService = TelegramBotService.getInstance();

// Helper functions
export function sendTradeNotification(
  strategy: string,
  symbol: string, 
  action: 'BUY' | 'SELL' | 'CLOSE',
  price: number,
  quantity: number,
  confidence?: number,
  profit?: number
): void {
  telegramBotService.sendTradeAlert({
    type: 'TRADE_EXECUTED',
    strategy,
    symbol,
    action,
    price,
    quantity,
    confidence,
    profit,
    timestamp: new Date()
  });
}

export function sendAlertNotification(
  strategy: string,
  symbol: string,
  action: 'BUY' | 'SELL' | 'CLOSE', 
  price: number,
  quantity: number,
  confidence: number
): void {
  telegramBotService.sendTradeAlert({
    type: 'ALERT_GENERATED',
    strategy,
    symbol,
    action,
    price,
    quantity,
    confidence,
    timestamp: new Date()
  });
}