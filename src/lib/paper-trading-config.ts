/**
 * SignalCartel Paper Trading Configuration
 * 
 * Centralized configuration for our custom paper trading platform
 */

export const PAPER_TRADING_CONFIG = {
  // Account Settings
  STARTING_BALANCE: 10000, // $10K - Realistic retail trader amount
  MAX_POSITION_SIZE: 0.1, // 10% max position size
  MAX_DAILY_TRADES: 50,
  
  // Trading Parameters
  DEFAULT_SYMBOLS: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'LINKUSD', 'ADAUSD'],
  MIN_TRADE_SIZE: 10, // $10 minimum trade
  MAX_TRADE_SIZE: 1000, // $1K maximum trade
  
  // Risk Management
  STOP_LOSS_PERCENTAGE: 5, // 5% stop loss
  TAKE_PROFIT_PERCENTAGE: 10, // 10% take profit
  MAX_DRAWDOWN: 20, // 20% max account drawdown
  
  // Strategy Settings
  CONFIDENCE_THRESHOLD: 0.7, // 70% minimum confidence for trades
  COOLDOWN_PERIOD: 60000, // 1 minute between trades per symbol
  
  // Display Settings
  CURRENCY_SYMBOL: '$',
  DECIMAL_PLACES: 2,
  
  // Alert Settings
  ALERT_ON_LARGE_TRADES: true,
  LARGE_TRADE_THRESHOLD: 500, // $500+
  ALERT_ON_LOSSES: true,
  LOSS_ALERT_THRESHOLD: 100, // $100+ loss
};

// Helper functions
export function formatCurrency(amount: number): string {
  return `${PAPER_TRADING_CONFIG.CURRENCY_SYMBOL}${amount.toFixed(PAPER_TRADING_CONFIG.DECIMAL_PLACES)}`;
}

export function calculatePositionSize(accountBalance: number, riskPercentage: number = 5): number {
  return Math.min(
    accountBalance * (riskPercentage / 100),
    accountBalance * PAPER_TRADING_CONFIG.MAX_POSITION_SIZE
  );
}

export function isTradeAllowed(tradeSize: number, accountBalance: number): boolean {
  return tradeSize >= PAPER_TRADING_CONFIG.MIN_TRADE_SIZE && 
         tradeSize <= PAPER_TRADING_CONFIG.MAX_TRADE_SIZE &&
         tradeSize <= accountBalance * PAPER_TRADING_CONFIG.MAX_POSITION_SIZE;
}

export default PAPER_TRADING_CONFIG;