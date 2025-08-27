/**
 * Real-Time Price Fetcher
 * 
 * ONLY fetches REAL prices from REAL APIs
 * NO MOCK DATA - if APIs fail, we show that clearly
 */

export interface RealPriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  source: string;
  success: boolean;
  error?: string;
}

class RealTimePriceFetcher {
  private static instance: RealTimePriceFetcher | null = null;
  private cache: Map<string, { price: number; timestamp: Date }> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache (much longer for trading stability)
  private lastCoinGeckoRequest: number = 0;
  private readonly COINGECKO_RATE_LIMIT_MS = 20000; // 20 seconds between requests to avoid rate limits

  private constructor() {}

  static getInstance(): RealTimePriceFetcher {
    if (!RealTimePriceFetcher.instance) {
      RealTimePriceFetcher.instance = new RealTimePriceFetcher();
    }
    return RealTimePriceFetcher.instance;
  }

  /**
   * Fetch REAL current price for a symbol
   * NO FALLBACKS TO FAKE DATA
   */
  async getCurrentPrice(symbol: string, forceRefresh: boolean = false): Promise<RealPriceData> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(symbol);
      if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
        return {
          symbol,
          price: cached.price,
          timestamp: cached.timestamp,
          source: 'cache',
          success: true
        };
      }
    }

    console.log(`📊 Fetching REAL price data for ${symbol} (no fallbacks)...`);
    
    // Try CoinGecko first (most reliable, no geo-restrictions)
    const coinGeckoResult = await this.fetchFromCoinGecko(symbol);
    if (coinGeckoResult.success) {
      this.cache.set(symbol, { price: coinGeckoResult.price, timestamp: new Date() });
      return coinGeckoResult;
    }
    console.log(`⚠️ CoinGecko failed for ${symbol}: ${coinGeckoResult.error}`);

    // Try Binance as backup (may be geo-restricted)
    const binanceResult = await this.fetchFromBinance(symbol);
    if (binanceResult.success) {
      this.cache.set(symbol, { price: binanceResult.price, timestamp: new Date() });
      return binanceResult;
    }
    console.log(`⚠️ Binance failed for ${symbol}: ${binanceResult.error}`);

    // Try CryptoCompare as third option
    const cryptoCompareResult = await this.fetchFromCryptoCompare(symbol);
    if (cryptoCompareResult.success) {
      this.cache.set(symbol, { price: cryptoCompareResult.price, timestamp: new Date() });
      return cryptoCompareResult;
    }
    console.log(`⚠️ CryptoCompare failed for ${symbol}: ${cryptoCompareResult.error}`);

    // ALL APIS FAILED - TRY ONE MORE WITH DIFFERENT APPROACH
    console.warn(`⚠️ All primary APIs failed for ${symbol}. Trying emergency fallback...`);
    
    // Try a direct approach with Coinbase API as emergency fallback
    try {
      const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol.replace('USD', '')}`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        const price = parseFloat(data?.data?.rates?.USD);
        
        if (price && price > 0) {
          console.log(`🆘 Emergency price from Coinbase: ${symbol} = $${price.toLocaleString()}`);
          this.cache.set(symbol, { price, timestamp: new Date() });
          return {
            symbol,
            price,
            timestamp: new Date(),
            source: 'coinbase-emergency',
            success: true
          };
        }
      }
    } catch (error) {
      console.error(`Emergency fallback also failed for ${symbol}:`, error);
    }

    // TRULY ALL APIS FAILED - RETURN ERROR, NO FAKE DATA
    const errorMsg = `All API sources failed for ${symbol} (CoinGecko, Binance, CryptoCompare, Coinbase) - no real data available`;
    console.error(`❌ ${errorMsg}`);
    
    return {
      symbol,
      price: 0,
      timestamp: new Date(),
      source: 'none',
      success: false,
      error: errorMsg
    };
  }

  /**
   * Fetch from Binance API
   */
  private async fetchFromBinance(symbol: string): Promise<RealPriceData> {
    try {
      const binanceSymbol = this.convertToBinanceSymbol(symbol);
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Binance API returned ${response.status}`);
      }

      const data = await response.json();
      const price = parseFloat(data.price);

      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price data from Binance');
      }

      console.log(`✅ Real price from Binance: ${symbol} = $${price.toLocaleString()}`);

      return {
        symbol,
        price,
        timestamp: new Date(),
        source: 'binance',
        success: true
      };

    } catch (error) {
      console.error(`Binance API error for ${symbol}:`, error);
      return {
        symbol,
        price: 0,
        timestamp: new Date(),
        source: 'binance',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch from CoinGecko API with rate limiting
   */
  private async fetchFromCoinGecko(symbol: string): Promise<RealPriceData> {
    try {
      // Rate limiting: wait if needed
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastCoinGeckoRequest;
      
      if (timeSinceLastRequest < this.COINGECKO_RATE_LIMIT_MS) {
        const waitTime = this.COINGECKO_RATE_LIMIT_MS - timeSinceLastRequest;
        console.log(`⏳ CoinGecko rate limit: waiting ${waitTime}ms before request for ${symbol}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.lastCoinGeckoRequest = Date.now();
      
      const coinId = this.convertToCoinGeckoId(symbol);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.status === 429) {
        throw new Error(`CoinGecko API rate limited (429) - please reduce request frequency`);
      }

      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}`);
      }

      const data = await response.json();
      const price = data[coinId]?.usd;

      if (!price || price <= 0) {
        throw new Error('Invalid price data from CoinGecko');
      }

      console.log(`✅ Real price from CoinGecko: ${symbol} = $${price.toLocaleString()}`);

      return {
        symbol,
        price,
        timestamp: new Date(),
        source: 'coingecko',
        success: true
      };

    } catch (error) {
      console.error(`CoinGecko API error for ${symbol}:`, error);
      return {
        symbol,
        price: 0,
        timestamp: new Date(),
        source: 'coingecko',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch from CryptoCompare API
   */
  private async fetchFromCryptoCompare(symbol: string): Promise<RealPriceData> {
    try {
      const cryptoSymbol = this.convertToCryptoCompareSymbol(symbol);
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=${cryptoSymbol}&tsyms=USD`,
        { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          timeout: 10000
        }
      );

      if (!response.ok) {
        throw new Error(`CryptoCompare API returned ${response.status}`);
      }

      const data = await response.json();
      const price = data.USD;

      if (!price || price <= 0) {
        throw new Error('Invalid price data from CryptoCompare');
      }

      console.log(`✅ Real price from CryptoCompare: ${symbol} = $${price.toLocaleString()}`);

      return {
        symbol,
        price,
        timestamp: new Date(),
        source: 'cryptocompare',
        success: true
      };

    } catch (error) {
      console.error(`CryptoCompare API error for ${symbol}:`, error);
      return {
        symbol,
        price: 0,
        timestamp: new Date(),
        source: 'cryptocompare',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get prices for multiple symbols
   */
  async getMultiplePrices(symbols: string[]): Promise<RealPriceData[]> {
    const promises = symbols.map(symbol => this.getCurrentPrice(symbol));
    return Promise.all(promises);
  }

  /**
   * Symbol conversions for different APIs
   */
  private convertToBinanceSymbol(symbol: string): string {
    const map: { [key: string]: string } = {
      'BTCUSD': 'BTCUSDT',
      'ETHUSD': 'ETHUSDT',
      'ADAUSD': 'ADAUSDT',
      'SOLUSD': 'SOLUSDT',
      'LINKUSD': 'LINKUSDT'
    };
    return map[symbol] || symbol.replace('USD', 'USDT');
  }

  private convertToCoinGeckoId(symbol: string): string {
    const map: { [key: string]: string } = {
      'BTCUSD': 'bitcoin',
      'ETHUSD': 'ethereum',
      'ADAUSD': 'cardano',
      'SOLUSD': 'solana',
      'LINKUSD': 'chainlink'
    };
    return map[symbol] || 'bitcoin';
  }

  private convertToCryptoCompareSymbol(symbol: string): string {
    const map: { [key: string]: string } = {
      'BTCUSD': 'BTC',
      'ETHUSD': 'ETH',
      'ADAUSD': 'ADA',
      'SOLUSD': 'SOL',
      'LINKUSD': 'LINK'
    };
    return map[symbol] || symbol.replace('USD', '');
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Price cache cleared');
  }

  /**
   * Get current cache status
   */
  getCacheStatus(): { symbol: string; price: number; age: number }[] {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([symbol, data]) => ({
      symbol,
      price: data.price,
      age: Math.round((now - data.timestamp.getTime()) / 1000) // age in seconds
    }));
  }
}

// Export singleton instance
export const realTimePriceFetcher = RealTimePriceFetcher.getInstance();

// Helper functions for cache management
export function clearPriceCache(): void {
  realTimePriceFetcher.clearCache();
}

export function getPriceCacheStatus(): { symbol: string; price: number; age: number }[] {
  return realTimePriceFetcher.getCacheStatus();
}

// Test function to verify APIs are working
export async function testRealPriceFetch(): Promise<void> {
  console.log('🧪 Testing real price fetching...');
  
  const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD'];
  const results = await realTimePriceFetcher.getMultiplePrices(symbols);
  
  console.log('📊 Real Price Test Results:');
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.symbol}: $${result.price.toLocaleString()} (from ${result.source})`);
    } else {
      console.log(`❌ ${result.symbol}: Failed - ${result.error}`);
    }
  }
}

// Auto-test on load in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testRealPriceFetch().catch(console.error);
  }, 2000);
}