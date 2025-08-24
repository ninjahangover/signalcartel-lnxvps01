/**
 * Complete Monitoring Endpoints Test
 * Verifies all 8 QUANTUM FORGE™ monitoring endpoints
 */

interface EndpointTest {
  name: string;
  url: string;
  expectedStatus: number;
  timeout: number;
  requiredFields?: string[];
}

const MONITORING_ENDPOINTS: EndpointTest[] = [
  {
    name: "🚀 QUANTUM FORGE™ Trading Engine",
    url: "http://localhost:3001/api/quantum-forge/status",
    expectedStatus: 200,
    timeout: 10000,
    requiredFields: ['success', 'data']
  },
  {
    name: "📊 Trading Portfolio",
    url: "http://localhost:3001/api/quantum-forge/portfolio",
    expectedStatus: 200,
    timeout: 10000,
    requiredFields: ['success', 'data']
  },
  {
    name: "📈 Market Data - Bitcoin",
    url: "http://localhost:3001/api/market-data/BTCUSD",
    expectedStatus: 200,
    timeout: 5000,
    requiredFields: ['symbol', 'price']
  },
  {
    name: "📈 Market Data - Ethereum", 
    url: "http://localhost:3001/api/market-data/ETHUSD",
    expectedStatus: 200,
    timeout: 5000,
    requiredFields: ['symbol', 'price']
  },
  {
    name: "🎮 GPU Strategy Engine",
    url: "http://localhost:3001/api/quantum-forge/gpu-status",
    expectedStatus: 200,
    timeout: 10000,
    requiredFields: ['status', 'gpuEnabled']
  },
  {
    name: "🗄️ SQLite Database",
    url: "http://localhost:3001/api/quantum-forge/database-health",
    expectedStatus: 200,
    timeout: 8000,
    requiredFields: ['status', 'database']
  },
  {
    name: "🌐 Website Dashboard",
    url: "http://localhost:3001/api/health",
    expectedStatus: 200,
    timeout: 5000,
    requiredFields: ['status', 'uptime']
  },
  {
    name: "🧠 Sentiment Intelligence",
    url: "http://localhost:3001/api/sentiment-analysis?hours=1",
    expectedStatus: 200,
    timeout: 15000,
    requiredFields: []
  }
];

async function testEndpoint(endpoint: EndpointTest): Promise<{
  success: boolean;
  status: number;
  responseTime: number;
  error?: string;
  data?: any;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
    
    const response = await fetch(endpoint.url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    let data: any = {};
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      console.warn(`Failed to parse JSON for ${endpoint.name}:`, parseError);
    }
    
    // Check required fields
    if (endpoint.requiredFields && response.ok) {
      const missing = endpoint.requiredFields.filter(field => !(field in data));
      if (missing.length > 0) {
        return {
          success: false,
          status: response.status,
          responseTime,
          error: `Missing required fields: ${missing.join(', ')}`,
          data
        };
      }
    }
    
    return {
      success: response.status === endpoint.expectedStatus,
      status: response.status,
      responseTime,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testAllEndpoints(): Promise<void> {
  console.log('🎯 QUANTUM FORGE™ COMPLETE MONITORING TEST');
  console.log('==========================================');
  console.log('');

  const results: Array<{
    endpoint: EndpointTest;
    result: Awaited<ReturnType<typeof testEndpoint>>;
  }> = [];

  console.log('🔍 Testing all monitoring endpoints...');
  console.log('');

  for (const endpoint of MONITORING_ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, result });
    
    if (result.success) {
      console.log(`✅ ${result.status} (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${result.status || 'ERR'} - ${result.error} (${result.responseTime}ms)`);
    }
  }

  console.log('');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=======================');

  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);

  console.log(`✅ Successful: ${successful.length}/${results.length} endpoints`);
  console.log(`❌ Failed: ${failed.length}/${results.length} endpoints`);
  console.log('');

  if (successful.length > 0) {
    console.log('✅ WORKING ENDPOINTS:');
    successful.forEach(({ endpoint, result }) => {
      console.log(`   ${endpoint.name}: ${result.status} (${result.responseTime}ms)`);
    });
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ FAILED ENDPOINTS:');
    failed.forEach(({ endpoint, result }) => {
      console.log(`   ${endpoint.name}: ${result.error || 'Unknown error'}`);
    });
    console.log('');
  }

  // Performance analysis
  const avgResponseTime = results.reduce((sum, r) => sum + r.result.responseTime, 0) / results.length;
  const maxResponseTime = Math.max(...results.map(r => r.result.responseTime));
  
  console.log('⚡ PERFORMANCE METRICS:');
  console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`   Maximum Response Time: ${maxResponseTime}ms`);
  console.log('');

  if (successful.length === results.length) {
    console.log('🎉 ALL MONITORING ENDPOINTS OPERATIONAL!');
    console.log('');
    console.log('🔔 READY FOR OPENSTATUS SETUP:');
    console.log('1. Access dashboard: http://localhost:3005');
    console.log('2. Create monitors using the URLs above');  
    console.log('3. Configure email notifications');
    console.log('4. Set up status page');
  } else {
    console.log('⚠️  PARTIAL SYSTEM READY');
    console.log(`${successful.length} out of ${results.length} endpoints are working`);
    console.log('Consider creating monitors for working endpoints first');
  }
  
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('- Copy working URLs to OpenStatus dashboard');  
  console.log('- Set monitoring frequencies (2-10 minutes)');
  console.log('- Configure alert thresholds and notifications');
  console.log('- Create public status page for system visibility');
}

if (require.main === module) {
  testAllEndpoints().catch(console.error);
}