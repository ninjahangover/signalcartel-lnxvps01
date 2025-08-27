#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Webhook Service Manager
 * CLI for managing the webhook service and destinations
 */

import { WebhookDestination } from '../src/lib/webhooks/webhook-service';

// Get real price helper
async function getRealPrice(symbol: string): Promise<number> {
  const { realTimePriceFetcher } = await import('../src/lib/real-time-price-fetcher');
  const priceData = await realTimePriceFetcher.getCurrentPrice(symbol);
  
  if (!priceData.success || priceData.price <= 0) {
    throw new Error(`❌ Cannot get real price for ${symbol}: ${priceData.error || 'Invalid price'}`);
  }
  
  return priceData.price;
}

interface WebhookServiceHealth {
  status: string;
  uptime: number;
  redis: string;
  queue: {
    depth: number;
    active: number;
    failed: number;
  };
  metrics: {
    totalReceived: number;
    totalProcessed: number;
    totalDelivered: number;
    totalFailed: number;
    avgProcessingTime: number;
    queueDepth: number;
  };
}

class WebhookServiceManager {
  private readonly baseUrl: string;
  
  constructor() {
    const port = process.env.WEBHOOK_PORT || '4000';
    this.baseUrl = `http://localhost:${port}`;
  }
  
  async checkHealth(): Promise<void> {
    console.log('🏥 WEBHOOK SERVICE HEALTH CHECK');
    console.log('=' .repeat(60));
    
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const health: WebhookServiceHealth = await response.json();
      
      console.log(`📊 Service Status: ${health.status.toUpperCase()}`);
      console.log(`⏱️  Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`);
      console.log(`🔗 Redis: ${health.redis.toUpperCase()}`);
      console.log('');
      
      console.log('📈 QUEUE STATUS:');
      console.log(`   Queue Depth: ${health.queue.depth.toLocaleString()}`);
      console.log(`   Active Jobs: ${health.queue.active}`);
      console.log(`   Failed Jobs: ${health.queue.failed}`);
      console.log('');
      
      console.log('📊 PROCESSING METRICS:');
      console.log(`   Total Received: ${health.metrics.totalReceived.toLocaleString()}`);
      console.log(`   Total Processed: ${health.metrics.totalProcessed.toLocaleString()}`);
      console.log(`   Total Delivered: ${health.metrics.totalDelivered.toLocaleString()}`);
      console.log(`   Total Failed: ${health.metrics.totalFailed.toLocaleString()}`);
      console.log(`   Avg Processing Time: ${health.metrics.avgProcessingTime.toFixed(2)}ms`);
      
      // Calculate success rate
      if (health.metrics.totalProcessed > 0) {
        const successRate = ((health.metrics.totalDelivered / health.metrics.totalProcessed) * 100);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
      }
      
      console.log('');
      
      if (health.status === 'healthy') {
        console.log('✅ Service is running normally');
      } else {
        console.log('⚠️ Service may have issues');
      }
      
    } catch (error) {
      console.error('❌ Failed to check service health:');
      console.error(`   Error: ${error.message}`);
      console.error('');
      console.error('💡 Make sure the webhook service is running:');
      console.error('   npx tsx src/lib/webhooks/webhook-server.ts');
    }
  }
  
  async showMetrics(): Promise<void> {
    console.log('📊 DETAILED WEBHOOK METRICS');
    console.log('=' .repeat(60));
    
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const metrics = await response.json();
      
      console.log('🔄 QUEUE DETAILS:');
      console.log(`   Waiting: ${metrics.queue.waiting}`);
      console.log(`   Active: ${metrics.queue.active}`);
      console.log(`   Completed: ${metrics.queue.completed.toLocaleString()}`);
      console.log(`   Failed: ${metrics.queue.failed}`);
      console.log(`   Delayed: ${metrics.queue.delayed}`);
      console.log('');
      
      console.log('📤 DISTRIBUTION QUEUE:');
      console.log(`   Pending: ${metrics.distribution.pending}`);
      console.log(`   Active: ${metrics.distribution.active}`);
      console.log(`   Completed: ${metrics.distribution.completed.toLocaleString()}`);
      console.log(`   Failed: ${metrics.distribution.failed}`);
      console.log('');
      
      console.log('⏱️ PERFORMANCE:');
      console.log(`   Avg Processing Time: ${metrics.avgProcessingTime.toFixed(2)}ms`);
      console.log(`   Avg Delivery Time: ${metrics.avgDeliveryTime.toFixed(2)}ms`);
      console.log(`   Last Hour Volume: ${metrics.lastHourVolume.toLocaleString()}`);
      console.log(`   Current Queue Depth: ${metrics.queueDepth.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Failed to fetch metrics:', error.message);
    }
  }
  
  async listDestinations(): Promise<void> {
    console.log('📋 WEBHOOK DESTINATIONS');
    console.log('=' .repeat(60));
    
    try {
      const response = await fetch(`${this.baseUrl}/destinations`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const destinations: WebhookDestination[] = await response.json();
      
      if (destinations.length === 0) {
        console.log('📭 No webhook destinations configured');
        return;
      }
      
      destinations.forEach((dest, index) => {
        const statusIcon = dest.active ? '✅' : '❌';
        
        console.log(`${statusIcon} ${dest.name} (${dest.id.slice(0, 8)})`);
        console.log(`   URL: ${dest.url}`);
        console.log(`   Status: ${dest.active ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   Max Retries: ${dest.retryPolicy.maxRetries}`);
        console.log(`   Timeout: ${dest.retryPolicy.timeoutMs}ms`);
        
        if (dest.filters) {
          const filters = [];
          if (dest.filters.types) filters.push(`Types: ${dest.filters.types.join(', ')}`);
          if (dest.filters.sources) filters.push(`Sources: ${dest.filters.sources.join(', ')}`);
          if (dest.filters.symbols) filters.push(`Symbols: ${dest.filters.symbols.join(', ')}`);
          if (dest.filters.minConfidence) filters.push(`Min Confidence: ${dest.filters.minConfidence}`);
          
          if (filters.length > 0) {
            console.log(`   Filters: ${filters.join(' | ')}`);
          }
        }
        
        if (index < destinations.length - 1) {
          console.log('');
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to fetch destinations:', error.message);
    }
  }
  
  async addDestination(
    name: string,
    url: string,
    options: {
      secret?: string;
      maxRetries?: number;
      timeout?: number;
      types?: string[];
      sources?: string[];
      symbols?: string[];
      minConfidence?: number;
    } = {}
  ): Promise<void> {
    console.log(`📝 Adding webhook destination: ${name}`);
    
    const destination: Omit<WebhookDestination, 'id'> = {
      name,
      url,
      secret: options.secret,
      active: true,
      retryPolicy: {
        maxRetries: options.maxRetries || 3,
        backoffMs: 2000,
        timeoutMs: options.timeout || 10000
      }
    };
    
    // Add filters if provided
    if (options.types || options.sources || options.symbols || options.minConfidence) {
      destination.filters = {
        types: options.types,
        sources: options.sources,
        symbols: options.symbols,
        minConfidence: options.minConfidence
      };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destination)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const created = await response.json();
      
      console.log(`✅ Destination created successfully`);
      console.log(`   ID: ${created.id}`);
      console.log(`   Name: ${created.name}`);
      console.log(`   URL: ${created.url}`);
      
      if (destination.filters) {
        console.log(`   Filters configured: Yes`);
      }
      
    } catch (error) {
      console.error('❌ Failed to add destination:', error.message);
    }
  }
  
  async testWebhook(type?: string): Promise<void> {
    console.log('🧪 Sending test webhook...');
    
    const testPayload = {
      type: type || 'trade_signal',
      source: 'webhook-manager-test',
      priority: 'normal',
      data: {
        action: 'BUY',
        symbol: 'BTCUSD',
        price: await getRealPrice('BTCUSD'),
        message: 'This is a test webhook from the manager CLI'
      },
      metadata: {
        symbol: 'BTCUSD',
        confidence: 0.75,
        test: true
      }
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Test webhook sent successfully');
      console.log(`   ID: ${result.id}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Queue Depth: ${result.queueDepth}`);
      console.log(`   Processing Time: ${result.processingTime}ms`);
      
    } catch (error) {
      console.error('❌ Failed to send test webhook:', error.message);
    }
  }
  
  async monitorLive(): Promise<void> {
    console.log('📊 LIVE WEBHOOK MONITORING');
    console.log('Press Ctrl+C to stop monitoring');
    console.log('=' .repeat(60));
    
    let lastMetrics: any = null;
    
    const monitor = async () => {
      try {
        const response = await fetch(`${this.baseUrl}/health`);
        const health: WebhookServiceHealth = await response.json();
        
        // Clear screen and show updated metrics
        console.clear();
        console.log('📊 LIVE WEBHOOK MONITORING - ' + new Date().toISOString());
        console.log('=' .repeat(60));
        
        console.log(`Status: ${health.status.toUpperCase()} | Uptime: ${Math.floor(health.uptime / 60)}m`);
        console.log(`Queue: ${health.queue.depth} waiting, ${health.queue.active} active`);
        console.log('');
        
        if (lastMetrics) {
          const receivedDiff = health.metrics.totalReceived - lastMetrics.totalReceived;
          const processedDiff = health.metrics.totalProcessed - lastMetrics.totalProcessed;
          const deliveredDiff = health.metrics.totalDelivered - lastMetrics.totalDelivered;
          
          console.log(`📈 RATE (last 5s):`);
          console.log(`   Received: +${receivedDiff} (${(receivedDiff * 12).toLocaleString()}/min)`);
          console.log(`   Processed: +${processedDiff} (${(processedDiff * 12).toLocaleString()}/min)`);
          console.log(`   Delivered: +${deliveredDiff} (${(deliveredDiff * 12).toLocaleString()}/min)`);
        }
        
        console.log('');
        console.log(`📊 TOTALS:`);
        console.log(`   Received: ${health.metrics.totalReceived.toLocaleString()}`);
        console.log(`   Processed: ${health.metrics.totalProcessed.toLocaleString()}`);
        console.log(`   Delivered: ${health.metrics.totalDelivered.toLocaleString()}`);
        console.log(`   Failed: ${health.metrics.totalFailed.toLocaleString()}`);
        
        const successRate = health.metrics.totalProcessed > 0 ? 
          (health.metrics.totalDelivered / health.metrics.totalProcessed * 100) : 0;
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        
        lastMetrics = health.metrics;
        
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    };
    
    // Initial call
    await monitor();
    
    // Update every 5 seconds
    const interval = setInterval(monitor, 5000);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 Monitoring stopped');
      process.exit(0);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new WebhookServiceManager();
  
  try {
    switch (command) {
      case 'health':
        await manager.checkHealth();
        break;
        
      case 'metrics':
        await manager.showMetrics();
        break;
        
      case 'destinations':
        await manager.listDestinations();
        break;
        
      case 'add-destination':
        if (args.length < 3) {
          console.log('Usage: add-destination <name> <url> [options]');
          console.log('Options: --secret=SECRET --retries=N --timeout=MS --types=TYPE1,TYPE2');
          process.exit(1);
        }
        
        const options: any = {};
        for (let i = 3; i < args.length; i++) {
          const arg = args[i];
          if (arg.startsWith('--secret=')) options.secret = arg.split('=')[1];
          if (arg.startsWith('--retries=')) options.maxRetries = parseInt(arg.split('=')[1]);
          if (arg.startsWith('--timeout=')) options.timeout = parseInt(arg.split('=')[1]);
          if (arg.startsWith('--types=')) options.types = arg.split('=')[1].split(',');
        }
        
        await manager.addDestination(args[1], args[2], options);
        break;
        
      case 'test':
        await manager.testWebhook(args[1]);
        break;
        
      case 'monitor':
        await manager.monitorLive();
        break;
        
      default:
        console.log('🚀 QUANTUM FORGE™ Webhook Service Manager');
        console.log('');
        console.log('Commands:');
        console.log('  health                                    - Check service health');
        console.log('  metrics                                   - Show detailed metrics');
        console.log('  destinations                              - List webhook destinations');
        console.log('  add-destination <name> <url> [options]    - Add webhook destination');
        console.log('  test [type]                               - Send test webhook');
        console.log('  monitor                                   - Live monitoring dashboard');
        console.log('');
        console.log('Examples:');
        console.log('  npx tsx admin/webhook-manager.ts health');
        console.log('  npx tsx admin/webhook-manager.ts add-destination "Discord" "https://discord.com/api/webhooks/..."');
        console.log('  npx tsx admin/webhook-manager.ts test trade_signal');
        console.log('  npx tsx admin/webhook-manager.ts monitor');
        break;
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { WebhookServiceManager };