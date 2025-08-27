#!/usr/bin/env npx tsx

/**
 * Quick Collection Sync - Data collection metadata
 * Simple sync test for MarketDataCollection table
 */

import { prisma } from './src/lib/prisma.js';
import { PrismaClient } from '@prisma/client';

const analyticsDb = new PrismaClient({
  datasources: {
    db: { url: process.env.ANALYTICS_DB_URL }
  }
});

const instanceId = process.env.INSTANCE_ID || 'site-primary-main';

async function quickSyncTest() {
  console.log('🧪 QUICK COLLECTION SYNC TEST');
  console.log('=============================');
  console.log('Instance ID:', instanceId);
  console.log('');

  try {
    // 1. Check what MarketDataCollection data we have
    console.log('🔍 Checking MarketDataCollection table...');
    const collectionRecords = await prisma.marketDataCollection.findMany({
      take: 10,
      select: {
        id: true,
        symbol: true,
        status: true,
        enabled: true,
        dataPoints: true,
        completeness: true,
        oldestData: true,
        newestData: true,
        lastCollected: true,
        successRate: true,
        errorCount: true,
        updatedAt: true
      }
    });

    console.log(`  Found ${collectionRecords.length} data collection records:`);
    collectionRecords.forEach(record => {
      console.log(`    ${record.symbol}: ${record.dataPoints || 0} points, ${(record.completeness || 0 * 100).toFixed(1)}% complete`);
    });

    if (collectionRecords.length === 0) {
      console.log('  ❌ No MarketDataCollection records found - this may be why sync shows 0');
      
      // Create a sample record for testing
      console.log('  🔧 Creating sample MarketDataCollection record for testing...');
      try {
        await prisma.marketDataCollection.create({
          data: {
            symbol: 'BTCUSD',
            status: 'active',
            enabled: true,
            dataPoints: 1000,
            completeness: 95.5,
            oldestData: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            newestData: new Date(),
            lastCollected: new Date(),
            successRate: 98.5,
            errorCount: 2
          }
        });
        console.log('    ✅ Created sample BTCUSD collection record');
      } catch (error: any) {
        console.log(`    ⚠️ Could not create sample record: ${error.message.split('\n')[0]}`);
      }
      return;
    }

    // 2. Try to sync the collection data
    console.log('📤 Syncing to analytics database...');
    let syncedCount = 0;
    for (const record of collectionRecords) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_data_collection (
            instance_id,
            original_collection_id,
            symbol,
            status,
            enabled,
            data_points,
            completeness,
            oldest_data,
            newest_data,
            last_collected,
            success_rate,
            error_count,
            data_hash
          ) VALUES (
            ${instanceId},
            ${record.id},
            ${record.symbol},
            ${record.status},
            ${record.enabled || false},
            ${record.dataPoints || 0},
            ${record.completeness || 0.0},
            ${record.oldestData},
            ${record.newestData},
            ${record.lastCollected},
            ${record.successRate || 0.0},
            ${record.errorCount || 0},
            ${record.id + '-' + record.symbol}
          )
          ON CONFLICT (instance_id, original_collection_id)
          DO UPDATE SET 
            data_points = EXCLUDED.data_points,
            completeness = EXCLUDED.completeness,
            newest_data = EXCLUDED.newest_data,
            last_collected = EXCLUDED.last_collected,
            success_rate = EXCLUDED.success_rate,
            error_count = EXCLUDED.error_count,
            last_updated = NOW()
        `;
        syncedCount++;
        console.log(`    ✅ Synced ${record.symbol} collection data`);
      } catch (error: any) {
        console.log(`    ❌ Failed to sync ${record.symbol}: ${error.message.split('\n')[0]}`);
      }
    }

    console.log('');
    console.log('✅ QUICK SYNC TEST COMPLETED');
    console.log(`   Successfully synced: ${syncedCount}/${collectionRecords.length} records`);

    if (syncedCount > 0) {
      console.log('');
      console.log('🎯 VERIFICATION - Checking analytics database...');
      const verificationCount = await analyticsDb.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count 
        FROM consolidated_data_collection 
        WHERE instance_id = ${instanceId}
      `;
      console.log(`   Analytics DB now has: ${Number(verificationCount[0]?.count || 0)} collection records`);
    }

  } catch (error: any) {
    console.error('❌ Quick sync test failed:', error.message);
    process.exit(1);
  } finally {
    await analyticsDb.$disconnect();
    await prisma.$disconnect();
  }
}

// Run quick sync test
quickSyncTest().catch(console.error);