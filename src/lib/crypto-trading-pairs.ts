/**
 * Comprehensive Crypto Trading Pairs Configuration
 * Top 100 crypto assets with USD and USDT pairs
 */

export interface CryptoPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
  marketCap?: number;
  isActive: boolean;
  exchanges: string[];
}

// Top 100 crypto assets
export const TOP_CRYPTO_ASSETS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'DOGE', 'TON', 'ADA',
  'SHIB', 'AVAX', 'TRX', 'WBTC', 'DOT', 'LINK', 'BCH', 'NEAR', 'MATIC', 'ICP',
  'UNI', 'DAI', 'LTC', 'APT', 'LEO', 'STX', 'HBAR', 'CRO', 'XLM', 'ATOM',
  'MNT', 'OKB', 'ETC', 'IMX', 'INJ', 'FIL', 'OP', 'ARB', 'VET', 'LDO',
  'ALGO', 'THETA', 'SAND', 'FLOW', 'MANA', 'AXS', 'XTZ', 'GRT', 'EGLD',
  'APE', 'CHZ', 'QNT', 'AAVE', 'KCS', 'FTM', 'SNX', 'RUNE', 'GMT', 'CRV',
  'LRC', 'KAVA', 'ZEC', 'DASH', 'ENJ', 'BAT', 'COMP', 'YFI', 'SUSHI', 'REN',
  'UMA', 'BNT', 'KNC', 'ZRX', 'STORJ', 'BAND', 'BAL', 'NMR', 'MLN', 'REP',
  'CELR', 'SKL', 'ANKR', 'OGN', 'NKN', 'CVC', 'CTSI', 'DATA', 'KEEP', 'NU',
  'OCEAN', 'FET', 'AST', 'MKR', 'LOOM', 'DNT', 'GNO', 'LPT', 'SPELL', 'CVX'
];

// Generate all USD and USDT pairs
export function generateCryptoPairs(): CryptoPair[] {
  const pairs: CryptoPair[] = [];
  
  // Skip stablecoins as base assets against USD/USDT
  const skipAssets = ['USDT', 'USDC', 'DAI', 'BUSD'];
  
  TOP_CRYPTO_ASSETS
    .filter(asset => !skipAssets.includes(asset))
    .forEach(asset => {
      // USD pairs
      pairs.push({
        symbol: `${asset}USD`,
        baseAsset: asset,
        quoteAsset: 'USD',
        displayName: `${asset}/USD`,
        isActive: true,
        exchanges: ['alpaca', 'binance', 'coinbase']
      });
      
      // USDT pairs
      pairs.push({
        symbol: `${asset}USDT`,
        baseAsset: asset,
        quoteAsset: 'USDT',
        displayName: `${asset}/USDT`,
        isActive: true,
        exchanges: ['binance', 'kraken']
      });
    });
  
  return pairs.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

// Get all available trading pairs
export const CRYPTO_TRADING_PAIRS = generateCryptoPairs();

// Popular pairs for quick selection
export const POPULAR_PAIRS = [
  'BTCUSD', 'BTCUSDT', 'ETHUSD', 'ETHUSDT', 'SOLUSD', 'SOLUSDT',
  'ADAUSD', 'ADAUSDT', 'DOGEUSD', 'DOGEUSDT', 'LINKUSD', 'LINKUSDT',
  'AVAXUSD', 'AVAXUSDT', 'MATICUSD', 'MATICUSDT', 'DOTUSD', 'DOTUSDT'
];

// Default trading pairs for different use cases
export const DEFAULT_PAIRS = {
  TESTING: 'BTCUSD',
  LIVE_TRADING: 'ETHUSD',
  PAPER_TRADING: 'BTCUSD',
  BACKTESTING: 'BTCUSDT'
};

// Get pair info by symbol
export function getPairInfo(symbol: string): CryptoPair | undefined {
  return CRYPTO_TRADING_PAIRS.find(pair => pair.symbol === symbol);
}

// Get pairs by base asset
export function getPairsByBaseAsset(baseAsset: string): CryptoPair[] {
  return CRYPTO_TRADING_PAIRS.filter(pair => pair.baseAsset === baseAsset);
}

// Get pairs by quote asset
export function getPairsByQuoteAsset(quoteAsset: string): CryptoPair[] {
  return CRYPTO_TRADING_PAIRS.filter(pair => pair.quoteAsset === quoteAsset);
}

// Search pairs by name or symbol
export function searchPairs(query: string): CryptoPair[] {
  const lowercaseQuery = query.toLowerCase();
  return CRYPTO_TRADING_PAIRS.filter(pair => 
    pair.symbol.toLowerCase().includes(lowercaseQuery) ||
    pair.displayName.toLowerCase().includes(lowercaseQuery) ||
    pair.baseAsset.toLowerCase().includes(lowercaseQuery)
  );
}

// Get supported exchanges for a pair
export function getSupportedExchanges(symbol: string): string[] {
  const pair = getPairInfo(symbol);
  return pair?.exchanges || [];
}

// Validate if a trading pair is supported
export function isValidTradingPair(symbol: string): boolean {
  return CRYPTO_TRADING_PAIRS.some(pair => pair.symbol === symbol);
}

// Group pairs by base asset for UI display
export function groupPairsByBaseAsset(): Record<string, CryptoPair[]> {
  const grouped: Record<string, CryptoPair[]> = {};
  
  CRYPTO_TRADING_PAIRS.forEach(pair => {
    if (!grouped[pair.baseAsset]) {
      grouped[pair.baseAsset] = [];
    }
    grouped[pair.baseAsset].push(pair);
  });
  
  return grouped;
}

// Get market data symbols for data collection
export function getMarketDataSymbols(limit: number = 20): string[] {
  return POPULAR_PAIRS.slice(0, limit);
}

// Default symbols for different services
export const SERVICE_DEFAULTS = {
  MARKET_DATA: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'LINKUSD'],
  PAPER_TRADING: ['BTCUSD', 'ETHUSD', 'ADAUSD'],
  LIVE_TRADING: ['BTCUSD', 'ETHUSD'],
  AI_OPTIMIZATION: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'LINKUSD', 'AVAXUSD', 'MATICUSD', 'DOTUSD']
};