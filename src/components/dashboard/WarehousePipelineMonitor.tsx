'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  PlayCircle,
  PauseCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';

interface PipelineStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastRun: string;
  nextRun: string;
  duration: number;
  recordsProcessed: number;
  errorCount: number;
  successRate: number;
  dataFreshness: number;
  isRunning: boolean;
}

export default function WarehousePipelineMonitor() {
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<{
    healthy: number;
    warning: number;
    critical: number;
    total: number;
    status: 'healthy' | 'warning' | 'critical';
  }>({ healthy: 0, warning: 0, critical: 0, total: 0, status: 'healthy' });

  // Fetch pipeline status
  const fetchPipelineStatus = async () => {
    try {
      // Simulate API call - in real implementation, this would call /api/warehouse/pipelines
      const mockPipelines: PipelineStatus[] = [
        {
          name: 'Trade Data Sync',
          status: 'healthy',
          lastRun: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          duration: 2340,
          recordsProcessed: 247,
          errorCount: 0,
          successRate: 98.5,
          dataFreshness: 10,
          isRunning: false
        },
        {
          name: 'Market Data Sync',
          status: 'healthy',
          lastRun: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          duration: 890,
          recordsProcessed: 1523,
          errorCount: 2,
          successRate: 99.2,
          dataFreshness: 3,
          isRunning: true
        },
        {
          name: 'Strategy Performance Sync',
          status: 'warning',
          lastRun: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          duration: 5670,
          recordsProcessed: 45,
          errorCount: 3,
          successRate: 94.1,
          dataFreshness: 45,
          isRunning: false
        },
        {
          name: 'Strategy Config Sync',
          status: 'healthy',
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          duration: 456,
          recordsProcessed: 12,
          errorCount: 0,
          successRate: 100,
          dataFreshness: 120,
          isRunning: false
        }
      ];

      setPipelines(mockPipelines);
      
      // Calculate overall status
      const healthy = mockPipelines.filter(p => p.status === 'healthy').length;
      const warning = mockPipelines.filter(p => p.status === 'warning').length;
      const critical = mockPipelines.filter(p => p.status === 'critical').length;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (critical > 0) status = 'critical';
      else if (warning > 0) status = 'warning';
      
      setOverallStatus({
        healthy,
        warning,
        critical,
        total: mockPipelines.length,
        status
      });
      
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPipelineStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      warning: 'destructive',
      critical: 'destructive',
      unknown: 'secondary'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimeAgo = (isoString: string) => {
    const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatTimeUntil = (isoString: string) => {
    const minutes = Math.floor((new Date(isoString).getTime() - Date.now()) / 60000);
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const triggerManualSync = async (pipelineName: string) => {
    try {
      console.log(`Triggering manual sync for: ${pipelineName}`);
      // In real implementation: await fetch(`/api/warehouse/pipelines/${pipelineName}/trigger`, { method: 'POST' });
      
      // Update UI to show running state
      setPipelines(prev => prev.map(p => 
        p.name === pipelineName ? { ...p, isRunning: true } : p
      ));
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        setPipelines(prev => prev.map(p => 
          p.name === pipelineName ? { 
            ...p, 
            isRunning: false, 
            lastRun: new Date().toISOString(),
            recordsProcessed: p.recordsProcessed + Math.floor(Math.random() * 100)
          } : p
        ));
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading pipeline status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Data Warehouse Pipeline Monitor
            <Badge variant={overallStatus.status === 'healthy' ? 'default' : 'destructive'}>
              {overallStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallStatus.healthy}</div>
              <div className="text-sm text-gray-600">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{overallStatus.warning}</div>
              <div className="text-sm text-gray-600">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overallStatus.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallStatus.total}</div>
              <div className="text-sm text-gray-600">Total Pipelines</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline List */}
      <div className="grid gap-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(pipeline.status)}
                  <div>
                    <h3 className="font-semibold">{pipeline.name}</h3>
                    <p className="text-sm text-gray-600">
                      Last run: {formatTimeAgo(pipeline.lastRun)} • Next: {formatTimeUntil(pipeline.nextRun)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(pipeline.status)}
                  {pipeline.isRunning && (
                    <Badge variant="outline" className="animate-pulse">
                      <Activity className="w-3 h-3 mr-1" />
                      RUNNING
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="font-medium">{formatDuration(pipeline.duration)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Records</div>
                  <div className="font-medium">{pipeline.recordsProcessed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="font-medium flex items-center gap-1">
                    {pipeline.successRate.toFixed(1)}%
                    {pipeline.successRate >= 95 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Data Age</div>
                  <div className="font-medium">
                    {pipeline.dataFreshness < 60 ? 
                      `${Math.round(pipeline.dataFreshness)}m` : 
                      `${Math.round(pipeline.dataFreshness / 60)}h`
                    }
                  </div>
                </div>
              </div>

              {/* Error Info */}
              {pipeline.errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {pipeline.errorCount} error{pipeline.errorCount > 1 ? 's' : ''} detected
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerManualSync(pipeline.name)}
                  disabled={pipeline.isRunning}
                >
                  {pipeline.isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run Now
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchPipelineStatus}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  );
}