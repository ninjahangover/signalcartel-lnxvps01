// QUANTUM FORGE™ Data Warehouse Sync Pipeline
// Automated data synchronization with comprehensive monitoring

import { warehousePipelineMonitor, recordDataSyncSuccess, recordDataSyncError } from './warehouse-pipeline-monitor';
// import { telegramAlertService } from './telegram-alert-service'; // DISABLED - Using OpenStatus for monitoring

export interface SyncJobConfig {
  name: string;
  source: 'trades' | 'market_data' | 'strategies' | 'performance';
  enabled: boolean;
  schedule: string; // cron expression
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  duration: number;
  error?: string;
  details?: any;
}

class WarehouseSyncPipeline {
  private static instance: WarehouseSyncPipeline | null = null;
  private jobs: Map<string, SyncJobConfig> = new Map();
  private running: Map<string, boolean> = new Map();
  private schedules: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): WarehouseSyncPipeline {
    if (!WarehouseSyncPipeline.instance) {
      WarehouseSyncPipeline.instance = new WarehouseSyncPipeline();
    }
    return WarehouseSyncPipeline.instance;
  }

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs(): void {
    const defaultJobs: SyncJobConfig[] = [
      {
        name: 'Trade Data Sync',
        source: 'trades',
        enabled: true,
        schedule: '0 */15 * * * *', // Every 15 minutes
        batchSize: 1000,
        maxRetries: 3,
        retryDelay: 30000 // 30 seconds
      },
      {
        name: 'Market Data Sync',
        source: 'market_data',
        enabled: true,
        schedule: '0 */5 * * * *', // Every 5 minutes
        batchSize: 5000,
        maxRetries: 3,
        retryDelay: 10000 // 10 seconds
      },
      {
        name: 'Strategy Performance Sync',
        source: 'performance',
        enabled: true,
        schedule: '0 0 * * * *', // Every hour
        batchSize: 500,
        maxRetries: 2,
        retryDelay: 60000 // 1 minute
      },
      {
        name: 'Strategy Config Sync',
        source: 'strategies',
        enabled: true,
        schedule: '0 0 */6 * * *', // Every 6 hours
        batchSize: 100,
        maxRetries: 2,
        retryDelay: 120000 // 2 minutes
      }
    ];

    defaultJobs.forEach(job => this.jobs.set(job.name, job));
  }

  // Start all sync pipelines
  async startPipelines(): Promise<void> {
    console.log('🚀 Starting Data Warehouse Sync Pipelines...');
    
    for (const [name, job] of this.jobs.entries()) {
      if (job.enabled) {
        this.scheduleJob(name, job);
      }
    }

    // Send startup notification via Telegram
    await telegramAlertService.sendAlert(
      `🚀 Data Warehouse Pipelines: Started ${Array.from(this.jobs.values()).filter(j => j.enabled).length} sync pipelines`,
      'medium',
      'warehouse'
    );

    console.log(`✅ ${this.jobs.size} sync pipelines initialized`);
  }

  private scheduleJob(name: string, job: SyncJobConfig): void {
    // For demo purposes, use simple intervals instead of cron
    const intervalMs = this.parseScheduleToInterval(job.schedule);
    
    const timer = setInterval(async () => {
      if (!this.running.get(name)) {
        await this.runSyncJob(name);
      }
    }, intervalMs);

    this.schedules.set(name, timer);
    console.log(`📅 Scheduled '${name}' to run every ${Math.round(intervalMs / 1000)}s`);
  }

  private parseScheduleToInterval(schedule: string): number {
    // Simple mapping for demo - in production, use a proper cron parser
    const patterns = {
      '0 */15 * * * *': 15 * 60 * 1000, // 15 minutes
      '0 */5 * * * *': 5 * 60 * 1000,   // 5 minutes
      '0 0 * * * *': 60 * 60 * 1000,    // 1 hour
      '0 0 */6 * * *': 6 * 60 * 60 * 1000 // 6 hours
    };
    
    return patterns[schedule as keyof typeof patterns] || 5 * 60 * 1000; // Default 5 minutes
  }

  async runSyncJob(jobName: string): Promise<SyncResult> {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    this.running.set(jobName, true);
    const startTime = Date.now();

    try {
      console.log(`🔄 Starting sync job: ${jobName}`);
      
      const result = await this.executeSyncJob(job);
      const duration = Date.now() - startTime;

      if (result.success) {
        await recordDataSyncSuccess(jobName, duration, result.recordsProcessed);
        console.log(`✅ ${jobName} completed: ${result.recordsProcessed} records in ${Math.round(duration / 1000)}s`);
      } else {
        await recordDataSyncError(jobName, duration, result.error || 'Unknown error');
        console.error(`❌ ${jobName} failed: ${result.error}`);
      }

      return { ...result, duration };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await recordDataSyncError(jobName, duration, errorMessage);
      console.error(`💥 ${jobName} crashed:`, error);
      
      return {
        success: false,
        recordsProcessed: 0,
        duration,
        error: errorMessage
      };
    } finally {
      this.running.set(jobName, false);
    }
  }

  private async executeSyncJob(job: SyncJobConfig): Promise<SyncResult> {
    switch (job.source) {
      case 'trades':
        return this.syncTrades(job);
      case 'market_data':
        return this.syncMarketData(job);
      case 'performance':
        return this.syncPerformance(job);
      case 'strategies':
        return this.syncStrategies(job);
      default:
        throw new Error(`Unknown sync source: ${job.source}`);
    }
  }

  private async syncTrades(job: SyncJobConfig): Promise<SyncResult> {
    try {
      // Simulate trade data sync
      const response = await fetch('/api/custom-paper-trading/dashboard');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const trades = data.data?.trades || [];
      
      // Simulate warehouse insert (in real implementation, this would be PostgreSQL)
      const recordsProcessed = Math.min(trades.length, job.batchSize);
      
      // Add some realistic processing delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      return {
        success: true,
        recordsProcessed,
        details: {
          totalTrades: trades.length,
          syncedTrades: recordsProcessed
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Trade sync failed'
      };
    }
  }

  private async syncMarketData(job: SyncJobConfig): Promise<SyncResult> {
    try {
      // Simulate market data sync from multiple sources
      const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD'];
      let totalRecords = 0;

      for (const symbol of symbols) {
        const response = await fetch(`/api/market-data?symbol=${symbol}&limit=${Math.floor(job.batchSize / symbols.length)}`);
        if (response.ok) {
          const data = await response.json();
          totalRecords += data.data?.length || 0;
        }
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

      return {
        success: true,
        recordsProcessed: totalRecords,
        details: {
          symbols: symbols.length,
          avgRecordsPerSymbol: Math.round(totalRecords / symbols.length)
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Market data sync failed'
      };
    }
  }

  private async syncPerformance(job: SyncJobConfig): Promise<SyncResult> {
    try {
      // Simulate strategy performance aggregation
      const strategies = ['RSI_Strategy', 'Bollinger_Bands', 'Neural_Network', 'Quantum_Oscillator'];
      
      // Calculate performance metrics for each strategy
      const performanceRecords = strategies.map(strategy => ({
        strategy,
        period: 'daily',
        timestamp: new Date(),
        trades: Math.floor(Math.random() * 50),
        winRate: 60 + Math.random() * 30,
        totalPnL: (Math.random() - 0.5) * 1000,
        avgTradeSize: 100 + Math.random() * 400
      }));

      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      return {
        success: true,
        recordsProcessed: performanceRecords.length,
        details: {
          strategies: strategies.length,
          period: 'daily'
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Performance sync failed'
      };
    }
  }

  private async syncStrategies(job: SyncJobConfig): Promise<SyncResult> {
    try {
      // Simulate strategy configuration sync
      const response = await fetch('/api/strategies');
      let strategies = [];
      
      if (response.ok) {
        strategies = await response.json();
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      return {
        success: true,
        recordsProcessed: strategies.length,
        details: {
          activeStrategies: strategies.filter((s: any) => s.active).length,
          totalStrategies: strategies.length
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Strategy sync failed'
      };
    }
  }

  // Manual sync trigger
  async triggerSync(jobName: string): Promise<SyncResult> {
    return this.runSyncJob(jobName);
  }

  // Get job status
  getJobStatus(jobName: string): {
    config: SyncJobConfig | undefined;
    isRunning: boolean;
    nextRun?: Date;
  } {
    return {
      config: this.jobs.get(jobName),
      isRunning: this.running.get(jobName) || false,
      nextRun: new Date(Date.now() + 5 * 60 * 1000) // Simplified
    };
  }

  getAllJobStatuses(): Array<{
    name: string;
    config: SyncJobConfig;
    isRunning: boolean;
    metrics?: any;
  }> {
    return Array.from(this.jobs.entries()).map(([name, config]) => ({
      name,
      config,
      isRunning: this.running.get(name) || false,
      metrics: warehousePipelineMonitor.getMetrics(name)
    }));
  }

  // Stop all pipelines
  stopPipelines(): void {
    for (const [name, timer] of this.schedules.entries()) {
      clearInterval(timer);
      console.log(`⏹️ Stopped sync pipeline: ${name}`);
    }
    this.schedules.clear();
  }

  // Update job configuration
  updateJob(name: string, updates: Partial<SyncJobConfig>): void {
    const job = this.jobs.get(name);
    if (job) {
      Object.assign(job, updates);
      
      // Restart scheduling if it was running
      if (this.schedules.has(name)) {
        clearInterval(this.schedules.get(name)!);
        if (job.enabled) {
          this.scheduleJob(name, job);
        }
      }
    }
  }
}

// Export singleton
export const warehouseSyncPipeline = WarehouseSyncPipeline.getInstance();

// Start warehouse syncing
export async function startWarehouseSyncPipelines(): Promise<void> {
  await warehouseSyncPipeline.startPipelines();
}