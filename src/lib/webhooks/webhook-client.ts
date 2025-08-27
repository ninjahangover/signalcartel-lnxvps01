/**
 * QUANTUM FORGE™ Webhook Client
 * Integration client for sending webhooks from trading system
 */

import { WebhookPayload } from './webhook-service';

export class WebhookClient {
  private readonly webhookUrl: string;
  private readonly bulkUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  
  // Buffer for bulk sending
  private webhookBuffer: WebhookPayload[] = [];
  private readonly bufferSize: number = 50;
  private bufferTimer: NodeJS.Timeout | null = null;
  
  constructor(options: {
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    enableBulkSending?: boolean;
    bufferSize?: number;
  } = {}) {
    const baseUrl = options.baseUrl || `http://localhost:${process.env.WEBHOOK_PORT || '4000'}`;
    this.webhookUrl = `${baseUrl}/webhook`;
    this.bulkUrl = `${baseUrl}/webhooks/bulk`;
    this.timeout = options.timeout || 5000;
    this.maxRetries = options.maxRetries || 3;
    
    if (options.bufferSize) {
      this.bufferSize = options.bufferSize;
    }
    
    // Setup bulk sending if enabled
    if (options.enableBulkSending) {
      this.setupBulkSending();
    }
  }
  
  /**
   * Send individual webhook
   */
  async sendWebhook(payload: Omit<WebhookPayload, 'id' | 'timestamp'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(this.webhookUrl, payload);
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, id: result.id };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send webhook with buffering for bulk optimization
   */
  async sendWebhookBuffered(payload: Omit<WebhookPayload, 'id' | 'timestamp'>): Promise<void> {
    this.webhookBuffer.push(payload as WebhookPayload);
    
    // Flush if buffer is full
    if (this.webhookBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }
  
  /**
   * Send bulk webhooks
   */
  async sendBulkWebhooks(payloads: Omit<WebhookPayload, 'id' | 'timestamp'>[]): Promise<{
    success: boolean;
    accepted?: number;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(this.bulkUrl, payloads);
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, accepted: result.accepted };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Trading-specific webhook methods
   */
  
  async sendTradeSignal(data: {
    action: 'BUY' | 'SELL' | 'HOLD';
    symbol: string;
    price: number;
    confidence: number;
    strategy: string;
    reason?: string;
  }): Promise<void> {
    await this.sendWebhookBuffered({
      type: 'trade_signal',
      source: data.strategy,
      priority: data.confidence > 0.8 ? 'high' : 'normal',
      data: {
        action: data.action,
        symbol: data.symbol,
        price: data.price,
        reason: data.reason
      },
      metadata: {
        symbol: data.symbol,
        confidence: data.confidence,
        strategyId: data.strategy
      }
    });
  }
  
  async sendTradeExecuted(data: {
    tradeId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    value: number;
    fees: number;
    strategy: string;
    sessionId?: string;
  }): Promise<void> {
    await this.sendWebhookBuffered({
      type: 'trade_executed',
      source: data.strategy,
      priority: 'normal',
      data: {
        tradeId: data.tradeId,
        symbol: data.symbol,
        side: data.side,
        quantity: data.quantity,
        price: data.price,
        value: data.value,
        fees: data.fees
      },
      metadata: {
        symbol: data.symbol,
        sessionId: data.sessionId,
        strategyId: data.strategy
      }
    });
  }
  
  async sendPositionOpened(data: {
    positionId: string;
    symbol: string;
    side: 'long' | 'short';
    quantity: number;
    entryPrice: number;
    strategy: string;
    sessionId?: string;
  }): Promise<void> {
    await this.sendWebhookBuffered({
      type: 'position_opened',
      source: data.strategy,
      priority: 'normal',
      data: {
        positionId: data.positionId,
        symbol: data.symbol,
        side: data.side,
        quantity: data.quantity,
        entryPrice: data.entryPrice
      },
      metadata: {
        symbol: data.symbol,
        sessionId: data.sessionId,
        strategyId: data.strategy
      }
    });
  }
  
  async sendPositionClosed(data: {
    positionId: string;
    symbol: string;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    holdingTime: number;
    strategy: string;
    sessionId?: string;
  }): Promise<void> {
    await this.sendWebhookBuffered({
      type: 'position_closed',
      source: data.strategy,
      priority: 'normal',
      data: {
        positionId: data.positionId,
        symbol: data.symbol,
        exitPrice: data.exitPrice,
        pnl: data.pnl,
        pnlPercent: data.pnlPercent,
        holdingTime: data.holdingTime
      },
      metadata: {
        symbol: data.symbol,
        sessionId: data.sessionId,
        strategyId: data.strategy
      }
    });
  }
  
  async sendRiskWarning(data: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    details?: any;
  }): Promise<void> {
    await this.sendWebhook({
      type: 'risk_warning',
      source: data.source,
      priority: data.severity === 'critical' ? 'critical' : 
               data.severity === 'high' ? 'high' : 'normal',
      data: {
        message: data.message,
        severity: data.severity,
        details: data.details
      }
    });
  }
  
  async sendEmergencyStop(data: {
    reason: string;
    source: string;
    sessionId?: string;
    affectedPositions?: number;
  }): Promise<void> {
    await this.sendWebhook({
      type: 'emergency_stop',
      source: data.source,
      priority: 'critical',
      data: {
        reason: data.reason,
        affectedPositions: data.affectedPositions,
        timestamp: new Date().toISOString()
      },
      metadata: {
        sessionId: data.sessionId
      }
    });
  }
  
  async sendAISignal(data: {
    recommendation: string;
    confidence: number;
    aiSystem: string;
    reasoning: string;
    symbol?: string;
    strategy?: string;
  }): Promise<void> {
    await this.sendWebhookBuffered({
      type: 'ai_signal',
      source: data.aiSystem,
      priority: data.confidence > 0.9 ? 'high' : 'normal',
      data: {
        recommendation: data.recommendation,
        reasoning: data.reasoning,
        aiSystem: data.aiSystem
      },
      metadata: {
        confidence: data.confidence,
        symbol: data.symbol,
        strategyId: data.strategy
      }
    });
  }
  
  async sendPerformanceUpdate(data: {
    sessionId: string;
    totalPnL: number;
    dailyPnL: number;
    winRate: number;
    tradesCount: number;
    source: string;
  }): Promise<void> {
    await this.sendWebhookBuffered({
      type: 'performance_update',
      source: data.source,
      priority: 'low',
      data: {
        totalPnL: data.totalPnL,
        dailyPnL: data.dailyPnL,
        winRate: data.winRate,
        tradesCount: data.tradesCount
      },
      metadata: {
        sessionId: data.sessionId
      }
    });
  }
  
  /**
   * Utility methods
   */
  
  async flushBuffer(): Promise<void> {
    if (this.webhookBuffer.length === 0) return;
    
    const webhooks = [...this.webhookBuffer];
    this.webhookBuffer = [];
    
    const result = await this.sendBulkWebhooks(webhooks);
    
    if (!result.success) {
      console.error('❌ Failed to flush webhook buffer:', result.error);
      // Could implement retry logic here
    } else {
      console.log(`📤 Flushed ${result.accepted} webhooks to service`);
    }
  }
  
  async getServiceHealth(): Promise<any> {
    try {
      const healthUrl = this.webhookUrl.replace('/webhook', '/health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: this.timeout
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Health check error: ${error.message}`);
    }
  }
  
  /**
   * Private methods
   */
  
  private setupBulkSending(): void {
    // Auto-flush buffer every 5 seconds
    this.bufferTimer = setInterval(() => {
      if (this.webhookBuffer.length > 0) {
        this.flushBuffer().catch(console.error);
      }
    }, 5000);
  }
  
  private async makeRequest(url: string, data: any): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    if (this.bufferTimer) {
      clearInterval(this.bufferTimer);
      this.bufferTimer = null;
    }
    
    // Flush any remaining webhooks
    this.flushBuffer().catch(console.error);
  }
}

// Create singleton instance for easy importing
export const webhookClient = new WebhookClient({
  enableBulkSending: true,
  bufferSize: 25 // Smaller buffer for more frequent flushing
});