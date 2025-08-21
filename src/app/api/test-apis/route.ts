/**
 * Test API endpoints for debugging
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const testResults = [];

    // Test execute-trade API
    try {
      const executeTradeResponse = await fetch(`${request.nextUrl.origin}/api/execute-trade?executed=false`);
      const executeTradeData = await executeTradeResponse.json();
      testResults.push({
        endpoint: '/api/execute-trade',
        status: executeTradeResponse.status,
        success: executeTradeData.success,
        dataCount: executeTradeData.data?.length || 0,
        error: executeTradeData.error || null
      });
    } catch (error) {
      testResults.push({
        endpoint: '/api/execute-trade',
        status: 'error',
        success: false,
        error: error.message
      });
    }

    // Test market-data/performance API
    try {
      const performanceResponse = await fetch(`${request.nextUrl.origin}/api/market-data/performance`);
      const performanceData = await performanceResponse.json();
      testResults.push({
        endpoint: '/api/market-data/performance',
        status: performanceResponse.status,
        success: performanceData.success,
        data: performanceData.data || null,
        error: performanceData.error || null
      });
    } catch (error) {
      testResults.push({
        endpoint: '/api/market-data/performance',
        status: 'error',
        success: false,
        error: error.message
      });
    }

    // Test market-data/status API
    try {
      const statusResponse = await fetch(`${request.nextUrl.origin}/api/market-data/status`);
      const statusData = await statusResponse.json();
      testResults.push({
        endpoint: '/api/market-data/status',
        status: statusResponse.status,
        success: statusData.success,
        data: statusData.data || null,
        error: statusData.error || null
      });
    } catch (error) {
      testResults.push({
        endpoint: '/api/market-data/status',
        status: 'error',
        success: false,
        error: error.message
      });
    }

    // Test market-data/collector API
    try {
      const collectorResponse = await fetch(`${request.nextUrl.origin}/api/market-data/collector`);
      const collectorData = await collectorResponse.json();
      testResults.push({
        endpoint: '/api/market-data/collector',
        status: collectorResponse.status,
        success: collectorData.success,
        data: collectorData.data || null,
        error: collectorData.error || null
      });
    } catch (error) {
      testResults.push({
        endpoint: '/api/market-data/collector',
        status: 'error',
        success: false,
        error: error.message
      });
    }

    const successfulTests = testResults.filter(t => t.success && t.status === 200).length;
    const totalTests = testResults.length;

    return NextResponse.json({
      success: true,
      summary: {
        totalTests,
        successfulTests,
        failedTests: totalTests - successfulTests,
        successRate: `${Math.round((successfulTests / totalTests) * 100)}%`
      },
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}