#!/usr/bin/env node

/**
 * Quick test script for resource monitoring
 * Tests all monitoring endpoints and displays output
 */

const http = require('http');

async function testResourceMonitor() {
  console.log('🧪 Testing Resource Monitor System');
  console.log('==================================\n');

  // Test endpoints
  const tests = [
    { path: '/api/resource-monitor?action=status', name: 'Status Check' },
    { path: '/api/resource-monitor?action=metrics', name: 'Current Metrics' },
    { path: '/api/resource-monitor?action=health', name: 'Health Check' },
    { path: '/api/resource-monitor?action=processes', name: 'Process Info' },
    { path: '/api/resource-monitor?action=metrics&format=prometheus', name: 'Prometheus Format' }
  ];

  for (const test of tests) {
    console.log(`📊 Testing: ${test.name}`);
    console.log(`   URL: ${test.path}`);
    
    try {
      const response = await fetchEndpoint(test.path);
      
      if (test.name === 'Prometheus Format') {
        console.log('   Response (first 5 lines):');
        const lines = response.split('\n').slice(0, 5);
        lines.forEach(line => console.log(`     ${line}`));
        if (response.split('\n').length > 5) {
          console.log(`     ... (${response.split('\n').length - 5} more lines)`);
        }
      } else {
        const data = JSON.parse(response);
        console.log(`   Status: ${data.success ? '✅ Success' : '❌ Failed'}`);
        
        if (test.name === 'Health Check') {
          console.log(`   Health: ${data.status}`);
          if (data.checks) {
            console.log(`   CPU: ${data.checks.cpu.status} (${data.checks.cpu.value.toFixed(1)}%)`);
            console.log(`   Memory: ${data.checks.memory.status} (${data.checks.memory.value.toFixed(1)}%)`);
            console.log(`   Processes: ${data.checks.processes.status} (${data.checks.processes.count} running)`);
          }
        } else if (test.name === 'Current Metrics') {
          if (data.data) {
            console.log(`   CPU: ${data.data.cpu.usage.toFixed(1)}%`);
            console.log(`   Memory: ${data.data.memory.usage.toFixed(1)}% (${data.data.memory.used}/${data.data.memory.total}MB)`);
            console.log(`   Processes: ${data.data.processes.length} running`);
            if (data.data.processes.length > 0) {
              const topProcess = data.data.processes[0];
              console.log(`   Top Process: ${topProcess.name} (${topProcess.cpu.toFixed(1)}% CPU, ${topProcess.memory}MB)`);
            }
          }
        } else if (test.name === 'Status Check') {
          if (data.data) {
            console.log(`   Monitoring: ${data.data.isMonitoring ? '✅ Active' : '❌ Inactive'}`);
            console.log(`   History: ${data.data.historyCount} entries`);
            console.log(`   Uptime: ${data.data.uptime}s`);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test starting monitoring via API
  console.log('🚀 Testing: Start Monitoring');
  try {
    const response = await postEndpoint('/api/resource-monitor', { action: 'start' });
    const data = JSON.parse(response);
    console.log(`   Status: ${data.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Message: ${data.message}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  console.log('✅ Resource Monitor testing complete!');
  console.log('');
  console.log('💡 For external monitoring, use these endpoints:');
  console.log('   Health: http://localhost:3001/api/resource-monitor?action=health');
  console.log('   Metrics: http://localhost:3001/api/resource-monitor?action=metrics');
  console.log('   Prometheus: http://localhost:3001/api/resource-monitor?action=metrics&format=prometheus');
  console.log('   InfluxDB: http://localhost:3001/api/resource-monitor?action=metrics&format=influxdb');
}

function fetchEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function postEndpoint(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Run the tests
testResourceMonitor().catch(console.error);