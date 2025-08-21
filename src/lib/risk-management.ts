interface RiskParams {
  maxOrderValue: number; // Maximum USD value per order
  maxDailyVolume: number; // Maximum USD volume per day
  maxPositionSize: number; // Maximum position size as % of account
  minOrderSize: number; // Minimum order size to prevent dust
  allowedPairs: string[]; // Whitelisted trading pairs
  maxOrdersPerHour: number; // Rate limiting
}

interface TradeValidationResult {
  isValid: boolean;
  reason?: string;
  adjustedVolume?: string;
}

class RiskManager {
  private static instance: RiskManager;
  private dailyVolume: number = 0;
  private orderHistory: { timestamp: number; pair: string; volume: number }[] = [];
  private lastResetDate: string;
  
  private readonly defaultRiskParams: RiskParams = {
    maxOrderValue: 10000, // $10,000 max per order
    maxDailyVolume: 50000, // $50,000 max per day
    maxPositionSize: 0.1, // 10% max position size
    minOrderSize: 10, // $10 minimum order
    allowedPairs: [
      'XBTUSD', 'ETHUSD', 'XRPUSD', 'LTCUSD', 'ADAUSD', 
      'SOLUSD', 'DOTUSD', 'AVAXUSD', 'MATICUSD', 'LINKUSD',
      'ATOMUSD', 'ALGOUSD', 'UNIUSD'
    ],
    maxOrdersPerHour: 20
  };

  private constructor() {
    this.lastResetDate = new Date().toDateString();
  }

  static getInstance(): RiskManager {
    if (!RiskManager.instance) {
      RiskManager.instance = new RiskManager();
    }
    return RiskManager.instance;
  }

  async validateTrade(params: {
    pair: string;
    type: 'buy' | 'sell';
    volume: string;
    price: number;
    accountBalance?: number;
  }): Promise<TradeValidationResult> {
    this.resetDailyCountersIfNeeded();

    const volume = parseFloat(params.volume);
    const orderValue = volume * params.price;

    // Check if pair is allowed
    if (!this.defaultRiskParams.allowedPairs.includes(params.pair)) {
      return {
        isValid: false,
        reason: `Trading pair ${params.pair} is not whitelisted`
      };
    }

    // Check minimum order size
    if (orderValue < this.defaultRiskParams.minOrderSize) {
      return {
        isValid: false,
        reason: `Order value $${orderValue.toFixed(2)} is below minimum $${this.defaultRiskParams.minOrderSize}`
      };
    }

    // Check maximum order value
    if (orderValue > this.defaultRiskParams.maxOrderValue) {
      // Calculate adjusted volume to meet max order value
      const adjustedVolume = (this.defaultRiskParams.maxOrderValue / params.price).toFixed(8);
      return {
        isValid: true,
        reason: `Order value reduced from $${orderValue.toFixed(2)} to $${this.defaultRiskParams.maxOrderValue}`,
        adjustedVolume
      };
    }

    // Check daily volume limit
    if (this.dailyVolume + orderValue > this.defaultRiskParams.maxDailyVolume) {
      const remainingVolume = this.defaultRiskParams.maxDailyVolume - this.dailyVolume;
      if (remainingVolume < this.defaultRiskParams.minOrderSize) {
        return {
          isValid: false,
          reason: `Daily volume limit reached. Daily volume: $${this.dailyVolume.toFixed(2)}, Limit: $${this.defaultRiskParams.maxDailyVolume}`
        };
      }

      // Adjust volume to remaining daily limit
      const adjustedVolume = (remainingVolume / params.price).toFixed(8);
      return {
        isValid: true,
        reason: `Order volume adjusted to remaining daily limit: $${remainingVolume.toFixed(2)}`,
        adjustedVolume
      };
    }

    // Check order rate limiting (orders per hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentOrders = this.orderHistory.filter(order => order.timestamp > oneHourAgo);
    
    if (recentOrders.length >= this.defaultRiskParams.maxOrdersPerHour) {
      return {
        isValid: false,
        reason: `Rate limit exceeded: ${recentOrders.length} orders in the last hour (max: ${this.defaultRiskParams.maxOrdersPerHour})`
      };
    }

    // Check position size if account balance is provided
    if (params.accountBalance && params.type === 'buy') {
      const positionSize = orderValue / params.accountBalance;
      if (positionSize > this.defaultRiskParams.maxPositionSize) {
        const adjustedVolume = ((params.accountBalance * this.defaultRiskParams.maxPositionSize) / params.price).toFixed(8);
        return {
          isValid: true,
          reason: `Position size reduced from ${(positionSize * 100).toFixed(1)}% to ${(this.defaultRiskParams.maxPositionSize * 100)}% of account`,
          adjustedVolume
        };
      }
    }

    return { isValid: true };
  }

  recordTrade(pair: string, volume: number, price: number): void {
    const orderValue = volume * price;
    this.dailyVolume += orderValue;
    
    this.orderHistory.push({
      timestamp: Date.now(),
      pair,
      volume: orderValue
    });

    // Keep only last 24 hours of history
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.orderHistory = this.orderHistory.filter(order => order.timestamp > oneDayAgo);

    console.log(`📊 Risk Manager: Trade recorded. Daily volume: $${this.dailyVolume.toFixed(2)}`);
  }

  private resetDailyCountersIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      console.log(`📊 Risk Manager: Resetting daily counters for ${today}`);
      this.dailyVolume = 0;
      this.lastResetDate = today;
    }
  }

  getDailyStats(): { dailyVolume: number; ordersToday: number; remainingDailyVolume: number } {
    this.resetDailyCountersIfNeeded();
    
    const today = new Date().toDateString();
    const todayOrders = this.orderHistory.filter(order => 
      new Date(order.timestamp).toDateString() === today
    );

    return {
      dailyVolume: this.dailyVolume,
      ordersToday: todayOrders.length,
      remainingDailyVolume: this.defaultRiskParams.maxDailyVolume - this.dailyVolume
    };
  }

  getRiskParams(): RiskParams {
    return { ...this.defaultRiskParams };
  }

  updateRiskParams(params: Partial<RiskParams>): void {
    Object.assign(this.defaultRiskParams, params);
    console.log(`📊 Risk Manager: Updated risk parameters:`, this.defaultRiskParams);
  }
}

export const riskManager = RiskManager.getInstance();
export type { RiskParams, TradeValidationResult };