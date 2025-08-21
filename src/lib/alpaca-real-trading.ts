/**
 * REAL Alpaca Trading System
 * This actually places real orders on Alpaca Paper Trading
 * No mocks, no fakes - real trades with real results
 */

// Use dynamic import for client-side compatibility
let Alpaca: any = null;
let alpaca: any = null;

// Initialize Alpaca only when needed
async function getAlpacaInstance() {
  if (!alpaca) {
    if (typeof window !== 'undefined') {
      // Client-side: use API routes instead
      return null;
    }
    
    try {
      const AlpacaSDK = await import('@alpacahq/alpaca-trade-api');
      Alpaca = AlpacaSDK.default;
      
      alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY_ID || process.env.NEXT_PUBLIC_ALPACA_API_KEY_ID || '',
        secretKey: process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY || '',
        paper: true, // Always use paper trading for safety
        usePolygon: false
      });
    } catch (error) {
      console.error('Failed to initialize Alpaca:', error);
      return null;
    }
  }
  return alpaca;
}

export interface RealTradeResult {
  success: boolean;
  orderId?: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  orderType: string;
  price?: number;
  filledAt?: string;
  filledQty?: number;
  filledAvgPrice?: number;
  status?: string;
  error?: string;
  timestamp: Date;
}

export interface AccountInfo {
  buying_power: number;
  cash: number;
  portfolio_value: number;
  positions: Array<{
    symbol: string;
    qty: number;
    market_value: number;
    unrealized_pl: number;
    unrealized_plpc: number;
  }>;
}

class AlpacaRealTrading {
  private static instance: AlpacaRealTrading | null = null;
  private isConnected: boolean = false;
  private tradingEnabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AlpacaRealTrading {
    if (!AlpacaRealTrading.instance) {
      AlpacaRealTrading.instance = new AlpacaRealTrading();
    }
    return AlpacaRealTrading.instance;
  }

  /**
   * Initialize and verify Alpaca connection
   */
  async initialize(): Promise<boolean> {
    try {
      // Client-side: use API route
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/alpaca/account');
        if (response.ok) {
          const account = await response.json();
          this.isConnected = true;
          this.tradingEnabled = !account.trading_blocked && !account.account_blocked;
          console.log('✅ REAL Alpaca connection established via API!');
          return true;
        }
        return false;
      }

      // Server-side: use direct SDK
      const alpacaInstance = await getAlpacaInstance();
      if (!alpacaInstance) return false;
      
      const account = await alpacaInstance.getAccount();
      
      this.isConnected = true;
      this.tradingEnabled = account.trading_blocked === false && 
                           account.account_blocked === false;
      
      console.log('✅ REAL Alpaca connection established!');
      console.log(`   Account: ${account.account_number}`);
      console.log(`   Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
      console.log(`   Portfolio Value: $${parseFloat(account.portfolio_value).toLocaleString()}`);
      console.log(`   Trading Enabled: ${this.tradingEnabled}`);
      
      return true;
    } catch (error) {
      console.error('❌ Alpaca connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get REAL account information
   */
  async getAccountInfo(): Promise<AccountInfo | null> {
    try {
      // Client-side: use API route
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/alpaca/account');
        if (response.ok) {
          return await response.json();
        }
        return null;
      }

      // Server-side: use direct SDK
      const alpacaInstance = await getAlpacaInstance();
      if (!alpacaInstance) return null;

      const account = await alpacaInstance.getAccount();
      const positions = await alpacaInstance.getPositions();
      
      return {
        buying_power: parseFloat(account.buying_power),
        cash: parseFloat(account.cash),
        portfolio_value: parseFloat(account.portfolio_value),
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          qty: parseFloat(pos.qty),
          market_value: parseFloat(pos.market_value),
          unrealized_pl: parseFloat(pos.unrealized_pl),
          unrealized_plpc: parseFloat(pos.unrealized_plpc)
        }))
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }

  /**
   * Place a REAL market order
   */
  async placeMarketOrder(
    symbol: string, 
    qty: number, 
    side: 'buy' | 'sell'
  ): Promise<RealTradeResult> {
    if (!this.isConnected) {
      await this.initialize();
    }

    if (!this.tradingEnabled) {
      return {
        success: false,
        symbol,
        qty,
        side,
        orderType: 'market',
        error: 'Trading is disabled on this account',
        timestamp: new Date()
      };
    }

    try {
      // Client-side: use API route
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/alpaca/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, qty, side, type: 'market' })
        });
        
        if (response.ok) {
          return await response.json();
        } else {
          const error = await response.json();
          return {
            success: false,
            symbol,
            qty,
            side,
            orderType: 'market',
            error: error.error || 'API request failed',
            timestamp: new Date()
          };
        }
      }

      // Server-side: use direct SDK
      const alpacaInstance = await getAlpacaInstance();
      if (!alpacaInstance) {
        return {
          success: false,
          symbol,
          qty,
          side,
          orderType: 'market',
          error: 'Alpaca not available',
          timestamp: new Date()
        };
      }

      console.log(`📈 Placing REAL ${side} order: ${qty} ${symbol}`);
      
      const order = await alpacaInstance.createOrder({
        symbol: symbol.replace('USD', ''), // Convert BTCUSD to BTC
        qty: qty,
        side: side,
        type: 'market',
        time_in_force: 'day'
      });

      console.log(`✅ REAL order placed! Order ID: ${order.id}`);
      
      // Wait a moment for the order to fill
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the updated order status
      const filledOrder = await alpacaInstance.getOrder(order.id);
      
      return {
        success: true,
        orderId: filledOrder.id,
        symbol: filledOrder.symbol,
        qty: parseFloat(filledOrder.qty),
        side: filledOrder.side as 'buy' | 'sell',
        orderType: filledOrder.type,
        filledAt: filledOrder.filled_at,
        filledQty: parseFloat(filledOrder.filled_qty || '0'),
        filledAvgPrice: parseFloat(filledOrder.filled_avg_price || '0'),
        status: filledOrder.status,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ REAL order failed:`, error);
      return {
        success: false,
        symbol,
        qty,
        side,
        orderType: 'market',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Place a REAL limit order
   */
  async placeLimitOrder(
    symbol: string, 
    qty: number, 
    side: 'buy' | 'sell',
    limitPrice: number
  ): Promise<RealTradeResult> {
    if (!this.isConnected) {
      await this.initialize();
    }

    if (!this.tradingEnabled) {
      return {
        success: false,
        symbol,
        qty,
        side,
        orderType: 'limit',
        price: limitPrice,
        error: 'Trading is disabled on this account',
        timestamp: new Date()
      };
    }

    try {
      console.log(`📊 Placing REAL limit ${side} order: ${qty} ${symbol} @ $${limitPrice}`);
      
      const order = await alpaca.createOrder({
        symbol: symbol.replace('USD', ''),
        qty: qty,
        side: side,
        type: 'limit',
        time_in_force: 'day',
        limit_price: limitPrice
      });

      console.log(`✅ REAL limit order placed! Order ID: ${order.id}`);
      
      return {
        success: true,
        orderId: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side as 'buy' | 'sell',
        orderType: order.type,
        price: parseFloat(order.limit_price || '0'),
        status: order.status,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ REAL limit order failed:`, error);
      return {
        success: false,
        symbol,
        qty,
        side,
        orderType: 'limit',
        price: limitPrice,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get REAL order history
   */
  async getOrderHistory(limit: number = 10): Promise<any[]> {
    try {
      // Client-side: use API route
      if (typeof window !== 'undefined') {
        const response = await fetch(`/api/alpaca/orders?limit=${limit}`);
        if (response.ok) {
          return await response.json();
        }
        return [];
      }

      // Server-side: use direct SDK
      const alpacaInstance = await getAlpacaInstance();
      if (!alpacaInstance) return [];

      const orders = await alpacaInstance.getOrders({
        status: 'all',
        limit: limit,
        direction: 'desc'
      });
      
      return orders.map(order => ({
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        qty: parseFloat(order.qty),
        type: order.type,
        status: order.status,
        filled_qty: parseFloat(order.filled_qty || '0'),
        filled_avg_price: parseFloat(order.filled_avg_price || '0'),
        created_at: order.created_at,
        filled_at: order.filled_at
      }));
      
    } catch (error) {
      console.error('Failed to get order history:', error);
      return [];
    }
  }

  /**
   * Get REAL positions
   */
  async getPositions(): Promise<any[]> {
    try {
      // Client-side: use API route
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/alpaca/positions');
        if (response.ok) {
          return await response.json();
        }
        return [];
      }

      // Server-side: use direct SDK
      const alpacaInstance = await getAlpacaInstance();
      if (!alpacaInstance) return [];

      const positions = await alpacaInstance.getPositions();
      
      return positions.map(pos => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        side: parseFloat(pos.qty) > 0 ? 'long' : 'short',
        market_value: parseFloat(pos.market_value),
        cost_basis: parseFloat(pos.cost_basis),
        unrealized_pl: parseFloat(pos.unrealized_pl),
        unrealized_plpc: parseFloat(pos.unrealized_plpc),
        current_price: parseFloat(pos.current_price || '0'),
        avg_entry_price: parseFloat(pos.avg_entry_price)
      }));
      
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string): Promise<RealTradeResult> {
    try {
      console.log(`🔴 Closing position: ${symbol}`);
      
      const order = await alpaca.closePosition(symbol.replace('USD', ''));
      
      return {
        success: true,
        orderId: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side as 'buy' | 'sell',
        orderType: 'market',
        status: 'closing',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`Failed to close position ${symbol}:`, error);
      return {
        success: false,
        symbol,
        qty: 0,
        side: 'sell',
        orderType: 'market',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await alpaca.cancelOrder(orderId);
      console.log(`✅ Order ${orderId} cancelled`);
      return true;
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Test the system with a small trade
   */
  async testTrade(): Promise<RealTradeResult> {
    console.log('🧪 Testing REAL Alpaca trading with a small order...');
    
    // Try to buy 0.001 BTC (about $100 worth)
    const result = await this.placeMarketOrder('BTCUSD', 0.001, 'buy');
    
    if (result.success) {
      console.log('✅ Test trade successful!');
      console.log('   Order ID:', result.orderId);
      console.log('   Filled:', result.filledQty, 'at $', result.filledAvgPrice);
      
      // Show account info after trade
      const account = await this.getAccountInfo();
      if (account) {
        console.log('📊 Account after trade:');
        console.log('   Buying Power: $', account.buying_power.toLocaleString());
        console.log('   Positions:', account.positions.length);
      }
    } else {
      console.log('❌ Test trade failed:', result.error);
    }
    
    return result;
  }
}

// Export singleton instance
export const alpacaRealTrading = AlpacaRealTrading.getInstance();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  console.log('🚀 Initializing REAL Alpaca Trading System...');
  alpacaRealTrading.getAccountInfo().then(account => {
    if (account) {
      console.log('💰 REAL Account Status:');
      console.log(`   Cash: $${account.cash.toLocaleString()}`);
      console.log(`   Buying Power: $${account.buying_power.toLocaleString()}`);
      console.log(`   Portfolio: $${account.portfolio_value.toLocaleString()}`);
      console.log(`   Positions: ${account.positions.length}`);
    }
  });
}