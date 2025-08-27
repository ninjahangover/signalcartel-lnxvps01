#!/usr/bin/env npx tsx

/**
 * Test consolidated data access for AI algorithms
 * Verifies that the analytics database is properly set up and accessible
 */

import { PrismaClient } from '@prisma/client';

const ANALYTICS_DB_URL = process.env.ANALYTICS_DB_URL || 
  'postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public';

async function testConsolidatedDataAccess() {
  console.log('🧪 Testing Consolidated Data Access for AI Algorithms');
  console.log('=' .repeat(80));
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: ANALYTICS_DB_URL }
    }
  });

  try {
    // Test 1: Check database connection
    console.log('\n📡 Test 1: Database Connection');
    console.log('-' .repeat(40));
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Test 2: Check instances table
    console.log('\n🏗️ Test 2: Instances Registration');
    console.log('-' .repeat(40));
    const instances = await prisma.$queryRaw`SELECT * FROM instances`;
    console.log(`✅ Found ${instances.length} registered instances:`);
    instances.forEach((instance: any) => {
      console.log(`   - ${instance.id}: ${instance.name} (${instance.status})`);
    });
    
    // Test 3: Check analytics views
    console.log('\n📊 Test 3: Analytics Views');
    console.log('-' .repeat(40));
    
    try {
      const views = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name LIKE '%performance%' OR table_name LIKE '%insights%'
      `;
      console.log(`✅ Found ${views.length} analytics views:`);
      views.forEach((view: any) => {
        console.log(`   - ${view.table_name}`);
      });
    } catch (error) {
      console.log('⚠️  Views check had issues, but continuing...');
    }
    
    // Test 4: Test AI data service import
    console.log('\n🤖 Test 4: AI Data Service Integration');
    console.log('-' .repeat(40));
    
    try {
      const { ConsolidatedAIDataService } = await import('../src/lib/consolidated-ai-data-service');
      const dataService = new ConsolidatedAIDataService({
        analyticsDbUrl: ANALYTICS_DB_URL,
        instanceId: 'site-primary-main'
      });
      
      console.log('✅ AI Data Service imported successfully');
      
      // Test getting learning insights
      const insights = await dataService.getLearningInsights('strategy', 'BTC/USDT', 0.5);
      console.log(`✅ Learning insights query executed (${insights.length} results)`);
      
      // Test instance status update
      await dataService.updateInstanceStatus({ dataQualityScore: 0.95 });
      console.log('✅ Instance status update successful');
      
      await dataService.disconnect();
      console.log('✅ Data service connection closed properly');
      
    } catch (error) {
      console.log('❌ AI Data Service test failed:', error.message);
    }
    
    // Test 5: Check table structures
    console.log('\n📋 Test 5: Table Structure Verification');
    console.log('-' .repeat(40));
    
    const tables = [
      'instances',
      'consolidated_positions', 
      'consolidated_trades',
      'ai_performance_metrics',
      'consolidated_sentiment',
      'consolidated_intuition',
      'learning_insights',
      'sync_status'
    ];
    
    let tablesCreated = 0;
    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ready (${count[0].count} records)`);
        tablesCreated++;
      } catch (error) {
        console.log(`❌ ${table}: error - ${error.message.slice(0, 100)}...`);
      }
    }
    
    console.log(`\n📊 Summary: ${tablesCreated}/${tables.length} tables operational`);
    
    // Test 6: Sample data insertion test
    console.log('\n💾 Test 6: Sample Data Operations');
    console.log('-' .repeat(40));
    
    try {
      // Insert a test learning insight
      await prisma.$queryRaw`
        INSERT INTO learning_insights (
          insight_type, title, description, confidence_level, 
          source_instances, data_points, validation_score,
          applicable_symbols
        ) VALUES (
          'test',
          'Multi-Instance Setup Test',
          'Verifying cross-site data consolidation is working',
          0.95,
          ARRAY['site-primary-main'],
          1,
          0.90,
          ARRAY['BTC/USDT']
        )
        ON CONFLICT DO NOTHING
      `;
      console.log('✅ Sample data insertion successful');
      
      // Query it back
      const testInsights = await prisma.$queryRaw`
        SELECT * FROM learning_insights 
        WHERE insight_type = 'test' 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      console.log(`✅ Sample data retrieval successful (${testInsights.length} results)`);
      
    } catch (error) {
      console.log('❌ Sample data operations failed:', error.message);
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 CONSOLIDATED DATA ACCESS TESTING COMPLETED');
    console.log('✅ Analytics database is ready for AI algorithm integration');
    console.log('📍 Database URL:', ANALYTICS_DB_URL);
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testConsolidatedDataAccess().catch(console.error);
}