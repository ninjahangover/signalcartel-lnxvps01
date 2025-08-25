/**
 * Strategy Integration Layer
 * Connects existing trading strategies to position management system
 */

import { positionService } from './position-service';
import { TradingSignal } from './position-manager';

export interface StrategySignal {
  strategy: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  confidence: number;
  reason?: string;
  timestamp?: Date;
  quantity?: number;
}

export class StrategyIntegration {
  
  /**
   * Process a signal from any trading strategy through position management
   */
  static async processStrategySignal(signal: StrategySignal) {
    console.log(`🎯 Processing ${signal.strategy} signal: ${signal.action} ${signal.symbol} @ $${signal.price} (confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
    
    // Convert strategy signal to trading signal format
    const tradingSignal: TradingSignal = {
      strategy: signal.strategy,
      symbol: signal.symbol,
      action: signal.action,
      price: signal.price,
      confidence: signal.confidence,
      quantity: signal.quantity || this.calculatePositionSize(signal),
      timestamp: signal.timestamp || new Date()
    };
    
    // Process through position management system
    const result = await positionService.processSignal(tradingSignal);
    
    // Log result
    if (result.action === 'opened') {
      console.log(`📈 ${signal.strategy}: OPENED ${result.position?.side} position for ${result.position?.symbol}`);
    } else if (result.action === 'closed') {
      console.log(`📉 ${signal.strategy}: CLOSED position with P&L: $${result.pnl?.toFixed(2)}`);
    } else {
      console.log(`⏸️ ${signal.strategy}: Signal ignored (${result.action})`);
    }
    
    return result;
  }
  
  /**
   * Calculate appropriate position size based on signal strength and risk management
   */
  private static calculatePositionSize(signal: StrategySignal): number {
    const basePositionValue = 100; // Base $100 position
    const confidenceMultiplier = Math.max(0.5, signal.confidence); // Min 50% of base size
    const maxPositionValue = 500; // Max $500 per position
    
    const positionValue = Math.min(basePositionValue * confidenceMultiplier, maxPositionValue);
    
    return Number((positionValue / signal.price).toFixed(6)); // Return quantity
  }
  
  /**
   * Integration for RSI Strategy
   */
  static async processRSISignal(
    symbol: string, 
    rsiValue: number, 
    price: number, 
    oversoldThreshold: number = 30, 
    overboughtThreshold: number = 70
  ) {
    let action: 'BUY' | 'SELL' | null = null;
    let confidence = 0;
    
    if (rsiValue <= oversoldThreshold) {
      action = 'BUY';
      confidence = Math.min(0.9, (oversoldThreshold - rsiValue) / oversoldThreshold + 0.5);
    } else if (rsiValue >= overboughtThreshold) {
      action = 'SELL';
      confidence = Math.min(0.9, (rsiValue - overboughtThreshold) / (100 - overboughtThreshold) + 0.5);
    }
    
    if (action) {
      return await this.processStrategySignal({
        strategy: 'rsi-strategy',
        symbol,
        action,
        price,
        confidence,
        reason: `RSI ${action === 'BUY' ? 'oversold' : 'overbought'} at ${rsiValue.toFixed(1)}`
      });
    }
    
    return null;
  }
  
  /**
   * Integration for Bollinger Bands Strategy
   */
  static async processBollingerSignal(
    symbol: string,
    price: number,
    upperBand: number,
    lowerBand: number,
    middle: number
  ) {
    let action: 'BUY' | 'SELL' | null = null;
    let confidence = 0;
    
    if (price <= lowerBand) {
      action = 'BUY';
      confidence = Math.min(0.9, (lowerBand - price) / (middle - lowerBand) + 0.6);
    } else if (price >= upperBand) {
      action = 'SELL';
      confidence = Math.min(0.9, (price - upperBand) / (upperBand - middle) + 0.6);
    }
    
    if (action) {
      return await this.processStrategySignal({
        strategy: 'bollinger-strategy',
        symbol,
        action,
        price,
        confidence,
        reason: `Price ${action === 'BUY' ? 'below lower' : 'above upper'} Bollinger Band`
      });
    }
    
    return null;
  }
  
  /**
   * Integration for Neural Network Strategy
   */
  static async processNeuralSignal(
    symbol: string,
    price: number,
    prediction: number, // Predicted price movement (-1 to 1)
    confidence: number  // Model confidence (0 to 1)
  ) {
    if (Math.abs(prediction) < 0.3 || confidence < 0.7) {
      return null; // Too weak signal
    }
    
    const action = prediction > 0 ? 'BUY' : 'SELL';
    const adjustedConfidence = Math.min(0.95, confidence * Math.abs(prediction));
    
    return await this.processStrategySignal({
      strategy: 'neural-strategy',
      symbol,
      action,
      price,
      confidence: adjustedConfidence,
      reason: `Neural prediction: ${(prediction * 100).toFixed(1)}% movement (${(confidence * 100).toFixed(1)}% confidence)`
    });
  }
  
  /**
   * Integration for Quantum Oscillator Strategy
   */
  static async processQuantumSignal(
    symbol: string,
    price: number,
    oscillatorValue: number, // Custom quantum oscillator value (-100 to 100)
    momentum: number        // Momentum indicator
  ) {
    let action: 'BUY' | 'SELL' | null = null;
    let confidence = 0;
    
    if (oscillatorValue < -50 && momentum > 0) {
      action = 'BUY';
      confidence = Math.min(0.9, Math.abs(oscillatorValue) / 100 + momentum * 0.3);
    } else if (oscillatorValue > 50 && momentum < 0) {
      action = 'SELL';
      confidence = Math.min(0.9, Math.abs(oscillatorValue) / 100 + Math.abs(momentum) * 0.3);
    }
    
    if (action) {
      return await this.processStrategySignal({
        strategy: 'quantum-oscillator',
        symbol,
        action,
        price,
        confidence,
        reason: `Quantum oscillator: ${oscillatorValue.toFixed(1)}, momentum: ${(momentum * 100).toFixed(1)}%`
      });
    }
    
    return null;
  }
  
  /**
   * Start position monitoring service (call this once in main trading loop)
   */
  static startPositionMonitoring() {
    console.log('🔄 Starting position monitoring service');
    positionService.startMonitoring(30000); // Monitor every 30 seconds
  }
  
  /**
   * Get current portfolio status
   */
  static async getPortfolioStatus() {
    return await positionService.getPortfolioSummary();
  }
  
  /**
   * Manually close a position (emergency use)
   */
  static async forceClosePosition(positionId: string, reason: string = 'manual_override') {
    return await positionService.forceClosePosition(positionId, reason);
  }
}

export default StrategyIntegration;