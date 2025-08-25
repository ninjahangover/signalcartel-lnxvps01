/**
 * Telegram Bot Service Stub
 * Provides empty implementations for build compatibility
 * Using OpenStatus for monitoring and alerting instead
 */

export class TelegramBotService {
  async sendMessage(message: string): Promise<void> {
    // OpenStatus handles monitoring - stub only
    console.log('System message:', message);
  }

  async sendAlert(alert: any): Promise<void> {
    // OpenStatus handles alerting - stub only
    console.log('System alert:', alert);
  }

  async sendTradeNotification(trade: any): Promise<void> {
    // OpenStatus handles notifications - stub only
    // console.log('Trade notification:', trade); // DISABLED to stop telegram spam
  }
}

export const telegramBot = new TelegramBotService();
export const telegramBotService = telegramBot;

// Function exports for compatibility - all route to console
export async function sendAlertNotification(alert: any): Promise<void> {
  console.log('Alert notification:', alert);
}

export async function sendTradeNotification(trade: any): Promise<void> {
  console.log('Trade notification:', trade);
}

// Export default instance
export default telegramBot;