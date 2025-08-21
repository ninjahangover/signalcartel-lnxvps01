/**
 * Alpaca Paper Trading Service
 * Executes trades on Alpaca's paper trading API
 */

import Alpaca from '@alpacahq/alpaca-trade-api';
import { TradingSignal } from './strategy-implementations';

export interface AlpacaConfig {
  keyId: string;
  secretKey: string;
  paper: boolean;
  baseUrl?: string;
}

export interface TradeExecution {
  orderId: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  status: string;
  filledQty?: number;
  filledAvgPrice?: number;
  timestamp: Date;
}

class AlpacaTradingService {
  private static instance: AlpacaTradingService;
  private alpaca: any;
  private isConnected: boolean = false;
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): AlpacaTradingService {
    if (!AlpacaTradingService.instance) {
      AlpacaTradingService.instance = new AlpacaTradingService();
    }
    return AlpacaTradingService.instance;
  }
  
  private initialize(): void {
    const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
    const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Alpaca API credentials not found');
      return;
    }
    
    try {
      this.alpaca = new Alpaca({
        keyId: apiKey,
        secretKey: apiSecret,
        paper: true,
        baseUrl: 'https://paper-api.alpaca.markets'
      });
      
      this.isConnected = true;
      console.log('✅ Alpaca paper trading service initialized');
      this.testConnection();
    } catch (error) {
      console.error('❌ Failed to initialize Alpaca:', error);
    }
  }
  
  private async testConnection(): Promise<void> {
    try {
      const account = await this.alpaca.getAccount();
      console.log(`✅ Alpaca connected - Account: $${parseFloat(account.equity).toLocaleString()}`);
      console.log(`   📊 Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
      console.log(`   📈 Paper Trading: ${account.trading_blocked ? 'BLOCKED' : 'ACTIVE'}`);
    } catch (error) {
      console.error('❌ Alpaca connection test failed:', error);
      this.isConnected = false;
    }
  }
  
  async executeTrade(signal: TradingSignal, symbol: string): Promise<TradeExecution | null> {
    if (!this.isConnected) {
      console.error('❌ Alpaca not connected');
      return null;
    }
    
    try {
      // Convert crypto symbol format (BTC/USD -> BTCUSD)
      const alpacaSymbol = symbol.replace('/', '');
      
      // Map signal action to Alpaca order
      let orderSide: 'buy' | 'sell';
      let orderQty: number;
      
      if (signal.action === 'BUY') {
        orderSide = 'buy';
        orderQty = signal.quantity;
      } else if (signal.action === 'SELL') {
        orderSide = 'sell';
        orderQty = signal.quantity;
      } else if (signal.action === 'CLOSE') {
        // Close existing position
        return await this.closePosition(alpacaSymbol);
      } else {
        console.log(`📊 HOLD signal - no trade executed`);
        return null;
      }
      
      // Create simple market order for crypto (bracket orders not supported)
      const order = await this.alpaca.createOrder({
        symbol: alpacaSymbol,
        qty: orderQty,
        side: orderSide,
        type: 'market',
        time_in_force: 'gtc'  // Good Till Canceled - required for crypto
      });
      
      // Note: Stop loss and take profit will be handled manually for crypto trades
      console.log(`📝 Note: Bracket orders not supported for crypto - using simple market order`);
      
      console.log(`✅ ALPACA TRADE EXECUTED!`);
      console.log(`   🎯 Action: ${signal.action}`);
      console.log(`   📊 Symbol: ${alpacaSymbol}`);
      console.log(`   💰 Quantity: ${orderQty}`);
      console.log(`   🛑 Stop Loss: $${signal.stopLoss.toLocaleString()}`);
      console.log(`   🎯 Take Profit: $${signal.takeProfit.toLocaleString()}`);
      console.log(`   📝 Reason: ${signal.reason}`);
      console.log(`   🆔 Order ID: ${order.id}`);
      
      // Send Telegram notification
      await this.sendTradeNotification(signal, alpacaSymbol, order);
      
      return {
        orderId: order.id,
        symbol: alpacaSymbol,
        qty: orderQty,
        side: orderSide,
        type: 'market',
        status: order.status,
        timestamp: new Date()
      };
      
    } catch (error: any) {
      console.error(`❌ Alpaca trade execution failed:`, error.message);
      if (error.response) {
        console.error(`   Details:`, error.response.data);
      }
      return null;
    }
  }
  
  async closePosition(symbol: string): Promise<TradeExecution | null> {
    try {
      const position = await this.alpaca.getPosition(symbol);
      
      if (!position) {
        console.log(`📊 No position to close for ${symbol}`);
        return null;
      }
      
      const order = await this.alpaca.closePosition(symbol);
      
      console.log(`✅ Position closed for ${symbol}`);
      console.log(`   💰 Quantity: ${position.qty}`);
      console.log(`   📈 P&L: $${parseFloat(position.unrealized_pl).toLocaleString()}`);
      
      return {
        orderId: order.id || 'close-' + Date.now(),
        symbol,
        qty: Math.abs(parseFloat(position.qty)),
        side: parseFloat(position.qty) > 0 ? 'sell' : 'buy',
        type: 'market',
        status: 'closed',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Failed to close position:`, error);
      return null;
    }
  }
  
  async getPositions(): Promise<any[]> {
    if (!this.isConnected) return [];
    
    try {
      const positions = await this.alpaca.getPositions();
      return positions;
    } catch (error) {
      console.error('❌ Failed to get positions:', error);
      return [];
    }
  }
  
  async getAccount(): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const account = await this.alpaca.getAccount();
      return account;
    } catch (error) {
      console.error('❌ Failed to get account:', error);
      return null;
    }
  }
  
  private async sendTradeNotification(signal: TradingSignal, symbol: string, order: any): Promise<void> {
    try {
      const { telegramBotService } = await import('./telegram-bot-service');
      const bot = telegramBotService;
      
      await bot.sendTradeAlert({
        type: 'TRADE_EXECUTED',
        strategy: 'SignalCartel Platform',
        symbol,
        action: signal.action as any,
        price: signal.price,
        quantity: signal.quantity,
        confidence: signal.confidence,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }
}

export const alpacaTradingService = AlpacaTradingService.getInstance();
export default alpacaTradingService;