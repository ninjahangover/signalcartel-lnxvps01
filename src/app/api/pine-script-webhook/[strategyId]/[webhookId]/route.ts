import { NextRequest, NextResponse } from 'next/server';
import PineScriptManager from '../../../../../lib/pine-script-manager';

interface RouteParams {
  params: {
    strategyId: string;
    webhookId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { strategyId, webhookId } = await params;
    
    // Parse the incoming Pine Script alert data
    const alertData = await request.json();
    
    console.log(`📡 Pine Script Alert for strategy ${strategyId} (webhook: ${webhookId}):`, alertData);

    // Validate the webhook exists and is active
    const pineScriptManager = PineScriptManager.getInstance();
    const webhookConfig = pineScriptManager.getWebhookConfig(strategyId);
    
    if (!webhookConfig) {
      return NextResponse.json(
        { error: `No webhook configuration found for strategy: ${strategyId}` },
        { status: 404 }
      );
    }

    if (!webhookConfig.active) {
      return NextResponse.json(
        { error: `Webhook is disabled for strategy: ${strategyId}` },
        { status: 403 }
      );
    }

    // Process the alert
    const success = await pineScriptManager.processAlert(strategyId, {
      ...alertData,
      webhookId,
      receivedAt: new Date().toISOString()
    });

    if (success) {
      return NextResponse.json({ 
        message: 'Pine Script alert processed successfully',
        strategyId,
        webhookId,
        testMode: webhookConfig.testMode,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to process Pine Script alert' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Pine Script webhook error:`, error);
    return NextResponse.json(
      { error: 'Internal server error processing Pine Script alert' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook status and testing
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { strategyId, webhookId } = await params;
    
    const pineScriptManager = PineScriptManager.getInstance();
    const webhookConfig = pineScriptManager.getWebhookConfig(strategyId);
    const alertHistory = pineScriptManager.getAlertHistory(strategyId);

    if (!webhookConfig) {
      return NextResponse.json(
        { error: `No webhook found for strategy: ${strategyId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      strategyId,
      webhookId,
      config: webhookConfig,
      recentAlerts: alertHistory.slice(-5), // Last 5 alerts
      status: webhookConfig.active ? 'active' : 'inactive',
      testMode: webhookConfig.testMode,
      endpoint: request.url,
      usage: {
        method: 'POST',
        contentType: 'application/json',
        samplePayload: webhookConfig.payload
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}