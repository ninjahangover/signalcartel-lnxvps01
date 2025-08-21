/**
 * DEPRECATED: Kraken Demo Futures API Service
 * 
 * This service has been REMOVED from paper trading system.
 * Paper trading now uses Alpaca only.
 * Real trading uses Kraken (not demo).
 * 
 * https://demo-futures.kraken.com/fdashboard
 */

import { TRADING_CONFIG } from './config';

export interface KrakenFuturesAuth {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface FuturesPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  value: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  marginUsed: number;
  liquidationPrice?: number;
}

export interface FuturesOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'take_profit';
  size: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled';
  timestamp: Date;
}

export interface FuturesAccount {
  balance: number;
  equity: number;
  freeMargin: number;
  usedMargin: number;
  unrealizedPnl: number;
  marginRatio: number;
  positions: FuturesPosition[];
  orders: FuturesOrder[];
}

class KrakenDemoFuturesService {
  private static instance: KrakenDemoFuturesService;
  private auth: KrakenFuturesAuth | null = null;
  private isAuthenticated = false;

  private constructor() {}

  static getInstance(): KrakenDemoFuturesService {
    if (!KrakenDemoFuturesService.instance) {
      KrakenDemoFuturesService.instance = new KrakenDemoFuturesService();
    }
    return KrakenDemoFuturesService.instance;
  }

  /**
   * Authenticate with Kraken Demo Futures
   * Note: For demo account, you need to get API keys from the dashboard first
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Attempting to authenticate with Kraken Demo Futures...');
      
      // Check if we have API credentials from environment
      const apiKey = TRADING_CONFIG.KRAKEN_API.API_KEY;
      const apiSecret = TRADING_CONFIG.KRAKEN_API.API_SECRET;
      
      if (apiKey && apiSecret) {
        console.log('🔑 Using API credentials from environment');
        this.auth = {
          apiKey,
          apiSecret
        };
        this.isAuthenticated = true;
        return true;
      }
      
      console.warn('⚠️ No API credentials found. You need to:');
      console.warn('1. Login to https://demo-futures.kraken.com/dashboard');
      console.warn('2. Go to Settings -> API Keys');
      console.warn('3. Create new API keys');
      console.warn('4. Set KRAKEN_DEMO_API_KEY and KRAKEN_DEMO_API_SECRET in environment');
      
      // Try a basic connection test to the API
      try {
        const testResponse = await fetch('https://demo-futures.kraken.com/derivatives/api/v3/instruments', {
          headers: {
            'User-Agent': 'Signal Cartel Stratus Engine/1.0'
          }
        });
        
        if (testResponse.ok) {
          console.log('✅ Basic API connection successful (public endpoints work)');
          console.log('❌ But authentication failed - need API keys from dashboard');
        } else {
          console.error('❌ Basic API connection failed:', testResponse.status);
        }
      } catch (testError) {
        console.error('❌ API connection test failed:', testError);
      }
      
      return false;

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return false;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<FuturesAccount | null> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) return null;
    }

    try {
      const response = await this.makeAuthenticatedRequest('/account');
      if (!response) return null;

      return {
        balance: response.balance || 100000, // Demo account starts with $100k
        equity: response.equity || response.balance || 100000,
        freeMargin: response.freeMargin || response.balance || 100000,
        usedMargin: response.usedMargin || 0,
        unrealizedPnl: response.unrealizedPnl || 0,
        marginRatio: response.marginRatio || 0,
        positions: response.positions || [],
        orders: response.orders || []
      };

    } catch (error) {
      console.error('❌ Failed to get account info:', error);
      return null;
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<FuturesPosition[]> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) return [];
    }

    try {
      const response = await this.makeAuthenticatedRequest('/openpositions');
      return response?.openPositions || [];
    } catch (error) {
      console.error('❌ Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Get open orders
   */
  async getOpenOrders(): Promise<FuturesOrder[]> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) return [];
    }

    try {
      const response = await this.makeAuthenticatedRequest('/openorders');
      return response?.openOrders || [];
    } catch (error) {
      console.error('❌ Failed to get open orders:', error);
      return [];
    }
  }

  /**
   * Place a new order
   */
  async placeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    orderType: 'market' | 'limit';
    size: number;
    price?: number;
    stopPrice?: number;
  }): Promise<FuturesOrder | null> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) return null;
    }

    try {
      console.log(`📤 Placing ${params.side} order for ${params.size} ${params.symbol}`);

      const orderData = {
        orderType: params.orderType,
        symbol: params.symbol,
        side: params.side,
        size: params.size,
        ...(params.price && { limitPrice: params.price }),
        ...(params.stopPrice && { stopPrice: params.stopPrice })
      };

      const response = await this.makeAuthenticatedRequest('/sendorder', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      if (response?.result === 'success') {
        console.log('✅ Order placed successfully:', response.orderId);
        return {
          orderId: response.orderId,
          symbol: params.symbol,
          side: params.side,
          orderType: params.orderType,
          size: params.size,
          price: params.price,
          stopPrice: params.stopPrice,
          status: 'pending',
          timestamp: new Date()
        };
      } else {
        console.error('❌ Order placement failed:', response);
        return null;
      }

    } catch (error) {
      console.error('❌ Failed to place order:', error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) return false;
    }

    try {
      const response = await this.makeAuthenticatedRequest('/cancelorder', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId })
      });

      return response?.result === 'success';
    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      return false;
    }
  }

  /**
   * Get market data for a symbol
   */
  async getMarketData(symbol: string): Promise<any> {
    try {
      const response = await fetch(
        `${TRADING_CONFIG.KRAKEN_API.PUBLIC_API_URL}/tickers?symbol=${symbol}`,
        {
          headers: {
            'User-Agent': 'Signal Cartel Stratus Engine/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Market data request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.result?.[symbol] || null;
    } catch (error) {
      console.error(`❌ Failed to get market data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.auth?.accessToken) {
      throw new Error('No access token available');
    }

    const url = `${TRADING_CONFIG.KRAKEN_API.PRIVATE_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.auth.accessToken}`,
        'User-Agent': 'Signal Cartel Stratus Engine/1.0',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check authentication status
   */
  isAuth(): boolean {
    return this.isAuthenticated && !!this.auth?.accessToken;
  }

  /**
   * Get demo dashboard URL
   */
  getDashboardUrl(): string {
    return TRADING_CONFIG.KRAKEN_API.DEMO_DASHBOARD_URL;
  }
}

// Export singleton instance
export const krakenDemoFutures = KrakenDemoFuturesService.getInstance();

export default KrakenDemoFuturesService;