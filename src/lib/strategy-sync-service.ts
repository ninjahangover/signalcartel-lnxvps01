/**
 * Strategy Synchronization Service
 * 
 * Ensures consistent strategy parameters across all UI components
 * and data sources (StrategyManager and CompetitionStrategyRegistry)
 */

import StrategyManager from './strategy-manager';
import { competitionStrategyRegistry } from './strategy-registry-competition';
import type { Strategy } from './strategy-manager';
import type { PineScriptStrategy } from './strategy-registry-competition';

export interface UnifiedStrategyParams {
  id: string;
  name: string;
  symbol: string;
  status: string;
  
  // Unified parameter structure
  parameters: {
    rsi: {
      period: number;
      oversold: number;
      overbought: number;
    };
    macd: {
      fast: number;
      slow: number;
      signal: number;
    };
    ma: {
      emaLength: number;
      smaLength: number;
    };
    risk: {
      stopLossPercent: number;
      takeProfitPercent: number;
      positionSize: number;
      maxPositions: number;
    };
    filters: {
      momentumThreshold: number;
      volumeThreshold: number;
      volatilityFilter: number;
      trendFilterEnabled: boolean;
    };
  };
  
  performance: {
    winRate: number;
    totalTrades: number;
    profitLoss: number;
    sharpeRatio: number;
  };
  
  lastOptimized: Date;
}

class StrategySyncService {
  private static instance: StrategySyncService;
  private listeners: Set<() => void> = new Set();
  
  private constructor() {
    // Initialize synchronization
    this.setupSynchronization();
  }
  
  static getInstance(): StrategySyncService {
    if (!StrategySyncService.instance) {
      StrategySyncService.instance = new StrategySyncService();
    }
    return StrategySyncService.instance;
  }
  
  private setupSynchronization(): void {
    // Listen to both sources and sync when either changes
    const strategyManager = StrategyManager.getInstance();
    const registry = competitionStrategyRegistry;
    
    // Subscribe to StrategyManager changes
    strategyManager.subscribe(() => {
      this.syncStrategies();
    });
    
    // Subscribe to Registry changes
    registry.subscribe(() => {
      this.syncStrategies();
    });
  }
  
  /**
   * Get unified strategy parameters from all sources
   */
  getUnifiedStrategies(): UnifiedStrategyParams[] {
    const strategies: UnifiedStrategyParams[] = [];
    
    // Get strategies from CompetitionStrategyRegistry (primary source)
    const registryStrategies = competitionStrategyRegistry.getAllStrategies();
    
    registryStrategies.forEach(regStrategy => {
      const unified = this.convertRegistryToUnified(regStrategy);
      
      // Try to enhance with data from StrategyManager if available
      const managerStrategy = StrategyManager.getInstance()
        .getStrategy(this.mapRegistryIdToManagerId(regStrategy.id));
      
      if (managerStrategy) {
        // Merge performance data from StrategyManager if more recent
        if (managerStrategy.performance.totalTrades > unified.performance.totalTrades) {
          unified.performance = {
            winRate: managerStrategy.performance.winRate,
            totalTrades: managerStrategy.performance.totalTrades,
            profitLoss: managerStrategy.performance.profitLoss,
            sharpeRatio: managerStrategy.performance.sharpeRatio || 0
          };
        }
      }
      
      strategies.push(unified);
    });
    
    return strategies;
  }
  
  /**
   * Convert CompetitionStrategyRegistry format to unified format
   */
  private convertRegistryToUnified(strategy: PineScriptStrategy): UnifiedStrategyParams {
    return {
      id: strategy.id,
      name: strategy.name,
      symbol: strategy.symbol,
      status: strategy.status.toLowerCase(),
      
      parameters: {
        rsi: {
          period: strategy.inputs.rsi_length,
          oversold: strategy.inputs.rsi_oversold,
          overbought: strategy.inputs.rsi_overbought
        },
        macd: {
          fast: strategy.inputs.macd_fast,
          slow: strategy.inputs.macd_slow,
          signal: strategy.inputs.macd_signal
        },
        ma: {
          emaLength: strategy.inputs.ema_length,
          smaLength: strategy.inputs.sma_length
        },
        risk: {
          stopLossPercent: strategy.inputs.stop_loss_percent,
          takeProfitPercent: strategy.inputs.take_profit_percent,
          positionSize: strategy.inputs.position_size_percent / 100, // Convert to decimal
          maxPositions: strategy.inputs.max_positions
        },
        filters: {
          momentumThreshold: strategy.inputs.momentum_threshold,
          volumeThreshold: strategy.inputs.volume_threshold,
          volatilityFilter: strategy.inputs.volatility_filter,
          trendFilterEnabled: strategy.inputs.trend_filter_enabled
        }
      },
      
      performance: {
        winRate: strategy.performance.winRate,
        totalTrades: strategy.performance.totalTrades,
        profitLoss: strategy.performance.totalProfit,
        sharpeRatio: strategy.performance.sharpeRatio
      },
      
      lastOptimized: strategy.optimization.lastOptimized
    };
  }
  
  /**
   * Convert StrategyManager format to unified format
   */
  private convertManagerToUnified(strategy: Strategy): UnifiedStrategyParams {
    // Map config fields to unified structure based on strategy type
    const config = strategy.config as any;
    
    return {
      id: strategy.id,
      name: strategy.name,
      symbol: 'BTCUSD', // Default symbol
      status: strategy.status,
      
      parameters: {
        rsi: {
          period: config.rsiPeriod || config.rsiLookback || 14,
          oversold: config.oversoldLevel || config.rsiOversold || 30,
          overbought: config.overboughtLevel || config.rsiOverbought || 70
        },
        macd: {
          fast: config.macdFast || 12,
          slow: config.macdSlow || 26,
          signal: config.macdSignal || 9
        },
        ma: {
          emaLength: config.emaLength || 20,
          smaLength: config.smaLength || 50
        },
        risk: {
          stopLossPercent: config.stopLossATR || 2.0,
          takeProfitPercent: config.takeProfitATR || 3.0,
          positionSize: config.positionSize || 0.01,
          maxPositions: config.maxPositions || 3
        },
        filters: {
          momentumThreshold: config.momentumThreshold || config.momentumPeriod || 0.5,
          volumeThreshold: config.volumeMultiplier || config.volumeThreshold || 1.2,
          volatilityFilter: config.volatilityFilter || 0.02,
          trendFilterEnabled: config.trendFilterEnabled !== false
        }
      },
      
      performance: {
        winRate: strategy.performance.winRate,
        totalTrades: strategy.performance.totalTrades,
        profitLoss: strategy.performance.profitLoss,
        sharpeRatio: strategy.performance.sharpeRatio || 0
      },
      
      lastOptimized: strategy.lastUpdated
    };
  }
  
  /**
   * Map registry strategy ID to manager strategy ID
   */
  private mapRegistryIdToManagerId(registryId: string): string {
    const mapping: Record<string, string> = {
      'rsi-pullback-pro': 'rsi-pullback-001',
      'claude-quantum-oscillator': 'claude-quantum-oscillator-001',
      'stratus-core-neural': 'stratus-core-neural-001'
    };
    
    return mapping[registryId] || registryId;
  }
  
  /**
   * Sync strategies between sources when parameters are updated
   */
  syncStrategies(): void {
    // Get unified view
    const unified = this.getUnifiedStrategies();
    
    // Update both sources with unified parameters
    unified.forEach(strategy => {
      this.updateStrategyParameters(strategy.id, strategy.parameters);
    });
    
    // Notify listeners
    this.notifyListeners();
  }
  
  /**
   * Update strategy parameters in all sources
   */
  updateStrategyParameters(strategyId: string, parameters: UnifiedStrategyParams['parameters']): void {
    // Update in CompetitionStrategyRegistry
    const registryStrategy = competitionStrategyRegistry.getStrategy(strategyId);
    if (registryStrategy) {
      competitionStrategyRegistry.updateStrategy(strategyId, {
        inputs: {
          ...registryStrategy.inputs,
          rsi_length: parameters.rsi.period,
          rsi_oversold: parameters.rsi.oversold,
          rsi_overbought: parameters.rsi.overbought,
          macd_fast: parameters.macd.fast,
          macd_slow: parameters.macd.slow,
          macd_signal: parameters.macd.signal,
          ema_length: parameters.ma.emaLength,
          sma_length: parameters.ma.smaLength,
          stop_loss_percent: parameters.risk.stopLossPercent,
          take_profit_percent: parameters.risk.takeProfitPercent,
          position_size_percent: parameters.risk.positionSize * 100,
          max_positions: parameters.risk.maxPositions,
          momentum_threshold: parameters.filters.momentumThreshold,
          volume_threshold: parameters.filters.volumeThreshold,
          volatility_filter: parameters.filters.volatilityFilter,
          trend_filter_enabled: parameters.filters.trendFilterEnabled
        }
      });
    }
    
    // Update in StrategyManager
    const managerId = this.mapRegistryIdToManagerId(strategyId);
    const managerStrategy = StrategyManager.getInstance().getStrategy(managerId);
    if (managerStrategy) {
      const updatedConfig: any = {
        ...managerStrategy.config
      };
      
      // Update RSI parameters
      if ('rsiPeriod' in updatedConfig) updatedConfig.rsiPeriod = parameters.rsi.period;
      if ('rsiLookback' in updatedConfig) updatedConfig.rsiLookback = parameters.rsi.period;
      if ('oversoldLevel' in updatedConfig) updatedConfig.oversoldLevel = parameters.rsi.oversold;
      if ('rsiOversold' in updatedConfig) updatedConfig.rsiOversold = parameters.rsi.oversold;
      if ('overboughtLevel' in updatedConfig) updatedConfig.overboughtLevel = parameters.rsi.overbought;
      if ('rsiOverbought' in updatedConfig) updatedConfig.rsiOverbought = parameters.rsi.overbought;
      
      // Update risk parameters
      if ('positionSize' in updatedConfig) updatedConfig.positionSize = parameters.risk.positionSize;
      if ('stopLossATR' in updatedConfig) updatedConfig.stopLossATR = parameters.risk.stopLossPercent;
      if ('takeProfitATR' in updatedConfig) updatedConfig.takeProfitATR = parameters.risk.takeProfitPercent;
      
      StrategyManager.getInstance().updateStrategy(managerId, {
        config: updatedConfig
      });
    }
  }
  
  /**
   * Subscribe to synchronization updates
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const strategySyncService = StrategySyncService.getInstance();
export default strategySyncService;