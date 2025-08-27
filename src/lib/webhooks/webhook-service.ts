/**
 * QUANTUM FORGE™ High-Performance Webhook Service
 * 
 * Enterprise-grade webhook ingestion and distribution system
 * designed to handle high-volume trading signals and alerts
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import crypto from 'crypto';
import { prisma } from '../prisma';

// Webhook payload types
export interface WebhookPayload {
  id: string;
  type: 'trade_signal' | 'trade_executed' | 'position_opened' | 'position_closed' | 
        'alert' | 'risk_warning' | 'emergency_stop' | 'performance_update' | 'ai_signal';
  source: string; // Strategy or system that generated the webhook
  timestamp: Date;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  metadata?: {
    sessionId?: string;
    strategyId?: string;
    symbol?: string;
    confidence?: number;
  };
}

export interface WebhookDestination {
  id: string;
  name: string;
  url: string;
  secret?: string; // For HMAC signature verification
  active: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    timeoutMs: number;
  };
  filters?: {
    types?: string[];
    sources?: string[];
    symbols?: string[];
    minConfidence?: number;
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  destinationId: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  responseCode?: number;
  responseTime?: number;
}

export class QuantumForgeWebhookService {
  private fastify: FastifyInstance;
  private redis: Redis;
  private webhookQueue: Queue<WebhookPayload>;
  private distributionQueue: Queue<{ webhook: WebhookPayload; destination: WebhookDestination }>;
  private worker: Worker | null = null;
  private distributionWorker: Worker | null = null;
  private queueEvents: QueueEvents;
  
  // Configuration
  private readonly config = {
    port: parseInt(process.env.WEBHOOK_PORT || '4000'),
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    maxQueueSize: 100000,
    workerConcurrency: 50,
    defaultTimeout: 10000,
    maxRetries: 3,
    retryBackoff: 5000,
    rateLimits: {
      perMinute: 1000,
      perSecond: 50
    }
  };
  
  // Metrics tracking
  private metrics = {
    totalReceived: 0,
    totalProcessed: 0,
    totalDelivered: 0,
    totalFailed: 0,
    avgProcessingTime: 0,
    avgDeliveryTime: 0,
    lastHourVolume: 0,
    queueDepth: 0
  };
  
  constructor() {
    // Initialize Fastify with optimizations
    this.fastify = Fastify({
      logger: true,
      bodyLimit: 10485760, // 10MB
      trustProxy: true,
      requestIdHeader: 'x-webhook-id',
      disableRequestLogging: false,
      maxParamLength: 500
    });
    
    // Initialize Redis
    this.redis = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    
    // Initialize queues
    this.webhookQueue = new Queue('webhooks', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.config.retryBackoff
        }
      }
    });
    
    this.distributionQueue = new Queue('webhook-distribution', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });
    
    this.queueEvents = new QueueEvents('webhooks', {
      connection: this.redis
    });
    
    this.setupRoutes();
    this.setupWorkers();
    this.setupMetricsTracking();
  }
  
  /**
   * Setup Fastify routes
   */
  private setupRoutes(): void {
    // Health check
    this.fastify.get('/health', async (request, reply) => {
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        redis: this.redis.status,
        queue: {
          depth: await this.webhookQueue.count(),
          active: await this.webhookQueue.getActiveCount(),
          failed: await this.webhookQueue.getFailedCount()
        },
        metrics: this.metrics
      };
      
      reply.code(200).send(health);
    });
    
    // Main webhook ingestion endpoint
    this.fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const startTime = Date.now();
        
        // Validate webhook payload
        const payload = this.validateWebhookPayload(request.body);
        
        // Check rate limits
        const rateLimitOk = await this.checkRateLimit(request.ip);
        if (!rateLimitOk) {
          return reply.code(429).send({ error: 'Rate limit exceeded' });
        }
        
        // Generate webhook ID
        payload.id = this.generateWebhookId();
        payload.timestamp = new Date();
        
        // Add to processing queue
        await this.webhookQueue.add('process', payload, {
          priority: this.getPriorityValue(payload.priority),
          delay: 0
        });
        
        // Update metrics
        this.metrics.totalReceived++;
        this.metrics.queueDepth = await this.webhookQueue.count();
        
        // Log high-priority webhooks
        if (payload.priority === 'critical' || payload.priority === 'high') {
          console.log(`🚨 High-priority webhook received: ${payload.type} from ${payload.source}`);
        }
        
        const processingTime = Date.now() - startTime;
        
        reply.code(202).send({
          id: payload.id,
          status: 'queued',
          processingTime: processingTime,
          queueDepth: this.metrics.queueDepth
        });
        
      } catch (error) {
        console.error('Webhook ingestion error:', error);
        reply.code(400).send({ error: error.message });
      }
    });
    
    // Webhook status endpoint
    this.fastify.get('/webhook/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      try {
        const webhookId = request.params.id;
        
        // Check queue for webhook
        const job = await this.webhookQueue.getJob(webhookId);
        
        if (!job) {
          return reply.code(404).send({ error: 'Webhook not found' });
        }
        
        const status = await job.getState();
        const progress = job.progress;
        
        reply.send({
          id: webhookId,
          status,
          progress,
          data: job.data,
          createdAt: new Date(job.timestamp),
          processedAt: job.processedOn ? new Date(job.processedOn) : null,
          failedReason: job.failedReason
        });
        
      } catch (error) {
        reply.code(500).send({ error: error.message });
      }
    });
    
    // Metrics endpoint
    this.fastify.get('/metrics', async (request, reply) => {
      const detailed = {
        ...this.metrics,
        queue: {
          waiting: await this.webhookQueue.getWaitingCount(),
          active: await this.webhookQueue.getActiveCount(),
          completed: await this.webhookQueue.getCompletedCount(),
          failed: await this.webhookQueue.getFailedCount(),
          delayed: await this.webhookQueue.getDelayedCount()
        },
        distribution: {
          pending: await this.distributionQueue.getWaitingCount(),
          active: await this.distributionQueue.getActiveCount(),
          completed: await this.distributionQueue.getCompletedCount(),
          failed: await this.distributionQueue.getFailedCount()
        },
        redis: {
          status: this.redis.status,
          memory: await this.redis.info('memory'),
          clients: await this.redis.client('list')
        }
      };
      
      reply.send(detailed);
    });
    
    // Destination management endpoints
    this.fastify.post('/destinations', async (request, reply) => {
      try {
        const destination = request.body as WebhookDestination;
        destination.id = crypto.randomUUID();
        
        // Store destination in Redis
        await this.redis.hset(
          'webhook:destinations',
          destination.id,
          JSON.stringify(destination)
        );
        
        reply.code(201).send(destination);
      } catch (error) {
        reply.code(500).send({ error: error.message });
      }
    });
    
    this.fastify.get('/destinations', async (request, reply) => {
      try {
        const destinations = await this.redis.hgetall('webhook:destinations');
        const parsed = Object.values(destinations).map(d => JSON.parse(d));
        reply.send(parsed);
      } catch (error) {
        reply.code(500).send({ error: error.message });
      }
    });
    
    // Bulk webhook ingestion for high volume
    this.fastify.post('/webhooks/bulk', async (request: FastifyRequest, reply) => {
      try {
        const payloads = request.body as WebhookPayload[];
        
        if (!Array.isArray(payloads) || payloads.length === 0) {
          return reply.code(400).send({ error: 'Invalid bulk payload' });
        }
        
        if (payloads.length > 100) {
          return reply.code(400).send({ error: 'Maximum 100 webhooks per bulk request' });
        }
        
        // Process bulk webhooks
        const jobs = payloads.map(payload => ({
          name: 'process',
          data: {
            ...payload,
            id: this.generateWebhookId(),
            timestamp: new Date()
          },
          opts: {
            priority: this.getPriorityValue(payload.priority),
            delay: 0
          }
        }));
        
        await this.webhookQueue.addBulk(jobs);
        
        this.metrics.totalReceived += payloads.length;
        this.metrics.queueDepth = await this.webhookQueue.count();
        
        reply.code(202).send({
          accepted: payloads.length,
          queueDepth: this.metrics.queueDepth
        });
        
      } catch (error) {
        reply.code(500).send({ error: error.message });
      }
    });
  }
  
  /**
   * Setup queue workers for processing
   */
  private setupWorkers(): void {
    // Main webhook processor
    this.worker = new Worker('webhooks', async (job) => {
      const startTime = Date.now();
      const webhook = job.data as WebhookPayload;
      
      try {
        console.log(`📨 Processing webhook ${webhook.id}: ${webhook.type} from ${webhook.source}`);
        
        // Store webhook in database for audit trail
        await this.storeWebhook(webhook);
        
        // Process based on webhook type
        await this.processWebhookByType(webhook);
        
        // Get destinations for distribution
        const destinations = await this.getMatchingDestinations(webhook);
        
        // Queue for distribution to each destination
        for (const destination of destinations) {
          await this.distributionQueue.add('distribute', {
            webhook,
            destination
          }, {
            priority: this.getPriorityValue(webhook.priority)
          });
        }
        
        // Update metrics
        this.metrics.totalProcessed++;
        this.updateAverageProcessingTime(Date.now() - startTime);
        
        return { processed: true, destinations: destinations.length };
        
      } catch (error) {
        console.error(`❌ Webhook processing failed for ${webhook.id}:`, error);
        throw error;
      }
    }, {
      connection: this.redis,
      concurrency: this.config.workerConcurrency
    });
    
    // Distribution worker
    this.distributionWorker = new Worker('webhook-distribution', async (job) => {
      const { webhook, destination } = job.data;
      const startTime = Date.now();
      
      try {
        console.log(`📤 Distributing webhook ${webhook.id} to ${destination.name}`);
        
        // Create delivery record
        const delivery: WebhookDelivery = {
          id: crypto.randomUUID(),
          webhookId: webhook.id,
          destinationId: destination.id,
          status: 'pending',
          attempts: job.attemptsMade + 1,
          lastAttemptAt: new Date()
        };
        
        // Generate HMAC signature if secret is configured
        const signature = destination.secret ? 
          this.generateHMACSignature(webhook, destination.secret) : null;
        
        // Send webhook to destination
        const response = await this.sendWebhookToDestination(webhook, destination, signature);
        
        if (response.success) {
          delivery.status = 'delivered';
          delivery.deliveredAt = new Date();
          delivery.responseCode = response.statusCode;
          delivery.responseTime = Date.now() - startTime;
          
          this.metrics.totalDelivered++;
          this.updateAverageDeliveryTime(delivery.responseTime);
          
          console.log(`✅ Webhook ${webhook.id} delivered to ${destination.name}`);
        } else {
          delivery.status = 'failed';
          delivery.errorMessage = response.error;
          delivery.responseCode = response.statusCode;
          
          this.metrics.totalFailed++;
          
          console.error(`❌ Webhook ${webhook.id} delivery failed to ${destination.name}: ${response.error}`);
          
          // Throw error to trigger retry
          if (job.attemptsMade < destination.retryPolicy.maxRetries) {
            throw new Error(response.error);
          }
        }
        
        // Store delivery record
        await this.storeDeliveryRecord(delivery);
        
        return delivery;
        
      } catch (error) {
        console.error(`Distribution error for webhook ${webhook.id}:`, error);
        throw error;
      }
    }, {
      connection: this.redis,
      concurrency: this.config.workerConcurrency * 2 // Higher concurrency for distribution
    });
    
    // Setup event handlers
    this.worker.on('completed', (job) => {
      console.log(`✅ Webhook ${job.data.id} processed successfully`);
    });
    
    this.worker.on('failed', (job, error) => {
      console.error(`❌ Webhook ${job?.data?.id} processing failed:`, error);
    });
    
    this.distributionWorker.on('completed', (job) => {
      const { webhook, destination } = job.data;
      console.log(`✅ Webhook ${webhook.id} distributed to ${destination.name}`);
    });
    
    this.distributionWorker.on('failed', (job, error) => {
      const { webhook, destination } = job?.data || {};
      console.error(`❌ Distribution failed for ${webhook?.id} to ${destination?.name}:`, error);
    });
  }
  
  /**
   * Process webhook based on type
   */
  private async processWebhookByType(webhook: WebhookPayload): Promise<void> {
    switch (webhook.type) {
      case 'trade_signal':
        // Log high-confidence trade signals
        if (webhook.metadata?.confidence && webhook.metadata.confidence > 0.8) {
          console.log(`🎯 High-confidence trade signal: ${webhook.data.action} ${webhook.metadata.symbol}`);
        }
        break;
        
      case 'trade_executed':
        // Update trading metrics
        await this.updateTradingMetrics(webhook);
        break;
        
      case 'emergency_stop':
        // Handle emergency situations
        console.log(`🚨 EMERGENCY STOP: ${webhook.data.reason}`);
        // Could trigger additional alerts here
        break;
        
      case 'position_opened':
      case 'position_closed':
        // Track position lifecycle
        await this.trackPositionLifecycle(webhook);
        break;
        
      case 'risk_warning':
        // Log risk warnings prominently
        console.warn(`⚠️ RISK WARNING: ${webhook.data.message}`);
        break;
        
      case 'ai_signal':
        // Process AI-enhanced signals
        await this.processAISignal(webhook);
        break;
        
      default:
        // Generic processing
        console.log(`📨 Processing ${webhook.type} webhook from ${webhook.source}`);
    }
  }
  
  /**
   * Get matching destinations for webhook
   */
  private async getMatchingDestinations(webhook: WebhookPayload): Promise<WebhookDestination[]> {
    const allDestinations = await this.redis.hgetall('webhook:destinations');
    const destinations = Object.values(allDestinations).map(d => JSON.parse(d) as WebhookDestination);
    
    return destinations.filter(dest => {
      if (!dest.active) return false;
      
      // Apply filters
      if (dest.filters) {
        if (dest.filters.types && !dest.filters.types.includes(webhook.type)) {
          return false;
        }
        
        if (dest.filters.sources && !dest.filters.sources.includes(webhook.source)) {
          return false;
        }
        
        if (dest.filters.symbols && webhook.metadata?.symbol && 
            !dest.filters.symbols.includes(webhook.metadata.symbol)) {
          return false;
        }
        
        if (dest.filters.minConfidence && webhook.metadata?.confidence &&
            webhook.metadata.confidence < dest.filters.minConfidence) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Send webhook to destination
   */
  private async sendWebhookToDestination(
    webhook: WebhookPayload,
    destination: WebhookDestination,
    signature: string | null
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Id': webhook.id,
        'X-Webhook-Type': webhook.type,
        'X-Webhook-Source': webhook.source,
        'X-Webhook-Timestamp': webhook.timestamp.toISOString()
      };
      
      if (signature) {
        headers['X-Webhook-Signature'] = signature;
      }
      
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, destination.retryPolicy.timeoutMs);
      
      const response = await fetch(destination.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhook),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        return { success: true, statusCode: response.status };
      } else {
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }
  
  // Helper methods
  
  private validateWebhookPayload(data: any): WebhookPayload {
    if (!data.type || !data.source || !data.data) {
      throw new Error('Invalid webhook payload: missing required fields');
    }
    
    return {
      id: '', // Will be generated
      type: data.type,
      source: data.source,
      timestamp: new Date(),
      data: data.data,
      priority: data.priority || 'normal',
      metadata: data.metadata
    };
  }
  
  private generateWebhookId(): string {
    return `wh_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  private generateHMACSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
  
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'normal': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }
  
  private async checkRateLimit(ip: string): Promise<boolean> {
    const key = `ratelimit:${ip}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    
    return count <= this.config.rateLimits.perMinute;
  }
  
  private async storeWebhook(webhook: WebhookPayload): Promise<void> {
    // Store in Redis for recent access
    await this.redis.hset(
      'webhooks:recent',
      webhook.id,
      JSON.stringify(webhook)
    );
    
    // Expire after 24 hours
    await this.redis.expire(`webhooks:recent:${webhook.id}`, 86400);
    
    // Could also store in database for permanent record
    // await prisma.webhookLog.create({ data: ... });
  }
  
  private async storeDeliveryRecord(delivery: WebhookDelivery): Promise<void> {
    await this.redis.hset(
      `webhook:deliveries:${delivery.webhookId}`,
      delivery.destinationId,
      JSON.stringify(delivery)
    );
  }
  
  private updateAverageProcessingTime(time: number): void {
    const current = this.metrics.avgProcessingTime;
    const count = this.metrics.totalProcessed;
    this.metrics.avgProcessingTime = (current * (count - 1) + time) / count;
  }
  
  private updateAverageDeliveryTime(time: number): void {
    const current = this.metrics.avgDeliveryTime;
    const count = this.metrics.totalDelivered;
    this.metrics.avgDeliveryTime = (current * (count - 1) + time) / count;
  }
  
  private async updateTradingMetrics(webhook: WebhookPayload): Promise<void> {
    // Update trading-specific metrics
    const tradeData = webhook.data;
    // Implementation depends on specific trade data structure
  }
  
  private async trackPositionLifecycle(webhook: WebhookPayload): Promise<void> {
    // Track position lifecycle events
    const positionData = webhook.data;
    // Implementation depends on position data structure
  }
  
  private async processAISignal(webhook: WebhookPayload): Promise<void> {
    // Process AI-enhanced signals with special handling
    if (webhook.metadata?.confidence && webhook.metadata.confidence > 0.9) {
      console.log(`🤖 Ultra-high confidence AI signal: ${webhook.data.recommendation}`);
    }
  }
  
  /**
   * Setup metrics tracking
   */
  private setupMetricsTracking(): void {
    // Update metrics every 10 seconds
    setInterval(async () => {
      this.metrics.queueDepth = await this.webhookQueue.count();
      
      // Calculate last hour volume
      const hourAgo = Date.now() - 3600000;
      const jobs = await this.webhookQueue.getJobs(['completed'], 0, 1000);
      this.metrics.lastHourVolume = jobs.filter(j => 
        j.finishedOn && j.finishedOn > hourAgo
      ).length;
      
    }, 10000);
  }
  
  /**
   * Start the webhook service
   */
  async start(): Promise<void> {
    try {
      // Test Redis connection
      await this.redis.ping();
      console.log('✅ Redis connected');
      
      // Start Fastify server
      await this.fastify.listen({ port: this.config.port, host: '0.0.0.0' });
      console.log(`🚀 QUANTUM FORGE™ Webhook Service running on port ${this.config.port}`);
      
      // Log service configuration
      console.log('📊 Service Configuration:');
      console.log(`   Max Queue Size: ${this.config.maxQueueSize.toLocaleString()}`);
      console.log(`   Worker Concurrency: ${this.config.workerConcurrency}`);
      console.log(`   Rate Limits: ${this.config.rateLimits.perMinute}/min, ${this.config.rateLimits.perSecond}/sec`);
      
    } catch (error) {
      console.error('Failed to start webhook service:', error);
      process.exit(1);
    }
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down webhook service...');
    
    // Stop accepting new webhooks
    await this.fastify.close();
    
    // Close workers
    await this.worker?.close();
    await this.distributionWorker?.close();
    
    // Close queue connections
    await this.webhookQueue.close();
    await this.distributionQueue.close();
    await this.queueEvents.close();
    
    // Close Redis
    this.redis.disconnect();
    
    console.log('✅ Webhook service shutdown complete');
  }
}

// Export singleton instance
export const webhookService = new QuantumForgeWebhookService();