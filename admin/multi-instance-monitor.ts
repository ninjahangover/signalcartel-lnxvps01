#!/usr/bin/env npx tsx

/**
 * SignalCartel Multi-Instance Real-Time Monitor
 * QUANTUM FORGE™ Edition - Cross-Instance Analytics Dashboard
 * 
 * Monitors multiple SignalCartel instances and displays consolidated analytics
 * Shows performance comparison, data synchronization status, and cross-validation
 */

import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m'
};

interface InstanceStats {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'syncing';
  lastSync: Date | null;
  totalPositions: number;
  totalPnL: number;
  winRate: number;
  avgPnL: number;
  recentTrades: number;
}

interface CrossInstanceMetrics {
  totalInstances: number;
  activeInstances: number;
  combinedPositions: number;
  combinedPnL: number;
  avgWinRate: number;
  dataQualityScore: number;
  syncHealth: 'excellent' | 'good' | 'poor' | 'critical';
}

class MultiInstanceMonitor {
  private analyticsDb: PrismaClient;
  private isRunning: boolean = false;
  private updateInterval: number = 5000; // 5 seconds

  constructor() {
    // Connect to analytics database
    const analyticsDbUrl = process.env.ANALYTICS_DB_URL || 
      'postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5435/signalcartel_analytics?schema=public';
    
    this.analyticsDb = new PrismaClient({
      datasources: {
        db: { url: analyticsDbUrl }
      }
    });
  }

  private clearScreen() {
    process.stdout.write('\x1B[2J\x1B[0f');
  }

  private colorize(text: string, color: keyof typeof colors): string {
    return `${colors[color]}${text}${colors.reset}`;
  }

  private formatNumber(num: number, decimals: number = 2): string {
    return num.toFixed(decimals);
  }

  private formatCurrency(amount: number): string {
    const color = amount >= 0 ? 'green' : 'red';
    const sign = amount >= 0 ? '+' : '';
    return this.colorize(`${sign}$${this.formatNumber(amount, 2)}`, color);
  }

  private formatPercentage(percent: number): string {
    const color = percent >= 50 ? 'green' : percent >= 30 ? 'yellow' : 'red';
    return this.colorize(`${this.formatNumber(percent, 1)}%`, color);
  }

  private getStatusColor(status: string): keyof typeof colors {
    switch (status.toLowerCase()) {
      case 'online': return 'green';
      case 'syncing': return 'yellow';
      case 'offline': return 'red';
      default: return 'white';
    }
  }

  private async getInstanceStats(): Promise<InstanceStats[]> {
    try {
      // This would be a real query in production
      const instances = await this.analyticsDb.$queryRaw`
        SELECT 
          i.id,
          i.name,
          i.last_sync,
          i.status,
          COALESCE(p.total_positions, 0) as total_positions,
          COALESCE(p.total_pnl, 0) as total_pnl,
          COALESCE(p.win_rate, 0) as win_rate,
          COALESCE(p.avg_pnl, 0) as avg_pnl
        FROM instances i
        LEFT JOIN cross_instance_performance p ON i.id = p.instance_id
        ORDER BY i.id
      ` as any[];

      return instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        status: this.getInstanceStatus(instance.last_sync),
        lastSync: instance.last_sync,
        totalPositions: Number(instance.total_positions) || 0,
        totalPnL: Number(instance.total_pnl) || 0,
        winRate: Number(instance.win_rate) || 0,
        avgPnL: Number(instance.avg_pnl) || 0,
        recentTrades: 0 // Would calculate from recent data
      }));

    } catch (error) {
      console.error('Error fetching instance stats:', error);
      return [
        {
          id: 'prod-main',
          name: 'Production Main Instance',
          status: 'offline',
          lastSync: null,
          totalPositions: 0,
          totalPnL: 0,
          winRate: 0,
          avgPnL: 0,
          recentTrades: 0
        },
        {
          id: 'dev-secondary', 
          name: 'Secondary Development Instance',
          status: 'offline',
          lastSync: null,
          totalPositions: 0,
          totalPnL: 0,
          winRate: 0,
          avgPnL: 0,
          recentTrades: 0
        }
      ];
    }
  }

  private getInstanceStatus(lastSync: Date | null): 'online' | 'offline' | 'syncing' {
    if (!lastSync) return 'offline';
    
    const now = new Date();
    const timeDiff = now.getTime() - lastSync.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff < 5) return 'online';
    if (minutesDiff < 30) return 'syncing';
    return 'offline';
  }

  private calculateCrossInstanceMetrics(instances: InstanceStats[]): CrossInstanceMetrics {
    const activeInstances = instances.filter(i => i.status === 'online').length;
    const combinedPositions = instances.reduce((sum, i) => sum + i.totalPositions, 0);
    const combinedPnL = instances.reduce((sum, i) => sum + i.totalPnL, 0);
    const avgWinRate = instances.length > 0 
      ? instances.reduce((sum, i) => sum + i.winRate, 0) / instances.length 
      : 0;

    let syncHealth: 'excellent' | 'good' | 'poor' | 'critical';
    if (activeInstances === instances.length) syncHealth = 'excellent';
    else if (activeInstances >= instances.length * 0.75) syncHealth = 'good';
    else if (activeInstances > 0) syncHealth = 'poor';
    else syncHealth = 'critical';

    return {
      totalInstances: instances.length,
      activeInstances,
      combinedPositions,
      combinedPnL,
      avgWinRate,
      dataQualityScore: activeInstances * 100 / Math.max(instances.length, 1),
      syncHealth
    };
  }

  private renderHeader() {
    const title = '🌐 SIGNALCARTEL MULTI-INSTANCE MONITOR';
    const subtitle = 'QUANTUM FORGE™ Cross-Instance Analytics Dashboard';
    const timestamp = new Date().toLocaleString();

    console.log(this.colorize('═'.repeat(100), 'magenta'));
    console.log(this.colorize(`${title.padStart(50 + title.length / 2)}`, 'magenta'));
    console.log(this.colorize(`${subtitle.padStart(50 + subtitle.length / 2)}`, 'cyan'));
    console.log(this.colorize(`${timestamp.padStart(50 + timestamp.length / 2)}`, 'white'));
    console.log(this.colorize('═'.repeat(100), 'magenta'));
  }

  private renderInstanceTable(instances: InstanceStats[]) {
    console.log(this.colorize('\n📊 INSTANCE STATUS & PERFORMANCE', 'bright'));
    console.log(this.colorize('─'.repeat(100), 'cyan'));
    
    // Header
    const header = `${'INSTANCE'.padEnd(25)} ${'STATUS'.padEnd(10)} ${'POSITIONS'.padEnd(12)} ${'TOTAL P&L'.padEnd(15)} ${'WIN RATE'.padEnd(10)} ${'LAST SYNC'.padEnd(20)}`;
    console.log(this.colorize(header, 'bright'));
    console.log(this.colorize('─'.repeat(100), 'cyan'));

    // Rows
    for (const instance of instances) {
      const statusText = instance.status.toUpperCase();
      const statusColor = this.getStatusColor(instance.status);
      const lastSyncText = instance.lastSync 
        ? instance.lastSync.toLocaleTimeString()
        : 'Never';

      const row = `${instance.name.padEnd(25)} ${this.colorize(statusText.padEnd(10), statusColor)} ${instance.totalPositions.toString().padEnd(12)} ${this.formatCurrency(instance.totalPnL).padEnd(25)} ${this.formatPercentage(instance.winRate).padEnd(20)} ${lastSyncText.padEnd(20)}`;
      console.log(row);
    }
  }

  private renderMetricsSummary(metrics: CrossInstanceMetrics) {
    console.log(this.colorize('\n🎯 CROSS-INSTANCE METRICS', 'bright'));
    console.log(this.colorize('─'.repeat(100), 'cyan'));

    const metricsGrid = [
      [`Total Instances: ${metrics.totalInstances}`, `Active Instances: ${this.colorize(metrics.activeInstances.toString(), 'green')}`],
      [`Combined Positions: ${this.colorize(metrics.combinedPositions.toString(), 'cyan')}`, `Combined P&L: ${this.formatCurrency(metrics.combinedPnL)}`],
      [`Average Win Rate: ${this.formatPercentage(metrics.avgWinRate)}`, `Data Quality: ${this.formatPercentage(metrics.dataQualityScore)}`],
      [`Sync Health: ${this.colorize(metrics.syncHealth.toUpperCase(), this.getSyncHealthColor(metrics.syncHealth))}`, `Update Rate: ${this.updateInterval/1000}s`]
    ];

    for (const [left, right] of metricsGrid) {
      console.log(`${left.padEnd(50)} ${right}`);
    }
  }

  private getSyncHealthColor(health: string): keyof typeof colors {
    switch (health) {
      case 'excellent': return 'green';
      case 'good': return 'yellow';
      case 'poor': return 'red';
      case 'critical': return 'bgRed';
      default: return 'white';
    }
  }

  private renderDataFlowVisualization(instances: InstanceStats[]) {
    console.log(this.colorize('\n🔄 DATA FLOW VISUALIZATION', 'bright'));
    console.log(this.colorize('─'.repeat(100), 'cyan'));

    // Simple ASCII visualization
    console.log('');
    console.log(this.colorize('    ┌─────────────────┐', 'blue'));
    console.log(this.colorize('    │   PRODUCTION    │', instances[0]?.status === 'online' ? 'green' : 'red'));
    console.log(this.colorize('    │     MAIN        │', instances[0]?.status === 'online' ? 'green' : 'red'));
    console.log(this.colorize('    └─────────┬───────┘', 'blue'));
    console.log(this.colorize('              │ READ-ONLY', 'yellow'));
    console.log(this.colorize('              ▼', 'yellow'));
    console.log(this.colorize('    ┌─────────────────┐', 'magenta'));
    console.log(this.colorize('    │   ANALYTICS     │', 'magenta'));
    console.log(this.colorize('    │   WAREHOUSE     │', 'magenta'));
    console.log(this.colorize('    └─────────┬───────┘', 'magenta'));
    console.log(this.colorize('              ▲ READ-ONLY', 'yellow'));
    console.log(this.colorize('              │', 'yellow'));
    console.log(this.colorize('    ┌─────────┴───────┐', 'blue'));
    console.log(this.colorize('    │   SECONDARY     │', instances[1]?.status === 'online' ? 'green' : 'red'));
    console.log(this.colorize('    │      DEV        │', instances[1]?.status === 'online' ? 'green' : 'red'));
    console.log(this.colorize('    └─────────────────┘', 'blue'));
    console.log('');
  }

  private renderControls() {
    console.log(this.colorize('\n⌨️  CONTROLS', 'bright'));
    console.log(this.colorize('─'.repeat(100), 'cyan'));
    console.log('ESC/Q: Exit Monitor    R: Refresh Now    S: Run Sync    H: Show Help');
    console.log(this.colorize('─'.repeat(100), 'cyan'));
  }

  private async renderDashboard() {
    this.clearScreen();
    
    const instances = await this.getInstanceStats();
    const metrics = this.calculateCrossInstanceMetrics(instances);

    this.renderHeader();
    this.renderInstanceTable(instances);
    this.renderMetricsSummary(metrics);
    this.renderDataFlowVisualization(instances);
    this.renderControls();
  }

  private setupKeyboardHandlers() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', async (key) => {
      const keyStr = key.toString();
      
      switch (keyStr) {
        case '\u001b': // ESC
        case 'q':
        case 'Q':
          await this.stop();
          break;
        case 'r':
        case 'R':
          await this.renderDashboard();
          break;
        case 's':
        case 'S':
          console.log(this.colorize('\n🔄 Running data sync...', 'yellow'));
          // Would trigger sync here
          setTimeout(async () => await this.renderDashboard(), 2000);
          break;
        case 'h':
        case 'H':
          console.log(this.colorize('\n📖 Multi-Instance Monitor Help', 'bright'));
          console.log('This dashboard shows real-time status of multiple SignalCartel instances');
          console.log('Data is consolidated from production and development systems');
          console.log('All connections to production are READ-ONLY for safety');
          setTimeout(async () => await this.renderDashboard(), 3000);
          break;
      }
    });
  }

  async start() {
    console.log(this.colorize('🚀 Starting Multi-Instance Monitor...', 'green'));
    
    this.isRunning = true;
    this.setupKeyboardHandlers();
    
    // Initial render
    await this.renderDashboard();
    
    // Set up periodic updates
    const updateLoop = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(updateLoop);
        return;
      }
      await this.renderDashboard();
    }, this.updateInterval);
  }

  async stop() {
    this.isRunning = false;
    
    console.log(this.colorize('\n👋 Multi-Instance Monitor stopped', 'yellow'));
    console.log('Thank you for using SignalCartel Multi-Instance Analytics!');
    
    await this.analyticsDb.$disconnect();
    process.exit(0);
  }
}

// Main execution
async function main() {
  const monitor = new MultiInstanceMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await monitor.stop();
  });
  
  process.on('SIGTERM', async () => {
    await monitor.stop();
  });
  
  await monitor.start();
}

if (require.main === module) {
  main().catch(console.error);
}

export default MultiInstanceMonitor;