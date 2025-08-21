// Trading Platform Configuration
export const TRADING_CONFIG = {
  // Real Data Mode - Set to true to use live data only
  REAL_DATA_ONLY: true,
  
  // TRADING MODE ROUTING CONFIGURATION
  TRADING_MODES: {
    // Paper trading always uses Alpaca Paper API
    PAPER_TRADING_PLATFORM: 'alpaca',
    // Live trading always uses Kraken via webhook
    LIVE_TRADING_PLATFORM: 'kraken',
    // Default mode when not specified
    DEFAULT_MODE: 'paper'
  },
  
  // PAPER TRADING CONFIGURATION - Now using Alpaca as primary
  PAPER_TRADING: {
    // Primary platform for paper trading
    PRIMARY_PLATFORM: 'alpaca', // 'alpaca', 'kraken_futures', 'internal'
    
    // Alpaca Paper Trading Configuration
    ALPACA: {
      API_BASE_URL: 'https://paper-api.alpaca.markets',
      DATA_BASE_URL: 'https://data.alpaca.markets',
      API_KEY: process.env.ALPACA_PAPER_API_KEY || null,
      API_SECRET: process.env.ALPACA_PAPER_API_SECRET || null,
      // Note: Starting balance is pulled from Alpaca API (typically ~$2M)
      // No hardcoded balance - always use real account data
      AUTO_CYCLE: process.env.PAPER_TRADING_AUTO_CYCLE === 'true',
      MAX_ACCOUNT_AGE_HOURS: parseInt(process.env.PAPER_TRADING_MAX_ACCOUNT_AGE_HOURS || '168'), // 7 days
      MAX_TRADES: parseInt(process.env.PAPER_TRADING_MAX_TRADES || '1000'),
      MAX_DRAWDOWN_PERCENT: parseInt(process.env.PAPER_TRADING_MAX_DRAWDOWN_PERCENT || '50'),
      PRESERVE_HISTORY_DAYS: parseInt(process.env.PAPER_TRADING_PRESERVE_HISTORY_DAYS || '90')
    }
  },
  
  // REAL TRADING CONFIGURATION - Kraken for live trading only
  KRAKEN_API: {
    // Real Kraken API for live trading only
    USE_REAL_API: true,
    USE_DEMO_FUTURES: false,
    PUBLIC_API_URL: 'https://api.kraken.com/0/public',
    PRIVATE_API_URL: 'https://api.kraken.com/0/private',
    
    // Real API Credentials for live trading
    API_KEY: process.env.KRAKEN_API_KEY || null,
    API_SECRET: process.env.KRAKEN_API_SECRET || null,
    
    // Rate limiting
    REQUEST_RATE_LIMIT: 1000,
    MAX_REQUESTS_PER_MINUTE: 30,
  },
  
  // Market Data Configuration
  MARKET_DATA: {
    // Polling interval for real-time data (increased to prevent rate limiting)
    POLLING_INTERVAL: 30000, // 30 seconds - much more reasonable for Kraken API
    
    // Data sources priority
    USE_REAL_PRICES_ONLY: true,
    
    // Supported trading pairs
    SUPPORTED_PAIRS: [
      'BTCUSD', // Bitcoin
      'ETHUSD', // Ethereum
      'ADAUSD', // Cardano
      'DOTUSD', // Polkadot
    ]
  },
  
  // Development vs Production
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // Logging
  ENABLE_API_LOGGING: true,
  ENABLE_PERFORMANCE_LOGGING: true,
} as const;

// Helper function to check if we're in real data mode
export function isRealDataMode(): boolean {
  return TRADING_CONFIG.REAL_DATA_ONLY;
}

// Helper function to check environment
export function isProduction(): boolean {
  return TRADING_CONFIG.ENVIRONMENT === 'production';
}

// Helper function to determine platform based on trading mode
export function getPlatformForTradingMode(mode: string): 'alpaca' | 'kraken' {
  if (mode === 'live') {
    return TRADING_CONFIG.TRADING_MODES.LIVE_TRADING_PLATFORM as 'kraken';
  } else {
    return TRADING_CONFIG.TRADING_MODES.PAPER_TRADING_PLATFORM as 'alpaca';
  }
}

// Helper function to get execution method description
export function getExecutionMethodDescription(mode: string): string {
  if (mode === 'live') {
    return 'Kraken Live Trading via kraken.circuitcartel.com/webhook';
  } else {
    return 'Alpaca Paper Trading via Direct API';
  }
}

export default TRADING_CONFIG;