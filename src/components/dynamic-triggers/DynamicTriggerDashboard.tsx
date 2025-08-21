'use client';

/**
 * Dynamic Trigger Dashboard Component
 * 
 * Provides real-time monitoring and control of the dynamic trigger generation system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface SystemStatus {
  isRunning: boolean;
  activeTriggers: number;
  totalSymbols: number;
  marketDataReceived: number;
  lastUpdate: string;
  alerts: number;
}

interface ActiveTrigger {
  id: string;
  trigger: {
    symbol: string;
    type: 'long' | 'short';
    triggerPrice: number;
    confidence: number;
  };
  status: string;
  entryTime: string;
  entryPrice: number;
  pnl?: number;
  currentDrawdown: number;
  positionSize: number;
  isTestPosition: boolean;
}

interface PerformanceStats {
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  volatility: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'risk' | 'opportunity' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function DynamicTriggerDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeTriggers, setActiveTriggers] = useState<ActiveTrigger[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dynamic-triggers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (result.success) {
        setSystemStatus(result.data?.status || null);
        setActiveTriggers(result.data?.activeTriggers || []);
        setPerformance(result.data?.performance || null);
        setAlerts(result.data?.alerts || []);
      } else {
        setError(result.error || 'Unknown API error');
      }
    } catch (err) {
      console.error('Failed to fetch dynamic triggers data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const handleSystemAction = async (action: string, config?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dynamic-triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, config }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchSystemData(); // Refresh data
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/dynamic-triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resolve_alert', alertId }),
      });
      await fetchSystemData();
    } catch (err) {
      setError('Failed to resolve alert');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value == null || isNaN(value)) return '0.00%';
    return `${(value * 100).toFixed(2)}%`;
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Trigger System</h1>
          <p className="text-gray-600 mt-1">
            AI-powered trading trigger generation and testing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchSystemData()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {systemStatus?.isRunning ? (
            <Button
              onClick={() => handleSystemAction('stop')}
              variant="destructive"
              disabled={isLoading}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop System
            </Button>
          ) : (
            <Button
              onClick={() => handleSystemAction('start', {
                symbols: ['BTCUSD', 'ETHUSD', 'XRPUSD'],
                updateFrequencySeconds: 60,
                maxTestPositionSize: 0.05
              })}
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-2" />
              Start System
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {systemStatus?.isRunning ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.isRunning ? 'Running' : 'Stopped'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus?.activeTriggers || 0} active triggers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Data</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.marketDataReceived || 0}/{systemStatus?.totalSymbols || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Symbols receiving data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            {performance && performance.totalReturn >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance ? formatPercentage(performance.totalReturn / 100) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {performance?.totalTrades || 0} total trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unresolved alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="triggers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="triggers">Active Triggers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Active Triggers Tab */}
        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Triggers ({activeTriggers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTriggers.length === 0 ? (
                <p className="text-muted-foreground">No active triggers</p>
              ) : (
                <div className="space-y-2">
                  {activeTriggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(trigger.status)}>
                          {trigger.status}
                        </Badge>
                        <div>
                          <div className="font-medium">
                            {trigger.trigger.symbol} {trigger.trigger.type.toUpperCase()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Entry: {formatCurrency(trigger.entryPrice)} | 
                            Size: {formatPercentage(trigger.positionSize)}
                            {trigger.isTestPosition && ' (TEST)'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          trigger.pnl && trigger.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trigger.pnl ? formatPercentage(trigger.pnl) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Confidence: {formatPercentage(trigger.trigger.confidence)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(performance.winRate)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performance.totalTrades} total trades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(performance?.sharpeRatio || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Risk-adjusted return
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Max Drawdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatPercentage(performance.maxDrawdown / 100)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Peak to trough decline
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Factor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(performance?.profitFactor || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gross profit / gross loss
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Best Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(performance.bestTrade / 100)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Largest winning trade
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Worst Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatPercentage(performance.worstTrade / 100)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Largest losing trade
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground">No alerts</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between p-3 border rounded-lg ${
                        alert.resolved ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.severity)}
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.message}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          onClick={() => resolveAlert(alert.id)}
                          variant="outline"
                          size="sm"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Test Mode Active</AlertTitle>
                  <AlertDescription>
                    The system is running in test mode. No real trades will be executed.
                    All positions are paper trades for performance comparison.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Update Frequency:</strong> 60 seconds
                  </div>
                  <div>
                    <strong>Max Position Size:</strong> 5%
                  </div>
                  <div>
                    <strong>Symbols:</strong> BTCUSD, ETHUSD, XRPUSD
                  </div>
                  <div>
                    <strong>Testing Duration:</strong> 14 days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}