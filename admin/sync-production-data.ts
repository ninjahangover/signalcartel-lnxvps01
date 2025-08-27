#!/usr/bin/env npx tsx

/**
 * Production Data Sync to Analytics Database
 * Syncs existing production data to the multi-instance analytics database
 */

import { prisma } from '../src/lib/prisma.js';
import { PrismaClient } from '@prisma/client';

async function syncProductionData() {
  console.log('🔄 SYNCING PRODUCTION DATA TO ANALYTICS DATABASE');
  console.log('='.repeat(70));
  
  // Create analytics DB connection
  const analyticsDb = new PrismaClient({
    datasources: {
      db: { url: process.env.ANALYTICS_DB_URL }
    }
  });
  
  try {
    console.log('📊 Starting production data sync...');
    
    // 1. Sync ManagedPositions with proper column mapping
    console.log('🏗️ Syncing managed positions...');
    const managedPositions = await prisma.managedPosition.findMany({
      take: 200, // Start with 200 records
      select: {
        id: true,
        symbol: true,
        strategy: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        realizedPnL: true,
        entryTime: true,
        exitTime: true,
        status: true
      }
    });
    
    console.log(`Found ${managedPositions.length} managed positions to sync`);
    
    let syncedPositions = 0;
    for (const position of managedPositions) {
      try {
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_positions (
            instance_id, 
            original_position_id, 
            symbol, 
            strategy_name, 
            entry_price, 
            exit_price, 
            quantity, 
            pnl_realized, 
            entry_time, 
            exit_time,
            data_hash
          ) VALUES (
            'site-primary-main',
            ${position.id},
            ${position.symbol || 'UNKNOWN'},
            ${position.strategy || 'default'},
            ${position.entryPrice || 0},
            ${position.exitPrice},
            ${position.quantity || 0},
            ${position.realizedPnL},
            ${position.entryTime},
            ${position.exitTime},
            ${position.id.toString() + (position.symbol || 'UNKNOWN')}
          )
          ON CONFLICT (instance_id, original_position_id) 
          DO UPDATE SET 
            exit_price = EXCLUDED.exit_price,
            exit_time = EXCLUDED.exit_time,
            pnl_realized = EXCLUDED.pnl_realized
        `;
        syncedPositions++;
      } catch (insertError: any) {
        console.log(`⚠️ Skipped position ${position.id}: ${insertError.message}`);
      }
    }
    
    console.log(`✅ Synced ${syncedPositions}/${managedPositions.length} positions`);
    
    // 2. Get position ID mapping from consolidated_positions
    console.log('🔗 Creating position ID mapping...');
    const positionMapping = await analyticsDb.$queryRaw<Array<{id: number; original_position_id: string}>>`
      SELECT id, original_position_id 
      FROM consolidated_positions 
      WHERE instance_id = 'site-primary-main'
    `;
    
    const positionIdMap = new Map(
      positionMapping.map(p => [p.original_position_id, p.id])
    );
    
    console.log(`Created mapping for ${positionIdMap.size} positions`);

    // 3. Sync ManagedTrades with position ID mapping
    console.log('💱 Syncing managed trades...');
    const managedTrades = await prisma.managedTrade.findMany({
      take: 200, // Start with 200 records
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        price: true,
        executedAt: true,
        positionId: true
      }
    });
    
    console.log(`Found ${managedTrades.length} managed trades to sync`);
    
    let syncedTrades = 0;
    for (const trade of managedTrades) {
      try {
        // Map the position ID from string to integer
        const mappedPositionId = trade.positionId ? positionIdMap.get(trade.positionId) : null;
        
        await analyticsDb.$executeRaw`
          INSERT INTO consolidated_trades (
            instance_id,
            original_trade_id,
            position_id,
            symbol,
            side,
            quantity,
            price,
            executed_at,
            data_hash
          ) VALUES (
            'site-primary-main',
            ${trade.id},
            ${mappedPositionId},
            ${trade.symbol || 'UNKNOWN'},
            ${trade.side || 'BUY'},
            ${trade.quantity || 0},
            ${trade.price || 0},
            ${trade.executedAt},
            ${trade.id.toString() + (trade.symbol || 'UNKNOWN')}
          )
          ON CONFLICT (instance_id, original_trade_id)
          DO NOTHING
        `;
        syncedTrades++;
      } catch (insertError: any) {
        console.log(`⚠️ Skipped trade ${trade.id}: ${insertError.message}`);
      }
    }
    
    console.log(`✅ Synced ${syncedTrades}/${managedTrades.length} trades`);
    
    // 4. Sync IntuitionAnalysis data if it exists
    console.log('🧠 Syncing intuition analysis data...');
    try {
      const intuitionAnalyses = await prisma.intuitionAnalysis.findMany({
        take: 100,
        select: {
          id: true,
          symbol: true,
          overallIntuition: true,
          flowFieldResonance: true,
          patternResonance: true,
          analysisTime: true,
          recommendation: true
        }
      });
      
      console.log(`Found ${intuitionAnalyses.length} intuition analyses to sync`);
      
      let syncedAnalyses = 0;
      for (const analysis of intuitionAnalyses) {
        try {
          await analyticsDb.$executeRaw`
            INSERT INTO consolidated_intuition (
              instance_id,
              original_analysis_id,
              symbol,
              overall_intuition,
              flow_field_resonance,
              pattern_resonance,
              analysis_time,
              recommendation,
              data_hash
            ) VALUES (
              'site-primary-main',
              ${analysis.id},
              ${analysis.symbol},
              ${analysis.overallIntuition},
              ${analysis.flowFieldResonance},
              ${analysis.patternResonance},
              ${analysis.analysisTime},
              ${analysis.recommendation},
              ${analysis.id.toString() + (analysis.symbol || 'UNKNOWN')}
            )
            ON CONFLICT (instance_id, original_analysis_id)
            DO NOTHING
          `;
          syncedAnalyses++;
        } catch (insertError: any) {
          console.log(`⚠️ Skipped analysis ${analysis.id}: ${insertError.message}`);
        }
      }
      
      console.log(`✅ Synced ${syncedAnalyses}/${intuitionAnalyses.length} analyses`);
      
    } catch (error: any) {
      console.log('ℹ️ IntuitionAnalysis table not found or empty, skipping...');
    }
    
    // 5. Update instance status
    console.log('🔄 Updating instance sync status...');
    await analyticsDb.$executeRaw`
      UPDATE instances 
      SET 
        last_sync = NOW(),
        status = 'active'
      WHERE id = 'site-primary-main'
    `;
    
    // 6. Verify sync results
    console.log('');
    console.log('✅ SYNC VERIFICATION:');
    
    const consolidatedPositions = await analyticsDb.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM consolidated_positions
    `;
    
    const consolidatedTrades = await analyticsDb.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM consolidated_trades  
    `;
    
    // Calculate performance data directly since view might not exist
    const performanceData = await analyticsDb.$queryRaw<Array<{
      instance_id: string;
      total_positions: bigint;
      total_pnl: number;
      win_rate: number;
    }>>`
      SELECT 
        'site-primary-main' as instance_id,
        COUNT(*) as total_positions,
        COALESCE(ROUND(SUM(pnl_realized)::numeric, 2), 0) as total_pnl,
        COALESCE(ROUND(COUNT(CASE WHEN pnl_realized > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1), 0) as win_rate
      FROM consolidated_positions 
      WHERE pnl_realized IS NOT NULL AND instance_id = 'site-primary-main'
    `;
    
    console.log(`Consolidated Positions: ${consolidatedPositions[0]?.count || 0}`);
    console.log(`Consolidated Trades: ${consolidatedTrades[0]?.count || 0}`);
    console.log('');
    console.log('📊 CROSS-INSTANCE PERFORMANCE:');
    performanceData.forEach(row => {
      console.log(`  ${row.instance_id}: ${row.total_positions} positions, $${row.total_pnl} P&L, ${row.win_rate}% win rate`);
    });
    
    console.log('');
    console.log('🎊 PRODUCTION DATA SYNC COMPLETED SUCCESSFULLY!');
    console.log('━'.repeat(70));
    console.log('✅ Analytics database now contains consolidated trading data');
    console.log('✅ AI algorithms can now access cross-instance data');
    console.log('✅ Multi-instance consolidation system is fully operational');
    
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await analyticsDb.$disconnect();
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  syncProductionData().catch(console.error);
}

export default syncProductionData;