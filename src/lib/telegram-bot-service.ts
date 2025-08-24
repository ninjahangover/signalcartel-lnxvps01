/**
 * Telegram Bot Service Stub
 * Provides empty implementations for build compatibility
 */

export class TelegramBotService {
  async sendMessage(message: string): Promise<void> {
    console.log('Telegram message (stub):', message);
  }

  async sendAlert(alert: any): Promise<void> {
    console.log('Telegram alert (stub):', alert);
  }

  async sendTradeNotification(trade: any): Promise<void> {
    console.log('Telegram trade notification (stub):', trade);
  }
}

export const telegramBot = new TelegramBotService();

// Export default instance
export default telegramBot;