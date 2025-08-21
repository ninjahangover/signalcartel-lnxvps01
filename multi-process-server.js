#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const os = require('os');

const NUM_WORKERS = Math.min(os.cpus().length, 4); // Max 4 workers
const BASE_PORT = 3100;
const MAIN_PORT = 3001;

console.log(`🚀 SignalCartel Multi-Process Server`);
console.log(`📊 Starting ${NUM_WORKERS} independent Next.js processes`);

const workers = [];
let currentWorker = 0;

// Function to start a Next.js worker process
function startWorker(id) {
  const port = BASE_PORT + id;
  
  console.log(`🔧 Starting worker ${id} on port ${port}...`);
  
  // Spawn Next.js process directly
  const worker = spawn('npx', ['next', 'dev', '-p', port.toString(), '-H', '0.0.0.0'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: port.toString(),
      WORKER_ID: id.toString()
    }
  });
  
  const workerInfo = {
    id,
    port,
    process: worker,
    ready: false,
    requests: 0,
    restarts: 0
  };
  
  // Monitor worker output
  worker.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') || output.includes('started')) {
      console.log(`✅ Worker ${id} ready on port ${port}`);
      workerInfo.ready = true;
    }
    // Show compilation messages
    if (output.includes('Compiling') || output.includes('Compiled')) {
      console.log(`👷 Worker ${id}: ${output.trim()}`);
    }
  });
  
  worker.stderr.on('data', (data) => {
    console.error(`⚠️ Worker ${id} error: ${data.toString()}`);
  });
  
  // Handle worker exit
  worker.on('exit', (code, signal) => {
    console.log(`💀 Worker ${id} exited (code: ${code}, signal: ${signal})`);
    workerInfo.ready = false;
    
    // Auto-restart if not intentional shutdown
    if (code !== 0 && workerInfo.restarts < 3) {
      workerInfo.restarts++;
      console.log(`🔄 Restarting worker ${id} (attempt ${workerInfo.restarts}/3)...`);
      setTimeout(() => {
        workers[id] = startWorker(id);
      }, 2000);
    }
  });
  
  workers[id] = workerInfo;
  return workerInfo;
}

// Start all workers
for (let i = 0; i < NUM_WORKERS; i++) {
  startWorker(i);
}

// Wait for workers to be ready, then start load balancer
setTimeout(() => {
  console.log(`\n🌐 Starting load balancer on port ${MAIN_PORT}...`);
  
  const server = http.createServer((req, res) => {
    // Get ready workers
    const readyWorkers = workers.filter(w => w && w.ready);
    
    if (readyWorkers.length === 0) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service starting up, please wait...');
      return;
    }
    
    // Round-robin selection
    currentWorker = (currentWorker + 1) % readyWorkers.length;
    const worker = readyWorkers[currentWorker];
    worker.requests++;
    
    // Log load distribution every 10 requests
    const totalRequests = workers.reduce((sum, w) => sum + (w ? w.requests : 0), 0);
    if (totalRequests % 10 === 0) {
      const distribution = workers.map(w => 
        w ? `Worker ${w.id}: ${w.requests} reqs` : 'dead'
      ).join(', ');
      console.log(`📊 Load Distribution: ${distribution}`);
    }
    
    // Proxy the request
    const options = {
      hostname: 'localhost',
      port: worker.port,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxy.on('error', (err) => {
      console.error(`❌ Proxy error for worker ${worker.id}:`, err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
    
    req.pipe(proxy);
  });
  
  server.listen(MAIN_PORT, '0.0.0.0', () => {
    console.log(`✅ Load balancer ready on http://0.0.0.0:${MAIN_PORT}`);
    console.log(`📊 Distributing load across ${NUM_WORKERS} workers`);
    console.log(`\n💡 Each worker compiles independently for better performance`);
    console.log(`💡 Requests are distributed round-robin style\n`);
  });
  
  // Handle WebSocket connections (for Next.js hot reload)
  server.on('upgrade', (req, socket, head) => {
    const readyWorkers = workers.filter(w => w && w.ready);
    if (readyWorkers.length === 0) {
      socket.end();
      return;
    }
    
    currentWorker = (currentWorker + 1) % readyWorkers.length;
    const worker = readyWorkers[currentWorker];
    
    const options = {
      port: worker.port,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(options);
    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                   'Upgrade: websocket\r\n' +
                   'Connection: Upgrade\r\n' +
                   '\r\n');
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });
    
    proxyReq.end();
  });
  
}, 10000); // Give workers 10 seconds to start

// Status monitoring
setInterval(() => {
  const status = workers.map(w => {
    if (!w) return 'Worker dead';
    return `Worker ${w.id}: ${w.ready ? '✅' : '🔄'} Port ${w.port}, ${w.requests} requests`;
  }).join('\n');
  
  console.log(`\n📊 === System Status ===`);
  console.log(status);
  console.log(`======================\n`);
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  workers.forEach(w => {
    if (w && w.process) {
      w.process.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  workers.forEach(w => {
    if (w && w.process) {
      w.process.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 2000);
});