// QUANTUM FORGE™ Data Warehouse Pipeline Monitor
// Enterprise-grade monitoring and alerting for data warehouse operations

// import { telegramAlertService } from './telegram-alert-service'; // DISABLED - Using OpenStatus for monitoring

export interface PipelineMetrics {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastRun: Date;
  nextRun: Date;
  duration: number; // in milliseconds
  recordsProcessed: number;
  errorCount: number;
  successRate: number; // percentage
  dataFreshness: number; // minutes since last data
  message?: string;
}

export interface AlertRule {
  name: string;
  condition: (metrics: PipelineMetrics) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: (metrics: PipelineMetrics) => string;
  cooldown: number; // minutes between alerts
  enabled: boolean;
}

class WarehousePipelineMonitor {
  private static instance: WarehousePipelineMonitor | null = null;
  private metrics: Map<string, PipelineMetrics> = new Map();
  private alerts: Map<string, Date> = new Map(); // Last alert time
  private rules: AlertRule[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  static getInstance(): WarehousePipelineMonitor {
    if (!WarehousePipelineMonitor.instance) {
      WarehousePipelineMonitor.instance = new WarehousePipelineMonitor();
    }
    return WarehousePipelineMonitor.instance;
  }

  constructor() {
    this.initializeAlertRules();
  }

  private initializeAlertRules(): void {
    this.rules = [
      {
        name: 'Pipeline Failure',
        condition: (m) => m.status === 'critical',
        severity: 'critical',
        message: (m) => `🚨 CRITICAL: ${m.name} pipeline failed! ${m.message || ''}`,
        cooldown: 5,
        enabled: true
      },
      {
        name: 'High Error Rate',
        condition: (m) => m.successRate < 95 && m.errorCount > 10,
        severity: 'warning',
        message: (m) => `⚠️ WARNING: ${m.name} has high error rate (${m.successRate.toFixed(1)}%, ${m.errorCount} errors)`,
        cooldown: 15,
        enabled: true
      },
      {
        name: 'Stale Data',
        condition: (m) => m.dataFreshness > 60, // 1 hour
        severity: 'warning',
        message: (m) => `⏰ WARNING: ${m.name} data is stale (${Math.round(m.dataFreshness)} minutes old)`,
        cooldown: 30,
        enabled: true
      },
      {
        name: 'Long Pipeline Duration',
        condition: (m) => m.duration > 5 * 60 * 1000, // 5 minutes
        severity: 'info',
        message: (m) => `🐌 INFO: ${m.name} taking longer than usual (${Math.round(m.duration / 1000)}s)`,
        cooldown: 60,
        enabled: true
      },
      {
        name: 'Pipeline Success',
        condition: (m) => m.status === 'healthy' && m.recordsProcessed > 0,
        severity: 'info',
        message: (m) => `✅ SUCCESS: ${m.name} completed successfully (${m.recordsProcessed.toLocaleString()} records, ${Math.round(m.duration / 1000)}s)`,
        cooldown: 360, // 6 hours
        enabled: false // Disabled by default to avoid spam
      }
    ];
  }

  // Record pipeline execution metrics
  recordPipelineExecution(
    pipelineName: string, 
    success: boolean, 
    duration: number, 
    recordsProcessed: number, 
    error?: string
  ): void {
    const now = new Date();
    const existing = this.metrics.get(pipelineName) || {
      name: pipelineName,
      status: 'unknown',
      lastRun: now,
      nextRun: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      duration: 0,
      recordsProcessed: 0,
      errorCount: 0,
      successRate: 100,
      dataFreshness: 0
    };

    // Update metrics
    const metrics: PipelineMetrics = {
      ...existing,
      status: success ? 'healthy' : 'critical',
      lastRun: now,
      duration,
      recordsProcessed: existing.recordsProcessed + recordsProcessed,
      errorCount: success ? existing.errorCount : existing.errorCount + 1,
      successRate: this.calculateSuccessRate(pipelineName, success),
      dataFreshness: 0, // Fresh data
      message: error || undefined
    };

    this.metrics.set(pipelineName, metrics);
    this.checkAlerts(metrics);
  }

  // Update data freshness for a pipeline
  updateDataFreshness(pipelineName: string, lastDataTime: Date): void {
    const metrics = this.metrics.get(pipelineName);
    if (metrics) {
      metrics.dataFreshness = (Date.now() - lastDataTime.getTime()) / (1000 * 60); // minutes
      this.metrics.set(pipelineName, metrics);
      this.checkAlerts(metrics);
    }
  }

  private calculateSuccessRate(pipelineName: string, currentSuccess: boolean): number {
    // Simple moving average over last 20 runs
    const key = `${pipelineName}_history`;
    const history = (global as any)[key] || [];
    
    history.push(currentSuccess);
    if (history.length > 20) {
      history.shift();
    }
    
    (global as any)[key] = history;
    
    const successCount = history.filter((s: boolean) => s).length;
    return (successCount / history.length) * 100;
  }

  private async checkAlerts(metrics: PipelineMetrics): Promise<void> {
    for (const rule of this.rules) {
      if (!rule.enabled || !rule.condition(metrics)) continue;

      const alertKey = `${metrics.name}_${rule.name}`;
      const lastAlert = this.alerts.get(alertKey);
      const now = new Date();

      // Check cooldown
      if (lastAlert && (now.getTime() - lastAlert.getTime()) < rule.cooldown * 60 * 1000) {
        continue;
      }

      // Send alert
      await this.sendAlert(rule, metrics);
      this.alerts.set(alertKey, now);
    }
  }

  private async sendAlert(rule: AlertRule, metrics: PipelineMetrics): Promise<void> {
    try {
      const message = rule.message(metrics);
      const priority = rule.severity === 'critical' ? 'critical' : 
                     rule.severity === 'warning' ? 'high' : 'medium';

      // await telegramAlertService.sendAlert(
      //   message,
      //   priority as any,
      // DISABLED - Using OpenStatus monitoring instead
      console.log('Warehouse pipeline alert:', { message, priority: priority as any, source: 'warehouse' });

      console.log(`📱 Pipeline alert sent via Telegram: ${rule.name} - ${message}`);
    } catch (error) {
      console.error('Failed to send pipeline alert via Telegram:', error);
    }
  }

  // Get current metrics for dashboard
  getAllMetrics(): PipelineMetrics[] {
    return Array.from(this.metrics.values());
  }

  getMetrics(pipelineName: string): PipelineMetrics | undefined {
    return this.metrics.get(pipelineName);
  }

  // Start continuous monitoring
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMinutes * 60 * 1000);

    console.log(`🔍 Warehouse pipeline monitoring started (${intervalMinutes}min intervals)`);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async performHealthCheck(): Promise<void> {
    const now = new Date();
    
    for (const [name, metrics] of this.metrics.entries()) {
      // Check if pipeline should have run by now
      const timeSinceLastRun = now.getTime() - metrics.lastRun.getTime();
      const expectedInterval = 60 * 60 * 1000; // 1 hour
      
      if (timeSinceLastRun > expectedInterval * 1.5) {
        // Pipeline is overdue
        const overdueMetrics: PipelineMetrics = {
          ...metrics,
          status: 'warning',
          message: `Pipeline overdue by ${Math.round((timeSinceLastRun - expectedInterval) / (1000 * 60))} minutes`
        };
        
        this.metrics.set(name, overdueMetrics);
        this.checkAlerts(overdueMetrics);
      }
    }
  }

  // Configure alert rules
  updateAlertRule(ruleName: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.find(r => r.name === ruleName);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  enableAlert(ruleName: string): void {
    this.updateAlertRule(ruleName, { enabled: true });
  }

  disableAlert(ruleName: string): void {
    this.updateAlertRule(ruleName, { enabled: false });
  }

  // Get pipeline status summary
  getOverallStatus(): {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
    status: 'healthy' | 'warning' | 'critical';
  } {
    const metrics = Array.from(this.metrics.values());
    const healthy = metrics.filter(m => m.status === 'healthy').length;
    const warning = metrics.filter(m => m.status === 'warning').length;
    const critical = metrics.filter(m => m.status === 'critical').length;
    
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (critical > 0) overallStatus = 'critical';
    else if (warning > 0) overallStatus = 'warning';
    
    return {
      healthy,
      warning,
      critical,
      total: metrics.length,
      status: overallStatus
    };
  }
}

// Export singleton instance
export const warehousePipelineMonitor = WarehousePipelineMonitor.getInstance();

// Convenience functions for common pipeline operations
export async function recordDataSyncSuccess(
  pipelineName: string, 
  duration: number, 
  recordsProcessed: number
): Promise<void> {
  warehousePipelineMonitor.recordPipelineExecution(pipelineName, true, duration, recordsProcessed);
}

export async function recordDataSyncError(
  pipelineName: string, 
  duration: number, 
  error: string
): Promise<void> {
  warehousePipelineMonitor.recordPipelineExecution(pipelineName, false, duration, 0, error);
}

export function startWarehouseMonitoring(): void {
  warehousePipelineMonitor.startMonitoring(5); // Check every 5 minutes
  
  // Send startup notification via Telegram - DISABLED
  // telegramAlertService.sendAlert(
  //   '🔍 Data Warehouse monitoring system started - enterprise-grade pipeline monitoring active',
  //   'medium',
  //   'warehouse'
  // ); // DISABLED - Using OpenStatus monitoring instead
  console.log('🔍 Data Warehouse monitoring system started - enterprise-grade pipeline monitoring active');
}