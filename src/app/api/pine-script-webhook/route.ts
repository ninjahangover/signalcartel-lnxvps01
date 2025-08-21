import { NextRequest, NextResponse } from 'next/server';
import PineScriptManager from '../../../lib/pine-script-manager';
import { processWebhook } from '../../../lib/unified-webhook-processor';
import { TRADING_CONFIG, getPlatformForTradingMode, getExecutionMethodDescription } from '../../../lib/config';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook data
    const alertData = await request.json();
    
    // Extract strategy ID from the request URL or payload
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const strategyId = alertData.strategy_id || pathSegments[pathSegments.length - 1];

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }

    console.log(`📡 Received Pine Script webhook for strategy: ${strategyId}`, alertData);

    // Determine trading mode and platform from URL parameters using config
    const tradingMode = request.nextUrl.searchParams.get('mode') || TRADING_CONFIG.TRADING_MODES.DEFAULT_MODE;
    const platform = getPlatformForTradingMode(tradingMode);
    const executionMethod = getExecutionMethodDescription(tradingMode);
    
    console.log(`📊 Trading mode: ${tradingMode.toUpperCase()}`);
    console.log(`🎯 Platform: ${platform.toUpperCase()}`);
    console.log(`⚡ Execution: ${executionMethod}`);
    
    // Process through unified webhook processor (handles both Alpaca and Kraken)
    const processingResult = await processWebhook(alertData, platform);
    
    // Also process through legacy PineScriptManager for backward compatibility
    const pineScriptManager = PineScriptManager.getInstance();
    await pineScriptManager.processAlert(strategyId, alertData);

    if (processingResult.success) {
      return NextResponse.json({ 
        message: 'Alert processed successfully with optimization',
        strategyId,
        tradingMode,
        platform,
        executionMethod,
        optimizationApplied: true,
        aiConfidence: `${(processingResult.aiEnhancement.confidence * 100).toFixed(1)}%`,
        marketAnalysis: processingResult.marketAnalysis.marketRegime,
        expectedWinRate: `${processingResult.aiEnhancement.expectedWinRate.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Alert processing failed', 
          reason: processingResult.rejectionReason,
          tradingMode,
          platform,
          executionMethod,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Pine Script webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const strategyId = url.searchParams.get('strategy');

  if (!strategyId) {
    return NextResponse.json({ 
      message: 'Pine Script Webhook Endpoint',
      usage: 'POST to this endpoint with Pine Script alert data'
    });
  }

  try {
    const pineScriptManager = PineScriptManager.getInstance();
    const config = pineScriptManager.getWebhookConfig(strategyId);
    const history = pineScriptManager.getAlertHistory(strategyId);

    return NextResponse.json({
      strategyId,
      config,
      recentAlerts: history.slice(-10), // Last 10 alerts
      endpoint: url.toString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Strategy not found' },
      { status: 404 }
    );
  }
}