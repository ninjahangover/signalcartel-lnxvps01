import { NextRequest, NextResponse } from 'next/server';
import { resourceMonitor, getCurrentResourceMetrics, getResourceStatus } from '../../../lib/resource-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const format = searchParams.get('format') || 'json';

    switch (action) {
      case 'status':
        return handleStatus(format);
      
      case 'metrics':
        return handleMetrics(format);
      
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '50');
        return handleHistory(limit, format);
      
      case 'health':
        return handleHealthCheck(format);
      
      case 'processes':
        return handleProcesses(format);
      
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['status', 'metrics', 'history', 'health', 'processes']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'start':
        resourceMonitor.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Resource monitoring started',
          timestamp: new Date().toISOString()
        });

      case 'stop':
        resourceMonitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Resource monitoring stopped',
          timestamp: new Date().toISOString()
        });

      case 'config':
        if (body.config) {
          resourceMonitor.updateConfig(body.config);
          return NextResponse.json({
            success: true,
            message: 'Configuration updated',
            newConfig: resourceMonitor.getStatus().config,
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json({
            error: 'No configuration provided'
          }, { status: 400 });
        }

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['start', 'stop', 'config']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function handleStatus(format: string) {
  const status = getResourceStatus();
  
  if (format === 'prometheus') {
    // Prometheus metrics format for external monitoring
    const current = status.currentMetrics;
    if (!current) {
      return new Response('# No metrics available\n', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const metrics = [
      `# HELP signalcartel_cpu_usage CPU usage percentage`,
      `# TYPE signalcartel_cpu_usage gauge`,
      `signalcartel_cpu_usage ${current.cpu.usage}`,
      ``,
      `# HELP signalcartel_memory_usage Memory usage percentage`,
      `# TYPE signalcartel_memory_usage gauge`, 
      `signalcartel_memory_usage ${current.memory.usage}`,
      ``,
      `# HELP signalcartel_memory_used Memory used in MB`,
      `# TYPE signalcartel_memory_used gauge`,
      `signalcartel_memory_used ${current.memory.used}`,
      ``,
      `# HELP signalcartel_load_average System load average`,
      `# TYPE signalcartel_load_average gauge`,
      `signalcartel_load_average{period="1m"} ${current.cpu.loadAverage[0]}`,
      `signalcartel_load_average{period="5m"} ${current.cpu.loadAverage[1]}`,
      `signalcartel_load_average{period="15m"} ${current.cpu.loadAverage[2]}`,
      ``,
      `# HELP signalcartel_process_count Number of application processes`,
      `# TYPE signalcartel_process_count gauge`,
      `signalcartel_process_count ${current.processes.length}`,
      ``
    ];

    // Add per-process metrics
    current.processes.forEach(process => {
      metrics.push(
        `# HELP signalcartel_process_cpu CPU usage per process`,
        `# TYPE signalcartel_process_cpu gauge`,
        `signalcartel_process_cpu{name="${process.name}",pid="${process.pid}"} ${process.cpu}`,
        ``,
        `# HELP signalcartel_process_memory Memory usage per process`,
        `# TYPE signalcartel_process_memory gauge`,
        `signalcartel_process_memory{name="${process.name}",pid="${process.pid}"} ${process.memory}`,
        ``
      );
    });

    return new Response(metrics.join('\n'), {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString()
  });
}

function handleMetrics(format: string) {
  const metrics = getCurrentResourceMetrics();
  
  if (!metrics) {
    return NextResponse.json({
      error: 'No current metrics available',
      timestamp: new Date().toISOString()
    }, { status: 404 });
  }

  if (format === 'influxdb') {
    // InfluxDB line protocol format
    const timestamp = Math.floor(metrics.timestamp.getTime() * 1000000); // nanoseconds
    
    const lines = [
      `system_metrics,host=signalcartel cpu_usage=${metrics.cpu.usage},memory_usage=${metrics.memory.usage},memory_used=${metrics.memory.used}i,load_1m=${metrics.cpu.loadAverage[0]},load_5m=${metrics.cpu.loadAverage[1]},load_15m=${metrics.cpu.loadAverage[2]} ${timestamp}`
    ];

    // Add process metrics
    metrics.processes.forEach(process => {
      lines.push(
        `process_metrics,host=signalcartel,process_name=${process.name},pid=${process.pid} cpu_usage=${process.cpu},memory_usage=${process.memory}i ${timestamp}`
      );
    });

    return new Response(lines.join('\n'), {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString()
  });
}

function handleHistory(limit: number, format: string) {
  const history = resourceMonitor.getMetricsHistory(limit);
  
  return NextResponse.json({
    success: true,
    data: history,
    count: history.length,
    timestamp: new Date().toISOString()
  });
}

function handleHealthCheck(format: string) {
  const current = getCurrentResourceMetrics();
  
  if (!current) {
    return NextResponse.json({
      status: 'unhealthy',
      reason: 'No metrics available',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }

  // Health check thresholds
  const isHealthy = current.cpu.usage < 90 && 
                   current.memory.usage < 90 &&
                   current.processes.every(p => p.cpu < 150);

  const status = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks: {
      cpu: {
        status: current.cpu.usage < 90 ? 'ok' : 'warning',
        value: current.cpu.usage,
        threshold: 90
      },
      memory: {
        status: current.memory.usage < 90 ? 'ok' : 'warning', 
        value: current.memory.usage,
        threshold: 90
      },
      processes: {
        status: current.processes.every(p => p.cpu < 150) ? 'ok' : 'critical',
        count: current.processes.length,
        runaway: current.processes.filter(p => p.cpu > 150).length
      }
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(status, {
    status: isHealthy ? 200 : 503
  });
}

function handleProcesses(format: string) {
  const current = getCurrentResourceMetrics();
  
  if (!current) {
    return NextResponse.json({
      error: 'No current metrics available',
      timestamp: new Date().toISOString()
    }, { status: 404 });
  }

  // Detailed process information
  const processData = {
    total: current.processes.length,
    processes: current.processes,
    summary: {
      totalCPU: current.processes.reduce((sum, p) => sum + p.cpu, 0),
      totalMemory: current.processes.reduce((sum, p) => sum + p.memory, 0),
      highCPU: current.processes.filter(p => p.cpu > 50).length,
      highMemory: current.processes.filter(p => p.memory > 500).length
    },
    timestamp: current.timestamp
  };

  return NextResponse.json({
    success: true,
    data: processData,
    timestamp: new Date().toISOString()
  });
}