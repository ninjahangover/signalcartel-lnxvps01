/**
 * API endpoints for Dynamic Trigger System
 * 
 * Provides REST API for controlling and monitoring the dynamic trigger generation system
 */

import { NextRequest, NextResponse } from 'next/server';
import { engineManager } from '@/lib/engine-manager';

/**
 * GET /api/dynamic-triggers - Get system status and performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const dynamicTriggerService = engineManager.getDynamicTriggerService();
    if (!dynamicTriggerService) {
      return NextResponse.json({
        success: false,
        error: 'Dynamic trigger system not initialized'
      }, { status: 400 });
    }

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: dynamicTriggerService.getSystemStatus()
        });

      case 'triggers':
        return NextResponse.json({
          success: true,
          data: dynamicTriggerService.getActiveTriggers()
        });

      case 'alerts':
        return NextResponse.json({
          success: true,
          data: dynamicTriggerService.getSystemAlerts()
        });

      case 'performance':
        const performance = await dynamicTriggerService.getRecentPerformance();
        return NextResponse.json({
          success: true,
          data: performance
        });

      case 'comparison':
        return NextResponse.json({
          success: true,
          data: dynamicTriggerService.getPerformanceComparison()
        });

      default:
        // Return comprehensive system overview
        const [status, triggers, alerts, perf] = await Promise.all([
          dynamicTriggerService.getSystemStatus(),
          dynamicTriggerService.getActiveTriggers(),
          dynamicTriggerService.getSystemAlerts(),
          dynamicTriggerService.getRecentPerformance()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            status,
            activeTriggers: triggers,
            alerts: alerts.filter(a => !a.resolved).slice(0, 10), // Last 10 unresolved
            performance: perf
          }
        });
    }
  } catch (error) {
    console.error('Error in dynamic triggers GET:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/dynamic-triggers - Start/stop system or update configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        try {
          const service = await engineManager.startDynamicTriggerService(config);
          return NextResponse.json({
            success: true,
            message: 'Dynamic trigger system started successfully',
            data: service.getSystemStatus()
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start system'
          }, { status: 400 });
        }

      case 'stop':
        await engineManager.stopDynamicTriggerService();
        return NextResponse.json({
          success: true,
          message: 'Dynamic trigger system stopped successfully'
        });

      case 'update_config':
        const service = engineManager.getDynamicTriggerService();
        if (!service) {
          return NextResponse.json({
            success: false,
            error: 'System not initialized'
          }, { status: 400 });
        }

        engineManager.updateDynamicTriggerConfig(config);
        return NextResponse.json({
          success: true,
          message: 'Configuration updated successfully'
        });

      case 'resolve_alert':
        const alertService = engineManager.getDynamicTriggerService();
        if (!alertService) {
          return NextResponse.json({
            success: false,
            error: 'System not initialized'
          }, { status: 400 });
        }

        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'alertId required'
          }, { status: 400 });
        }

        alertService.resolveAlert(alertId);
        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: start, stop, update_config, resolve_alert'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in dynamic triggers POST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/dynamic-triggers - Force stop and cleanup system
 */
export async function DELETE(request: NextRequest) {
  try {
    await engineManager.cleanup();
    return NextResponse.json({
      success: true,
      message: 'Dynamic trigger system cleaned up successfully'
    });
  } catch (error) {
    console.error('Error in dynamic triggers DELETE:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}