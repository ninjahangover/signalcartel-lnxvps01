/**
 * Alpaca Paper Trading Service
 * 
 * Completely separate paper trading system using Alpaca's API
 * Isolated from Kraken live trading functionality
 */

export interface AlpacaPaperAccount {
  id: string;
  userId: string;
  alpacaAccountId: string;
  apiKey: string;
  apiSecret: string;
  initialBalance: number;
  currentBalance: number;
  dayTradingBuyingPower: number;
  buyingPower: number;
  equity: number;
  status: 'active' | 'expired' | 'archived';
  createdAt: Date;
  expiresAt?: Date;
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  side: 'long' | 'short';
  marketValue: number;
  costBasis: number;
  unrealizedPl: number;
  unrealizedPlpc: number;
  currentPrice: number;
  lastdayPrice: number;
  changeToday: number;
}

export interface AlpacaOrder {
  id: string;
  clientOrderId: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced' | 'pending_cancel' | 'pending_replace' | 'accepted' | 'pending_new' | 'accepted_for_bidding' | 'stopped' | 'rejected' | 'suspended' | 'calculated';
  submittedAt: Date;
  filledAt?: Date;
  filledQty?: number;
  filledAvgPrice?: number;
}

export interface AlpacaMarketData {
  symbol: string;
  latestPrice: number;
  latestTime: Date;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

class AlpacaPaperTradingService {
  private static instance: AlpacaPaperTradingService;
  private baseUrl = 'https://paper-api.alpaca.markets';
  private dataUrl = 'https://data.alpaca.markets';
  private currentAccount: AlpacaPaperAccount | null = null;
  private autoApiKey: string | null = null;
  private autoApiSecret: string | null = null;

  private constructor() {
    // Auto-initialize with environment variables if available
    const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
    const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
    
    if (apiKey && apiSecret) {
      this.autoApiKey = apiKey;
      this.autoApiSecret = apiSecret;
      console.log('✅ Alpaca Paper Trading Service auto-initialized with environment variables');
      this.autoInitialize();
    } else {
      console.warn('⚠️ Alpaca API credentials not found in environment variables');
    }
  }

  static getInstance(): AlpacaPaperTradingService {
    if (!AlpacaPaperTradingService.instance) {
      AlpacaPaperTradingService.instance = new AlpacaPaperTradingService();
    }
    return AlpacaPaperTradingService.instance;
  }

  private async autoInitialize(): Promise<void> {
    if (this.autoApiKey && this.autoApiSecret) {
      const account = await this.initializeAccount('auto-system', this.autoApiKey, this.autoApiSecret);
      if (account) {
        console.log('✅ Alpaca auto-initialization successful');
      }
    }
  }

  /**
   * Initialize paper trading account for a user
   */
  async initializeAccount(userId: string, apiKey: string, apiSecret: string): Promise<AlpacaPaperAccount | null> {
    try {
      console.log('🚀 Initializing Alpaca paper trading account for user:', userId);

      // Test API credentials and get account info
      const accountInfo = await this.getAccountInfo(apiKey, apiSecret);
      if (!accountInfo) {
        throw new Error('Failed to retrieve account information');
      }

      // Create paper account record
      const paperAccount: AlpacaPaperAccount = {
        id: `alpaca_paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        alpacaAccountId: accountInfo.id,
        apiKey,
        apiSecret,
        initialBalance: parseFloat(accountInfo.buying_power),
        currentBalance: parseFloat(accountInfo.equity),
        dayTradingBuyingPower: parseFloat(accountInfo.daytrading_buying_power),
        buyingPower: parseFloat(accountInfo.buying_power),
        equity: parseFloat(accountInfo.equity),
        status: 'active',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
      };

      this.currentAccount = paperAccount;

      console.log('✅ Alpaca paper trading account initialized:', {
        accountId: paperAccount.alpacaAccountId,
        balance: `$${paperAccount.currentBalance.toLocaleString()}`,
        buyingPower: `$${paperAccount.buyingPower.toLocaleString()}`
      });

      return paperAccount;

    } catch (error) {
      console.error('❌ Failed to initialize Alpaca paper account:', error);
      return null;
    }
  }

  /**
   * Get account information from Alpaca
   */
  async getAccountInfo(apiKey?: string, apiSecret?: string): Promise<any> {
    const headers = this.getAuthHeaders(apiKey, apiSecret);
    
    try {
      const response = await fetch(`${this.baseUrl}/v2/account`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Account info request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Failed to get account info:', error);
      return null;
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    if (!this.currentAccount) {
      throw new Error('No active paper trading account');
    }

    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/v2/positions`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Positions request failed: ${response.status} ${response.statusText}`);
      }

      const positions = await response.json();
      
      return positions.map((pos: any): AlpacaPosition => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        side: parseFloat(pos.qty) >= 0 ? 'long' : 'short',
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedPl: parseFloat(pos.unrealized_pl),
        unrealizedPlpc: parseFloat(pos.unrealized_plpc),
        currentPrice: parseFloat(pos.current_price),
        lastdayPrice: parseFloat(pos.lastday_price),
        changeToday: parseFloat(pos.change_today)
      }));

    } catch (error) {
      console.error('❌ Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Get open orders
   */
  async getOpenOrders(): Promise<AlpacaOrder[]> {
    if (!this.currentAccount) {
      throw new Error('No active paper trading account');
    }

    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/v2/orders?status=open`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Orders request failed: ${response.status} ${response.statusText}`);
      }

      const orders = await response.json();
      
      return orders.map((order: any): AlpacaOrder => ({
        id: order.id,
        clientOrderId: order.client_order_id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        orderType: order.order_type,
        timeInForce: order.time_in_force,
        limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
        stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
        status: order.status,
        submittedAt: new Date(order.submitted_at),
        filledAt: order.filled_at ? new Date(order.filled_at) : undefined,
        filledQty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined
      }));

    } catch (error) {
      console.error('❌ Failed to get orders:', error);
      return [];
    }
  }

  /**
   * Place a new order
   */
  async placeOrder(params: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
    limitPrice?: number;
    stopPrice?: number;
  }): Promise<AlpacaOrder | null> {
    if (!this.currentAccount) {
      throw new Error('No active paper trading account');
    }

    const headers = this.getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const orderData = {
      symbol: params.symbol,
      qty: params.qty.toString(),
      side: params.side,
      type: params.type,
      time_in_force: params.timeInForce || 'day',
      ...(params.limitPrice && { limit_price: params.limitPrice.toString() }),
      ...(params.stopPrice && { stop_price: params.stopPrice.toString() })
    };

    try {
      console.log(`📤 Placing ${params.side} order:`, {
        symbol: params.symbol,
        qty: params.qty,
        type: params.type,
        limitPrice: params.limitPrice
      });

      const response = await fetch(`${this.baseUrl}/v2/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Order placement failed: ${response.status} ${errorText}`);
      }

      const order = await response.json();
      
      console.log('✅ Order placed successfully:', order.id);

      return {
        id: order.id,
        clientOrderId: order.client_order_id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        orderType: order.order_type,
        timeInForce: order.time_in_force,
        limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
        stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
        status: order.status,
        submittedAt: new Date(order.submitted_at),
        filledAt: order.filled_at ? new Date(order.filled_at) : undefined,
        filledQty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined
      };

    } catch (error) {
      console.error('❌ Failed to place order:', error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.currentAccount) {
      throw new Error('No active paper trading account');
    }

    const headers = this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/v2/orders/${orderId}`, {
        method: 'DELETE',
        headers
      });

      return response.ok;

    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      return false;
    }
  }

  /**
   * Get market data for symbols
   */
  async getMarketData(symbols: string[]): Promise<AlpacaMarketData[]> {
    const headers = this.getAuthHeaders();
    const symbolsParam = symbols.join(',');

    try {
      const response = await fetch(
        `${this.dataUrl}/v2/stocks/quotes/latest?symbols=${symbolsParam}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Market data request failed: ${response.status}`);
      }

      const data = await response.json();
      
      return symbols.map(symbol => {
        const quote = data.quotes[symbol];
        if (!quote) {
          return {
            symbol,
            latestPrice: 0,
            latestTime: new Date(),
            previousClose: 0,
            change: 0,
            changePercent: 0,
            high: 0,
            low: 0,
            volume: 0
          };
        }

        return {
          symbol,
          latestPrice: quote.ap || quote.bp || 0, // ask price or bid price
          latestTime: new Date(quote.t),
          previousClose: 0, // Would need separate endpoint for this
          change: 0,
          changePercent: 0,
          high: 0,
          low: 0,
          volume: 0
        };
      });

    } catch (error) {
      console.error('❌ Failed to get market data:', error);
      return [];
    }
  }

  /**
   * Reset paper trading account to fresh state
   * Closes all positions and pulls REAL account balance from Alpaca API
   */
  async resetAccount(): Promise<boolean> {
    if (!this.currentAccount) {
      throw new Error('No active paper trading account');
    }

    try {
      console.log('🔄 Resetting paper trading account...');

      // Cancel all open orders
      const openOrders = await this.getOpenOrders();
      for (const order of openOrders) {
        await this.cancelOrder(order.id);
      }

      // Close all positions
      const positions = await this.getPositions();
      for (const position of positions) {
        if (position.qty !== 0) {
          await this.placeOrder({
            symbol: position.symbol,
            qty: Math.abs(position.qty),
            side: position.qty > 0 ? 'sell' : 'buy',
            type: 'market'
          });
        }
      }

      // IMPORTANT: Pull REAL account balance from Alpaca API (not arbitrary numbers!)
      console.log('📡 Refreshing account data from Alpaca API...');
      const freshAccountInfo = await this.getAccountInfo();
      
      if (freshAccountInfo) {
        // Update with REAL Alpaca data
        this.currentAccount.currentBalance = parseFloat(freshAccountInfo.equity);
        this.currentAccount.initialBalance = parseFloat(freshAccountInfo.equity);
        this.currentAccount.buyingPower = parseFloat(freshAccountInfo.buying_power);
        this.currentAccount.dayTradingBuyingPower = parseFloat(freshAccountInfo.daytrading_buying_power);
        this.currentAccount.equity = parseFloat(freshAccountInfo.equity);
        this.currentAccount.createdAt = new Date();

        console.log('✅ Paper trading account reset with REAL Alpaca data:', {
          equity: `$${this.currentAccount.equity.toLocaleString()}`,
          buyingPower: `$${this.currentAccount.buyingPower.toLocaleString()}`,
          source: 'Alpaca API (real data)'
        });
      } else {
        console.error('❌ Failed to refresh account data from Alpaca API');
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ Failed to reset account:', error);
      return false;
    }
  }

  /**
   * Cycle to a new paper trading account
   */
  async cycleAccount(userId: string): Promise<AlpacaPaperAccount | null> {
    console.log('🔄 Cycling to new paper trading account...');

    // Archive current account performance if exists
    if (this.currentAccount) {
      await this.archiveAccountPerformance();
    }

    // Create new account with same credentials but fresh state
    const apiKey = process.env.ALPACA_PAPER_API_KEY;
    const apiSecret = process.env.ALPACA_PAPER_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Alpaca API credentials not configured');
    }

    return this.initializeAccount(userId, apiKey, apiSecret);
  }

  /**
   * Archive current account performance data
   */
  private async archiveAccountPerformance(): Promise<void> {
    if (!this.currentAccount) return;

    try {
      // Get final account state
      const accountInfo = await this.getAccountInfo();
      const positions = await this.getPositions();
      const orders = await this.getOpenOrders();

      // Calculate performance metrics
      const totalReturn = accountInfo.equity - this.currentAccount.initialBalance;
      const returnPercentage = (totalReturn / this.currentAccount.initialBalance) * 100;

      console.log('📊 Archiving paper trading performance:', {
        accountId: this.currentAccount.id,
        initialBalance: `$${this.currentAccount.initialBalance.toLocaleString()}`,
        finalBalance: `$${parseFloat(accountInfo.equity).toLocaleString()}`,
        totalReturn: `${totalReturn >= 0 ? '+' : ''}$${totalReturn.toFixed(2)}`,
        returnPercentage: `${returnPercentage >= 0 ? '+' : ''}${returnPercentage.toFixed(2)}%`,
        duration: `${Math.ceil((Date.now() - this.currentAccount.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days`,
        totalPositions: positions.length,
        openOrders: orders.length
      });

      // Here you would save to database
      // await this.saveAccountPerformance(this.currentAccount, accountInfo, positions);

    } catch (error) {
      console.error('❌ Failed to archive account performance:', error);
    }
  }

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(apiKey?: string, apiSecret?: string): Record<string, string> {
    const key = apiKey || this.currentAccount?.apiKey || process.env.ALPACA_PAPER_API_KEY;
    const secret = apiSecret || this.currentAccount?.apiSecret || process.env.ALPACA_PAPER_API_SECRET;

    if (!key || !secret) {
      throw new Error('Alpaca API credentials not available');
    }

    return {
      'APCA-API-KEY-ID': key,
      'APCA-API-SECRET-KEY': secret,
      'User-Agent': 'Signal Cartel Paper Trading/1.0'
    };
  }

  /**
   * Check if account is active and not expired
   */
  isAccountActive(): boolean {
    if (!this.currentAccount) return false;
    if (this.currentAccount.status !== 'active') return false;
    if (this.currentAccount.expiresAt && new Date() > this.currentAccount.expiresAt) return false;
    
    return true;
  }

  /**
   * Refresh account balance from Alpaca API
   * Call this regularly to get real-time account data
   */
  async refreshAccountBalance(): Promise<boolean> {
    if (!this.currentAccount) return false;

    try {
      console.log('🔄 Refreshing account balance from Alpaca API...');
      
      const accountInfo = await this.getAccountInfo();
      if (accountInfo) {
        // Update with REAL current data from Alpaca
        this.currentAccount.currentBalance = parseFloat(accountInfo.equity);
        this.currentAccount.buyingPower = parseFloat(accountInfo.buying_power);
        this.currentAccount.dayTradingBuyingPower = parseFloat(accountInfo.daytrading_buying_power);
        this.currentAccount.equity = parseFloat(accountInfo.equity);
        
        console.log('✅ Account balance refreshed from Alpaca:', {
          equity: `$${this.currentAccount.equity.toLocaleString()}`,
          buyingPower: `$${this.currentAccount.buyingPower.toLocaleString()}`
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to refresh account balance:', error);
      return false;
    }
  }

  /**
   * Get current account info (refreshes from API first)
   */
  async getCurrentAccount(): Promise<AlpacaPaperAccount | null> {
    if (this.currentAccount) {
      // Always refresh balance before returning account info
      await this.refreshAccountBalance();
    }
    return this.currentAccount;
  }

  /**
   * Get current account info (cached version)
   */
  getCurrentAccountCached(): AlpacaPaperAccount | null {
    return this.currentAccount;
  }
}

// Export singleton instance
export const alpacaPaperTradingService = AlpacaPaperTradingService.getInstance();

export default AlpacaPaperTradingService;