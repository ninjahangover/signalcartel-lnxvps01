import { krakenApiService } from './kraken-api-service';

export type TradingMode = 'paper' | 'live';

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: Date;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: Date;
}

export interface AccountData {
  totalValue: number;
  availableBalance: number;
  unrealizedPnL: number;
  realizedPnL: number;
  positions: Position[];
  orders: Order[];
  balances: Record<string, number>;
  lastUpdated: Date;
  tradingMode: TradingMode;
}

class TradingAccountService {
  private static instance: TradingAccountService;
  private currentMode: TradingMode = 'paper';
  private paperTradingData: AccountData | null = null;
  private liveAccountData: AccountData | null = null;
  private listeners: Set<(data: AccountData | null) => void> = new Set();

  private constructor() {
    // Initialize paper trading account with REAL Alpaca data
    this.initializePaperTradingAccount().catch(console.error);
  }

  static getInstance(): TradingAccountService {
    if (!TradingAccountService.instance) {
      TradingAccountService.instance = new TradingAccountService();
    }
    return TradingAccountService.instance;
  }

  private async initializePaperTradingAccount() {
    console.log('🔄 Initializing paper trading account with REAL Alpaca data...');
    
    try {
      // Import Alpaca service to get real account data
      const { alpacaPaperTradingService } = await import('./alpaca-paper-trading-service');
      
      // Get real account info from Alpaca API
      const realAccount = await alpacaPaperTradingService.getCurrentAccount();
      
      if (realAccount) {
        console.log('✅ Using REAL Alpaca account data for overview');
        this.paperTradingData = {
          totalValue: realAccount.equity, // REAL Alpaca equity
          availableBalance: realAccount.buyingPower, // REAL Alpaca buying power
          unrealizedPnL: 0, // Will be calculated from positions
          realizedPnL: 0, // Will be calculated from trade history
          positions: [], // Will be populated from Alpaca positions
          orders: [], // Will be populated from Alpaca orders
          balances: {
            'USD': realAccount.currentBalance, // REAL Alpaca balance
            'BTC': 0,
            'ETH': 0
          },
          lastUpdated: new Date(),
          tradingMode: 'paper'
        };
      } else {
        console.warn('⚠️ Could not get real Alpaca data, initializing with minimal data');
        this.paperTradingData = {
          totalValue: 0, // Will be updated when Alpaca connects
          availableBalance: 0,
          unrealizedPnL: 0,
          realizedPnL: 0,
          positions: [],
          orders: [],
          balances: {
            'USD': 0,
            'BTC': 0,
            'ETH': 0
          },
          lastUpdated: new Date(),
          tradingMode: 'paper'
        };
      }
    } catch (error) {
      console.error('❌ Failed to initialize with real Alpaca data:', error);
      // Fallback to minimal data structure
      this.paperTradingData = {
        totalValue: 0,
        availableBalance: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        positions: [],
        orders: [],
        balances: { 'USD': 0, 'BTC': 0, 'ETH': 0 },
        lastUpdated: new Date(),
        tradingMode: 'paper'
      };
    }
  }

  // Set trading mode
  setTradingMode(mode: TradingMode) {
    this.currentMode = mode;
    this.notifyListeners();
    console.log(`🔄 Trading mode switched to: ${mode}`);
  }

  getCurrentMode(): TradingMode {
    return this.currentMode;
  }

  // Get current account data based on mode (ALWAYS refreshes from real APIs)
  async getAccountData(): Promise<AccountData | null> {
    if (this.currentMode === 'paper') {
      // ALWAYS refresh paper trading data from real Alpaca API
      console.log('🔄 Refreshing paper trading data from Alpaca API...');
      await this.refreshPaperTradingData();
      return this.paperTradingData;
    } else {
      const liveData = await this.getLiveAccountData();
      // Return paper trading data as fallback if live data fails
      if (!liveData && this.paperTradingData) {
        console.warn('Live data unavailable, showing paper trading data as fallback');
        return { ...this.paperTradingData, tradingMode: 'live' };
      }
      return liveData;
    }
  }

  // Refresh paper trading data from real Alpaca API
  private async refreshPaperTradingData(): Promise<void> {
    try {
      const { alpacaPaperTradingService } = await import('./alpaca-paper-trading-service');
      
      // Get fresh account data from Alpaca
      const realAccount = await alpacaPaperTradingService.getCurrentAccount();
      
      if (realAccount) {
        console.log('✅ Refreshed with REAL Alpaca data:', {
          equity: `$${realAccount.equity.toLocaleString()}`,
          buyingPower: `$${realAccount.buyingPower.toLocaleString()}`
        });
        
        // Update with fresh real data
        if (this.paperTradingData) {
          this.paperTradingData.totalValue = realAccount.equity;
          this.paperTradingData.availableBalance = realAccount.buyingPower;
          this.paperTradingData.balances['USD'] = realAccount.currentBalance;
          this.paperTradingData.lastUpdated = new Date();
        } else {
          // Initialize if not exists
          await this.initializePaperTradingAccount();
        }
        
        // Notify listeners of updated data
        this.notifyListeners();
      } else {
        console.warn('⚠️ Could not refresh from Alpaca API');
      }
    } catch (error) {
      console.error('❌ Failed to refresh paper trading data:', error);
    }
  }

  // Get live account data from Kraken
  private async getLiveAccountData(): Promise<AccountData | null> {
    try {
      if (!krakenApiService.getConnectionStatus()) {
        throw new Error('Kraken API not connected');
      }

      const balance = await krakenApiService.getAccountBalance();
      if (balance.error && balance.error.length > 0) {
        throw new Error(balance.error[0]);
      }

      const balances = balance.result || {};
      let totalUSD = 0;
      const processedBalances: Record<string, number> = {};

      // Process balances and calculate total USD value
      Object.entries(balances).forEach(([currency, amount]) => {
        const numAmount = parseFloat(amount as string) || 0;
        processedBalances[currency] = numAmount;

        // Convert to USD (approximate - in real implementation, use live prices)
        if (currency === 'ZUSD') {
          totalUSD += numAmount;
        } else if (currency === 'XXBT') {
          totalUSD += numAmount * 50000; // Use real BTC price in production
        } else if (currency === 'XETH') {
          totalUSD += numAmount * 3000; // Use real ETH price in production
        }
      });

      // Get open orders (if API supports it)
      const openOrders: Order[] = [];
      
      // Get positions (calculate from balance changes)
      const positions: Position[] = [];

      this.liveAccountData = {
        totalValue: totalUSD,
        availableBalance: parseFloat(balances.ZUSD || '0'),
        unrealizedPnL: 0, // Calculate from positions
        realizedPnL: 0, // Calculate from trade history
        positions,
        orders: openOrders,
        balances: processedBalances,
        lastUpdated: new Date(),
        tradingMode: 'live'
      };

      return this.liveAccountData;

    } catch (error) {
      console.error('Failed to fetch live account data:', error);
      return null;
    }
  }

  // Execute trade (paper or live)
  async executeTrade(order: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    type: 'market' | 'limit';
    price?: number;
  }) {
    if (this.currentMode === 'paper') {
      return await this.executePaperTrade(order);
    } else {
      return await this.executeLiveTrade(order);
    }
  }

  // Execute paper trade
  private async executePaperTrade(order: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    type: 'market' | 'limit';
    price?: number;
  }) {
    if (!this.paperTradingData) return false;

    // Simulate market price (in real implementation, get from market data service)
    const marketPrice = order.price || this.getSimulatedPrice(order.symbol);
    const totalCost = order.amount * marketPrice;

    try {
      if (order.side === 'buy') {
        if (this.paperTradingData.availableBalance < totalCost) {
          throw new Error('Insufficient balance for paper trade');
        }

        // Execute buy
        this.paperTradingData.availableBalance -= totalCost;
        this.paperTradingData.balances['USD'] -= totalCost;

        // Add to positions or increase existing position
        const existingPosition = this.paperTradingData.positions.find(p => 
          p.symbol === order.symbol && p.side === 'long'
        );

        if (existingPosition) {
          // Average up the position
          const totalSize = existingPosition.size + order.amount;
          existingPosition.entryPrice = 
            ((existingPosition.entryPrice * existingPosition.size) + (marketPrice * order.amount)) / totalSize;
          existingPosition.size = totalSize;
        } else {
          // Create new position
          this.paperTradingData.positions.push({
            symbol: order.symbol,
            side: 'long',
            size: order.amount,
            entryPrice: marketPrice,
            currentPrice: marketPrice,
            pnl: 0,
            pnlPercent: 0,
            timestamp: new Date()
          });
        }

      } else {
        // Handle sell logic
        const position = this.paperTradingData.positions.find(p => 
          p.symbol === order.symbol && p.side === 'long'
        );

        if (position && position.size >= order.amount) {
          // Calculate P&L
          const pnl = (marketPrice - position.entryPrice) * order.amount;
          this.paperTradingData.realizedPnL += pnl;
          this.paperTradingData.availableBalance += totalCost;
          this.paperTradingData.balances['USD'] += totalCost;

          // Reduce position
          position.size -= order.amount;
          if (position.size === 0) {
            this.paperTradingData.positions = this.paperTradingData.positions.filter(p => p !== position);
          }
        }
      }

      // Update totals
      this.updatePaperTradingTotals();
      this.paperTradingData.lastUpdated = new Date();
      
      console.log(`📝 Paper trade executed: ${order.side.toUpperCase()} ${order.amount} ${order.symbol} @ $${marketPrice}`);
      this.notifyListeners();
      return true;

    } catch (error) {
      console.error('Paper trade failed:', error);
      return false;
    }
  }

  // Execute live trade through Kraken API
  private async executeLiveTrade(order: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    type: 'market' | 'limit';
    price?: number;
  }) {
    try {
      if (!krakenApiService.getConnectionStatus()) {
        throw new Error('Kraken API not connected');
      }

      // Convert to Kraken format
      const krakenPair = this.convertToKrakenPair(order.symbol);
      
      const orderParams = {
        pair: krakenPair,
        type: order.side,
        ordertype: order.type,
        volume: order.amount.toString(),
        price: order.price?.toString(),
        validate: false // Set to false for live trading
      };

      console.log(`💰 Executing live trade:`, orderParams);
      const result = await krakenApiService.placeOrder(orderParams);
      
      if (result.error && result.error.length > 0) {
        throw new Error(result.error[0]);
      }

      console.log(`✅ Live trade executed successfully:`, result);
      
      // Refresh account data
      await this.getLiveAccountData();
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Live trade failed:', error);
      return false;
    }
  }

  // Update paper trading totals
  private updatePaperTradingTotals() {
    if (!this.paperTradingData) return;

    let unrealizedPnL = 0;
    
    // Calculate unrealized P&L from positions
    this.paperTradingData.positions.forEach(position => {
      const currentPrice = this.getSimulatedPrice(position.symbol);
      position.currentPrice = currentPrice;
      position.pnl = (currentPrice - position.entryPrice) * position.size;
      position.pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      unrealizedPnL += position.pnl;
    });

    this.paperTradingData.unrealizedPnL = unrealizedPnL;
    this.paperTradingData.totalValue = 
      this.paperTradingData.availableBalance + 
      this.calculatePositionValue() + 
      unrealizedPnL;
  }

  private calculatePositionValue(): number {
    if (!this.paperTradingData) return 0;
    
    return this.paperTradingData.positions.reduce((total, position) => {
      return total + (position.size * position.currentPrice);
    }, 0);
  }

  // Get simulated price (replace with real market data)
  private getSimulatedPrice(symbol: string): number {
    // In production, get from market data service
    const prices: Record<string, number> = {
      'BTCUSD': 50000 + (Math.random() - 0.5) * 1000,
      'ETHUSD': 3000 + (Math.random() - 0.5) * 100,
      'XRPUSD': 0.60 + (Math.random() - 0.5) * 0.05
    };
    return prices[symbol] || 1;
  }

  private convertToKrakenPair(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'BTCUSD': 'XBTUSD',
      'ETHUSD': 'ETHUSD',
      'XRPUSD': 'XRPUSD'
    };
    return symbolMap[symbol] || symbol;
  }

  // Reset paper trading account
  resetPaperAccount() {
    this.initializePaperTradingAccount();
    console.log('📝 Paper trading account reset with real Alpaca data');
    this.notifyListeners();
  }

  // Subscribe to account data changes
  subscribe(callback: (data: AccountData | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.getAccountData().then(data => {
      this.listeners.forEach(callback => callback(data));
    });
  }

  // Get trading history
  getTradingHistory(limit = 50) {
    // Return combined history of paper and live trades
    // Implementation depends on how you want to store trade history
    return [];
  }
}

export const tradingAccountService = TradingAccountService.getInstance();
export default tradingAccountService;