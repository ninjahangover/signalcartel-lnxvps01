import { Strategy } from './strategy-manager';
import { krakenApiService } from './kraken-api-service';
import { riskManager } from './risk-management';

interface PineScriptAlert {
  strategyId: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  symbol: string;
  price: number;
  quantity: number;
  timestamp: Date;
  alertData: Record<string, any>;
}

interface WebhookConfig {
  strategyId: string;
  webhookId: string;
  url: string;
  payload: Record<string, any>;
  active: boolean;
  testMode: boolean;
}

class PineScriptManager {
  private static instance: PineScriptManager;
  private webhookConfigs: Map<string, WebhookConfig> = new Map();
  private alertHistory: PineScriptAlert[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): PineScriptManager {
    if (!PineScriptManager.instance) {
      PineScriptManager.instance = new PineScriptManager();
    }
    return PineScriptManager.instance;
  }

  // Generate webhook URL with unique webhook ID for each strategy
  generateWebhookUrl(strategyId: string): { url: string; webhookId: string } {
    const webhookId = this.generateUniqueId(strategyId);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    const url = `${baseUrl}/api/pine-script-webhook/${strategyId}/${webhookId}`;
    return { url, webhookId };
  }

  private generateUniqueId(strategyId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `wh_${strategyId}_${timestamp}_${random}`;
  }

  // Configure webhook for a strategy
  async configureWebhook(strategyId: string, strategy: Strategy): Promise<WebhookConfig> {
    const { url, webhookId } = this.generateWebhookUrl(strategyId);
    
    const config: WebhookConfig = {
      strategyId,
      webhookId,
      url,
      payload: this.generateDefaultPayload(strategy),
      active: true,
      testMode: strategy.pineScript?.testingMode ?? false
    };

    // Store the webhook configuration locally
    this.webhookConfigs.set(strategyId, config);
    console.log(`✅ Webhook configured for strategy: ${strategyId} with ID: ${webhookId}`);

    this.notifyListeners();
    return config;
  }

  private generateDefaultPayload(strategy: Strategy): Record<string, any> {
    return {
      passphrase: "sdfqoei1898498",
      ticker: "{{ticker}}",
      strategy: {
        order_action: "{{strategy.order.action}}",
        order_type: "market", // Default to market for faster execution
        order_price: "{{strategy.order.price}}",
        order_contracts: "{{strategy.order.contracts}}",
        type: "{{strategy.order.action}}",
        volume: "{{strategy.order.contracts}}",
        pair: "{{ticker}}",
        validate: "false", // Set to "false" for testing/live trading, "true" only for validation
        close: {
          order_type: "market", // Use market orders for closing positions
          price: "{{strategy.order.price}}"
        },
        stop_loss: "{{strategy.order.price - strategy.position.avg_price * 0.02}}", // 2% stop loss
        take_profit: "{{strategy.order.price + strategy.position.avg_price * 0.04}}", // 4% take profit
        leverage: "none", // No leverage by default for safety
        time_in_force: "IOC" // Immediate or Cancel for better execution
      }
    };
  }

  // Generate Pine Script alert code
  generatePineScriptAlert(strategyId: string): string {
    const config = this.webhookConfigs.get(strategyId);
    if (!config) {
      throw new Error(`No webhook config found for strategy ${strategyId}`);
    }

    const buyPayload = {
      ...config.payload,
      strategy: {
        ...config.payload.strategy,
        order_action: "buy"
      }
    };

    const sellPayload = {
      ...config.payload,
      strategy: {
        ...config.payload.strategy,
        order_action: "sell"
      }
    };

    const closePayload = {
      ...config.payload,
      strategy: {
        ...config.payload.strategy,
        order_action: "close"
      }
    };

    return `// Pine Script Alert Configuration for Strategy: ${strategyId}
// Webhook URL: ${config.url}
// Test Mode: ${config.testMode ? 'ENABLED (validate: true)' : 'DISABLED (validate: false)'}

// Add this to your Pine Script strategy for BUY signals:
if (buyCondition)
    strategy.entry("Long", strategy.long)
    alert('${JSON.stringify(buyPayload)}', alert.freq_once_per_bar)

// Add this to your Pine Script strategy for SELL signals:
if (sellCondition)
    strategy.entry("Short", strategy.short)
    alert('${JSON.stringify(sellPayload)}', alert.freq_once_per_bar)

// Add this to your Pine Script strategy for CLOSE positions:
if (closeCondition)
    strategy.close_all()
    alert('${JSON.stringify(closePayload)}', alert.freq_once_per_bar)

// TradingView Alert Setup Instructions:
// 1. Create a new alert on your chart
// 2. Set Condition to your strategy name
// 3. Set "Once Per Bar Close" frequency
// 4. Paste the webhook URL above into the "Webhook URL" field
// 5. Copy the appropriate alert message from above into the "Message" field
// 6. Enable the alert

// Note: Default validate: "false" allows testing with Kraken validation
// For pure validation (no API calls), set validate: "true"
// For real live trading, set validate: "false" and ensure proper risk management`;
  }

  // Process incoming webhook alerts
  async processAlert(strategyId: string, alertData: Record<string, any>): Promise<boolean> {
    try {
      const config = this.webhookConfigs.get(strategyId);
      if (!config || !config.active) {
        console.log(`Alert ignored for inactive strategy: ${strategyId}`);
        return false;
      }

      // Extract data from the new payload format
      const strategyData = alertData.strategy || {};
      const action = (strategyData.order_action || strategyData.type || 'unknown').toUpperCase();
      const symbol = alertData.ticker || strategyData.pair || 'UNKNOWN';
      const price = parseFloat(strategyData.order_price || '0');
      const quantity = parseFloat(strategyData.order_contracts || strategyData.volume || '0');
      const isValidationMode = strategyData.validate === "true";

      const alert: PineScriptAlert = {
        strategyId,
        action: action as 'BUY' | 'SELL' | 'CLOSE',
        symbol,
        price,
        quantity,
        timestamp: new Date(),
        alertData: {
          ...alertData,
          isValidationMode,
          passphrase: alertData.passphrase
        }
      };

      // Store alert in history
      this.alertHistory.push(alert);
      
      // Keep only last 1000 alerts
      if (this.alertHistory.length > 1000) {
        this.alertHistory.shift();
      }

      const modeText = isValidationMode ? '[VALIDATION MODE - No real trades]' : '[TRADING MODE - Real trades with validation]';
      console.log(`📡 Pine Script Alert received for strategy ${strategyId} ${modeText}:`, alert);

      // Only skip trading when validate: "true" (pure validation mode)
      if (isValidationMode) {
        console.log(`🧪 Validation mode - no real trade executed`);
      } else {
        console.log(`💰 Trading mode - executing trade via Kraken API with validation`);
        
        try {
          const tradeResult = await this.executeKrakenTrade(alert, strategyData);
          console.log(`✅ Trade executed successfully:`, tradeResult);
          
          // Store trade result in alert data
          alert.alertData.tradeResult = tradeResult;
        } catch (tradeError) {
          console.error(`❌ Trade execution failed:`, tradeError);
          alert.alertData.tradeError = tradeError instanceof Error ? tradeError.message : 'Unknown trade error';
          
          // Don't fail the webhook - log the error and continue
        }
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error(`Error processing alert for strategy ${strategyId}:`, error);
      return false;
    }
  }

  // Toggle validate parameter for testing vs live trading
  toggleLiveTrading(strategyId: string, isLive: boolean): void {
    const config = this.webhookConfigs.get(strategyId);
    if (config && config.payload.strategy) {
      config.payload.strategy.validate = isLive ? "false" : "true";
      config.testMode = !isLive;
      this.notifyListeners();
      console.log(`${strategyId} trading mode: ${isLive ? 'LIVE' : 'TEST'}`);
    }
  }

  // Test Pine Script configuration
  async testStrategy(strategyId: string, testAlert: Record<string, any>): Promise<boolean> {
    const config = this.webhookConfigs.get(strategyId);
    if (!config) {
      throw new Error(`No webhook config found for strategy ${strategyId}`);
    }

    // Ensure test mode is enabled for testing
    const wasTestMode = config.testMode;
    const wasValidate = config.payload.strategy.validate;
    config.testMode = true;
    config.payload.strategy.validate = "true"; // Force validation mode for testing

    try {
      // Create test payload in the expected format
      const testPayload = {
        passphrase: "sdfqoei1898498",
        ticker: testAlert.symbol || "BTCUSD",
        strategy: {
          order_action: testAlert.action?.toLowerCase() || "buy",
          order_type: "limit",
          order_price: testAlert.price || "50000",
          order_contracts: testAlert.quantity || "0.01",
          type: testAlert.action?.toLowerCase() || "buy",
          volume: testAlert.quantity || "0.01",
          pair: testAlert.symbol || "BTCUSD",
          validate: "true", // Always true for testing
          close: {
            order_type: "limit",
            price: testAlert.price || "50000"
          },
          stop_loss: (parseFloat(testAlert.price || "50000") * 0.99).toString()
        }
      };

      const result = await this.processAlert(strategyId, testPayload);
      console.log(`✅ Test successful for strategy ${strategyId}`, testPayload);
      return result;
    } catch (error) {
      console.error(`❌ Test failed for strategy ${strategyId}:`, error);
      return false;
    } finally {
      // Restore original settings
      config.testMode = wasTestMode;
      config.payload.strategy.validate = wasValidate;
    }
  }

  // Get webhook configuration for a strategy
  getWebhookConfig(strategyId: string): WebhookConfig | undefined {
    return this.webhookConfigs.get(strategyId);
  }

  // Get alert history for a strategy
  getAlertHistory(strategyId?: string): PineScriptAlert[] {
    if (strategyId) {
      return this.alertHistory.filter(alert => alert.strategyId === strategyId);
    }
    return [...this.alertHistory];
  }

  // Enable/disable webhook for a strategy
  toggleWebhook(strategyId: string, active: boolean): void {
    const config = this.webhookConfigs.get(strategyId);
    if (config) {
      config.active = active;
      this.notifyListeners();
    }
  }

  // Enable/disable test mode for a strategy
  toggleTestMode(strategyId: string, testMode: boolean): void {
    const config = this.webhookConfigs.get(strategyId);
    if (config) {
      config.testMode = testMode;
      this.notifyListeners();
    }
  }

  // Update webhook payload for a strategy
  updateWebhookPayload(strategyId: string, payload: Record<string, any>): void {
    const config = this.webhookConfigs.get(strategyId);
    if (config) {
      config.payload = { ...config.payload, ...payload };
      this.notifyListeners();
    }
  }

  // Configure advanced trading parameters for a strategy
  configureTradingParameters(strategyId: string, params: {
    orderType?: 'market' | 'limit';
    leverage?: string;
    stopLossPercent?: number;
    takeProfitPercent?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
  }): void {
    const config = this.webhookConfigs.get(strategyId);
    if (config && config.payload.strategy) {
      if (params.orderType) {
        config.payload.strategy.order_type = params.orderType;
        config.payload.strategy.close.order_type = params.orderType;
      }
      
      if (params.leverage) {
        config.payload.strategy.leverage = params.leverage;
      }
      
      if (params.stopLossPercent) {
        const percent = params.stopLossPercent / 100;
        config.payload.strategy.stop_loss = `{{strategy.order.price - strategy.position.avg_price * ${percent}}}`;
      }
      
      if (params.takeProfitPercent) {
        const percent = params.takeProfitPercent / 100;
        config.payload.strategy.take_profit = `{{strategy.order.price + strategy.position.avg_price * ${percent}}}`;
      }
      
      if (params.timeInForce) {
        config.payload.strategy.time_in_force = params.timeInForce;
      }
      
      this.notifyListeners();
      console.log(`⚙️ Updated trading parameters for strategy ${strategyId}:`, params);
    }
  }

  // Get all webhook configurations
  getAllWebhookConfigs(): WebhookConfig[] {
    return Array.from(this.webhookConfigs.values());
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private async executeKrakenTrade(alert: PineScriptAlert, strategyData: any): Promise<any> {
    if (!krakenApiService.getConnectionStatus()) {
      throw new Error('Kraken API not authenticated - cannot execute trade');
    }

    // Convert Pine Script symbol to Kraken pair format
    const krakenPair = this.convertToKrakenPair(alert.symbol);
    
    // Determine order parameters based on alert
    let orderType: 'buy' | 'sell';
    let orderTypeDetails: 'market' | 'limit' = 'market'; // Default to market orders for faster execution
    
    switch (alert.action) {
      case 'BUY':
        orderType = 'buy';
        break;
      case 'SELL':
        orderType = 'sell';
        break;
      case 'CLOSE':
        // For CLOSE, we need to determine if we're closing a long or short position
        // For now, assume we're closing by selling (most common case)
        orderType = 'sell';
        break;
      default:
        throw new Error(`Unknown action: ${alert.action}`);
    }

    // Use limit order if price is specified and order type is set to limit
    if (strategyData.order_type === 'limit' && alert.price > 0) {
      orderTypeDetails = 'limit';
    }

    // Get account balance for risk assessment
    let accountBalance: number | undefined;
    try {
      const accountInfo = await krakenApiService.getAccountBalance();
      const usdBalance = parseFloat(accountInfo.result?.ZUSD || '0');
      accountBalance = usdBalance;
    } catch (error) {
      console.warn('Could not fetch account balance for risk assessment:', error);
    }

    // Validate trade with risk manager
    const validation = await riskManager.validateTrade({
      pair: krakenPair,
      type: orderType,
      volume: alert.quantity.toString(),
      price: alert.price,
      accountBalance
    });

    if (!validation.isValid) {
      throw new Error(`Trade rejected by risk manager: ${validation.reason}`);
    }

    // Use adjusted volume if provided by risk manager
    const finalVolume = validation.adjustedVolume || alert.quantity.toString();
    
    if (validation.reason) {
      console.log(`⚠️ Risk Manager adjustment: ${validation.reason}`);
    }

    const orderParams = {
      pair: krakenPair,
      type: orderType,
      ordertype: orderTypeDetails,
      volume: finalVolume,
      price: orderTypeDetails === 'limit' ? alert.price.toString() : undefined,
      validate: true // Use validation mode for testing - set to false only for real live trading
    };

    console.log(`🚀 Executing Kraken trade:`, orderParams);
    
    const result = await krakenApiService.placeOrder(orderParams);
    
    // Record successful trade with risk manager
    if (result && !result.error) {
      riskManager.recordTrade(krakenPair, parseFloat(finalVolume), alert.price);
    }
    
    return result;
  }

  private convertToKrakenPair(symbol: string): string {
    // Convert common Pine Script symbols to Kraken pair format
    const symbolMap: Record<string, string> = {
      'BTCUSD': 'XBTUSD',
      'ETHUSD': 'ETHUSD',
      'XRPUSD': 'XRPUSD',
      'LTCUSD': 'LTCUSD',
      'ADAUSD': 'ADAUSD',
      'SOLUSD': 'SOLUSD',
      'DOTUSD': 'DOTUSD',
      'AVAXUSD': 'AVAXUSD',
      'MATICUSD': 'MATICUSD',
      'LINKUSD': 'LINKUSD',
      'ATOMUSD': 'ATOMUSD',
      'ALGOUSD': 'ALGOUSD',
      'UNIUSD': 'UNIUSD'
    };

    // Return mapped symbol or use original if not found
    return symbolMap[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default PineScriptManager;
export type { PineScriptAlert, WebhookConfig };