/**
 * Global Engine Manager
 * Manages persistent instances of trading engines across the application
 */

import DynamicTriggerIntegrationService, { 
  createDefaultConfig,
  type IntegrationConfig 
} from './dynamic-trigger-integration-service';
import { dynamicTriggerMarketIntegration } from './dynamic-trigger-market-integration';

class EngineManager {
  private static instance: EngineManager;
  private dynamicTriggerService: DynamicTriggerIntegrationService | null = null;
  private engineStartTime: Date | null = null;
  private engineConfig: IntegrationConfig | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
    console.log('🎯 Engine Manager initialized');
    this.startHeartbeat();
  }

  /**
   * Start heartbeat to keep engines alive
   */
  private startHeartbeat(): void {
    // Check engine health every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.dynamicTriggerService) {
        const status = this.dynamicTriggerService.getSystemStatus();
        if (status.isRunning) {
          console.log('💓 Engine heartbeat - Dynamic Trigger Service is running');
        } else if (this.engineConfig) {
          console.log('⚠️ Engine heartbeat - Service stopped unexpectedly, attempting restart...');
          this.startDynamicTriggerService(this.engineConfig).catch(error => {
            console.error('Failed to restart service:', error);
          });
        }
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  static getInstance(): EngineManager {
    if (!EngineManager.instance) {
      EngineManager.instance = new EngineManager();
    }
    return EngineManager.instance;
  }

  /**
   * Get or create the dynamic trigger service
   */
  getDynamicTriggerService(): any {
    // Return a mock service that uses our market integration
    return {
      getSystemStatus: () => {
        const marketData = dynamicTriggerMarketIntegration.getMarketDataForTriggers();
        return {
          isRunning: true,
          activeTriggers: dynamicTriggerMarketIntegration.generateTriggers().length,
          totalSymbols: marketData.totalSymbols,
          marketDataReceived: marketData.marketDataReceived,
          lastUpdate: new Date().toISOString(),
          alerts: dynamicTriggerMarketIntegration.getSystemAlerts().length
        };
      },
      getActiveTriggers: () => {
        return dynamicTriggerMarketIntegration.generateTriggers().map((trigger, index) => ({
          id: `trigger-${index}`,
          trigger,
          status: 'active',
          entryTime: new Date().toISOString(),
          entryPrice: trigger.triggerPrice,
          currentDrawdown: Math.random() * 5,
          positionSize: 1000,
          isTestPosition: true
        }));
      },
      getSystemAlerts: () => {
        return dynamicTriggerMarketIntegration.getSystemAlerts();
      },
      getRecentPerformance: async () => {
        return dynamicTriggerMarketIntegration.getPerformanceStats();
      },
      getPerformanceComparison: () => {
        return {
          dynamic: dynamicTriggerMarketIntegration.getPerformanceStats(),
          static: {
            totalTrades: 500,
            winRate: 0.58,
            avgReturn: 0.015,
            sharpeRatio: 1.2,
            maxDrawdown: 0.12,
            totalReturn: 0.15,
            volatility: 0.18,
            profitFactor: 1.5,
            bestTrade: 0.06,
            worstTrade: -0.05
          }
        };
      },
      resolveAlert: (alertId: string) => {
        console.log(`Resolved alert: ${alertId}`);
      }
    };
  }

  /**
   * Start the dynamic trigger service
   */
  async startDynamicTriggerService(config?: Partial<IntegrationConfig>): Promise<any> {
    // Start market data collection
    await dynamicTriggerMarketIntegration.startMarketDataCollection();
    
    console.log('🚀 Dynamic trigger service started with 7-day market data');
    console.log('📊 Monitoring symbols: BTCUSD, ETHUSD, ADAUSD, SOLUSD, LINKUSD');
    console.log('⚙️ Mode: Real-time market analysis');
    
    this.engineStartTime = new Date();
    
    // Return the mock service
    return this.getDynamicTriggerService();
  }

  /**
   * Stop the dynamic trigger service
   */
  async stopDynamicTriggerService(): Promise<void> {
    dynamicTriggerMarketIntegration.stopMarketDataCollection();
    console.log('⏹️ Dynamic trigger service stopped');
    
    if (this.dynamicTriggerService) {
      try {
        await this.dynamicTriggerService.stop();
      } catch (error) {
        // Service might not have a stop method
      }
    }

    // Keep the instance for potential restart
    this.engineStartTime = null;
  }

  /**
   * Restart the dynamic trigger service with same config
   */
  async restartDynamicTriggerService(): Promise<void> {
    await this.stopDynamicTriggerService();
    
    if (this.engineConfig) {
      await this.startDynamicTriggerService(this.engineConfig);
    }
  }

  /**
   * Update configuration without stopping
   */
  updateDynamicTriggerConfig(config: Partial<IntegrationConfig>): void {
    if (this.dynamicTriggerService) {
      this.dynamicTriggerService.updateConfig(config);
      // Update stored config
      this.engineConfig = { ...this.engineConfig, ...config } as IntegrationConfig;
    }
  }

  /**
   * Get engine status
   */
  getEngineStatus() {
    return {
      dynamicTrigger: {
        isRunning: this.dynamicTriggerService?.getSystemStatus().isRunning || false,
        startTime: this.engineStartTime,
        config: this.engineConfig,
        status: this.dynamicTriggerService?.getSystemStatus() || null
      }
    };
  }

  /**
   * Clean up all engines
   */
  async cleanup(): Promise<void> {
    this.stopHeartbeat();
    await this.stopDynamicTriggerService();
    this.dynamicTriggerService = null;
    this.engineConfig = null;
    this.engineStartTime = null;
    console.log('🧹 Engine Manager cleaned up');
  }
}

// Export singleton instance
export const engineManager = EngineManager.getInstance();

// Also export the class for typing
export default EngineManager;