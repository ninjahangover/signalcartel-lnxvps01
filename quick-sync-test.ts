#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const analyticsDb = new PrismaClient({
  datasources: { db: { url: process.env.ANALYTICS_DB_URL } }
});

async function quickSync() {
  try {
    console.log('🔄 Testing simplified sync...');
    
    // Sync 2 collection records
    const collections = await prisma.marketDataCollection.findMany({ take: 2 });
    console.log(`📁 Found ${collections.length} collection records`);
    
    for (const col of collections) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_data_collection (
            instance_id, original_collection_id, symbol, status, enabled, data_points
          ) VALUES (
            ${'site-primary-main'}, ${col.id}, ${col.symbol}, ${col.status}, ${col.enabled}, ${col.dataPoints || 0}
          ) ON CONFLICT (instance_id, original_collection_id) DO NOTHING
        `;
        console.log('✅ Synced collection:', col.symbol, 'with', col.dataPoints, 'data points');
      } catch (error: any) {
        console.log('❌ Error syncing', col.symbol, ':', error.message.split('\n')[0]);
      }
    }

    // Check results
    const result = await analyticsDb.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) as count FROM consolidated_data_collection`;
    console.log('📊 Total collection records:', Number(result[0].count));
    
  } catch (error: any) {
    console.error('❌ Overall error:', error.message);
  }
  
  await prisma.$disconnect();
  await analyticsDb.$disconnect();
}

quickSync().then(() => process.exit(0));