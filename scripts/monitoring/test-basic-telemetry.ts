#!/usr/bin/env node
// Basic SigNoz Test - No complex dependencies
// Just sends HTTP requests to test connectivity

import { spawn } from 'child_process';

console.log('🧪 Basic SigNoz Connectivity Test...\n');

async function testConnectivity() {
  console.log('1️⃣ Testing SigNoz services...');
  
  // Test frontend
  const frontendTest = await testEndpoint('http://localhost:3301', 'SigNoz Frontend');
  
  // Test OTEL collectors 
  const grpcTest = await testEndpoint('http://localhost:4317', 'OTEL gRPC Collector');
  const httpTest = await testEndpoint('http://localhost:4318', 'OTEL HTTP Collector');
  
  console.log('\n2️⃣ Testing Docker containers...');
  
  // Check containers
  const containers = await checkContainers();
  
  console.log('\n📊 Test Results:');
  console.log('─────────────────────────');
  console.log(`Frontend (3301):      ${frontendTest ? '✅' : '❌'}`);
  console.log(`OTEL gRPC (4317):     ${grpcTest ? '✅' : '❌'}`);
  console.log(`OTEL HTTP (4318):     ${httpTest ? '✅' : '❌'}`);
  console.log(`Containers:           ${containers ? '✅' : '❌'}`);
  
  const allGood = frontendTest && grpcTest && httpTest && containers;
  
  console.log('\n' + '═'.repeat(50));
  if (allGood) {
    console.log('✅ SigNoz is ready for telemetry!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. Access dashboard: http://localhost:3301');
    console.log('  2. Login: gaylen@signalcartel.io / admin123');
    console.log('  3. Install telemetry deps: npm install --save-dev');
    console.log('     @opentelemetry/api @opentelemetry/sdk-node');
    console.log('     @opentelemetry/auto-instrumentations-node');
    console.log('  4. Run: ./scripts/monitoring/start-with-signoz.sh');
  } else {
    console.log('❌ SigNoz needs attention');
    console.log('');
    console.log('🔧 Try:');
    console.log('  1. cd /home/telgkb9/signoz && docker-compose up -d');
    console.log('  2. Wait 60 seconds for services to start');
    console.log('  3. Run this test again');
  }
  console.log('═'.repeat(50));
}

async function testEndpoint(url: string, name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', '-I', '--connect-timeout', '5', url]);
    let output = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      const success = output.includes('200 OK') || output.includes('404'); // 404 is OK for some endpoints
      console.log(`   ${success ? '✅' : '❌'} ${name}: ${url}`);
      resolve(success);
    });
    
    // Timeout fallback
    setTimeout(() => {
      curl.kill();
      console.log(`   ❌ ${name}: Timeout`);
      resolve(false);
    }, 6000);
  });
}

async function checkContainers(): Promise<boolean> {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['ps', '--format', '{{.Names}}']);
    let output = '';
    
    docker.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    docker.on('close', () => {
      const hasSignoz = output.includes('signoz');
      const hasFrontend = output.includes('signoz-frontend');
      const hasCollector = output.includes('signoz-otel-collector');
      
      console.log(`   ${hasFrontend ? '✅' : '❌'} signoz-frontend`);
      console.log(`   ${hasCollector ? '✅' : '❌'} signoz-otel-collector`);
      console.log(`   ${hasSignoz ? '✅' : '❌'} Other SigNoz services`);
      
      resolve(hasFrontend && hasCollector);
    });
    
    // Timeout fallback
    setTimeout(() => {
      docker.kill();
      resolve(false);
    }, 5000);
  });
}

// Run the test
testConnectivity().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});