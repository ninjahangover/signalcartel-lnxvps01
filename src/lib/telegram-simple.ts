const fetch = require('node-fetch');

class SimpleTelegramService {
  private token: string;
  private chatId: string;
  
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }
  
  async sendMessage(text: string): Promise<boolean> {
    if (!this.token || !this.chatId) {
      console.error('❌ Telegram credentials not configured');
      return false;
    }
    
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
      
      const result = await response.json();
      if (result.ok) {
        console.log('📱 Telegram sent:', text.substring(0, 50) + '...');
        return true;
      } else {
        console.error('❌ Telegram API error:', result.description);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Telegram send failed:', error.message);
      return false;
    }
  }
  
  async sendTradeAlert(order: any): Promise<boolean> {
    const side = order.side ? order.side.toUpperCase() : 'UNKNOWN';
    const message = `🎉 <b>TRADE EXECUTED!</b>
🎯 Order ID: ${order.id}
💎 ${side} ${order.qty} ${order.symbol}
📊 Status: ${order.status}
💰 Type: ${order.order_type || 'MARKET'}
⏰ Time: ${new Date().toISOString()}`;
    
    return this.sendMessage(message);
  }
  
  async sendStrategyAlert(strategy: string, signal: any): Promise<boolean> {
    const emoji = signal.action === 'BUY' ? '🟢' : signal.action === 'SELL' ? '🔴' : '⚪';
    const message = `${emoji} <b>SIGNAL GENERATED!</b>
🤖 Strategy: ${strategy}
💎 Symbol: ${signal.symbol}
📈 Action: ${signal.action}
💪 Confidence: ${(signal.confidence * 100).toFixed(1)}%
💰 Price: $${signal.price.toLocaleString()}
⏰ Time: ${new Date().toISOString()}`;
    
    return this.sendMessage(message);
  }
  
  async sendOptimizationAlert(strategy: string, improvement: string): Promise<boolean> {
    const message = `🔧 <b>STRATEGY OPTIMIZED!</b>
🤖 Strategy: ${strategy}
📈 Improvement: ${improvement}
⏰ Time: ${new Date().toISOString()}`;
    
    return this.sendMessage(message);
  }
}

export const simpleTelegram = new SimpleTelegramService();