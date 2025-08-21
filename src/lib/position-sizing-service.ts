export type PositionSizingMode = 'percentage' | 'fixed_amount';

export interface PositionSizingConfig {
  mode: PositionSizingMode;
  percentage: number; // 1-100% of available funds
  fixedAmount: number; // Fixed dollar amount per trade
  maxPercentagePerTrade: number; // Maximum percentage of portfolio per single trade (safety limit)
  minTradeAmount: number; // Minimum trade amount in USD
  maxTradeAmount: number; // Maximum trade amount in USD
}

export interface PositionSizeCalculation {
  calculatedAmount: number;
  actualAmount: number; // After applying limits and rounding
  reasoning: string;
  withinLimits: boolean;
  warnings: string[];
}

class PositionSizingService {
  private static instance: PositionSizingService;
  private config: PositionSizingConfig = {
    mode: 'percentage',
    percentage: 2, // Default 2% of portfolio per trade
    fixedAmount: 1000, // Default $1000 per trade
    maxPercentagePerTrade: 10, // Max 10% of portfolio per trade
    minTradeAmount: 10, // Minimum $10 trade
    maxTradeAmount: 50000, // Maximum $50k trade
  };
  private listeners: Set<(config: PositionSizingConfig) => void> = new Set();

  private constructor() {}

  static getInstance(): PositionSizingService {
    if (!PositionSizingService.instance) {
      PositionSizingService.instance = new PositionSizingService();
    }
    return PositionSizingService.instance;
  }

  // Get current configuration
  getConfig(): PositionSizingConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(updates: Partial<PositionSizingConfig>) {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
    console.log('📊 Position sizing config updated:', this.config);
  }

  // Calculate position size based on current configuration
  calculatePositionSize(
    portfolioValue: number,
    availableBalance: number,
    assetPrice: number,
    strategyId?: string
  ): PositionSizeCalculation {
    const warnings: string[] = [];
    let calculatedAmount = 0;
    let reasoning = '';

    // Calculate base amount based on mode
    if (this.config.mode === 'percentage') {
      const portfolioPercent = this.config.percentage / 100;
      calculatedAmount = portfolioValue * portfolioPercent;
      reasoning = `${this.config.percentage}% of portfolio ($${portfolioValue.toLocaleString()})`;
    } else {
      calculatedAmount = this.config.fixedAmount;
      reasoning = `Fixed amount of $${this.config.fixedAmount.toLocaleString()}`;
    }

    // Apply safety limits
    const maxAllowed = portfolioValue * (this.config.maxPercentagePerTrade / 100);
    if (calculatedAmount > maxAllowed) {
      warnings.push(`Reduced from $${calculatedAmount.toLocaleString()} to safety limit of ${this.config.maxPercentagePerTrade}% portfolio`);
      calculatedAmount = maxAllowed;
    }

    // Check minimum trade amount
    if (calculatedAmount < this.config.minTradeAmount) {
      warnings.push(`Increased to minimum trade amount of $${this.config.minTradeAmount}`);
      calculatedAmount = this.config.minTradeAmount;
    }

    // Check maximum trade amount
    if (calculatedAmount > this.config.maxTradeAmount) {
      warnings.push(`Reduced to maximum trade amount of $${this.config.maxTradeAmount.toLocaleString()}`);
      calculatedAmount = this.config.maxTradeAmount;
    }

    // Check available balance
    if (calculatedAmount > availableBalance) {
      warnings.push(`Reduced to available balance of $${availableBalance.toLocaleString()}`);
      calculatedAmount = availableBalance;
    }

    // Calculate actual trade size in units
    const tradeUnits = calculatedAmount / assetPrice;
    const actualAmount = tradeUnits * assetPrice;

    // Final validation
    const withinLimits = actualAmount <= availableBalance && 
                        actualAmount >= this.config.minTradeAmount &&
                        actualAmount <= this.config.maxTradeAmount;

    if (!withinLimits && actualAmount > availableBalance) {
      warnings.push('Insufficient available balance for trade');
    }

    return {
      calculatedAmount: calculatedAmount,
      actualAmount: actualAmount,
      reasoning: reasoning,
      withinLimits: withinLimits,
      warnings: warnings
    };
  }

  // Get position size for a specific dollar amount
  calculateUnitsForAmount(amount: number, assetPrice: number): number {
    return amount / assetPrice;
  }

  // Get recommended position size as percentage of portfolio
  getRecommendedPercentage(portfolioValue: number, riskLevel: 'conservative' | 'moderate' | 'aggressive'): number {
    const recommendations = {
      conservative: Math.min(1, 1000 / portfolioValue * 100), // 1% or $1000, whichever is smaller
      moderate: Math.min(2.5, 2500 / portfolioValue * 100), // 2.5% or $2500, whichever is smaller
      aggressive: Math.min(5, 5000 / portfolioValue * 100), // 5% or $5000, whichever is smaller
    };

    return Math.max(0.1, recommendations[riskLevel]); // Minimum 0.1%
  }

  // Validate configuration
  validateConfig(config: Partial<PositionSizingConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.percentage !== undefined) {
      if (config.percentage < 0.1 || config.percentage > 100) {
        errors.push('Percentage must be between 0.1% and 100%');
      }
    }

    if (config.fixedAmount !== undefined) {
      if (config.fixedAmount < 1 || config.fixedAmount > 1000000) {
        errors.push('Fixed amount must be between $1 and $1,000,000');
      }
    }

    if (config.maxPercentagePerTrade !== undefined) {
      if (config.maxPercentagePerTrade < 0.1 || config.maxPercentagePerTrade > 100) {
        errors.push('Max percentage per trade must be between 0.1% and 100%');
      }
    }

    if (config.minTradeAmount !== undefined) {
      if (config.minTradeAmount < 1 || config.minTradeAmount > 10000) {
        errors.push('Minimum trade amount must be between $1 and $10,000');
      }
    }

    if (config.maxTradeAmount !== undefined) {
      if (config.maxTradeAmount < 10 || config.maxTradeAmount > 10000000) {
        errors.push('Maximum trade amount must be between $10 and $10,000,000');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Preset configurations for different risk levels
  applyPreset(preset: 'conservative' | 'moderate' | 'aggressive' | 'custom') {
    const presets: Record<string, Partial<PositionSizingConfig>> = {
      conservative: {
        mode: 'percentage',
        percentage: 1,
        maxPercentagePerTrade: 2,
        minTradeAmount: 10,
        maxTradeAmount: 5000
      },
      moderate: {
        mode: 'percentage',
        percentage: 2,
        maxPercentagePerTrade: 5,
        minTradeAmount: 25,
        maxTradeAmount: 25000
      },
      aggressive: {
        mode: 'percentage',
        percentage: 5,
        maxPercentagePerTrade: 10,
        minTradeAmount: 50,
        maxTradeAmount: 100000
      },
      custom: {} // Keep current settings
    };

    if (preset !== 'custom') {
      this.updateConfig(presets[preset]);
      console.log(`📊 Applied ${preset} position sizing preset`);
    }
  }

  // Subscribe to configuration changes
  subscribe(callback: (config: PositionSizingConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.config));
  }

  // Get human-readable summary of current settings
  getConfigSummary(): string {
    if (this.config.mode === 'percentage') {
      return `${this.config.percentage}% of portfolio (max ${this.config.maxPercentagePerTrade}% per trade)`;
    } else {
      return `$${this.config.fixedAmount.toLocaleString()} per trade (max ${this.config.maxPercentagePerTrade}% portfolio)`;
    }
  }

  // Calculate Kelly Criterion optimal bet size (advanced)
  calculateKellyOptimal(winRate: number, avgWin: number, avgLoss: number): number {
    if (winRate <= 0 || winRate >= 1 || avgWin <= 0 || avgLoss <= 0) {
      return 0;
    }

    // Kelly formula: f = (bp - q) / b
    // where: b = avgWin/avgLoss, p = winRate, q = lossRate
    const b = avgWin / avgLoss;
    const p = winRate;
    const q = 1 - p;
    
    const kellyFraction = (b * p - q) / b;
    
    // Cap Kelly at reasonable levels (never more than 25%)
    return Math.max(0, Math.min(0.25, kellyFraction));
  }
}

export const positionSizingService = PositionSizingService.getInstance();
export default positionSizingService;