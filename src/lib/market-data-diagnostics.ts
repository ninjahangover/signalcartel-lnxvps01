/**
 * Market Data Service Diagnostics & Recovery Tools
 * 
 * Utilities to diagnose and fix market data service issues
 */

import marketDataService from './market-data-service';

export interface MarketDataHealth {
  isPolling: boolean;
  totalSymbols: number;
  successfulSymbols: number;
  failedSymbols: number;
  symbolStatus: Array<{
    symbol: string;
    hasData: boolean;
    failedAttempts: number;
    lastAttempt: Date | null;
    krakenMapping: string | null;
  }>;
  lastDataUpdate: Date | null;
  recommendations: string[];
}

/**
 * Diagnose the current health of the market data service
 */
export async function diagnoseMarketDataHealth(): Promise<MarketDataHealth> {
  const symbolStatus = marketDataService.getSymbolStatus();
  const allData = marketDataService.getAllData();
  
  const successfulSymbols = symbolStatus.filter(s => s.failedAttempts === 0 && allData.has(s.symbol));
  const failedSymbols = symbolStatus.filter(s => s.failedAttempts > 0);
  
  const recommendations: string[] = [];
  
  // Generate recommendations
  if (failedSymbols.length > successfulSymbols.length) {
    recommendations.push('⚠️ More symbols failing than succeeding - check API connectivity');
  }
  
  if (symbolStatus.some(s => s.failedAttempts >= 10)) {
    recommendations.push('🚫 Some symbols permanently disabled - consider updating symbol mappings');
  }
  
  if (allData.size === 0) {
    recommendations.push('❌ No market data available - restart the service');
  }
  
  if (successfulSymbols.length > 0) {
    recommendations.push('✅ Some data is working - system is partially functional');
  }

  const timestamps = Array.from(allData.values()).map(d => d.timestamp);
  const lastDataUpdate = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

  return {
    isPolling: (marketDataService as any).isPolling || false,
    totalSymbols: symbolStatus.length,
    successfulSymbols: successfulSymbols.length,
    failedSymbols: failedSymbols.length,
    symbolStatus: symbolStatus.map(s => ({
      symbol: s.symbol,
      hasData: allData.has(s.symbol),
      failedAttempts: s.failedAttempts,
      lastAttempt: s.lastAttempt,
      krakenMapping: (marketDataService as any).convertToKrakenPair(s.symbol)
    })),
    lastDataUpdate,
    recommendations
  };
}

/**
 * Reset and restart the market data service
 */
export async function resetMarketDataService(): Promise<void> {
  console.log('🔄 Resetting market data service...');
  
  // Stop polling
  marketDataService.stopPolling();
  
  // Clear failed attempts
  marketDataService.clearFailedAttempts();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Restart with core symbols only
  const coreSymbols = ['BTCUSD', 'ETHUSD', 'XRPUSD'];
  marketDataService.setUserAssets(coreSymbols);
  
  // Start polling again
  marketDataService.startPolling();
  
  console.log('✅ Market data service reset complete');
}

/**
 * Test connectivity to a specific symbol
 */
export async function testSymbolConnectivity(symbol: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
  krakenMapping?: string;
}> {
  try {
    const krakenMapping = (marketDataService as any).convertToKrakenPair(symbol);
    
    if (!krakenMapping) {
      return {
        success: false,
        error: `No Kraken mapping found for ${symbol}`,
        krakenMapping: null
      };
    }

    // Try to fetch real-time data for this symbol
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://127.0.0.1:3001';
    const response = await fetch(`${baseUrl}/api/kraken-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'Ticker',
        params: { pair: krakenMapping }
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        krakenMapping
      };
    }

    const data = await response.json();

    if (data.error && data.error.length > 0) {
      return {
        success: false,
        error: `Kraken API error: ${data.error.join(', ')}`,
        krakenMapping,
        data
      };
    }

    return {
      success: true,
      krakenMapping,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      krakenMapping: (marketDataService as any).convertToKrakenPair(symbol)
    };
  }
}

/**
 * Get a summary report of the market data service
 */
export async function getMarketDataReport(): Promise<string> {
  const health = await diagnoseMarketDataHealth();
  
  const report = `
📊 Market Data Service Health Report
=====================================

Status: ${health.isPolling ? '🟢 Running' : '🔴 Stopped'}
Total Symbols: ${health.totalSymbols}
Successful: ${health.successfulSymbols}
Failed: ${health.failedSymbols}
Last Update: ${health.lastDataUpdate ? health.lastDataUpdate.toLocaleString() : 'Never'}

Symbol Details:
${health.symbolStatus.map(s => 
  `  ${s.hasData ? '✅' : '❌'} ${s.symbol} (${s.krakenMapping || 'No mapping'}) - Failed: ${s.failedAttempts}`
).join('\n')}

Recommendations:
${health.recommendations.map(r => `  ${r}`).join('\n')}
`;

  return report;
}

export default {
  diagnoseMarketDataHealth,
  resetMarketDataService,
  testSymbolConnectivity,
  getMarketDataReport
};