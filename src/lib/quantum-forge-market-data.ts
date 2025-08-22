// QUANTUM FORGE™ Market Data Service
// Uses the same data that QUANTUM FORGE™ trading system uses

export interface QuantumForgeMarketPrice {
  symbol: string;
  price: number;
  timestamp: number;
  source: 'database' | 'api';
}

class QuantumForgeMarketDataService {
  private static instance: QuantumForgeMarketDataService | null = null;
  private priceCache: Map<string, QuantumForgeMarketPrice> = new Map();
  private lastFetch = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds - faster updates for live charts

  static getInstance(): QuantumForgeMarketDataService {
    if (!QuantumForgeMarketDataService.instance) {
      QuantumForgeMarketDataService.instance = new QuantumForgeMarketDataService();
    }
    return QuantumForgeMarketDataService.instance;
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    const now = Date.now();
    const cached = this.priceCache.get(symbol);
    
    // Return cached price if it's fresh
    if (cached && (now - this.lastFetch) < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      // First try to get REAL live price from Kraken API
      const apiResponse = await fetch(`/api/market-data/${symbol}`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const price = apiData.price;
        
        // Cache the price
        this.priceCache.set(symbol, {
          symbol,
          price,
          timestamp: now,
          source: 'api'
        });
        
        this.lastFetch = now;
        return price;
      }

      // Fallback to database if live API fails
      const dbResponse = await fetch(`/api/market-data?symbol=${symbol}&limit=1`);
      
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.success && dbData.data && dbData.data.length > 0) {
          const latestPrice = dbData.data[dbData.data.length - 1];
          const price = latestPrice.price;
          
          // Cache the price
          this.priceCache.set(symbol, {
            symbol,
            price,
            timestamp: now,
            source: 'database'
          });
          
          this.lastFetch = now;
          return price;
        }
      }

      // If both fail, return cached price if available
      if (cached) {
        console.warn(`Using stale cached price for ${symbol}`);
        return cached.price;
      }

      // Last resort: reasonable default prices
      const defaultPrices: { [key: string]: number } = {
        'BTCUSD': 116000,
        'ETHUSD': 4800,
        'SOLUSD': 198,
        'ADAUSD': 0.93,
        'LINKUSD': 27
      };

      const defaultPrice = defaultPrices[symbol] || 100;
      console.warn(`Using default price for ${symbol}: $${defaultPrice}`);
      return defaultPrice;

    } catch (error) {
      console.error(`Error fetching QUANTUM FORGE™ price for ${symbol}:`, error);
      
      // Return cached price if available
      if (cached) {
        return cached.price;
      }
      
      // Return reasonable default
      return symbol === 'BTCUSD' ? 116000 : 100;
    }
  }

  // Get price history for charting
  async getPriceHistory(symbol: string, timeframe: string = '1H', limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(`/api/market-data?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      
      console.warn(`Failed to fetch price history for ${symbol}`);
      return [];
    } catch (error) {
      console.error(`Error fetching price history for ${symbol}:`, error);
      return [];
    }
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.priceCache.clear();
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const quantumForgeMarketData = QuantumForgeMarketDataService.getInstance();