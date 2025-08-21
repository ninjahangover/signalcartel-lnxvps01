#!/usr/bin/env node

const cluster = require('cluster');
const os = require('os');
const http = require('http');
const httpProxy = require('http-proxy');

const BASE_PORT = 3100; // Workers will use 3100, 3101, 3102, 3103
const LOAD_BALANCER_PORT = 3001; // Main website port
const numCPUs = os.cpus().length;
const MAX_WORKERS = Math.min(numCPUs, 4);

console.log(`🚀 SignalCartel Advanced Cluster starting...`);
console.log(`📊 System: ${numCPUs} CPUs detected, using ${MAX_WORKERS} workers`);

if (cluster.isMaster) {
  console.log(`🎯 Master ${process.pid} is running`);
  
  const workers = new Map();
  const workerPorts = new Map();
  let currentWorkerIndex = 0;
  
  // Function to spawn a worker with specific port
  function spawnWorker(workerId) {
    const port = BASE_PORT + workerId;
    const env = {
      WORKER_PORT: port,
      WORKER_ID: workerId,
      NODE_ENV: 'development'
    };
    
    const worker = cluster.fork(env);
    workers.set(worker.id, {
      worker,
      port,
      startTime: Date.now(),
      requests: 0,
      healthy: false
    });
    workerPorts.set(worker.id, port);
    
    console.log(`👷 Worker ${worker.process.pid} started on port ${port} (ID: ${worker.id})`);
    
    worker.on('message', (msg) => {
      if (msg.type === 'ready') {
        const workerInfo = workers.get(worker.id);
        workerInfo.healthy = true;
        console.log(`✅ Worker ${worker.id} ready on port ${port}`);
      } else if (msg.type === 'request') {
        const workerInfo = workers.get(worker.id);
        workerInfo.requests++;
      }
    });
    
    return worker;
  }
  
  // Spawn initial workers
  for (let i = 0; i < MAX_WORKERS; i++) {
    spawnWorker(i);
  }
  
  // Create load balancer using http-proxy
  setTimeout(() => {
    const proxy = httpProxy.createProxyServer({});
    
    const loadBalancer = http.createServer((req, res) => {
      // Round-robin load balancing
      const healthyWorkers = Array.from(workers.values()).filter(w => w.healthy);
      if (healthyWorkers.length === 0) {
        console.log('⚠️ No healthy workers available');
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('Service Unavailable - No workers ready');
        return;
      }
      
      currentWorkerIndex = (currentWorkerIndex + 1) % healthyWorkers.length;
      const worker = healthyWorkers[currentWorkerIndex];
      const target = `http://localhost:${worker.port}`;
      
      console.log(`🔄 Routing request ${req.url} to worker on port ${worker.port} (${worker.requests} total requests)`);
      worker.requests++;
      
      proxy.web(req, res, { target }, (err) => {
        console.error('❌ Proxy error:', err);
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway - Worker error');
      });
    });
    
    // Handle WebSocket upgrades
    loadBalancer.on('upgrade', (req, socket, head) => {
      const healthyWorkers = Array.from(workers.values()).filter(w => w.healthy);
      if (healthyWorkers.length === 0) {
        socket.end();
        return;
      }
      
      currentWorkerIndex = (currentWorkerIndex + 1) % healthyWorkers.length;
      const worker = healthyWorkers[currentWorkerIndex];
      const target = `http://localhost:${worker.port}`;
      
      proxy.ws(req, socket, head, { target });
    });
    
    loadBalancer.listen(LOAD_BALANCER_PORT, '0.0.0.0', () => {
      console.log(`🌐 Load Balancer ready on http://0.0.0.0:${LOAD_BALANCER_PORT}`);
      console.log(`📊 Distributing requests across ${MAX_WORKERS} workers`);
    });
  }, 5000); // Wait for workers to start
  
  // Handle worker deaths
  cluster.on('exit', (worker, code, signal) => {
    const workerInfo = workers.get(worker.id);
    const port = workerInfo ? workerInfo.port : 'unknown';
    
    console.log(`💀 Worker ${worker.process.pid} died (port: ${port}, code: ${code}, signal: ${signal})`);
    workers.delete(worker.id);
    
    // Restart worker with same ID/port
    const workerId = workerInfo ? workerInfo.port - BASE_PORT : 0;
    console.log(`🔄 Restarting worker ${workerId}...`);
    setTimeout(() => spawnWorker(workerId), 2000);
  });
  
  // Status monitoring
  setInterval(() => {
    const stats = Array.from(workers.values()).map(w => 
      `Port ${w.port}: ${w.requests} requests, ${w.healthy ? '✅' : '❌'}`
    ).join(', ');
    console.log(`📊 Load Distribution: ${stats}`);
  }, 30000);
  
} else {
  // Worker process
  const port = parseInt(process.env.WORKER_PORT, 10);
  const workerId = parseInt(process.env.WORKER_ID, 10);
  
  console.log(`👷 Worker ${process.pid} (ID: ${workerId}) starting on port ${port}...`);
  
  try {
    const next = require('next');
    const dev = true;
    const hostname = '0.0.0.0';
    
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    app.prepare().then(() => {
      const server = http.createServer(async (req, res) => {
        try {
          // Notify master of request
          if (process.send) {
            process.send({ type: 'request' });
          }
          await handle(req, res);
        } catch (err) {
          console.error(`❌ Worker ${workerId} error:`, err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
      
      server.listen(port, hostname, (err) => {
        if (err) {
          console.error(`❌ Worker ${workerId} failed to start:`, err);
          process.exit(1);
        }
        console.log(`✅ Worker ${workerId} listening on http://${hostname}:${port}`);
        
        // Notify master that worker is ready
        if (process.send) {
          process.send({ type: 'ready' });
        }
      });
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log(`🛑 Worker ${workerId} shutting down...`);
        server.close(() => {
          process.exit(0);
        });
      });
      
    }).catch((err) => {
      console.error(`❌ Worker ${workerId} Next.js error:`, err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error(`❌ Worker ${workerId} startup error:`, error);
    process.exit(1);
  }
}