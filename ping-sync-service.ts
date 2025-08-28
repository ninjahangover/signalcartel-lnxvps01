#!/usr/bin/env node
/**
 * Simple Sync Service Heartbeat Ping
 * Updates a heartbeat counter to show the sync service is alive
 */

import { PrismaClient } from '@prisma/client';

const ANALYTICS_DB_URL = process.env.ANALYTICS_DB_URL || "postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public";

async function pingSyncService() {
  try {
    console.log('🏓 SYNC SERVICE PING');
    console.log('==================');
    
    // Connect to analytics database
    const analyticsDb = new PrismaClient({
      datasources: {
        db: {
          url: ANALYTICS_DB_URL
        }
      }
    });

    // Update heartbeat with ping count increment
    const result = await analyticsDb.$executeRaw`
      INSERT INTO sync_heartbeat (service_name, last_ping, ping_count, status)
      VALUES ('data-sync-service', NOW(), 1, 'active')
      ON CONFLICT (service_name) 
      DO UPDATE SET 
        last_ping = NOW(),
        ping_count = sync_heartbeat.ping_count + 1,
        status = 'active'
      RETURNING *;
    `;

    // Get current heartbeat status
    const heartbeat = await analyticsDb.$queryRaw`
      SELECT service_name, last_ping, ping_count, status 
      FROM sync_heartbeat 
      WHERE service_name = 'data-sync-service'
    ` as any[];

    if (heartbeat.length > 0) {
      const hb = heartbeat[0];
      console.log(`✅ Service: ${hb.service_name}`);
      console.log(`📅 Last Ping: ${hb.last_ping}`);
      console.log(`🔢 Ping Count: ${hb.ping_count}`);
      console.log(`🟢 Status: ${hb.status}`);
      console.log('');
      console.log('🎯 Sync service heartbeat updated successfully!');
    }

    await analyticsDb.$disconnect();
    
  } catch (error) {
    console.error('❌ Ping failed:', error);
    process.exit(1);
  }
}

pingSyncService();