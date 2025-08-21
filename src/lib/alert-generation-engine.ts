import { Strategy } from './strategy-manager';
import marketDataService, { MarketData } from './market-data-service';
import { alpacaStratusIntegration } from './alpaca-stratus-integration';
import { telegramBotService, sendAlertNotification, sendTradeNotification } from './telegram-bot-service';

interface AlertConfig {
  strategyId: string;
  variables: Record<string, any>;
  webhookUrl: string;
  active: boolean;
  performanceTracking: {
    totalAlerts: number;
    successfulTrades: number;
    failedTrades: number;
    avgReturn: number;
    lastOptimization: Date;
  };
}

interface GeneratedAlert {
  id: string;
  strategyId: string;
  timestamp: Date;
  action: 'BUY' | 'SELL' | 'CLOSE';
  symbol: string;
  price: number;
  quantity: number;
  confidence: number;
  variables: Record<string, any>;
  reason: string;
  executionStatus: 'pending' | 'sent' | 'executed' | 'failed';
}

interface VariableChange {
  strategyId: string;
  variableName: string;
  oldValue: any;
  newValue: any;
  reason: string;
  timestamp: Date;
  performanceBeforeChange: number;
  performanceAfterChange?: number;
  isImprovement?: boolean;
}

class AlertGenerationEngine {
  private static instance: AlertGenerationEngine;
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private generatedAlerts: GeneratedAlert[] = [];
  private variableChanges: VariableChange[] = [];
  private isRunning = false;
  private listeners: Set<() => void> = new Set();
  private marketDataSubscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): AlertGenerationEngine {
    if (!AlertGenerationEngine.instance) {
      AlertGenerationEngine.instance = new AlertGenerationEngine();
    }
    return AlertGenerationEngine.instance;
  }

  // Initialize alert generation for a strategy
  initializeStrategy(strategy: Strategy, symbol: string = 'BTCUSD'): void {
    const webhookUrl = strategy.pineScript?.webhookUrl || 'https://kraken.circuitcartel.com/webhook';
    
    const alertConfig: AlertConfig = {
      strategyId: strategy.id,
      variables: { ...strategy.config },
      webhookUrl,
      active: true,
      performanceTracking: {
        totalAlerts: 0,
        successfulTrades: 0,
        failedTrades: 0,
        avgReturn: 0,
        lastOptimization: new Date()
      }
    };

    this.alertConfigs.set(strategy.id, alertConfig);

    // Subscribe to market data for this symbol
    if (!this.marketDataSubscriptions.has(symbol)) {
      const unsubscribe = marketDataService.subscribe(symbol, (marketData) => {
        this.processMarketDataForAlerts(marketData);
      });
      this.marketDataSubscriptions.set(symbol, unsubscribe);
    }

    console.log(`🚨 Alert Generation: Initialized for strategy ${strategy.name} (${strategy.id})`);
    this.notifyListeners();
  }

  // Start the alert generation engine
  startEngine(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 Alert Generation Engine started');
    this.notifyListeners();
  }

  stopEngine(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    // Unsubscribe from all market data
    for (const [symbol, unsubscribe] of this.marketDataSubscriptions) {
      unsubscribe();
    }
    this.marketDataSubscriptions.clear();
    
    console.log('⏹️ Alert Generation Engine stopped');
    this.notifyListeners();
  }

  // Process market data and generate alerts
  private async processMarketDataForAlerts(marketData: MarketData): Promise<void> {
    if (!this.isRunning) return;

    for (const [strategyId, config] of this.alertConfigs) {
      if (!config.active) continue;

      // Get strategy from StrategyManager
      const StrategyManager = (await import('./strategy-manager')).default;
      const strategyManager = StrategyManager.getInstance();
      const strategy = strategyManager.getStrategy(strategyId);

      if (!strategy) continue;

      // Check if conditions are met for alert generation
      const alertDecision = await this.evaluateStrategyConditions(
        strategy, 
        config, 
        marketData
      );

      if (alertDecision.shouldAlert) {
        await this.generateAlert(strategy, config, marketData, alertDecision);
      }
    }
  }

  // Evaluate strategy conditions using current variables
  private async evaluateStrategyConditions(
    strategy: Strategy, 
    config: AlertConfig, 
    marketData: MarketData
  ): Promise<{
    shouldAlert: boolean;
    action?: 'BUY' | 'SELL' | 'CLOSE';
    confidence?: number;
    reason?: string;
  }> {
    // For demonstration, using RSI-based logic
    // In production, this would be pluggable strategy evaluation
    
    if (strategy.type === 'RSI_PULLBACK') {
      // Use current variable values from config
      const rsiPeriod = config.variables.rsiPeriod || 14;
      const oversoldLevel = config.variables.oversoldLevel || 30;
      const overboughtLevel = config.variables.overboughtLevel || 70;
      const confirmationPeriod = config.variables.confirmationPeriod || 3;

      // Calculate RSI using real market data
      const currentRSI = this.calculateRSI(marketData.price, rsiPeriod);
      const isOversold = currentRSI <= oversoldLevel;
      const isOverbought = currentRSI >= overboughtLevel;

      if (isOversold) {
        return {
          shouldAlert: true,
          action: 'BUY',
          confidence: Math.min(95, (oversoldLevel - currentRSI) * 2 + 60),
          reason: `RSI oversold: ${currentRSI.toFixed(1)} <= ${oversoldLevel}`
        };
      }

      if (isOverbought) {
        return {
          shouldAlert: true,
          action: 'SELL',
          confidence: Math.min(95, (currentRSI - overboughtLevel) * 2 + 60),
          reason: `RSI overbought: ${currentRSI.toFixed(1)} >= ${overboughtLevel}`
        };
      }
    }

    return { shouldAlert: false };
  }

  // Generate and send alert
  private async generateAlert(
    strategy: Strategy,
    config: AlertConfig,
    marketData: MarketData,
    alertDecision: any
  ): Promise<void> {
    const alert: GeneratedAlert = {
      id: this.generateAlertId(),
      strategyId: strategy.id,
      timestamp: new Date(),
      action: alertDecision.action,
      symbol: marketData.symbol,
      price: marketData.price,
      quantity: this.calculateQuantity(strategy, config),
      confidence: alertDecision.confidence,
      variables: { ...config.variables },
      reason: alertDecision.reason,
      executionStatus: 'pending'
    };

    // Store alert
    this.generatedAlerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.generatedAlerts.length > 1000) {
      this.generatedAlerts.shift();
    }

    // Update performance tracking
    config.performanceTracking.totalAlerts++;

    console.log(`🚨 Generated Alert: ${alert.action} ${alert.symbol} at ${alert.price} (${alert.confidence}% confidence)`);

    // Send Telegram notification for alert generation
    sendAlertNotification(
      strategy.name,
      alert.symbol,
      alert.action,
      alert.price,
      alert.quantity,
      alert.confidence || 0
    );

    // Send to Alpaca paper trading directly instead of webhook
    await this.executePaperTrade(alert, config);

    this.notifyListeners();
  }

  // Execute paper trade directly via Alpaca API (replaces webhook for paper trading)
  private async executePaperTrade(alert: GeneratedAlert, config: AlertConfig): Promise<void> {
    try {
      console.log(`📈 Executing paper trade for alert: ${alert.action} ${alert.symbol}`);
      
      // Convert alert to webhook-like payload format
      const webhookPayload = {
        strategy_id: alert.strategyId,
        action: alert.action,
        ticker: alert.symbol,
        symbol: alert.symbol,
        price: alert.price,
        quantity: alert.quantity,
        confidence: alert.confidence,
        variables: alert.variables,
        reason: alert.reason,
        timestamp: alert.timestamp.toISOString(),
        alert_id: alert.id,
        // Add strategy parameters expected by Alpaca integration
        strategy: {
          order_action: alert.action.toLowerCase(),
          order_type: 'market',
          order_price: alert.price.toString(),
          order_contracts: alert.quantity.toString(),
          type: alert.action.toLowerCase(),
          volume: alert.quantity.toString(),
          pair: alert.symbol,
          validate: 'false'
        }
      };

      // Execute trade via Alpaca-Stratus integration
      const execution = await alpacaStratusIntegration.processWebhookTrade(webhookPayload);
      
      if (execution) {
        alert.executionStatus = 'executed';
        config.performanceTracking.successfulTrades++;
        console.log(`✅ Paper trade executed successfully: ${execution.alpacaOrderId}`);
        
        // Send Telegram notification for successful trade execution
        sendTradeNotification(
          execution.strategyId,
          execution.symbol,
          execution.action,
          execution.price,
          execution.quantity,
          execution.aiDecision?.confidence,
          undefined // P&L will be calculated later
        );
      } else {
        alert.executionStatus = 'failed';
        config.performanceTracking.failedTrades++;
        console.log(`❌ Paper trade execution failed for ${alert.symbol}`);
      }

    } catch (error) {
      alert.executionStatus = 'failed';
      config.performanceTracking.failedTrades++;
      console.error(`❌ Paper trade execution error for ${alert.symbol}:`, error);
    }
  }

  // Send alert to configured webhook (kept for real trading)
  private async sendAlertToWebhook(alert: GeneratedAlert, config: AlertConfig): Promise<void> {
    try {
      const payload = {
        strategy_id: alert.strategyId,
        action: alert.action,
        symbol: alert.symbol,
        price: alert.price,
        quantity: alert.quantity,
        confidence: alert.confidence,
        variables: alert.variables,
        reason: alert.reason,
        timestamp: alert.timestamp.toISOString(),
        alert_id: alert.id
      };

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert.executionStatus = 'sent';
        console.log(`✅ Alert ${alert.id} sent successfully to ${config.webhookUrl}`);
      } else {
        alert.executionStatus = 'failed';
        console.error(`❌ Failed to send alert ${alert.id}:`, response.statusText);
      }
    } catch (error) {
      alert.executionStatus = 'failed';
      console.error(`❌ Error sending alert ${alert.id}:`, error);
    }
  }

  // Update strategy variables and log changes
  updateStrategyVariables(
    strategyId: string, 
    variableUpdates: Record<string, any>,
    reason: string = 'Manual update'
  ): void {
    const config = this.alertConfigs.get(strategyId);
    if (!config) {
      console.warn(`No alert config found for strategy ${strategyId}`);
      return;
    }

    const currentPerformance = config.performanceTracking.avgReturn;

    // Log each variable change
    for (const [variableName, newValue] of Object.entries(variableUpdates)) {
      const oldValue = config.variables[variableName];
      
      if (oldValue !== newValue) {
        const change: VariableChange = {
          strategyId,
          variableName,
          oldValue,
          newValue,
          reason,
          timestamp: new Date(),
          performanceBeforeChange: currentPerformance
        };

        this.variableChanges.push(change);
        
        // Keep only last 500 changes
        if (this.variableChanges.length > 500) {
          this.variableChanges.shift();
        }

        console.log(`📊 Variable Change: ${strategyId}.${variableName}: ${oldValue} → ${newValue} (${reason})`);
      }
    }

    // Update the variables
    config.variables = { ...config.variables, ...variableUpdates };
    this.notifyListeners();
  }

  // Analyze variable change effectiveness
  async analyzeVariableEffectiveness(strategyId: string): Promise<{
    improvements: VariableChange[];
    degradations: VariableChange[];
    recommendations: string[];
  }> {
    const strategyChanges = this.variableChanges.filter(c => c.strategyId === strategyId);
    const improvements: VariableChange[] = [];
    const degradations: VariableChange[] = [];
    const recommendations: string[] = [];

    // Analyze recent changes
    for (const change of strategyChanges.slice(-20)) { // Last 20 changes
      if (change.performanceAfterChange !== undefined) {
        const performanceDiff = change.performanceAfterChange - change.performanceBeforeChange;
        
        if (performanceDiff > 0.01) { // 1% improvement threshold
          change.isImprovement = true;
          improvements.push(change);
        } else if (performanceDiff < -0.01) { // 1% degradation threshold
          change.isImprovement = false;
          degradations.push(change);
        }
      }
    }

    // Generate recommendations
    if (improvements.length > 0) {
      recommendations.push(`Recent successful variable changes: ${improvements.length} improvements found`);
    }
    
    if (degradations.length > 0) {
      recommendations.push(`Warning: ${degradations.length} variable changes reduced performance`);
    }

    return { improvements, degradations, recommendations };
  }

  // Get alert statistics
  getAlertStats(strategyId?: string): {
    totalAlerts: number;
    pendingAlerts: number;
    sentAlerts: number;
    failedAlerts: number;
    avgConfidence: number;
    recentAlerts: GeneratedAlert[];
  } {
    let alerts = this.generatedAlerts;
    if (strategyId) {
      alerts = alerts.filter(a => a.strategyId === strategyId);
    }

    const totalAlerts = alerts.length;
    const pendingAlerts = alerts.filter(a => a.executionStatus === 'pending').length;
    const sentAlerts = alerts.filter(a => a.executionStatus === 'sent').length;
    const failedAlerts = alerts.filter(a => a.executionStatus === 'failed').length;
    const avgConfidence = alerts.length > 0 
      ? alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length 
      : 0;

    return {
      totalAlerts,
      pendingAlerts,
      sentAlerts,
      failedAlerts,
      avgConfidence,
      recentAlerts: alerts.slice(-10) // Last 10 alerts
    };
  }

  // Get variable change history
  getVariableChangeHistory(strategyId?: string): VariableChange[] {
    let changes = this.variableChanges;
    if (strategyId) {
      changes = changes.filter(c => c.strategyId === strategyId);
    }
    return changes.slice(-50); // Last 50 changes
  }

  // Helper methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private calculateQuantity(strategy: Strategy, config: AlertConfig): number {
    // Simple position sizing logic - can be enhanced
    const baseQuantity = 0.01;
    const riskFactor = config.variables.riskLevel || 1;
    return baseQuantity * riskFactor;
  }

  private calculateRSI(currentPrice: number, period: number = 14): number {
    // Real RSI calculation - requires historical price data
    // For now, return a neutral RSI value since we need historical data for proper RSI
    // In production, this would use the market data service to get price history
    console.warn('⚠️ RSI calculation requires historical price data - using neutral value');
    return 50; // Neutral RSI value - neither overbought nor oversold
  }

  // Get all alert configurations
  getAlertConfigs(): AlertConfig[] {
    return Array.from(this.alertConfigs.values());
  }

  // Enable/disable alert generation for a strategy
  toggleStrategy(strategyId: string, active: boolean): void {
    const config = this.alertConfigs.get(strategyId);
    if (config) {
      config.active = active;
      console.log(`🔄 Alert generation ${active ? 'enabled' : 'disabled'} for strategy ${strategyId}`);
      this.notifyListeners();
    }
  }

  // Engine status
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default AlertGenerationEngine;
export type { AlertConfig, GeneratedAlert, VariableChange };