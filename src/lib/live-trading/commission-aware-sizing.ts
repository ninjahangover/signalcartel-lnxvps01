/**
 * QUANTUM FORGE™ Commission-Aware Position Sizing
 * 
 * Intelligent position sizing that accounts for trading commissions
 * and ensures profitable trades even with small account sizes
 */

export interface CommissionConfig {
  makerFee: number;      // Kraken: 0.0016 (0.16%)
  takerFee: number;      // Kraken: 0.0026 (0.26%)
  accountSize: number;   // Total account balance
  maxPositionPct: number; // Max % of account per trade (0.2 = 20%)
  minConfidence: number;  // Minimum confidence to trade (0.75 = 75%)
  minProfitTarget: number; // Minimum profit target % (0.012 = 1.2%)
}

export interface TradeSizing {
  shouldTrade: boolean;
  positionSize: number;    // Dollar amount to trade
  positionPct: number;     // Percentage of account
  expectedProfit: number;  // Expected profit after fees
  breakEvenMove: number;   // Minimum price move % to break even
  reason: string;          // Why trade was accepted/rejected
}

export class CommissionAwarePositionSizer {
  constructor(private config: CommissionConfig) {}
  
  /**
   * Calculate optimal position size considering commissions
   */
  calculatePositionSize(
    confidence: number,
    expectedMove: number,
    orderType: 'market' | 'limit' = 'limit'
  ): TradeSizing {
    
    // Use maker fee for limit orders, taker for market orders
    const feeRate = orderType === 'limit' ? this.config.makerFee : this.config.takerFee;
    const roundTripFee = feeRate * 2; // Buy + Sell
    
    // Reject low confidence signals immediately
    if (confidence < this.config.minConfidence) {
      return {
        shouldTrade: false,
        positionSize: 0,
        positionPct: 0,
        expectedProfit: 0,
        breakEvenMove: 0,
        reason: `Confidence ${(confidence * 100).toFixed(1)}% below minimum ${(this.config.minConfidence * 100).toFixed(1)}%`
      };
    }
    
    // Calculate break-even move required to cover fees
    const breakEvenMove = roundTripFee;
    
    // Reject if expected move doesn't sufficiently exceed break-even
    if (expectedMove <= breakEvenMove + this.config.minProfitTarget) {
      return {
        shouldTrade: false,
        positionSize: 0,
        positionPct: 0,
        expectedProfit: 0,
        breakEvenMove: breakEvenMove * 100,
        reason: `Expected move ${(expectedMove * 100).toFixed(2)}% insufficient for profit target`
      };
    }
    
    // Scale position size based on confidence level
    let positionPct = this.calculateConfidenceBasedSizing(confidence);
    
    // Apply account size limits
    positionPct = Math.min(positionPct, this.config.maxPositionPct);
    
    const positionSize = this.config.accountSize * positionPct;
    const fees = positionSize * roundTripFee;
    const grossProfit = positionSize * expectedMove;
    const expectedProfit = grossProfit - fees;
    
    // Final profitability check
    if (expectedProfit <= 0) {
      return {
        shouldTrade: false,
        positionSize: 0,
        positionPct: 0,
        expectedProfit: 0,
        breakEvenMove: breakEvenMove * 100,
        reason: `Expected profit $${expectedProfit.toFixed(2)} after fees not profitable`
      };
    }
    
    return {
      shouldTrade: true,
      positionSize: positionSize,
      positionPct: positionPct,
      expectedProfit: expectedProfit,
      breakEvenMove: breakEvenMove * 100,
      reason: `High confidence ${(confidence * 100).toFixed(1)}%, expected profit $${expectedProfit.toFixed(2)}`
    };
  }
  
  /**
   * Scale position size based on confidence level
   */
  private calculateConfidenceBasedSizing(confidence: number): number {
    // Conservative sizing for small accounts
    if (confidence >= 0.90) return 0.20;  // 20% for ultra-high confidence
    if (confidence >= 0.85) return 0.15;  // 15% for high confidence  
    if (confidence >= 0.80) return 0.12;  // 12% for good confidence
    if (confidence >= 0.75) return 0.08;  // 8% for minimum confidence
    return 0; // Below minimum threshold
  }
  
  /**
   * Calculate minimum price move needed for profitability
   */
  getMinimumProfitableMove(positionPct: number, orderType: 'market' | 'limit' = 'limit'): number {
    const feeRate = orderType === 'limit' ? this.config.makerFee : this.config.takerFee;
    const roundTripFee = feeRate * 2;
    return roundTripFee + this.config.minProfitTarget;
  }
  
  /**
   * Analyze trade feasibility for different account sizes
   */
  analyzeTradeFeasibility(): void {
    console.log('💰 COMMISSION-AWARE TRADING ANALYSIS');
    console.log('=' .repeat(60));
    console.log(`Account Size: $${this.config.accountSize}`);
    console.log(`Maker Fee: ${(this.config.makerFee * 100).toFixed(2)}%`);
    console.log(`Taker Fee: ${(this.config.takerFee * 100).toFixed(2)}%`);
    console.log(`Min Confidence: ${(this.config.minConfidence * 100).toFixed(0)}%`);
    console.log(`Min Profit Target: ${(this.config.minProfitTarget * 100).toFixed(1)}%`);
    console.log('');
    
    const testScenarios = [
      { confidence: 0.95, move: 0.025, desc: 'Ultra-high confidence, 2.5% move' },
      { confidence: 0.85, move: 0.020, desc: 'High confidence, 2.0% move' },
      { confidence: 0.80, move: 0.015, desc: 'Good confidence, 1.5% move' },
      { confidence: 0.75, move: 0.012, desc: 'Min confidence, 1.2% move' },
      { confidence: 0.70, move: 0.015, desc: 'Below threshold, 1.5% move' }
    ];
    
    testScenarios.forEach(scenario => {
      const sizing = this.calculatePositionSize(scenario.confidence, scenario.move);
      
      console.log(`📊 ${scenario.desc}:`);
      if (sizing.shouldTrade) {
        console.log(`   ✅ TRADE: $${sizing.positionSize.toFixed(0)} (${(sizing.positionPct * 100).toFixed(1)}%)`);
        console.log(`   💰 Expected Profit: $${sizing.expectedProfit.toFixed(2)}`);
        console.log(`   📈 Break-even Move: ${sizing.breakEvenMove.toFixed(2)}%`);
      } else {
        console.log(`   ❌ SKIP: ${sizing.reason}`);
      }
      console.log('');
    });
  }
}

// Default configuration for small Kraken accounts
export const krakenSmallAccountConfig: CommissionConfig = {
  makerFee: 0.0016,      // 0.16% Kraken maker fee
  takerFee: 0.0026,      // 0.26% Kraken taker fee  
  accountSize: 300,      // $300 starting account
  maxPositionPct: 0.20,  // Max 20% per trade
  minConfidence: 0.75,   // 75% minimum confidence
  minProfitTarget: 0.008 // 0.8% profit target above fees
};

// Export singleton for easy use
export const commissionAwareSizer = new CommissionAwarePositionSizer(krakenSmallAccountConfig);