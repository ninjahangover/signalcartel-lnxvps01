/**
 * Resource Limiter
 * 
 * Implements throttling and resource management for heavy operations
 */

import { cpus } from 'os';
import { performance } from 'perf_hooks';

interface ThrottleOptions {
  maxConcurrent?: number;
  delayMs?: number;
  maxCpuPercent?: number;
  maxMemoryMB?: number;
}

class ResourceLimiter {
  private static instance: ResourceLimiter;
  private activeOperations = new Map<string, number>();
  private operationQueue = new Map<string, Array<() => Promise<any>>>();
  private cpuUsageHistory: number[] = [];
  private lastCpuCheck = 0;
  
  // Configuration
  private readonly MAX_CONCURRENT_HEAVY_OPS = 2;
  private readonly MAX_CONCURRENT_LIGHT_OPS = 5;
  private readonly THROTTLE_DELAY_MS = 100;
  private readonly MAX_CPU_PERCENT = 60;
  private readonly CPU_CHECK_INTERVAL = 1000;
  
  private constructor() {
    this.startResourceMonitoring();
  }
  
  static getInstance(): ResourceLimiter {
    if (!ResourceLimiter.instance) {
      ResourceLimiter.instance = new ResourceLimiter();
    }
    return ResourceLimiter.instance;
  }
  
  /**
   * Execute a function with resource throttling
   */
  async throttledExecute<T>(
    operationType: string,
    fn: () => Promise<T>,
    options: ThrottleOptions = {}
  ): Promise<T> {
    const {
      maxConcurrent = this.MAX_CONCURRENT_HEAVY_OPS,
      delayMs = this.THROTTLE_DELAY_MS,
      maxCpuPercent = this.MAX_CPU_PERCENT
    } = options;
    
    // Wait if CPU is too high
    await this.waitForCpuAvailability(maxCpuPercent);
    
    // Wait if too many operations of this type are running
    await this.waitForSlot(operationType, maxConcurrent);
    
    // Add delay to prevent burst operations
    if (delayMs > 0) {
      await this.delay(delayMs);
    }
    
    // Track operation
    this.incrementOperation(operationType);
    
    try {
      // Execute the function
      const result = await fn();
      return result;
    } finally {
      // Clean up
      this.decrementOperation(operationType);
      this.processQueue(operationType, maxConcurrent);
    }
  }
  
  /**
   * Batch execute multiple operations with throttling
   */
  async batchExecute<T>(
    operationType: string,
    items: T[],
    processor: (item: T) => Promise<any>,
    batchSize = 3
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch with throttling
      await Promise.all(
        batch.map(item => 
          this.throttledExecute(
            operationType,
            () => processor(item),
            { maxConcurrent: batchSize }
          )
        )
      );
      
      // Add delay between batches
      if (i + batchSize < items.length) {
        await this.delay(500);
      }
    }
  }
  
  /**
   * Rate limit function calls
   */
  rateLimiter(fn: Function, callsPerSecond: number): Function {
    const minInterval = 1000 / callsPerSecond;
    let lastCall = 0;
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: any[]) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
      
      if (timeSinceLastCall >= minInterval) {
        lastCall = now;
        return fn.apply(null, args);
      } else {
        if (timeout) clearTimeout(timeout);
        
        return new Promise((resolve) => {
          timeout = setTimeout(() => {
            lastCall = Date.now();
            resolve(fn.apply(null, args));
          }, minInterval - timeSinceLastCall);
        });
      }
    };
  }
  
  /**
   * Debounce function calls
   */
  debounce(fn: Function, delayMs: number): Function {
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: any[]) {
      if (timeout) clearTimeout(timeout);
      
      return new Promise((resolve) => {
        timeout = setTimeout(() => {
          resolve(fn.apply(null, args));
        }, delayMs);
      });
    };
  }
  
  /**
   * Monitor and limit memory usage
   */
  checkMemoryUsage(): { usedMB: number; availableMB: number; percentUsed: number } {
    const used = process.memoryUsage();
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    const totalMB = Math.round(used.heapTotal / 1024 / 1024);
    const availableMB = totalMB - usedMB;
    const percentUsed = (usedMB / totalMB) * 100;
    
    // Force garbage collection if memory usage is high
    if (percentUsed > 80 && global.gc) {
      console.log('High memory usage detected, forcing garbage collection...');
      global.gc();
    }
    
    return { usedMB, availableMB, percentUsed };
  }
  
  /**
   * Get current CPU usage estimate
   */
  private getCpuUsage(): number {
    // This is a simplified CPU usage estimate
    // In production, you might want to use a more sophisticated method
    const loadAvg = require('os').loadavg()[0];
    const numCpus = cpus().length;
    return Math.min(100, (loadAvg / numCpus) * 100);
  }
  
  /**
   * Wait until CPU usage is below threshold
   */
  private async waitForCpuAvailability(maxCpuPercent: number): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30; // Max 30 seconds wait
    
    while (attempts < maxAttempts) {
      const cpuUsage = this.getCpuUsage();
      
      if (cpuUsage < maxCpuPercent) {
        return;
      }
      
      console.log(`CPU usage at ${cpuUsage.toFixed(1)}%, waiting... (${maxCpuPercent}% max)`);
      await this.delay(1000);
      attempts++;
    }
    
    console.warn('CPU usage threshold timeout, proceeding anyway');
  }
  
  /**
   * Wait for an operation slot to become available
   */
  private async waitForSlot(operationType: string, maxConcurrent: number): Promise<void> {
    const current = this.activeOperations.get(operationType) || 0;
    
    if (current < maxConcurrent) {
      return;
    }
    
    // Add to queue and wait
    return new Promise((resolve) => {
      if (!this.operationQueue.has(operationType)) {
        this.operationQueue.set(operationType, []);
      }
      this.operationQueue.get(operationType)!.push(resolve);
    });
  }
  
  /**
   * Process queued operations
   */
  private processQueue(operationType: string, maxConcurrent: number): void {
    const queue = this.operationQueue.get(operationType);
    if (!queue || queue.length === 0) return;
    
    const current = this.activeOperations.get(operationType) || 0;
    const slotsAvailable = maxConcurrent - current;
    
    for (let i = 0; i < slotsAvailable && queue.length > 0; i++) {
      const resolve = queue.shift()!;
      resolve();
    }
  }
  
  private incrementOperation(operationType: string): void {
    const current = this.activeOperations.get(operationType) || 0;
    this.activeOperations.set(operationType, current + 1);
  }
  
  private decrementOperation(operationType: string): void {
    const current = this.activeOperations.get(operationType) || 0;
    this.activeOperations.set(operationType, Math.max(0, current - 1));
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Start monitoring system resources
   */
  private startResourceMonitoring(): void {
    setInterval(() => {
      const memory = this.checkMemoryUsage();
      const cpu = this.getCpuUsage();
      
      // Log if resources are high
      if (memory.percentUsed > 70 || cpu > 70) {
        console.log(`Resource usage - CPU: ${cpu.toFixed(1)}%, Memory: ${memory.usedMB}MB (${memory.percentUsed.toFixed(1)}%)`);
      }
      
      // Store CPU history
      this.cpuUsageHistory.push(cpu);
      if (this.cpuUsageHistory.length > 60) {
        this.cpuUsageHistory.shift();
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Get resource usage statistics
   */
  getResourceStats() {
    const memory = this.checkMemoryUsage();
    const cpu = this.getCpuUsage();
    const avgCpu = this.cpuUsageHistory.length > 0
      ? this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length
      : cpu;
    
    return {
      cpu: {
        current: cpu,
        average: avgCpu,
        history: this.cpuUsageHistory
      },
      memory: memory,
      activeOperations: Object.fromEntries(this.activeOperations),
      queuedOperations: Object.fromEntries(
        Array.from(this.operationQueue.entries()).map(([k, v]) => [k, v.length])
      )
    };
  }
}

// Export singleton instance
export const resourceLimiter = ResourceLimiter.getInstance();

// Export utility functions
export const throttledExecute = resourceLimiter.throttledExecute.bind(resourceLimiter);
export const batchExecute = resourceLimiter.batchExecute.bind(resourceLimiter);
export const rateLimiter = resourceLimiter.rateLimiter.bind(resourceLimiter);
export const debounce = resourceLimiter.debounce.bind(resourceLimiter);

export default resourceLimiter;