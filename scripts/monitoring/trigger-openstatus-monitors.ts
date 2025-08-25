#!/usr/bin/env tsx
/**
 * OpenStatus Monitor Trigger Script
 * 
 * This script triggers all configured monitors in OpenStatus via the API
 * so that results are stored in the database and alerts are triggered properly.
 */

interface Monitor {
  id: string;
  name: string;
  url: string;
  periodicity: string;
  active: boolean;
}

class OpenStatusMonitorTrigger {
  private readonly apiUrl = 'http://localhost:3000'; // OpenStatus API server
  private readonly dashboardUrl = 'http://localhost:3006'; // OpenStatus Dashboard
  
  // We'll need to get the actual monitor IDs from the database
  // For now, we'll try common IDs
  private monitorIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  async triggerMonitor(monitorId: string): Promise<any> {
    try {
      // Try to trigger the monitor via the API
      const response = await fetch(`${this.apiUrl}/api/v1/monitors/${monitorId}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Triggered monitor ${monitorId}: ${JSON.stringify(data)}`);
        return data;
      } else {
        console.log(`⚠️  Failed to trigger monitor ${monitorId}: ${response.status}`);
        
        // Try the run endpoint instead
        const runResponse = await fetch(`${this.apiUrl}/api/v1/monitors/${monitorId}/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (runResponse.ok) {
          const runData = await runResponse.json();
          console.log(`✅ Ran monitor ${monitorId} via /run endpoint`);
          return runData;
        }
      }
    } catch (error) {
      console.log(`❌ Error triggering monitor ${monitorId}:`, error);
    }
    
    return null;
  }
  
  async getAllMonitors(): Promise<void> {
    // Try to get monitors from the API
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/monitors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const monitors = await response.json();
        console.log('📋 Found monitors:', monitors);
        
        if (Array.isArray(monitors)) {
          this.monitorIds = monitors.map((m: any) => String(m.id));
        }
      }
    } catch (error) {
      console.log('⚠️  Could not fetch monitor list:', error);
    }
  }
  
  async checkDatabaseMonitors(): Promise<void> {
    // Try to query the SQLite database directly
    try {
      const dbUrl = 'http://127.0.0.1:8080';
      
      // Try to run a SQL query to get monitors
      const query = 'SELECT * FROM monitor';
      const response = await fetch(dbUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statements: [query],
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Database monitors:', data);
        
        // Extract monitor IDs if we got results
        if (data && data.length > 0 && data[0].rows) {
          this.monitorIds = data[0].rows.map((row: any) => String(row[0])); // Assuming ID is first column
          console.log('📋 Found monitor IDs in database:', this.monitorIds);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not query database:', error);
    }
  }
  
  async runAllTriggers(): Promise<void> {
    console.log('🔄 OpenStatus Monitor Trigger - Starting');
    console.log('=' .repeat(60));
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('');
    
    // Try to get the actual monitor list first
    await this.getAllMonitors();
    
    // Also check the database
    await this.checkDatabaseMonitors();
    
    console.log(`📋 Will attempt to trigger ${this.monitorIds.length} monitors`);
    console.log('');
    
    // Trigger all monitors
    const results = [];
    for (const monitorId of this.monitorIds) {
      const result = await this.triggerMonitor(monitorId);
      if (result) {
        results.push(result);
      }
      
      // Small delay between triggers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
    console.log('=' .repeat(60));
    console.log(`📊 Summary: Triggered ${results.length} monitors successfully`);
    
    if (results.length === 0) {
      console.log('');
      console.log('⚠️  No monitors were triggered successfully.');
      console.log('   This might mean:');
      console.log('   1. The OpenStatus API server is not running on port 3000');
      console.log('   2. Authentication is required for the API');
      console.log('   3. No monitors are configured in the database');
      console.log('');
      console.log('💡 Make sure:');
      console.log('   - OpenStatus server is running: pnpm dev --filter "./apps/server"');
      console.log('   - Monitors are configured in the dashboard');
      console.log('   - The database is accessible');
    }
  }
  
  async simulateQStashWebhook(): Promise<void> {
    // OpenStatus expects QStash webhooks to trigger monitors
    // Let's simulate those webhooks
    console.log('🔄 Simulating QStash webhook triggers...');
    
    for (const monitorId of this.monitorIds) {
      try {
        // QStash sends webhooks to specific endpoints
        const webhookUrl = `${this.apiUrl}/api/v1/cron/monitors/${monitorId}`;
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Qstash-Signature': 'simulated', // In production this would be verified
            'Qstash-Topic': `monitor-${monitorId}`,
          },
          body: JSON.stringify({
            monitorId,
            timestamp: new Date().toISOString(),
            source: 'local-trigger',
          }),
        });
        
        if (response.ok) {
          console.log(`✅ Simulated QStash webhook for monitor ${monitorId}`);
        } else {
          console.log(`⚠️  Webhook simulation failed for monitor ${monitorId}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Error simulating webhook for monitor ${monitorId}:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

// Main execution
async function main() {
  const trigger = new OpenStatusMonitorTrigger();
  
  console.log('🚀 OpenStatus Monitor Trigger v1.0');
  console.log('');
  console.log('This will trigger all configured monitors in OpenStatus');
  console.log('so that results appear in the dashboard and alerts are sent.');
  console.log('');
  
  // Run the triggers
  await trigger.runAllTriggers();
  
  // Also try simulating QStash webhooks
  console.log('');
  await trigger.simulateQStashWebhook();
  
  console.log('');
  console.log('✅ Trigger run complete!');
  console.log('');
  console.log('📊 Check your dashboard at: http://localhost:3006/login');
  console.log('');
  console.log('💡 To run this automatically every 2 minutes:');
  console.log('   Add to crontab: */2 * * * * cd /home/telgkb9/depot/dev-signalcartel && npx tsx scripts/monitoring/trigger-openstatus-monitors.ts');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { OpenStatusMonitorTrigger };