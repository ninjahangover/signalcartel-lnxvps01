#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

const NUM_WORKERS = Math.min(os.cpus().length, 4);
const BASE_PORT = 3100;
const MAIN_PORT = 3001;
const TIMEOUT_MS = 30000; // 30 second timeout

console.log(`🚀 SignalCartel Fast Server - Production Optimized`);
console.log(`📊 Starting ${NUM_WORKERS} optimized Next.js processes`);
console.log(`⚡ Timeout protection: ${TIMEOUT_MS/1000}s`);

const workers = [];
let currentWorker = 0;
let fallbackResponse = null;

// Pre-build a fallback HTML response
function createFallbackResponse() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SignalCartel - Loading</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0a; color: #00ff00; margin: 0; padding: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .status { margin: 20px 0; padding: 15px; border: 1px solid #00ff00; border-radius: 5px; }
        .refresh { margin-top: 30px; }
        button { background: #00ff00; color: #0a0a0a; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    </style>
    <script>
        let retryCount = 0;
        function checkStatus() {
            fetch('/api/health', { method: 'HEAD' })
                .then(() => window.location.reload())
                .catch(() => {
                    retryCount++;
                    document.getElementById('retry-count').textContent = retryCount;
                    setTimeout(checkStatus, 2000);
                });
        }
        setTimeout(checkStatus, 5000);
    </script>
</head>
<body>
    <div class="container">
        <h1 class="loading">⚡ SignalCartel</h1>
        <div class="status">
            <h2>🔥 Trading Platform Starting Up</h2>
            <p>Initializing high-performance trading engines...</p>
            <p>Compile optimization in progress</p>
            <p>Retry attempts: <span id="retry-count">0</span></p>
        </div>
        <div class="refresh">
            <button onclick="window.location.reload()">🔄 Check Status</button>
        </div>
        <p><small>Services will be available momentarily</small></p>
    </div>
</body>
</html>`;
}

// Function to start a Next.js worker process with optimizations
function startWorker(id) {
  const port = BASE_PORT + id;
  
  console.log(`🔧 Starting optimized worker ${id} on port ${port}...`);
  
  // Use production build for faster startup if available
  const useProduction = fs.existsSync('.next/BUILD_ID');
  const nextCommand = useProduction ? 'start' : 'dev';
  const args = useProduction ? ['-p', port.toString(), '-H', '0.0.0.0'] : ['dev', '-p', port.toString(), '-H', '0.0.0.0'];
  
  console.log(`📦 Worker ${id} using ${nextCommand} mode`);
  
  const worker = spawn('npx', ['next', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: port.toString(),
      WORKER_ID: id.toString(),
      NODE_ENV: useProduction ? 'production' : 'development',
      // Optimize Node.js for faster startup
      NODE_OPTIONS: '--max-old-space-size=2048',
      // Skip expensive dev features
      NEXT_TELEMETRY_DISABLED: '1',
      DISABLE_ESLINT_PLUGIN: '1'
    }
  });
  
  const workerInfo = {
    id,
    port,
    process: worker,
    ready: false,
    requests: 0,
    restarts: 0,
    startTime: Date.now(),
    mode: nextCommand
  };
  
  // Monitor worker output for faster ready detection
  worker.stdout.on('data', (data) => {
    const output = data.toString();
    // Multiple ready indicators for different modes
    if (output.includes('Ready') || 
        output.includes('started server') || 
        output.includes('Local:') ||
        output.includes('started on')) {
      console.log(`✅ Worker ${id} ready on port ${port} (${nextCommand} mode)`);
      workerInfo.ready = true;
    }
    // Show only critical compilation messages
    if (output.includes('Compiled') && !output.includes('Compiling')) {
      const timeMatch = output.match(/in ([0-9.]+)s/);
      const time = timeMatch ? timeMatch[1] : 'unknown';
      console.log(`⚡ Worker ${id}: Compiled in ${time}s`);
    }
  });
  
  worker.stderr.on('data', (data) => {
    const error = data.toString();
    // Filter out noise, only show critical errors
    if (!error.includes('webpack.cache') && !error.includes('Found a change')) {
      console.error(`⚠️ Worker ${id}: ${error.trim()}`);
    }
  });
  
  // Handle worker exit with intelligent restart
  worker.on('exit', (code, signal) => {
    console.log(`💀 Worker ${id} exited (code: ${code}, signal: ${signal})`);
    workerInfo.ready = false;
    
    // Auto-restart with backoff
    if (code !== 0 && workerInfo.restarts < 3) {
      workerInfo.restarts++;
      const delay = Math.min(2000 * Math.pow(2, workerInfo.restarts), 10000);
      console.log(`🔄 Restarting worker ${id} in ${delay/1000}s (attempt ${workerInfo.restarts}/3)...`);
      setTimeout(() => {
        workers[id] = startWorker(id);
      }, delay);
    }
  });
  
  workers[id] = workerInfo;
  return workerInfo;
}

// Start all workers
for (let i = 0; i < NUM_WORKERS; i++) {
  startWorker(i);
}

// Initialize fallback response
fallbackResponse = createFallbackResponse();

// Start load balancer immediately with fallback support
console.log(`\\n🌐 Starting resilient load balancer on port ${MAIN_PORT}...`);

const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/api/health') {
    const readyWorkers = workers.filter(w => w && w.ready);
    res.writeHead(readyWorkers.length > 0 ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: readyWorkers.length > 0 ? 'ready' : 'starting',
      workers: readyWorkers.length,
      total: NUM_WORKERS
    }));
    return;
  }
  
  // Get ready workers
  const readyWorkers = workers.filter(w => w && w.ready);
  
  // Serve fallback if no workers ready
  if (readyWorkers.length === 0) {
    res.writeHead(503, { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'Retry-After': '5'
    });
    res.end(fallbackResponse);
    return;
  }
  
  // Round-robin selection
  currentWorker = (currentWorker + 1) % readyWorkers.length;
  const worker = readyWorkers[currentWorker];
  worker.requests++;
  
  // Proxy with timeout protection
  const options = {
    hostname: '127.0.0.1',
    port: worker.port,
    path: req.url,
    method: req.method,
    headers: req.headers,
    timeout: TIMEOUT_MS
  };
  
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxy.on('timeout', () => {
    console.error(`⏰ Timeout for worker ${worker.id} after ${TIMEOUT_MS/1000}s`);
    proxy.destroy();
    res.writeHead(504, { 'Content-Type': 'text/html' });
    res.end(fallbackResponse.replace('Starting Up', 'Timeout - Retrying'));
  });
  
  proxy.on('error', (err) => {
    console.error(`❌ Proxy error for worker ${worker.id}:`, err.message);
    res.writeHead(502, { 'Content-Type': 'text/html' });
    res.end(fallbackResponse.replace('Starting Up', 'Connection Error'));
  });
  
  req.pipe(proxy);
});

server.listen(MAIN_PORT, '0.0.0.0', () => {
  console.log(`✅ Resilient load balancer ready on http://0.0.0.0:${MAIN_PORT}`);
  console.log(`🛡️ Fallback protection enabled (${TIMEOUT_MS/1000}s timeout)`);
  console.log(`📊 Distributing load across ${NUM_WORKERS} workers\\n`);
});

// Enhanced status monitoring
setInterval(() => {
  const totalRequests = workers.reduce((sum, w) => sum + (w ? w.requests : 0), 0);
  const readyCount = workers.filter(w => w && w.ready).length;
  const avgUptime = workers.reduce((sum, w) => {
    return sum + (w ? (Date.now() - w.startTime) / 1000 : 0);
  }, 0) / NUM_WORKERS;
  
  console.log(`📊 Status: ${readyCount}/${NUM_WORKERS} ready, ${totalRequests} total requests, ${avgUptime.toFixed(1)}s avg uptime`);
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Fast shutdown initiated...');
  workers.forEach(w => {
    if (w && w.process) {
      w.process.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Received SIGTERM, fast shutdown...');
  workers.forEach(w => {
    if (w && w.process) {
      w.process.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 2000);
});