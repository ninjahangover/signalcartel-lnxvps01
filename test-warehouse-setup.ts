// Test QUANTUM FORGE™ Data Warehouse Setup
import { warehouseDataPipeline, syncToWarehouse } from './src/lib/warehouse-data-pipeline';

async function testWarehouseSetup() {
  console.log('🏭 Testing QUANTUM FORGE™ Data Warehouse...');
  
  try {
    // Initialize warehouse connection
    const connected = await warehouseDataPipeline.initialize();
    
    if (!connected) {
      console.log('⚠️ Warehouse not available - this is expected if container not running');
      console.log('💡 To start warehouse: docker-compose -f containers/database/postgres-warehouse.yml up -d');
      return;
    }
    
    console.log('✅ Warehouse connection successful!');
    
    // Test data sync (will be empty since operational DB is empty)
    const tradesSynced = await warehouseDataPipeline.syncTrades(10);
    console.log(`📊 Test sync completed: ${tradesSynced} trades synced`);
    
    // Test analytics query
    const analytics = await warehouseDataPipeline.getLongTermAnalytics('RSI_Strategy', 30);
    console.log('📈 Analytics query successful:', analytics ? `${analytics.length} weeks of data` : 'No data available');
    
    // Generate snapshots
    await warehouseDataPipeline.generateStrategySnapshots();
    console.log('📊 Strategy snapshots generated');
    
    console.log('🎉 Data Warehouse test completed successfully!');
    
  } catch (error) {
    console.error('❌ Warehouse test failed:', error.message);
  } finally {
    await warehouseDataPipeline.close();
  }
}

// Run if called directly
if (require.main === module) {
  testWarehouseSetup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testWarehouseSetup };