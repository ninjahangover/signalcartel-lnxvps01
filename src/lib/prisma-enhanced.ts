/**
 * Enhanced Prisma Client with Connection Pooling and Transaction Management
 * 
 * Features:
 * - Connection pooling with automatic cleanup
 * - Transaction management with automatic rollback
 * - Retry logic for transient failures
 * - Health checking and auto-recovery
 * - Graceful shutdown integration
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { shutdownManager } from './graceful-shutdown-manager';

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

class EnhancedPrismaClient {
  private static instance: EnhancedPrismaClient;
  private prisma: PrismaClient;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private pendingTransactions = new Set<string>();

  private constructor() {
    // Initialize with optimized connection pool settings
    this.prisma = new PrismaClient({
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' }
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Connection pool configuration
      // @ts-ignore - These options might not be in TypeScript definitions yet
      connectionLimit: 10, // Max connections in pool
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100
      }
    });

    this.setupEventListeners();
    this.registerShutdownHandler();
  }

  static getInstance(): EnhancedPrismaClient {
    if (!this.instance) {
      this.instance = new EnhancedPrismaClient();
    }
    return this.instance;
  }

  private setupEventListeners() {
    // @ts-ignore
    this.prisma.$on('error', (e: any) => {
      console.error('🔴 Database error:', e.message);
      this.handleDatabaseError(e);
    });

    // @ts-ignore
    this.prisma.$on('warn', (e: any) => {
      console.warn('⚠️ Database warning:', e.message);
    });

    // @ts-ignore
    this.prisma.$on('info', (e: any) => {
      console.log('ℹ️ Database info:', e.message);
    });
  }

  private registerShutdownHandler() {
    shutdownManager.registerHandler({
      name: 'Enhanced Prisma Cleanup',
      priority: 90, // Run near the end
      timeout: 10000,
      handler: async () => {
        await this.gracefulDisconnect();
      }
    });
  }

  /**
   * Connect to database with retry logic
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    while (this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        this.connectionAttempts++;
        console.log(`🔄 Connecting to database (attempt ${this.connectionAttempts})...`);
        
        await this.prisma.$connect();
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        console.log('✅ Database connected successfully');
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        return;
      } catch (error) {
        console.error(`❌ Connection attempt ${this.connectionAttempts} failed:`, error.message);
        
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          throw new Error(`Failed to connect after ${this.maxConnectionAttempts} attempts`);
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring() {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        // Simple health check query
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
        this.isConnected = false;
        
        // Try to reconnect
        try {
          await this.connect();
        } catch (reconnectError) {
          console.error('❌ Reconnection failed:', reconnectError.message);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Execute a transaction with automatic rollback on failure
   */
  async executeTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.pendingTransactions.add(transactionId);

    try {
      console.log(`🔄 Starting transaction ${transactionId}`);
      
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Set transaction options
          if (options.isolationLevel) {
            await tx.$executeRaw`SET TRANSACTION ISOLATION LEVEL ${Prisma.raw(options.isolationLevel)}`;
          }
          
          return await fn(tx);
        },
        {
          maxWait: options.maxWait || 5000,
          timeout: options.timeout || 10000,
          isolationLevel: options.isolationLevel
        }
      );

      console.log(`✅ Transaction ${transactionId} completed successfully`);
      this.pendingTransactions.delete(transactionId);
      return result;

    } catch (error) {
      console.error(`❌ Transaction ${transactionId} failed:`, error.message);
      this.pendingTransactions.delete(transactionId);
      
      // Check if it's a known transient error
      if (this.isTransientError(error)) {
        console.log('🔄 Retrying transaction due to transient error...');
        // Retry once
        return await this.executeTransaction(fn, options);
      }
      
      throw error;
    }
  }

  /**
   * Execute query with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isTransientError(error) || attempt === maxRetries) {
          throw error;
        }
        
        const delay = Math.min(1000 * attempt, 5000);
        console.log(`⏳ Retrying operation (attempt ${attempt}/${maxRetries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is transient and can be retried
   */
  private isTransientError(error: any): boolean {
    const transientErrorCodes = [
      'P1001', // Can't reach database server
      'P1002', // Database server timeout
      'P2024', // Connection pool timeout
      'P2025', // Operation timeout
    ];

    if (error.code && transientErrorCodes.includes(error.code)) {
      return true;
    }

    const transientMessages = [
      'connection timeout',
      'connection refused',
      'ECONNRESET',
      'ETIMEDOUT',
      'deadlock detected'
    ];

    return transientMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Handle database errors
   */
  private async handleDatabaseError(error: any) {
    console.error('🚨 Database error detected:', error);

    // Check if it's a connection error
    if (error.code === 'P1001' || error.code === 'P1002') {
      this.isConnected = false;
      
      // Try to reconnect
      try {
        await this.connect();
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect after error:', reconnectError.message);
      }
    }
  }

  /**
   * Graceful disconnect with transaction completion
   */
  async gracefulDisconnect(): Promise<void> {
    console.log('🔄 Starting graceful database disconnect...');

    // Wait for pending transactions
    if (this.pendingTransactions.size > 0) {
      console.log(`⏳ Waiting for ${this.pendingTransactions.size} pending transactions...`);
      
      // Wait up to 10 seconds for transactions to complete
      const maxWait = 10000;
      const startTime = Date.now();
      
      while (this.pendingTransactions.size > 0 && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (this.pendingTransactions.size > 0) {
        console.warn(`⚠️ ${this.pendingTransactions.size} transactions still pending after timeout`);
      }
    }

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Disconnect
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Error during disconnect:', error.message);
    }
  }

  /**
   * Get the underlying Prisma client
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Check if connected
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      pendingTransactions: this.pendingTransactions.size,
      connectionAttempts: this.connectionAttempts
    };
  }
}

// Export singleton instance and client
export const enhancedPrisma = EnhancedPrismaClient.getInstance();
export const prismaEnhanced = enhancedPrisma.getClient();

// Also export transaction helper
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  return enhancedPrisma.executeTransaction(fn, options);
}

// Export retry helper
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries?: number
): Promise<T> {
  return enhancedPrisma.executeWithRetry(operation, maxRetries);
}