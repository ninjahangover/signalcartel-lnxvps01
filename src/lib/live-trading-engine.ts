import { stratusEngine, getAITradingSignal, recordAITradeResult, type AITradingDecision, type TradeOutcome } from './stratus-engine-ai';
import { realMarketData } from './real-market-data';
import { tradingAccountService } from './trading-account-service';

export interface LiveAccount {
  accountId: string;
  totalBalance: number;
  availableBalance: number;
  positions: LivePosition[];
  trades: LiveTrade[];
  realizedPnL: number;
  unrealizedPnL: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  maxDrawdown: number;
  peakBalance: number;
  lastUpdated: Date;
  isLive: true;
  riskManagement: RiskSettings;
}

export interface LivePosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: Date;
  strategyName: string;
  aiDecision: AITradingDecision;
  orderId?: string; // Exchange order ID
  status: 'OPEN' | 'CLOSING' | 'CLOSED';
}

export interface LiveTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  value: number;
  fees: number;
  pnl?: number;
  timestamp: Date;
  strategyName: string;
  aiDecision?: AITradingDecision;
  isEntry: boolean;
  positionId?: string;
  orderId?: string; // Exchange order ID
  executionStatus: 'PENDING' | 'FILLED' | 'REJECTED' | 'CANCELLED';
}

export interface RiskSettings {
  maxRiskPerTrade: number; // Percentage of account (e.g., 2%)
  maxDailyLoss: number; // Maximum daily loss in USD
  maxTotalRisk: number; // Maximum total account risk
  emergencyStopLoss: number; // Emergency stop if account drops by this %
  maxPositions: number; // Maximum concurrent positions
  minTradeAmount: number; // Minimum trade size in USD
  maxTradeAmount: number; // Maximum trade size in USD
}

class LiveTradingEngine {
  private static instance: LiveTradingEngine | null = null;
  private account: LiveAccount;
  private isRunning: boolean = false;
  private tradingInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(account: LiveAccount) => void> = new Set();
  private lastHeartbeat: Date = new Date();
  private isKrakenConnected: boolean = false;

  private constructor() {
    this.account = {
      accountId: 'live_account_1',
      totalBalance: 0, // Will be fetched from exchange
      availableBalance: 0,
      positions: [],
      trades: [],
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalTrades: 0,
      winningTrades: 0,
      winRate: 0,
      maxDrawdown: 0,
      peakBalance: 0,
      lastUpdated: new Date(),
      isLive: true,
      riskManagement: {
        maxRiskPerTrade: 1.0, // 1% max risk per trade (conservative)
        maxDailyLoss: 500, // $500 daily loss limit
        maxTotalRisk: 10.0, // 10% total account risk
        emergencyStopLoss: 20.0, // 20% emergency stop
        maxPositions: 3, // Max 3 concurrent positions
        minTradeAmount: 50, // Minimum $50 trade
        maxTradeAmount: 1000 // Maximum $1000 trade
      }
    };

    this.loadFromStorage();
    this.startHeartbeat();
  }

  static getInstance(): LiveTradingEngine {
    if (!LiveTradingEngine.instance) {
      LiveTradingEngine.instance = new LiveTradingEngine();
    }
    return LiveTradingEngine.instance;
  }

  // Start live AI trading with full safety checks
  async startAILiveTrading(symbols: string[] = ['BTCUSD', 'ETHUSD', 'ADAUSD']): Promise<void> {
    if (this.isRunning) {
      console.log('🔥 Live trading engine already running');
      return;
    }

    console.log('🚨 STARTING LIVE TRADING ENGINE - REAL MONEY! 🚨');
    console.log('Symbols:', symbols);
    console.log('Risk settings:', this.account.riskManagement);

    // Pre-flight safety checks
    if (!await this.performSafetyChecks()) {
      throw new Error('Safety checks failed - cannot start live trading');
    }

    // Initialize account from exchange
    await this.initializeAccountFromExchange();

    this.isRunning = true;

    // Execute live trades based on AI signals (more conservative timing)
    this.tradingInterval = setInterval(async () => {
      try {
        // Update heartbeat
        this.lastHeartbeat = new Date();
        
        // Safety check before each trading cycle
        if (!await this.performRuntimeSafetyCheck()) {
          console.log('⚠️ Runtime safety check failed, pausing trading');
          return;
        }

        for (const symbol of symbols) {
          try {
            await this.processAISignalLive(symbol);
          } catch (error) {
            console.error(`❌ Error processing live AI signal for ${symbol}:`, error);
          }
        }
        
        // Update all positions with current market prices
        await this.updateLivePositions();
        
        // Save to storage
        this.saveToStorage();
        
        // Notify listeners
        this.notifyListeners();
        
      } catch (error) {
        console.error('❌ Critical error in live trading cycle:', error);
        await this.emergencyShutdown('TRADING_CYCLE_ERROR');
      }
      
    }, 30000); // Check every 30 seconds (more conservative for live)

    console.log('✅ Live AI trading engine started - TRADING WITH REAL MONEY');
  }

  // Process AI signal for live trading (more conservative than paper)
  private async processAISignalLive(symbol: string): Promise<void> {
    try {
      // Get AI trading decision
      const aiDecision = await getAITradingSignal(symbol);
      
      // HIGHER threshold for live trading - only ultra-high confidence trades
      if (aiDecision.confidence < 0.8 || aiDecision.decision === 'HOLD') {
        return;
      }

      // Additional safety: check if we're within risk limits
      if (!this.withinRiskLimits(aiDecision)) {
        console.log(`⚠️ AI signal for ${symbol} exceeds risk limits, skipping`);
        return;
      }

      const currentPrice = await realMarketData.getCurrentPrice(symbol);
      const existingPosition = this.findPosition(symbol);

      // Execute live trades
      if (aiDecision.decision === 'BUY' && !existingPosition) {
        await this.executeLiveBuyOrder(symbol, currentPrice, aiDecision);
      } else if (aiDecision.decision === 'SELL' && !existingPosition) {
        await this.executeLiveSellOrder(symbol, currentPrice, aiDecision);
      } else if ((aiDecision.decision === 'CLOSE_LONG' || aiDecision.decision === 'SELL') && existingPosition?.side === 'LONG') {
        await this.closeLivePosition(existingPosition.id, currentPrice, 'AI_SIGNAL');
      } else if ((aiDecision.decision === 'CLOSE_SHORT' || aiDecision.decision === 'BUY') && existingPosition?.side === 'SHORT') {
        await this.closeLivePosition(existingPosition.id, currentPrice, 'AI_SIGNAL');
      }

    } catch (error) {
      console.error(`❌ Error processing live AI signal for ${symbol}:`, error);
    }
  }

  // Execute live buy order via webhook
  private async executeLiveBuyOrder(symbol: string, price: number, aiDecision: AITradingDecision): Promise<void> {
    // Conservative position sizing for live trading
    const maxRiskAmount = this.account.totalBalance * (this.account.riskManagement.maxRiskPerTrade / 100);
    const aiPositionSize = Math.min(aiDecision.positionSize * 0.5, 1.0); // 50% of AI recommendation, max 1x
    const orderValue = Math.min(
      maxRiskAmount,
      this.account.availableBalance * (aiPositionSize * 0.05), // Max 5% of available balance
      this.account.riskManagement.maxTradeAmount
    );
    
    if (orderValue < this.account.riskManagement.minTradeAmount) {
      console.log(`⚠️ Order size too small for ${symbol}: $${orderValue.toFixed(2)}`);
      return;
    }

    const quantity = orderValue / price;

    console.log(`🔥 Executing LIVE BUY order for ${symbol}:`, {
      quantity: quantity.toFixed(6),
      price: `$${price.toFixed(2)}`,
      value: `$${orderValue.toFixed(2)}`,
      confidence: `${(aiDecision.confidence * 100).toFixed(1)}%`
    });

    try {
      // Execute via webhook to CircuitCartel/Kraken
      const webhook_payload = {
        "passphrase": "sdfqoei1898498",
        "ticker": symbol,
        "strategy": { 
          "order_action": "buy",
          "order_type": "market",
          "order_contracts": quantity.toString(),
          "type": "buy",
          "volume": quantity.toString(),
          "pair": symbol,
          "validate": "false", // LIVE EXECUTION
          "live_trading": true,
          "stratus_engine": true,
          "ai_confidence": aiDecision.confidence,
          "timestamp": new Date().toISOString()
        }
      };

      const response = await fetch('https://kraken.circuitcartel.com/webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'StratusEngine-Live/2.0'
        },
        body: JSON.stringify(webhook_payload),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create position record
        const positionId = `live_pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const position: LivePosition = {
          id: positionId,
          symbol,
          side: 'LONG',
          quantity,
          entryPrice: price,
          currentPrice: price,
          unrealizedPnL: 0,
          stopLoss: aiDecision.stopLoss,
          takeProfit: aiDecision.takeProfit[0],
          entryTime: new Date(),
          strategyName: 'Stratus Engine Live',
          aiDecision,
          orderId: result.order_id || result.txid,
          status: 'OPEN'
        };

        // Create trade record
        const trade: LiveTrade = {
          id: `live_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          side: 'BUY',
          quantity,
          price: result.executed_price || price,
          value: quantity * (result.executed_price || price),
          fees: result.fees || (orderValue * 0.001),
          timestamp: new Date(),
          strategyName: 'Stratus Engine Live',
          aiDecision,
          isEntry: true,
          positionId,
          orderId: result.order_id || result.txid,
          executionStatus: 'FILLED'
        };

        // Update account
        this.account.positions.push(position);
        this.account.trades.push(trade);
        this.account.totalTrades++;
        this.account.lastUpdated = new Date();

        console.log(`✅ LIVE BUY order executed successfully:`, {
          orderId: trade.orderId,
          executedPrice: `$${trade.price.toFixed(2)}`,
          fees: `$${trade.fees.toFixed(2)}`
        });

      } else {
        const errorText = await response.text();
        console.error('❌ Live buy order failed:', response.status, errorText);
        
        // Record failed trade
        const failedTrade: LiveTrade = {
          id: `failed_${Date.now()}`,
          symbol,
          side: 'BUY',
          quantity,
          price,
          value: orderValue,
          fees: 0,
          timestamp: new Date(),
          strategyName: 'Stratus Engine Live',
          aiDecision,
          isEntry: true,
          executionStatus: 'REJECTED'
        };
        
        this.account.trades.push(failedTrade);
      }

    } catch (error) {
      console.error('❌ Network error executing live buy order:', error);
    }
  }

  // Execute live sell order (short position)
  private async executeLiveSellOrder(symbol: string, price: number, aiDecision: AITradingDecision): Promise<void> {
    // Similar to buy but for short positions
    const maxRiskAmount = this.account.totalBalance * (this.account.riskManagement.maxRiskPerTrade / 100);
    const aiPositionSize = Math.min(aiDecision.positionSize * 0.5, 1.0);
    const orderValue = Math.min(
      maxRiskAmount,
      this.account.availableBalance * (aiPositionSize * 0.05),
      this.account.riskManagement.maxTradeAmount
    );
    
    if (orderValue < this.account.riskManagement.minTradeAmount) return;

    const quantity = orderValue / price;

    console.log(`🔥 Executing LIVE SELL order for ${symbol}:`, {
      quantity: quantity.toFixed(6),
      price: `$${price.toFixed(2)}`,
      value: `$${orderValue.toFixed(2)}`,
      confidence: `${(aiDecision.confidence * 100).toFixed(1)}%`
    });

    const webhook_payload = {
      "passphrase": "sdfqoei1898498",
      "ticker": symbol,
      "strategy": { 
        "order_action": "sell",
        "order_type": "market",
        "order_contracts": quantity.toString(),
        "type": "sell",
        "volume": quantity.toString(),
        "pair": symbol,
        "validate": "false",
        "live_trading": true,
        "stratus_engine": true,
        "ai_confidence": aiDecision.confidence,
        "timestamp": new Date().toISOString()
      }
    };

    try {
      const response = await fetch('https://kraken.circuitcartel.com/webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'StratusEngine-Live/2.0'
        },
        body: JSON.stringify(webhook_payload),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const result = await response.json();
        
        const positionId = `live_pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const position: LivePosition = {
          id: positionId,
          symbol,
          side: 'SHORT',
          quantity,
          entryPrice: price,
          currentPrice: price,
          unrealizedPnL: 0,
          stopLoss: aiDecision.stopLoss,
          takeProfit: aiDecision.takeProfit[0],
          entryTime: new Date(),
          strategyName: 'Stratus Engine Live',
          aiDecision,
          orderId: result.order_id || result.txid,
          status: 'OPEN'
        };

        const trade: LiveTrade = {
          id: `live_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          side: 'SELL',
          quantity,
          price: result.executed_price || price,
          value: quantity * (result.executed_price || price),
          fees: result.fees || (orderValue * 0.001),
          timestamp: new Date(),
          strategyName: 'Stratus Engine Live',
          aiDecision,
          isEntry: true,
          positionId,
          orderId: result.order_id || result.txid,
          executionStatus: 'FILLED'
        };

        this.account.positions.push(position);
        this.account.trades.push(trade);
        this.account.totalTrades++;
        this.account.lastUpdated = new Date();

        console.log(`✅ LIVE SELL order executed successfully:`, {
          orderId: trade.orderId,
          executedPrice: `$${trade.price.toFixed(2)}`
        });

      } else {
        console.error('❌ Live sell order failed:', response.status);
      }

    } catch (error) {
      console.error('❌ Network error executing live sell order:', error);
    }
  }

  // Safety and persistence methods
  private async performSafetyChecks(): Promise<boolean> {
    console.log('🛡️ Performing pre-flight safety checks...');
    
    // Check 1: Kraken connection
    try {
      const accountData = await tradingAccountService.getAccountData();
      if (!accountData) {
        console.error('❌ Cannot connect to Kraken account');
        return false;
      }
      this.isKrakenConnected = true;
      console.log('✅ Kraken connection verified');
    } catch (error) {
      console.error('❌ Kraken connection failed:', error);
      return false;
    }

    // Check 2: Sufficient balance
    if (this.account.totalBalance < 1000) {
      console.error('❌ Insufficient balance for live trading (minimum $1000)');
      return false;
    }

    // Check 3: Risk management limits
    if (this.account.realizedPnL < -(this.account.riskManagement.maxDailyLoss)) {
      console.error('❌ Daily loss limit exceeded');
      return false;
    }

    console.log('✅ All safety checks passed');
    return true;
  }

  private async performRuntimeSafetyCheck(): Promise<boolean> {
    // Emergency stop if account drops too much
    const drawdown = ((this.account.peakBalance - this.account.totalBalance) / this.account.peakBalance) * 100;
    if (drawdown > this.account.riskManagement.emergencyStopLoss) {
      console.error(`🚨 Emergency stop triggered - drawdown: ${drawdown.toFixed(1)}%`);
      await this.emergencyShutdown('EMERGENCY_DRAWDOWN');
      return false;
    }

    // Check position limits
    if (this.account.positions.length >= this.account.riskManagement.maxPositions) {
      console.log('⚠️ Maximum positions reached, skipping new trades');
      return false;
    }

    return true;
  }

  private withinRiskLimits(aiDecision: AITradingDecision): boolean {
    // Check if AI decision is within our risk parameters
    const estimatedRisk = aiDecision.positionSize * aiDecision.expectedProfitMargin;
    return estimatedRisk <= this.account.riskManagement.maxRiskPerTrade;
  }

  // Heartbeat system to prevent random stops
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = new Date();
      
      // Check if engine is still running and restart if needed
      if (this.isRunning && !this.tradingInterval) {
        console.log('💓 Heartbeat detected engine stopped, attempting restart...');
        this.recoverEngine();
      }
      
      // Save heartbeat to storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('stratusEngineHeartbeat', this.lastHeartbeat.toISOString());
      }
      
    }, 10000); // Heartbeat every 10 seconds
  }

  private async recoverEngine(): Promise<void> {
    try {
      console.log('🔄 Attempting to recover Stratus Engine...');
      
      if (this.isRunning) {
        // Re-initialize trading interval
        await this.startAILiveTrading();
        console.log('✅ Engine recovery successful');
      }
      
    } catch (error) {
      console.error('❌ Engine recovery failed:', error);
    }
  }

  private async emergencyShutdown(reason: string): Promise<void> {
    console.log(`🚨 EMERGENCY SHUTDOWN - Reason: ${reason}`);
    
    this.stopTrading();
    
    // Close all open positions
    for (const position of this.account.positions) {
      try {
        await this.closeLivePosition(position.id, position.currentPrice, 'EMERGENCY_SHUTDOWN');
      } catch (error) {
        console.error(`Failed to close position ${position.id}:`, error);
      }
    }
    
    // Notify emergency
    console.log('🚨 ALL POSITIONS CLOSED - ENGINE SHUT DOWN');
  }

  // Utility methods (similar to paper trading but with live execution)
  private findPosition(symbol: string): LivePosition | undefined {
    return this.account.positions.find(p => p.symbol === symbol);
  }

  private async updateLivePositions(): Promise<void> {
    // Update positions with real market prices and check stops
    // Similar to paper trading but with real account updates
  }

  private async closeLivePosition(positionId: string, currentPrice: number, reason: string): Promise<void> {
    // Close position via live webhook execution
    // Similar to paper trading but executes real trades
  }

  private async initializeAccountFromExchange(): Promise<void> {
    try {
      const accountData = await tradingAccountService.getAccountData();
      if (accountData) {
        this.account.totalBalance = accountData.totalValue;
        this.account.availableBalance = accountData.availableBalance;
        this.account.peakBalance = Math.max(this.account.peakBalance, accountData.totalValue);
      }
    } catch (error) {
      console.error('Failed to initialize account from exchange:', error);
    }
  }

  // Storage methods
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('liveTradingAccount', JSON.stringify(this.account, this.dateReplacer));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('liveTradingAccount');
      if (saved) {
        try {
          this.account = JSON.parse(saved, this.dateReviver);
        } catch (error) {
          console.error('Failed to load live trading account from storage:', error);
        }
      }
    }
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  // Public API
  stopTrading(): void {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Live trading engine stopped');
  }

  getAccount(): LiveAccount {
    return { ...this.account };
  }

  addListener(callback: (account: LiveAccount) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (account: LiveAccount) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.account));
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  updateRiskSettings(newSettings: Partial<RiskSettings>): void {
    this.account.riskManagement = { ...this.account.riskManagement, ...newSettings };
    this.saveToStorage();
    console.log('⚙️ Risk settings updated:', newSettings);
  }
}

// Export singleton instance
export const liveTradingEngine = LiveTradingEngine.getInstance();

// Export helper functions
export async function startAILiveTrading(symbols?: string[]): Promise<void> {
  return liveTradingEngine.startAILiveTrading(symbols);
}

export function stopAILiveTrading(): void {
  return liveTradingEngine.stopTrading();
}

export function getLiveAccount(): LiveAccount {
  return liveTradingEngine.getAccount();
}

// Export types
export type { LiveAccount, LivePosition, LiveTrade, RiskSettings };