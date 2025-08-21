// Simple real market data fetcher for paper trading synchronization
export interface RealMarketPrice {
  symbol: string;
  price: number;
  timestamp: number;
}

class RealMarketDataService {
  private static instance: RealMarketDataService | null = null;
  private priceCache: Map<string, RealMarketPrice> = new Map();
  private lastFetch = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): RealMarketDataService {
    if (!RealMarketDataService.instance) {
      RealMarketDataService.instance = new RealMarketDataService();
    }
    return RealMarketDataService.instance;
  }

  // Get current real market price for a symbol
  async getCurrentPrice(symbol: string): Promise<number> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const cached = this.priceCache.get(normalizedSymbol);
    const now = Date.now();

    // Use cached price if it's fresh
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.price;
    }

    // Fetch new price
    try {
      const price = await this.fetchRealPrice(normalizedSymbol);
      this.priceCache.set(normalizedSymbol, {
        symbol: normalizedSymbol,
        price,
        timestamp: now
      });
      return price;
    } catch (error) {
      console.error(`Failed to fetch real price for ${normalizedSymbol}:`, error);
      // Return cached price if available, otherwise FAIL - NO FAKE PRICES
      if (cached?.price) {
        console.warn(`Using cached price for ${normalizedSymbol}: $${cached.price}`);
        return cached.price;
      }
      throw new Error(`No real price data available for ${normalizedSymbol}`);
    }
  }

  // Fetch multiple prices at once with timeout protection
  async getMultiplePrices(symbols: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    
    // Process in smaller batches to prevent timeout
    const BATCH_SIZE = 3;
    const batches = [];
    
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      batches.push(symbols.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📊 Fetching prices for ${symbols.length} symbols in ${batches.length} batches...`);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (symbol) => {
        try {
          // Add timeout protection per symbol
          const price = await Promise.race([
            this.getCurrentPrice(symbol),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Symbol fetch timeout')), 8000)
            )
          ]);
          results.set(symbol, price);
          console.log(`✅ Got price for ${symbol}: $${price.toFixed(2)}`);
        } catch (error) {
          console.error(`❌ Failed to fetch price for ${symbol}:`, error);
          // NO FAKE PRICES - Skip symbols without real data
          console.warn(`⏭️ Skipping ${symbol} - no real price data available`);
        }
      });

      // Process batch with timeout
      try {
        await Promise.allSettled(batchPromises);
        // Small delay between batches to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Batch processing error:`, error);
      }
    }
    
    console.log(`📊 Successfully fetched ${results.size}/${symbols.length} prices`);
    return results;
  }

  // Fetch real price from API
  private async fetchRealPrice(symbol: string): Promise<number> {
    // Try multiple data sources for reliability
    
    // 1. Try CoinGecko (free, reliable)
    try {
      const cgPrice = await this.fetchFromCoinGecko(symbol);
      if (cgPrice > 0) return cgPrice;
    } catch (error) {
      console.warn('CoinGecko fetch failed:', error);
    }

    // 2. Try Binance (as fallback)
    try {
      const binancePrice = await this.fetchFromBinance(symbol);
      if (binancePrice > 0) return binancePrice;
    } catch (error) {
      console.warn('Binance fetch failed:', error);
    }

    // 3. Final fallback - return reasonable current price
    throw new Error(`No price data available for ${symbol}`);
  }

  // Fetch from CoinGecko
  private async fetchFromCoinGecko(symbol: string): Promise<number> {
    const coinId = this.symbolToCoinGeckoId(symbol);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data[coinId]?.usd;
    
    if (typeof price !== 'number' || price <= 0) {
      throw new Error(`Invalid price data from CoinGecko: ${price}`);
    }
    
    return price;
  }

  // Fetch from Binance
  private async fetchFromBinance(symbol: string): Promise<number> {
    const binanceSymbol = this.symbolToBinanceSymbol(symbol);
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
      { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    const price = parseFloat(data.price);
    
    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid price data from Binance: ${data.price}`);
    }
    
    return price;
  }

  // Symbol mappings
  private normalizeSymbol(symbol: string): string {
    return symbol.toUpperCase().replace(/[^A-Z]/g, '');
  }

  private symbolToCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'BTCUSD': 'bitcoin',
      'ETH': 'ethereum',
      'ETHUSD': 'ethereum',
      'ADA': 'cardano',
      'ADAUSD': 'cardano',
      'SOL': 'solana',
      'SOLUSD': 'solana',
      'DOGE': 'dogecoin',
      'DOGEUSD': 'dogecoin',
      'DOT': 'polkadot',
      'DOTUSD': 'polkadot'
    };
    
    const normalized = this.normalizeSymbol(symbol);
    return mapping[normalized] || mapping[normalized.replace('USD', '')] || 'bitcoin';
  }

  private symbolToBinanceSymbol(symbol: string): string {
    const normalized = this.normalizeSymbol(symbol);
    if (normalized.endsWith('USD')) {
      return normalized.replace('USD', 'USDT');
    }
    return normalized + 'USDT';
  }

  // REMOVED: getFallbackPrice() - NO FAKE PRICES ALLOWED

  // Clear cache (useful for testing)
  clearCache(): void {
    this.priceCache.clear();
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const realMarketData = RealMarketDataService.getInstance();

// Export helper functions
export async function getCurrentBTCPrice(): Promise<number> {
  return realMarketData.getCurrentPrice('BTCUSD');
}

export async function getCurrentETHPrice(): Promise<number> {
  return realMarketData.getCurrentPrice('ETHUSD');
}

export async function getRealPricesForPaperTrading(): Promise<Map<string, number>> {
  const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD'];
  return realMarketData.getMultiplePrices(symbols);
}