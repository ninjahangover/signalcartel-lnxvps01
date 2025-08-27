/**
 * QUANTUM FORGE™ Live Trading Configuration
 * 
 * Configuration system for switching between paper and live trading
 * with commission-aware position sizing and risk management
 */

import { CommissionConfig, CommissionAwarePositionSizer } from './commission-aware-sizing';

export interface LiveTradingConfig {
  mode: 'paper' | 'live';
  
  // Account settings
  accountSize: number;
  maxDailyRisk: number;     // Max % of account at risk per day
  maxConcurrentPositions: number;
  
  // Commission settings
  commissionConfig: CommissionConfig;
  
  // Signal filtering for live trading
  minConfidence: number;     // Higher than paper trading
  requiredPhase: number;     // Only allow trades in Phase N+
  enabledAISystems: string[]; // Which AI systems to trust for live trades
  
  // Risk management
  maxPositionSize: number;   // % of account per position
  maxDrawdownPercent: number; // Stop trading if down this %
  cooldownAfterLoss: number; // Minutes to wait after losing trade
  
  // Kraken API settings
  krakenConfig: {
    apiUrl: string;
    useTestNet: boolean;
    defaultOrderType: 'market' | 'limit';
    orderTimeout: number; // seconds
  };
  
  // Webhook integration
  webhookConfig: {
    sendLiveTradeAlerts: boolean;
    destinations: string[]; // Webhook URLs for live trade notifications
  };
}

export class LiveTradingConfigManager {
  constructor(private config: LiveTradingConfig) {}
  
  /**
   * Determine if a signal should be executed in live trading
   */
  shouldExecuteLiveSignal(
    confidence: number,
    currentPhase: number,
    aiSystemsUsed: string[],
    accountStatus: {
      currentDrawdown: number;
      recentLossCount: number;
      lastLossTime?: Date;
    }
  ): { execute: boolean; reason: string } {
    
    // Check confidence threshold
    if (confidence < this.config.minConfidence) {
      return {
        execute: false,
        reason: `Confidence ${(confidence * 100).toFixed(1)}% below live trading minimum ${(this.config.minConfidence * 100).toFixed(1)}%`
      };
    }
    
    // Check phase requirement
    if (currentPhase < this.config.requiredPhase) {
      return {
        execute: false,
        reason: `Current phase ${currentPhase} below required phase ${this.config.requiredPhase} for live trading`
      };
    }
    
    // Check AI system requirements
    const requiredSystemsPresent = this.config.enabledAISystems.some(system => 
      aiSystemsUsed.includes(system)
    );
    
    if (!requiredSystemsPresent) {
      return {
        execute: false,
        reason: `Signal does not use required AI systems: ${this.config.enabledAISystems.join(', ')}`
      };
    }
    
    // Check drawdown limits
    if (accountStatus.currentDrawdown > this.config.maxDrawdownPercent) {
      return {
        execute: false,
        reason: `Account drawdown ${(accountStatus.currentDrawdown * 100).toFixed(1)}% exceeds limit ${(this.config.maxDrawdownPercent * 100).toFixed(1)}%`
      };
    }
    
    // Check cooldown period after losses
    if (accountStatus.lastLossTime && accountStatus.recentLossCount >= 2) {
      const timeSinceLoss = Date.now() - accountStatus.lastLossTime.getTime();
      const cooldownMs = this.config.cooldownAfterLoss * 60 * 1000;
      
      if (timeSinceLoss < cooldownMs) {
        return {
          execute: false,
          reason: `In cooldown period after recent losses (${Math.ceil((cooldownMs - timeSinceLoss) / 60000)} minutes remaining)`
        };
      }
    }
    
    return {
      execute: true,
      reason: `All live trading criteria met - confidence ${(confidence * 100).toFixed(1)}%, phase ${currentPhase}`
    };
  }
  
  /**
   * Get commission-aware position sizer
   */
  getPositionSizer(): CommissionAwarePositionSizer {
    return new CommissionAwarePositionSizer(this.config.commissionConfig);
  }
  
  /**
   * Update account size (for dynamic sizing)
   */
  updateAccountSize(newAccountSize: number): void {
    this.config.accountSize = newAccountSize;
    this.config.commissionConfig.accountSize = newAccountSize;
  }
  
  /**
   * Get configuration summary for logging
   */
  getConfigSummary(): object {
    return {
      mode: this.config.mode,
      accountSize: this.config.accountSize,
      minConfidence: this.config.minConfidence,
      requiredPhase: this.config.requiredPhase,
      maxPositionSize: this.config.maxPositionSize,
      enabledAISystems: this.config.enabledAISystems,
      krakenTestNet: this.config.krakenConfig.useTestNet
    };
  }
}

// Preset configurations for different scenarios
export const smallAccountLiveConfig: LiveTradingConfig = {
  mode: 'live',
  
  // Conservative account settings
  accountSize: 300,
  maxDailyRisk: 0.05,        // 5% max daily risk
  maxConcurrentPositions: 2,
  
  // Kraken commission settings
  commissionConfig: {
    makerFee: 0.0016,         // 0.16%
    takerFee: 0.0026,         // 0.26%
    accountSize: 300,
    maxPositionPct: 0.20,     // 20% max position
    minConfidence: 0.80,      // Higher than paper trading
    minProfitTarget: 0.012    // 1.2% minimum profit
  },
  
  // Strict signal filtering
  minConfidence: 0.80,        // 80% minimum for live trades
  requiredPhase: 3,          // Phase 3+ only (Order Book Intelligence active)
  enabledAISystems: [
    'mathematical-intuition-engine',
    'multi-layer-ai',
    'order-book-intelligence'
  ],
  
  // Conservative risk management
  maxPositionSize: 0.20,     // 20% max per position
  maxDrawdownPercent: 0.15,  // Stop at 15% drawdown
  cooldownAfterLoss: 30,     // 30 minute cooldown after losses
  
  // Kraken API settings
  krakenConfig: {
    apiUrl: 'https://api.kraken.com',
    useTestNet: false,        // Set to true for initial testing
    defaultOrderType: 'limit', // Better fees
    orderTimeout: 30
  },
  
  // Webhook notifications
  webhookConfig: {
    sendLiveTradeAlerts: true,
    destinations: ['discord', 'email'] // Configure webhook URLs
  }
};

// Paper trading configuration (for comparison)
export const paperTradingConfig: LiveTradingConfig = {
  ...smallAccountLiveConfig,
  mode: 'paper',
  
  // More aggressive for learning
  minConfidence: 0.10,       // 10% for Phase 0 data collection
  requiredPhase: 0,          // Any phase
  enabledAISystems: ['*'],   // All systems
  
  // No commission considerations
  commissionConfig: {
    ...smallAccountLiveConfig.commissionConfig,
    makerFee: 0,
    takerFee: 0,
    minProfitTarget: 0
  },
  
  maxDrawdownPercent: 1.0,   // No practical limit
  cooldownAfterLoss: 0       // No cooldowns
};

// Export the configuration manager
export function createLiveTradingManager(accountSize: number): LiveTradingConfigManager {
  const config = {
    ...smallAccountLiveConfig,
    accountSize,
    commissionConfig: {
      ...smallAccountLiveConfig.commissionConfig,
      accountSize
    }
  };
  
  return new LiveTradingConfigManager(config);
}

// Export already handled above