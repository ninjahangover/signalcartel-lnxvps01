/**
 * Resource Monitor Service
 * 
 * Comprehensive system monitoring with:
 * - CPU and Memory tracking
 * - Process monitoring and automatic killing
 * - External API endpoints for monitoring tools
 * - Detailed console logging with timestamps
 * - Configurable thresholds and alerts
 */

import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ResourceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;        // Overall CPU usage %
    loadAverage: number[]; // 1, 5, 15 minute load averages
    cores: number;
  };
  memory: {
    total: number;        // Total memory in MB
    used: number;         // Used memory in MB
    free: number;         // Free memory in MB
    usage: number;        // Memory usage %
  };
  processes: ProcessInfo[];
  system: {
    uptime: number;       // System uptime in seconds
    platform: string;
    nodeVersion: string;
  };
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;          // CPU usage %
  memory: number;       // Memory usage in MB
  command: string;
  status: string;
  runtime: string;      // How long the process has been running
}

export interface MonitoringConfig {
  // Thresholds for alerts
  cpu: {
    warning: number;      // CPU warning threshold %
    critical: number;     // CPU critical threshold %
    processMax: number;   // Max CPU % for single process
  };
  memory: {
    warning: number;      // Memory warning threshold %
    critical: number;     // Memory critical threshold %
    processMax: number;   // Max memory MB for single process
  };
  monitoring: {
    interval: number;     // Monitoring interval in seconds
    logLevel: 'verbose' | 'normal' | 'critical';
    enableAutoKill: boolean;
    maxProcessRuntime: number; // Max process runtime in minutes
  };
}

class ResourceMonitor {
  private static instance: ResourceMonitor;
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private metricsHistory: ResourceMetrics[] = [];
  private config: MonitoringConfig;
  private alertCallbacks: Array<(alert: AlertInfo) => void> = [];
  private logFile: string = '';

  private constructor() {
    this.config = {
      cpu: {
        warning: 80,      // 80% CPU warning
        critical: 95,     // 95% CPU critical
        processMax: 75    // 75% CPU for single process
      },
      memory: {
        warning: 85,      // 85% memory warning
        critical: 95,     // 95% memory critical
        processMax: 1500  // 1.5GB for single process
      },
      monitoring: {
        interval: 30,     // Monitor every 30 seconds
        logLevel: 'normal',
        enableAutoKill: true,
        maxProcessRuntime: 60 // 60 minutes max runtime
      }
    };
    
    // Use environment variable or fallback to relative path for container compatibility
    const baseDir = process.env.LOG_DIR || process.cwd();
    this.logFile = `${baseDir}/logs/resource-monitor.log`;
    this.initializeLogging();
  }

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  /**
   * Start resource monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      this.log('warning', 'Resource monitoring already running');
      return;
    }

    this.log('info', '🔍 Starting resource monitoring system');
    this.log('info', `📊 Monitoring interval: ${this.config.monitoring.interval}s`);
    this.log('info', `⚠️  CPU thresholds: ${this.config.cpu.warning}% warning, ${this.config.cpu.critical}% critical`);
    this.log('info', `💾 Memory thresholds: ${this.config.memory.warning}% warning, ${this.config.memory.critical}% critical`);
    this.log('info', `🔫 Auto-kill enabled: ${this.config.monitoring.enableAutoKill}`);

    this.isMonitoring = true;

    // Initial metrics collection
    this.collectMetrics();

    // Start periodic monitoring
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoring.interval * 1000);

    this.log('success', '✅ Resource monitoring started successfully');
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.log('info', '⏹️ Stopping resource monitoring');
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.log('success', '✅ Resource monitoring stopped');
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Get CPU metrics
      const cpuMetrics = await this.getCPUMetrics();
      
      // Get memory metrics
      const memoryMetrics = this.getMemoryMetrics();
      
      // Get process information
      const processes = await this.getProcessInfo();
      
      // Get system information
      const systemMetrics = this.getSystemMetrics();

      const metrics: ResourceMetrics = {
        timestamp,
        cpu: cpuMetrics,
        memory: memoryMetrics,
        processes,
        system: systemMetrics
      };

      // Store metrics
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 metrics (about 50 minutes at 30s intervals)
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      // Check thresholds and generate alerts
      await this.checkThresholds(metrics);

      // Log current status
      this.logMetrics(metrics);

    } catch (error) {
      this.log('error', `Failed to collect metrics: ${error.message}`);
    }
  }

  /**
   * Get CPU usage metrics
   */
  private async getCPUMetrics(): Promise<any> {
    try {
      // Get load average
      const loadAverage = os.loadavg();
      
      // Get CPU usage via top command
      const { stdout } = await execAsync(`top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1`);
      const cpuUsage = parseFloat(stdout.trim()) || 0;

      return {
        usage: cpuUsage,
        loadAverage,
        cores: os.cpus().length
      };
    } catch (error) {
      this.log('error', `Failed to get CPU metrics: ${error.message}`);
      return {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: os.cpus().length
      };
    }
  }

  /**
   * Get memory usage metrics
   */
  private getMemoryMetrics(): any {
    const totalMem = Math.round(os.totalmem() / 1024 / 1024); // MB
    const freeMem = Math.round(os.freemem() / 1024 / 1024);   // MB
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usage: memoryUsage
    };
  }

  /**
   * Get detailed process information
   */
  private async getProcessInfo(): Promise<ProcessInfo[]> {
    try {
      // Get processes related to our application
      const { stdout } = await execAsync(`ps aux | grep -E "(node|next|tsx)" | grep -v grep`);
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);
      
      const processes: ProcessInfo[] = [];
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          const pid = parseInt(parts[1]);
          const cpu = parseFloat(parts[2]);
          const memPercent = parseFloat(parts[3]);
          const totalMem = os.totalmem() / 1024 / 1024; // MB
          const memory = Math.round((memPercent / 100) * totalMem);
          const command = parts.slice(10).join(' ');
          
          // Get process name and runtime
          const name = this.extractProcessName(command);
          const runtime = parts[9] || '0:00';

          processes.push({
            pid,
            name,
            cpu,
            memory,
            command: command.length > 100 ? command.substring(0, 100) + '...' : command,
            status: parts[7] || 'unknown',
            runtime
          });
        }
      }

      return processes.sort((a, b) => b.cpu - a.cpu); // Sort by CPU usage
    } catch (error) {
      this.log('error', `Failed to get process info: ${error.message}`);
      return [];
    }
  }

  /**
   * Get system information
   */
  private getSystemMetrics(): any {
    return {
      uptime: os.uptime(),
      platform: os.platform(),
      nodeVersion: process.version
    };
  }

  /**
   * Check thresholds and generate alerts
   */
  private async checkThresholds(metrics: ResourceMetrics): Promise<void> {
    const alerts: AlertInfo[] = [];

    // Check overall CPU usage
    if (metrics.cpu.usage > this.config.cpu.critical) {
      alerts.push({
        type: 'cpu',
        level: 'critical',
        message: `Critical CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
        value: metrics.cpu.usage,
        threshold: this.config.cpu.critical,
        timestamp: metrics.timestamp
      });
    } else if (metrics.cpu.usage > this.config.cpu.warning) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
        value: metrics.cpu.usage,
        threshold: this.config.cpu.warning,
        timestamp: metrics.timestamp
      });
    }

    // Check overall memory usage
    if (metrics.memory.usage > this.config.memory.critical) {
      alerts.push({
        type: 'memory',
        level: 'critical',
        message: `Critical memory usage: ${metrics.memory.usage.toFixed(1)}% (${metrics.memory.used}MB/${metrics.memory.total}MB)`,
        value: metrics.memory.usage,
        threshold: this.config.memory.critical,
        timestamp: metrics.timestamp
      });
    } else if (metrics.memory.usage > this.config.memory.warning) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${metrics.memory.usage.toFixed(1)}% (${metrics.memory.used}MB/${metrics.memory.total}MB)`,
        value: metrics.memory.usage,
        threshold: this.config.memory.warning,
        timestamp: metrics.timestamp
      });
    }

    // Check individual processes
    for (const process of metrics.processes) {
      // Check process CPU usage
      if (process.cpu > this.config.cpu.processMax) {
        const alert: AlertInfo = {
          type: 'process_cpu',
          level: 'critical',
          message: `Process ${process.name} (PID ${process.pid}) high CPU: ${process.cpu.toFixed(1)}%`,
          value: process.cpu,
          threshold: this.config.cpu.processMax,
          timestamp: metrics.timestamp,
          processInfo: process
        };
        alerts.push(alert);

        // Auto-kill if enabled
        if (this.config.monitoring.enableAutoKill && process.cpu > 200) {
          await this.killRunawayProcess(process, 'High CPU usage');
        }
      }

      // Check process memory usage
      if (process.memory > this.config.memory.processMax) {
        const alert: AlertInfo = {
          type: 'process_memory',
          level: 'warning',
          message: `Process ${process.name} (PID ${process.pid}) high memory: ${process.memory}MB`,
          value: process.memory,
          threshold: this.config.memory.processMax,
          timestamp: metrics.timestamp,
          processInfo: process
        };
        alerts.push(alert);

        // Auto-kill if memory is extremely high
        if (this.config.monitoring.enableAutoKill && process.memory > 2000) {
          await this.killRunawayProcess(process, 'Excessive memory usage');
        }
      }
    }

    // Process alerts
    for (const alert of alerts) {
      this.handleAlert(alert);
    }
  }

  /**
   * Kill a runaway process
   */
  private async killRunawayProcess(process: ProcessInfo, reason: string): Promise<void> {
    try {
      this.log('warning', `🔫 Auto-killing process ${process.name} (PID ${process.pid}) - ${reason}`);
      this.log('warning', `   CPU: ${process.cpu.toFixed(1)}%, Memory: ${process.memory}MB`);
      
      // Try graceful kill first
      await execAsync(`kill -TERM ${process.pid}`);
      
      // Wait 5 seconds then force kill if still running
      setTimeout(async () => {
        try {
          await execAsync(`kill -KILL ${process.pid}`);
          this.log('success', `✅ Force killed runaway process ${process.name} (PID ${process.pid})`);
        } catch (error) {
          // Process probably already died
        }
      }, 5000);
      
    } catch (error) {
      this.log('error', `Failed to kill process ${process.pid}: ${error.message}`);
    }
  }

  /**
   * Handle alerts
   */
  private handleAlert(alert: AlertInfo): void {
    // Log the alert
    this.log(alert.level, `🚨 ${alert.message}`);
    
    // Call registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        this.log('error', `Alert callback failed: ${error.message}`);
      }
    });
  }

  /**
   * Log metrics summary
   */
  private logMetrics(metrics: ResourceMetrics): void {
    if (this.config.monitoring.logLevel === 'verbose') {
      const topProcesses = metrics.processes.slice(0, 3);
      const processInfo = topProcesses.map(p => 
        `${p.name}(${p.cpu.toFixed(1)}%/${p.memory}MB)`
      ).join(', ');

      this.log('info', 
        `📊 CPU: ${metrics.cpu.usage.toFixed(1)}% | ` +
        `Memory: ${metrics.memory.usage.toFixed(1)}% (${metrics.memory.used}/${metrics.memory.total}MB) | ` +
        `Load: [${metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}] | ` +
        `Top: ${processInfo || 'none'}`
      );
    } else if (this.config.monitoring.logLevel === 'normal') {
      // Only log if thresholds are approaching
      if (metrics.cpu.usage > 50 || metrics.memory.usage > 70) {
        this.log('info', 
          `📊 CPU: ${metrics.cpu.usage.toFixed(1)}% | Memory: ${metrics.memory.usage.toFixed(1)}%`
        );
      }
    }
  }

  /**
   * Extract process name from command
   */
  private extractProcessName(command: string): string {
    if (command.includes('next-server')) return 'next-server';
    if (command.includes('next dev')) return 'next-dev';
    if (command.includes('market-data-collector')) return 'market-data';
    if (command.includes('pine-script-input-optimizer')) return 'ai-optimizer';
    if (command.includes('strategy-execution-engine')) return 'strategy-engine';
    if (command.includes('alert-generation-engine')) return 'alert-engine';
    if (command.includes('global-stratus-engine')) return 'stratus-engine';
    if (command.includes('tsx')) return 'tsx-runner';
    if (command.includes('esbuild')) return 'esbuild';
    return 'node-process';
  }

  /**
   * Initialize logging
   */
  private initializeLogging(): void {
    // Ensure logs directory exists
    const fs = require('fs');
    const path = require('path');
    const logDir = path.dirname(this.logFile);
    
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error: any) {
      // If we can't create the log directory (e.g., in container), 
      // fall back to console logging only
      console.warn(`[ResourceMonitor] Cannot create log directory: ${error.message}`);
      console.warn('[ResourceMonitor] Falling back to console logging only');
      // Set logFile to empty to disable file logging
      this.logFile = '';
    }
  }

  /**
   * Log with timestamp and level
   */
  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Console output
    console.log(logMessage);
    
    // File output (only if logFile is set)
    if (this.logFile) {
      try {
        const fs = require('fs');
        fs.appendFileSync(this.logFile, logMessage + '\n');
      } catch (error) {
        // Silently fail file logging if there's an issue
        // Console logging is already done above
      }
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ResourceMetrics | null {
    return this.metricsHistory.length > 0 ? 
      this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 50): ResourceMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get monitoring status
   */
  getStatus(): any {
    const current = this.getCurrentMetrics();
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      currentMetrics: current,
      historyCount: this.metricsHistory.length,
      uptime: this.isMonitoring ? 
        Math.round((Date.now() - (this.metricsHistory[0]?.timestamp.getTime() || Date.now())) / 1000) : 0
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', `🔧 Monitoring configuration updated`);
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: AlertInfo) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(callback: (alert: AlertInfo) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }
}

export interface AlertInfo {
  type: 'cpu' | 'memory' | 'process_cpu' | 'process_memory';
  level: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  processInfo?: ProcessInfo;
}

// Export singleton instance
export const resourceMonitor = ResourceMonitor.getInstance();

// Helper functions
export function startResourceMonitoring(): void {
  resourceMonitor.startMonitoring();
}

export function stopResourceMonitoring(): void {
  resourceMonitor.stopMonitoring();
}

export function getResourceStatus(): any {
  return resourceMonitor.getStatus();
}

export function getCurrentResourceMetrics(): ResourceMetrics | null {
  return resourceMonitor.getCurrentMetrics();
}