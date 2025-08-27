/**
 * QUANTUM FORGE™ Kraken API Client
 * Professional-grade wrapper for live cryptocurrency trading
 */

import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

export interface KrakenBalance {
  currency: string;
  balance: number;
  available: number;
  hold: number;
}

export interface KrakenOrderRequest {
  pair: string;
  type: 'buy' | 'sell';
  ordertype: 'market' | 'limit';
  volume: string;
  price?: string;
  leverage?: string;
  oflags?: string;
  starttm?: string;
  expiretm?: string;
  userref?: string;
  validate?: boolean;
}

export interface KrakenOrder {
  txid: string;
  descr: {
    order: string;
    close: string;
  };
  status: 'pending' | 'open' | 'closed' | 'canceled' | 'expired';
  opentm: number;
  closetm?: number;
  vol: string;
  vol_exec: string;
  cost: string;
  fee: string;
  price: string;
  misc: string;
  oflags: string;
}

export interface KrakenTicker {
  a: [string, string, string]; // ask [price, whole lot volume, lot volume]
  b: [string, string, string]; // bid [price, whole lot volume, lot volume] 
  c: [string, string];         // last trade closed [price, lot volume]
  v: [string, string];         // volume [today, last 24 hours]
  p: [string, string];         // volume weighted average price [today, last 24 hours]
  t: [number, number];         // number of trades [today, last 24 hours]
  l: [string, string];         // low [today, last 24 hours]
  h: [string, string];         // high [today, last 24 hours]
  o: string;                   // today's opening price
}

export interface KrakenApiError {
  error: string[];
}

export class KrakenClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly privateKey: string;
  private readonly axios: AxiosInstance;
  private readonly isLive: boolean;

  constructor(config: {
    apiKey: string;
    privateKey: string;
    isLive?: boolean;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.privateKey = config.privateKey;
    this.isLive = config.isLive ?? false;
    
    // Use sandbox URL for testing, live URL for production
    this.apiUrl = this.isLive 
      ? 'https://api.kraken.com'
      : 'https://api.kraken.com'; // Kraken doesn't have sandbox, will use validate=true
    
    this.axios = axios.create({
      baseURL: this.apiUrl,
      timeout: config.timeout || 10000,
      headers: {
        'User-Agent': 'QUANTUM-FORGE-Trading/1.0'
      }
    });

    console.log(`🔌 Kraken Client initialized: ${this.isLive ? '🔴 LIVE' : '🟡 VALIDATE-ONLY'} mode`);
  }

  /**
   * Generate authentication signature for private API calls
   */
  private generateSignature(uri: string, nonce: string, postdata: string): string {
    const message = postdata;
    const secret = Buffer.from(this.privateKey, 'base64');
    const hash = crypto.createHash('sha256');
    const hmac = crypto.createHmac('sha512', secret);
    
    const hashDigest = hash.update(nonce + message).digest();
    const hmacDigest = hmac.update(uri + hashDigest, 'binary').digest('base64');
    
    return hmacDigest;
  }

  /**
   * Make public API call (no authentication required)
   */
  async publicCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const url = `/0/public/${endpoint}`;
      const response = await this.axios.get(url, { params });
      
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }
      
      return response.data.result;
    } catch (error) {
      console.error(`❌ Kraken public API call failed (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Make private API call (requires authentication)
   */
  async privateCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const uri = `/0/private/${endpoint}`;
      const nonce = Date.now().toString();
      
      const postdata = new URLSearchParams({
        nonce,
        ...params
      }).toString();
      
      const signature = this.generateSignature(uri, nonce, postdata);
      
      const headers = {
        'API-Key': this.apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      
      const response = await this.axios.post(uri, postdata, { headers });
      
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }
      
      return response.data.result;
    } catch (error) {
      console.error(`❌ Kraken private API call failed (${endpoint}):`, error);
      throw error;
    }
  }

  // === Public Market Data Methods ===

  /**
   * Get ticker information for a symbol
   */
  async getTicker(pair: string): Promise<KrakenTicker> {
    const result = await this.publicCall('Ticker', { pair });
    return result[pair];
  }

  /**
   * Get server time (useful for synchronization)
   */
  async getServerTime(): Promise<{ unixtime: number; rfc1123: string }> {
    return await this.publicCall('Time');
  }

  /**
   * Get tradable asset pairs
   */
  async getAssetPairs(): Promise<Record<string, any>> {
    return await this.publicCall('AssetPairs');
  }

  // === Private Account Methods ===

  /**
   * Get account balance
   */
  async getBalance(): Promise<Record<string, string>> {
    return await this.privateCall('Balance');
  }

  /**
   * Get formatted balance information
   */
  async getFormattedBalance(): Promise<KrakenBalance[]> {
    const balances = await this.getBalance();
    
    return Object.entries(balances).map(([currency, balance]) => ({
      currency,
      balance: parseFloat(balance),
      available: parseFloat(balance), // Kraken doesn't separate available/hold in balance call
      hold: 0
    })).filter(b => b.balance > 0);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(): Promise<Record<string, KrakenOrder>> {
    const result = await this.privateCall('OpenOrders');
    return result.open || {};
  }

  /**
   * Get closed orders
   */
  async getClosedOrders(start?: number, end?: number): Promise<Record<string, KrakenOrder>> {
    const params: Record<string, any> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    
    const result = await this.privateCall('ClosedOrders', params);
    return result.closed || {};
  }

  // === Trading Methods ===

  /**
   * Place a new order
   */
  async placeOrder(orderRequest: KrakenOrderRequest): Promise<{ txid: string[]; descr: any }> {
    // For testing, always validate orders first
    const validateParams = {
      ...orderRequest,
      validate: true
    };
    
    try {
      // Always validate first
      console.log(`🧪 Validating ${orderRequest.type.toUpperCase()} order: ${orderRequest.volume} ${orderRequest.pair}`);
      await this.privateCall('AddOrder', validateParams);
      console.log(`✅ Order validation passed`);
      
      // Only execute if in live mode
      if (this.isLive) {
        console.log(`🔴 LIVE ORDER EXECUTION: ${orderRequest.type.toUpperCase()} ${orderRequest.volume} ${orderRequest.pair}`);
        const result = await this.privateCall('AddOrder', orderRequest);
        console.log(`✅ Live order placed: ${result.txid?.[0]}`);
        return result;
      } else {
        console.log(`🟡 VALIDATE-ONLY MODE: Order would be executed in live mode`);
        // Return a mock response for testing
        return {
          txid: [`VALIDATE_${Date.now()}`],
          descr: { order: `Validation order: ${orderRequest.type} ${orderRequest.volume} ${orderRequest.pair}` }
        };
      }
      
    } catch (error) {
      console.error(`❌ Order failed:`, error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(txid: string): Promise<{ count: number; pending?: boolean }> {
    if (!this.isLive) {
      console.log(`🟡 VALIDATE-ONLY MODE: Would cancel order ${txid}`);
      return { count: 1 };
    }
    
    console.log(`🗑️ Cancelling order: ${txid}`);
    return await this.privateCall('CancelOrder', { txid });
  }

  /**
   * Get order status
   */
  async getOrderStatus(txid: string): Promise<KrakenOrder> {
    const result = await this.privateCall('QueryOrders', { txid });
    return result[txid];
  }

  // === Portfolio and Risk Methods ===

  /**
   * Get total portfolio value in USD
   */
  async getPortfolioValue(): Promise<number> {
    try {
      const balances = await this.getFormattedBalance();
      let totalValue = 0;

      for (const balance of balances) {
        if (balance.currency === 'USD' || balance.currency === 'ZUSD') {
          totalValue += balance.balance;
        } else if (balance.balance > 0) {
          // Get USD value for other currencies
          try {
            const pair = `${balance.currency}USD`;
            const ticker = await this.getTicker(pair);
            const price = parseFloat(ticker.c[0]);
            totalValue += balance.balance * price;
          } catch (error) {
            console.warn(`⚠️ Could not get price for ${balance.currency}, excluding from portfolio value`);
          }
        }
      }

      return totalValue;
    } catch (error) {
      console.error('❌ Failed to calculate portfolio value:', error);
      throw error;
    }
  }

  /**
   * Check if we have sufficient balance for a trade
   */
  async checkSufficientBalance(pair: string, volume: number, type: 'buy' | 'sell'): Promise<boolean> {
    try {
      const balances = await this.getFormattedBalance();
      
      if (type === 'sell') {
        // Check if we have enough of the base currency
        const baseCurrency = pair.replace('USD', '').replace('ZUSD', '');
        const balance = balances.find(b => b.currency === baseCurrency || b.currency === `X${baseCurrency}`);
        return balance ? balance.available >= volume : false;
      } else {
        // For buy orders, check USD balance
        const ticker = await this.getTicker(pair);
        const price = parseFloat(ticker.a[0]); // Ask price
        const requiredUSD = volume * price;
        
        const usdBalance = balances.find(b => b.currency === 'USD' || b.currency === 'ZUSD');
        return usdBalance ? usdBalance.available >= requiredUSD : false;
      }
    } catch (error) {
      console.error('❌ Failed to check balance:', error);
      return false;
    }
  }

  // === Utility Methods ===

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getServerTime();
      await this.getBalance(); // This tests private API access
      console.log(`✅ Kraken API connection test passed (${this.isLive ? 'LIVE' : 'VALIDATE-ONLY'})`);
      return true;
    } catch (error) {
      console.error(`❌ Kraken API connection test failed:`, error);
      return false;
    }
  }

  /**
   * Get current mode
   */
  getMode(): { isLive: boolean; description: string } {
    return {
      isLive: this.isLive,
      description: this.isLive ? 'LIVE TRADING' : 'VALIDATE-ONLY MODE'
    };
  }

  /**
   * Enable live trading (use with extreme caution)
   */
  enableLiveTrading(): void {
    console.log('🚨 DANGER: Enabling LIVE TRADING mode - real money at risk!');
    (this as any).isLive = true;
  }

  /**
   * Disable live trading (safe mode)
   */
  disableLiveTrading(): void {
    console.log('✅ SAFE: Switching to VALIDATE-ONLY mode');
    (this as any).isLive = false;
  }
}

// Export a configured instance for the application
export const createKrakenClient = (isLive: boolean = false): KrakenClient => {
  const apiKey = process.env.KRAKEN_API_KEY;
  const privateKey = process.env.KRAKEN_PRIVATE_KEY;

  if (!apiKey || !privateKey) {
    throw new Error('❌ Kraken API credentials not found in environment variables');
  }

  return new KrakenClient({
    apiKey,
    privateKey,
    isLive,
    timeout: 15000
  });
};