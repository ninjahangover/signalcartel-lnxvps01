#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ServiceCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

const services: ServiceCheck[] = [
  {
    name: 'OpenStatus API Server',
    check: async () => {
      try {
        const { stdout } = await execAsync('curl -s http://localhost:3000/ping');
        return stdout.includes('pong');
      } catch {
        return false;
      }
    },
    critical: true
  },
  {
    name: 'OpenStatus Dashboard',
    check: async () => {
      try {
        const { stdout } = await execAsync('curl -s http://localhost:3001/api/health');
        return stdout.includes('healthy');
      } catch {
        return false;
      }
    },
    critical: true
  },
  {
    name: 'Trading Engine',
    check: async () => {
      try {
        const { stdout } = await execAsync('ps aux | grep "load-database-strategies" | grep -v grep');
        return stdout.trim().length > 0;
      } catch {
        return false;
      }
    },
    critical: true
  },
  {
    name: 'Market Data Collector',
    check: async () => {
      try {
        const { stdout } = await execAsync('ps aux | grep "market-data-collector" | grep -v grep');
        return stdout.trim().length > 0;
      } catch {
        return false;
      }
    },
    critical: false
  },
  {
    name: 'Database Access',
    check: async () => {
      try {
        const { stdout } = await execAsync('npx tsx -e "import { prisma } from \'./src/lib/prisma.ts\'; console.log(await prisma.strategy.count())"');
        return !stdout.includes('Error');
      } catch {
        return false;
      }
    },
    critical: true
  }
];

async function sendAlert(message: string, urgent = false) {
  const topic = process.env.NTFY_TOPIC || 'signal-cartel';
  const priority = urgent ? '5' : '3';
  
  try {
    await execAsync(`curl -s -X POST -H "Priority: ${priority}" -d "${message}" https://ntfy.sh/${topic}`);
    console.log(`🚨 ALERT SENT: ${message}`);
  } catch (error) {
    console.error(`❌ Failed to send alert:`, error);
  }
}

async function checkServices() {
  const results = await Promise.all(
    services.map(async (service) => ({
      name: service.name,
      status: await service.check(),
      critical: service.critical
    }))
  );

  const failures = results.filter(r => !r.status);
  const criticalFailures = failures.filter(r => r.critical);

  console.log(`\n🔍 System Health Check - ${new Date().toLocaleString()}`);
  console.log(`✅ Healthy: ${results.filter(r => r.status).length}`);
  console.log(`❌ Failed: ${failures.length}`);
  
  if (criticalFailures.length > 0) {
    const alertMsg = `🚨 CRITICAL SYSTEM FAILURE: ${criticalFailures.map(f => f.name).join(', ')} - Immediate attention required!`;
    await sendAlert(alertMsg, true);
    console.log(alertMsg);
  } else if (failures.length > 0) {
    const alertMsg = `⚠️ Non-critical services down: ${failures.map(f => f.name).join(', ')}`;
    await sendAlert(alertMsg, false);
    console.log(alertMsg);
  } else {
    console.log('🟢 All systems operational');
  }

  results.forEach(r => {
    const icon = r.status ? '✅' : (r.critical ? '🚨' : '⚠️');
    console.log(`${icon} ${r.name}: ${r.status ? 'UP' : 'DOWN'}`);
  });
}

async function startMonitoring() {
  console.log('🛡️ QUANTUM FORGE™ System Monitor Starting...');
  
  // Initial check
  await checkServices();
  
  // Check every 2 minutes
  setInterval(async () => {
    try {
      await checkServices();
    } catch (error) {
      console.error('Monitor error:', error);
      await sendAlert('🤖 System monitor encountered an error', false);
    }
  }, 2 * 60 * 1000);
}

// Handle the classic "who monitors the monitor" problem
process.on('uncaughtException', async (error) => {
  await sendAlert(`💀 MONITOR CRASHED: ${error.message}`, true);
  process.exit(1);
});

if (require.main === module) {
  startMonitoring().catch(console.error);
}