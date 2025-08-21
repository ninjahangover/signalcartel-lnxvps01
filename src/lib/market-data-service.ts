import { TRADING_CONFIG } from './config';

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  volume: number;
  changePercent: number;
  timestamp: number;
  close?: number; // For historical data
}

interface Subscriber {
  symbol: string;
  callback: (data: MarketData) => void;
}

class MarketDataService {
  private static instance: MarketDataService | null = null;
  private subscribers: Subscriber[] = [];
  private marketData: Map<string, MarketData> = new Map();
  private isPolling = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private userAssets: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  subscribe(symbol: string, callback: (data: MarketData) => void): () => void {
    const subscriber: Subscriber = { symbol, callback };
    this.subscribers.push(subscriber);
    console.log(`📡 Market Data: New subscription for ${symbol} (total subscribers: ${this.subscribers.length})`);

    // Send current data if available
    const currentData = this.marketData.get(symbol);
    if (currentData) {
      console.log(`📡 Market Data: Sending current data for ${symbol} to new subscriber`);
      callback(currentData);
    }

    // Start polling if not already polling
    if (!this.isPolling) {
      this.startPolling();
    }

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }

      // Stop polling if no subscribers
      if (this.subscribers.length === 0) {
        this.stopPolling();
      }
    };
  }

  setUserAssets(assets: string[]): void {
    // Filter assets to only include supported trading pairs
    const validAssets = assets.filter(asset => {
      // Skip pure currency codes that need USD pairing
      if (['ZUSD', 'USD', 'EUR', 'GBP', 'CAD', 'JPY', 'CHF', 'AUD'].includes(asset)) {
        return false;
      }
      
      // Check if we have a mapping for this asset
      const hasMapping = this.convertToKrakenPair(asset) !== null;
      if (!hasMapping) {
        console.warn(`⚠️ Skipping unsupported asset: ${asset} (no Kraken mapping)`);
      }
      return hasMapping;
    });
    
    this.userAssets = new Set(validAssets);
    
    // Always include core trading pairs that we know work
    const corePairs = ['BTCUSD', 'ETHUSD', 'XRPUSD'];
    for (const pair of corePairs) {
      if (this.convertToKrakenPair(pair)) {
        this.userAssets.add(pair);
      }
    }

    console.log('📊 Market data service updated user assets (filtered):', Array.from(this.userAssets));
    console.log('📊 Total valid symbols:', this.userAssets.size);
  }

  startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log('Market data service: Starting polling');

    // Initial fetch
    this.fetchMarketData();

    // Set up polling interval based on configuration
    this.pollingInterval = setInterval(() => {
      this.fetchMarketData();
    }, TRADING_CONFIG.MARKET_DATA.POLLING_INTERVAL);
  }

  stopPolling(): void {
    if (!this.isPolling) return;

    this.isPolling = false;
    console.log('📊 Market data service: Stopping polling');

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Clear failed attempts for all symbols (useful for reset)
   */
  clearFailedAttempts(): void {
    this.failedAttempts.clear();
    this.lastFetchAttempt.clear();
    console.log('📊 Market data service: Cleared all failed attempts');
  }

  /**
   * Get status of symbol fetch attempts
   */
  getSymbolStatus(): { symbol: string; failedAttempts: number; lastAttempt: Date | null }[] {
    const symbols = this.getSymbolsToFetch();
    return symbols.map(symbol => ({
      symbol,
      failedAttempts: this.failedAttempts.get(symbol) || 0,
      lastAttempt: this.lastFetchAttempt.has(symbol) ? new Date(this.lastFetchAttempt.get(symbol)!) : null
    }));
  }

  private async fetchMarketData(): Promise<void> {
    try {
      // Get list of symbols to fetch
      const symbolsToFetch = this.getSymbolsToFetch();

      if (symbolsToFetch.length === 0) {
        // If no specific symbols, fetch popular ones
        symbolsToFetch.push('BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD');
      }

      // Fetch data for each symbol
      for (const symbol of symbolsToFetch) {
        await this.fetchSymbolData(symbol);
      }

    } catch (error) {
      console.error('Market data service: Error fetching market data:', error);
    }
  }

  private getSymbolsToFetch(): string[] {
    const symbols = new Set<string>();

    // Add symbols that have subscribers
    for (const subscriber of this.subscribers) {
      symbols.add(subscriber.symbol);
    }

    // Add user assets (always include Bitcoin)
    for (const asset of this.userAssets) {
      symbols.add(asset);
    }

    return Array.from(symbols);
  }

  private failedAttempts: Map<string, number> = new Map();
  private lastFetchAttempt: Map<string, number> = new Map();

  private async fetchSymbolData(symbol: string): Promise<void> {
    const now = Date.now();
    const failedCount = this.failedAttempts.get(symbol) || 0;
    const lastAttempt = this.lastFetchAttempt.get(symbol) || 0;

    // Exponential backoff for failed symbols (1s, 2s, 4s, 8s, max 60s)
    const backoffDelay = Math.min(1000 * Math.pow(2, failedCount), 60000);
    
    if (failedCount > 0 && (now - lastAttempt) < backoffDelay) {
      // Skip this symbol due to backoff
      return;
    }

    this.lastFetchAttempt.set(symbol, now);

    try {
      // Check if symbol has valid Kraken mapping before attempting fetch
      const krakenPair = this.convertToKrakenPair(symbol);
      if (!krakenPair) {
        console.warn(`📈 Market Data: No Kraken mapping for ${symbol} - skipping permanently`);
        this.failedAttempts.set(symbol, 10); // Mark as permanently failed
        return;
      }

      console.log(`📈 Market Data: Fetching REAL price for ${symbol} from Kraken API`);

      const realData = await this.fetchRealKrakenPrice(symbol);

      if (!realData) {
        throw new Error(`Failed to get real price data for ${symbol}`);
      }

      if (realData.price <= 0) {
        throw new Error(`Invalid price data received: $${realData.price}`);
      }

      // Success! Reset failed attempts
      this.failedAttempts.delete(symbol);
      
      const marketData = realData;
      console.log(`✅ Market Data: Got REAL price for ${symbol}: $${realData.price.toLocaleString()}`);

      this.marketData.set(symbol, marketData);

      // Notify subscribers for this symbol
      const symbolSubscribers = this.subscribers.filter(s => s.symbol === symbol);
      console.log(`📡 Market Data: Notifying ${symbolSubscribers.length} subscribers for ${symbol}`);
      
      for (const subscriber of symbolSubscribers) {
        try {
          subscriber.callback(marketData);
        } catch (callbackError) {
          console.error(`Error in subscriber callback for ${symbol}:`, callbackError);
        }
      }

    } catch (error) {
      // Increment failed attempts
      const newFailedCount = failedCount + 1;
      this.failedAttempts.set(symbol, newFailedCount);
      
      if (newFailedCount <= 3) {
        console.warn(`⚠️ Market Data: Failed to fetch ${symbol} (attempt ${newFailedCount}/3):`, error);
      } else if (newFailedCount === 10) {
        console.error(`❌ Market Data: Permanently disabling ${symbol} after repeated failures`);
      } else if (newFailedCount < 10) {
        console.error(`❌ Market Data: Failed to fetch ${symbol} (attempt ${newFailedCount}, backing off):`, error);
      }
    }
  }

  private async fetchRealKrakenPrice(symbol: string): Promise<MarketData | null> {
    try {
      // Convert symbol to Kraken format
      const krakenPair = this.convertToKrakenPair(symbol);
      if (!krakenPair) {
        console.warn(`📈 Market Data: No Kraken pair mapping for ${symbol} - skipping`);
        return null;
      }

      // Add rate limiting delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between requests

      console.log(`📈 Market Data: Calling Kraken API for pair ${krakenPair}`);

      // Call Kraken's public Ticker API directly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        // Call Kraken API directly - no proxy needed for public endpoints
        const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenPair}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Signal-Cartel-Trading-Bot/1.0',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.error && data.error.length > 0) {
          console.error(`📈 Market Data: Kraken API error for ${krakenPair}:`, data.error);
          throw new Error(`Kraken API error: ${data.error.join(', ')}`);
        }

        if (data.result && Object.keys(data.result).length > 0) {
          const pairData = Object.values(data.result)[0] as any;
          
          // Validate that we have valid price data
          if (!pairData.c || !pairData.c[0] || parseFloat(pairData.c[0]) <= 0) {
            throw new Error(`Invalid price data received for ${krakenPair}`);
          }

          const price = parseFloat(pairData.c[0]); // Current price
          const high = parseFloat(pairData.h[0]) || price;  // 24h high
          const low = parseFloat(pairData.l[0]) || price;   // 24h low
          const volume = parseFloat(pairData.v[0]) || 0; // 24h volume
          const bid = parseFloat(pairData.b[0]) || price;   // Bid price
          const ask = parseFloat(pairData.a[0]) || price;   // Ask price
          const open = parseFloat(pairData.o) || price; // Open price

          console.log(`✅ Market Data: Successfully fetched ${symbol}: $${price.toLocaleString()}`);

          return {
            symbol,
            price,
            bid,
            ask,
            high24h: high,
            low24h: low,
            volume,
            changePercent: ((price - open) / open) * 100, // % change from open
            timestamp: Date.now()
          };
        }

        console.warn(`📈 Market Data: No data returned for ${krakenPair}`);
        return null;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`❌ Market Data: Error fetching real price for ${symbol}:`, error);
      return null;
    }
  }

  private convertToKrakenPair(symbol: string): string | null {
    // Convert our symbol format to Kraken's pair format
    const krakenPairs: { [key: string]: string } = {
      // Bitcoin pairs
      'BTCUSD': 'XBTUSD',
      'XBTUSD': 'XBTUSD',
      'XXBTUSD': 'XBTUSD',
      'XXBT': 'XBTUSD',
      
      // Ethereum pairs
      'ETHUSD': 'XETHZUSD', 
      'XETHUSD': 'XETHZUSD',
      'XETH': 'XETHZUSD',
      'ETHEUR': 'XETHZEUR',
      
      // XRP pairs
      'XRPUSD': 'XXRPZUSD',
      'XXRPUSD': 'XXRPZUSD',
      'XXRP': 'XXRPZUSD',
      'XRPEUR': 'XXRPZEUR',
      
      // Litecoin pairs
      'LTCUSD': 'XLTCZUSD',
      'XLTCUSD': 'XLTCZUSD',
      'XLTC': 'XLTCZUSD',
      
      // Dogecoin pairs
      'DOGEUSD': 'XDGUSD',
      'XDGUSD': 'XDGUSD',
      'XDOGE': 'XDGUSD',
      
      // Cardano pairs
      'ADAUSD': 'ADAUSD',
      'ADA': 'ADAUSD',
      
      // Solana pairs  
      'SOLUSD': 'SOLUSD',
      'SOL': 'SOLUSD',
      
      // Other popular pairs
      'MATICUSD': 'MATICUSD',
      'MATIC': 'MATICUSD',
      'LINKUSD': 'LINKUSD', 
      'LINK': 'LINKUSD',
      'ALGOUSD': 'ALGOUSD',
      'ALGO': 'ALGOUSD',
      'ATOMUSD': 'ATOMUSD',
      'ATOM': 'ATOMUSD',
      'DOTUSD': 'DOTUSD',
      'DOT': 'DOTUSD',
      'AVAXUSD': 'AVAXUSD',
      'AVAX': 'AVAXUSD',
      'UNIUSD': 'UNIUSD',
      'UNI': 'UNIUSD',
      
      // Euro pairs
      'BTCEUR': 'XXBTZEUR',
      
      // GBP pairs  
      'BTCGBP': 'XXBTZGBP',
      'ETHGBP': 'XETHZGBP',
    };

    const pair = krakenPairs[symbol];
    if (!pair) {
      console.warn(`📈 Market Data: No Kraken pair mapping found for symbol: ${symbol}`);
      return null;
    }
    
    return pair;
  }

  // REMOVED: generateMockData function - NO FAKE DATA ALLOWED

  getCurrentData(symbol: string): MarketData | null {
    return this.marketData.get(symbol) || null;
  }

  getAllData(): Map<string, MarketData> {
    return new Map(this.marketData);
  }

  getPrice(symbol: string): number {
    const data = this.marketData.get(symbol);
    return data ? data.price : 0;
  }

  // Method to get prices for portfolio calculation - only real prices
  getPrices(symbols: string[]): { [symbol: string]: number } {
    const prices: { [symbol: string]: number } = {};

    for (const symbol of symbols) {
      const data = this.marketData.get(symbol);
      if (data && data.price > 0) {
        prices[symbol] = data.price;
        console.log(`💰 Real price for ${symbol}: $${data.price.toLocaleString()}`);
      } else {
        console.warn(`⚠️ No real price data available for ${symbol}`);
        // Only include USD as 1.0, skip other assets without real data
        if (symbol === 'ZUSD' || symbol === 'USD') {
          prices[symbol] = 1.0;
        } else {
          // Don't include assets without real price data
          prices[symbol] = 0;
        }
      }
    }

    return prices;
  }

  // Get historical data for technical analysis
  async getHistoricalData(symbol: string, periods: number): Promise<MarketData[]> {
    try {
      // For now, return current data repeated (in production, fetch from Kraken OHLC endpoint)
      const currentData = this.marketData.get(symbol);
      if (!currentData) {
        // Try to fetch fresh data
        const freshData = await this.fetchRealKrakenPrice(symbol);
        if (!freshData) {
          return [];
        }
        // Create historical array from fresh data (no random variations)
        return Array(periods).fill(null).map((_, i) => ({
          ...freshData,
          timestamp: Date.now() - (i * 60000), // 1 minute intervals
          close: freshData.price // Use actual price - no fake variations
        }));
      }
      
      // Generate historical data points based on current data (no random variations)
      const historicalData: MarketData[] = [];
      for (let i = 0; i < periods; i++) {
        historicalData.push({
          ...currentData,
          timestamp: Date.now() - (i * 60000), // 1 minute intervals
          close: currentData.price, // Use actual price - no fake variations
          volume: currentData.volume || 1000
        });
      }
      
      return historicalData.reverse(); // Oldest first
    } catch (error) {
      console.error(`Failed to get historical data for ${symbol}:`, error);
      return [];
    }
  }
}

// Export the singleton instance directly as default (no .getInstance() needed)
const marketDataService = MarketDataService.getInstance();
export default marketDataService;

// Also export the class for cases where .getInstance() is needed
export { MarketDataService };
