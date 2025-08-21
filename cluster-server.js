#!/usr/bin/env node

const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;
const MAX_WORKERS = Math.min(numCPUs, 4); // Limit to 4 workers max for stability

console.log(`🚀 SignalCartel Cluster Manager starting...`);
console.log(`📊 System: ${numCPUs} CPUs detected, using ${MAX_WORKERS} workers`);

if (cluster.isMaster) {
  console.log(`🎯 Master ${process.pid} is running`);
  
  // Track worker health
  const workers = new Map();
  let restartCount = 0;
  const MAX_RESTARTS = 10;
  
  // Function to spawn a worker
  function spawnWorker() {
    const worker = cluster.fork();
    workers.set(worker.id, {
      worker,
      startTime: Date.now(),
      restarts: 0
    });
    
    console.log(`👷 Worker ${worker.process.pid} started (ID: ${worker.id})`);
    
    worker.on('message', (msg) => {
      if (msg.type === 'health') {
        console.log(`💚 Worker ${worker.id} health check: OK`);
      }
    });
    
    return worker;
  }
  
  // Spawn initial workers
  for (let i = 0; i < MAX_WORKERS; i++) {
    spawnWorker();
  }
  
  // Handle worker deaths
  cluster.on('exit', (worker, code, signal) => {
    const workerInfo = workers.get(worker.id);
    const uptime = workerInfo ? Date.now() - workerInfo.startTime : 0;
    
    console.log(`💀 Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}, uptime: ${Math.round(uptime/1000)}s)`);
    workers.delete(worker.id);
    
    restartCount++;
    
    if (restartCount < MAX_RESTARTS) {
      console.log(`🔄 Restarting worker... (${restartCount}/${MAX_RESTARTS})`);
      setTimeout(() => spawnWorker(), 2000); // Wait 2s before restart
    } else {
      console.log(`🚨 Max restarts (${MAX_RESTARTS}) reached. Stopping cluster.`);
      process.exit(1);
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Master received SIGTERM, shutting down gracefully...');
    for (const [id, workerInfo] of workers) {
      workerInfo.worker.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 5000);
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Master received SIGINT, shutting down gracefully...');
    for (const [id, workerInfo] of workers) {
      workerInfo.worker.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 5000);
  });
  
  // Health monitoring
  setInterval(() => {
    console.log(`📊 Cluster Status: ${workers.size} workers active, ${restartCount} total restarts`);
  }, 30000);
  
} else {
  // Worker process - run Next.js
  console.log(`👷 Worker ${process.pid} starting Next.js server...`);
  
  try {
    // Set environment for development (more stable)
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3001';
    process.env.HOSTNAME = '0.0.0.0';
    
    // Import and start Next.js
    const { createServer } = require('http');
    const next = require('next');
    
    const dev = true; // Force development mode for stability
    const hostname = process.env.HOSTNAME || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3001', 10);
    
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    app.prepare().then(() => {
      const server = createServer(async (req, res) => {
        try {
          await handle(req, res);
        } catch (err) {
          console.error(`❌ Worker ${process.pid} request error:`, err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
      
      server.listen(port, hostname, (err) => {
        if (err) {
          console.error(`❌ Worker ${process.pid} failed to start:`, err);
          process.exit(1);
        }
        console.log(`✅ Worker ${process.pid} ready on http://${hostname}:${port}`);
        
        // Send health checks to master
        setInterval(() => {
          if (process.send) {
            process.send({ type: 'health', pid: process.pid });
          }
        }, 10000);
      });
      
      // Graceful shutdown for worker
      process.on('SIGTERM', () => {
        console.log(`🛑 Worker ${process.pid} received SIGTERM, shutting down...`);
        server.close(() => {
          console.log(`✅ Worker ${process.pid} HTTP server closed`);
          process.exit(0);
        });
      });
      
    }).catch((err) => {
      console.error(`❌ Worker ${process.pid} Next.js preparation failed:`, err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error(`❌ Worker ${process.pid} startup error:`, error);
    process.exit(1);
  }
}