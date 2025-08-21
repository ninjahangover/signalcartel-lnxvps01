import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { strategyId, webhookUrl, payload, testMode } = await request.json();

    console.log(`📡 Registering webhook with kraken.circuitcartel.com for strategy: ${strategyId}`);

    // Register strategy with your webhook API for processing
    // Since kraken.circuitcartel.com/webhook is the single endpoint,
    // we just need to inform it about this strategy's configuration
    console.log(`Registering strategy ${strategyId} with webhook endpoint`);
    
    // For now, we'll just log the registration since your API handles
    // the actual webhook processing. In production, you might want to 
    // register the strategy configuration with your API.
    
    return NextResponse.json({
      message: 'Strategy registered successfully for webhook processing',
      strategyId,
      webhookUrl,
      payload,
      testMode,
      note: 'Using kraken.circuitcartel.com/webhook as single endpoint'
    });
  } catch (error) {
    console.error('Webhook registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during webhook registration' },
      { status: 500 }
    );
  }
}

// Test webhook connection to your API
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const strategyId = url.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({
        message: 'Webhook registration endpoint',
        usage: 'POST to register webhooks with kraken.circuitcartel.com'
      });
    }

    // Test connection to your API with test webhook
    const response = await fetch(`https://kraken.circuitcartel.com/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers your API requires
        // 'Authorization': 'Bearer your-api-token',
      },
      body: JSON.stringify({
        verify: 'test',
        strategyId: strategyId,
        action: 'buy',
        symbol: 'BTCUSD',
        price: 50000,
        quantity: 0.001,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const testResult = await response.json();
      return NextResponse.json({
        strategyId,
        status: 'connected',
        message: 'Test webhook sent successfully',
        testResult
      });
    } else {
      return NextResponse.json({
        strategyId,
        status: 'disconnected',
        error: 'Could not connect to kraken.circuitcartel.com'
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Failed to test connection to kraken.circuitcartel.com'
    });
  }
}