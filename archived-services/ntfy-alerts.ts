/**
 * NTFY Alert Service - Super Simple Push Notifications
 * No API keys, no tokens, no pain! Just works! 📱
 */

export interface NtfyAlert {
  title: string;
  message: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'urgent';
  tags?: string[];
  emoji?: string;
}

class NtfyAlertService {
  private static instance: NtfyAlertService;
  private topicName = 'signalcartel-trades'; // Default topic
  private baseUrl = 'https://ntfy.sh';
  private isEnabled = true;

  private constructor() {
    // Can be overridden via environment variable
    this.topicName = process.env.NTFY_TOPIC || 'signalcartel-trades';
    console.log(`📱 NTFY Alert Service initialized with topic: ${this.topicName}`);
  }

  static getInstance(): NtfyAlertService {
    if (!NtfyAlertService.instance) {
      NtfyAlertService.instance = new NtfyAlertService();
    }
    return NtfyAlertService.instance;
  }

  // Set your custom topic name
  setTopic(topicName: string) {
    this.topicName = topicName;
    console.log(`📱 NTFY topic updated to: ${topicName}`);
  }

  // Enable/disable alerts
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`📱 NTFY alerts ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // Send a simple message
  async sendMessage(message: string, title: string = 'SignalCartel Alert'): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const response = await fetch(`${this.baseUrl}/${this.topicName}`, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': 'default',
          'Tags': 'chart_with_upwards_trend,money_with_wings'
        },
        body: message
      });

      if (response.ok) {
        console.log(`📱 NTFY alert sent: ${title}`);
        return true;
      } else {
        console.error(`❌ NTFY alert failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ NTFY alert error:`, error);
      return false;
    }
  }

  // Send a detailed alert
  async sendAlert(alert: NtfyAlert): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const headers: Record<string, string> = {
        'Title': alert.title.replace(/[^\x00-\x7F]/g, ''), // Remove emojis from title for headers
        'Priority': alert.priority || 'default',
      };

      if (alert.tags) {
        headers['Tags'] = alert.tags.join(',');
      }

      // Don't put emojis in headers - they'll be in the message body

      const response = await fetch(`${this.baseUrl}/${this.topicName}`, {
        method: 'POST',
        headers,
        body: alert.title + '\n\n' + alert.message
      });

      if (response.ok) {
        console.log(`📱 NTFY alert sent: ${alert.title}`);
        return true;
      } else {
        console.error(`❌ NTFY alert failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ NTFY alert error:`, error);
      return false;
    }
  }

  // Trade-specific alert
  async sendTradeAlert(tradeData: {
    action: string;
    symbol: string;
    price: number;
    quantity: number;
    strategy: string;
    confidence: number;
    mode: 'paper' | 'live';
    orderId?: string;
  }): Promise<boolean> {
    const emoji = tradeData.action === 'BUY' ? '📈' : tradeData.action === 'SELL' ? '📉' : '🔄';
    const modeEmoji = tradeData.mode === 'paper' ? '📝' : '💰';
    
    const alert: NtfyAlert = {
      title: `${emoji} ${tradeData.action} Signal ${modeEmoji}`,
      message: `Strategy: ${tradeData.strategy}
Symbol: ${tradeData.symbol}
Action: ${tradeData.action} ${tradeData.quantity}
Price: $${tradeData.price.toLocaleString()}
Confidence: ${tradeData.confidence}%
Mode: ${tradeData.mode.toUpperCase()}
${tradeData.orderId ? `Order ID: ${tradeData.orderId}` : ''}
Time: ${new Date().toLocaleString()}`,
      priority: tradeData.confidence > 80 ? 'high' : 'default',
      tags: ['chart_with_upwards_trend', 'money_with_wings', tradeData.mode === 'live' ? 'fire' : 'memo'],
      emoji: emoji
    };

    return this.sendAlert(alert);
  }

  // System status alert
  async sendSystemAlert(status: string, details: string = ''): Promise<boolean> {
    const alert: NtfyAlert = {
      title: '🤖 SignalCartel System',
      message: `Status: ${status}
${details}
Time: ${new Date().toLocaleString()}`,
      priority: status.includes('ERROR') || status.includes('FAIL') ? 'urgent' : 'default',
      tags: ['robot', 'gear'],
      emoji: status.includes('ERROR') ? '🚨' : '🤖'
    };

    return this.sendAlert(alert);
  }

  // Test the service
  async sendTestAlert(): Promise<boolean> {
    return this.sendAlert({
      title: '🧪 NTFY Test Alert',
      message: `✅ NTFY is working!

📱 You should receive this on your phone
🚀 SignalCartel trading alerts are ready
⏰ Time: ${new Date().toLocaleString()}

If you see this, everything is set up correctly! 🎉`,
      priority: 'default',
      tags: ['white_check_mark', 'rocket', 'mobile_phone'],
      emoji: '🧪'
    });
  }

  // Get setup instructions
  getSetupInstructions(): string {
    return `📱 NTFY SETUP INSTRUCTIONS:

1. Download the NTFY app on your phone:
   - Android: Play Store "ntfy"
   - iOS: App Store "ntfy"

2. Open the app and subscribe to topic: "${this.topicName}"
   - Tap the "+" button
   - Enter topic: ${this.topicName}
   - Tap "Subscribe"

3. That's it! You'll now receive all trade alerts on your phone.

🔧 OPTIONAL: Set custom topic name:
export NTFY_TOPIC="your-custom-topic-name"

📱 Test URL: ${this.baseUrl}/${this.topicName}`;
  }
}

export const ntfyAlerts = NtfyAlertService.getInstance();
export default NtfyAlertService;