#!/usr/bin/env node
/**
 * QUANTUM FORGE™ Webhook Server
 * Standalone high-performance webhook service
 */

import { webhookService } from './webhook-service';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  
  try {
    await webhookService.shutdown();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the service
async function main() {
  console.log('🚀 QUANTUM FORGE™ Webhook Service Starting...');
  console.log('=' .repeat(60));
  
  try {
    await webhookService.start();
    console.log('✅ Webhook service is running and ready to accept webhooks');
    console.log('');
    console.log('📊 Service Endpoints:');
    console.log(`   Health Check: http://localhost:${process.env.WEBHOOK_PORT || '4000'}/health`);
    console.log(`   Webhook Ingestion: http://localhost:${process.env.WEBHOOK_PORT || '4000'}/webhook`);
    console.log(`   Bulk Ingestion: http://localhost:${process.env.WEBHOOK_PORT || '4000'}/webhooks/bulk`);
    console.log(`   Metrics: http://localhost:${process.env.WEBHOOK_PORT || '4000'}/metrics`);
    console.log('');
    console.log('🔥 Ready for high-volume webhook processing!');
    
  } catch (error) {
    console.error('❌ Failed to start webhook service:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}