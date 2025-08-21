'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import AlertGenerationEngine, { GeneratedAlert, VariableChange, AlertConfig } from '@/lib/alert-generation-engine';
import PerformanceTracker, { PerformanceMetrics, VariableEffectiveness, AutoAdjustmentRule } from '@/lib/performance-tracker';

interface AlertManagementDashboardProps {
  className?: string;
}

const AlertManagementDashboard: React.FC<AlertManagementDashboardProps> = ({ className }) => {
  const [alertEngine] = useState(() => AlertGenerationEngine.getInstance());
  const [performanceTracker] = useState(() => PerformanceTracker.getInstance());
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [isTrackingRunning, setIsTrackingRunning] = useState(false);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<GeneratedAlert[]>([]);
  const [variableChanges, setVariableChanges] = useState<VariableChange[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');

  useEffect(() => {
    const updateData = () => {
      setIsEngineRunning(alertEngine.isEngineRunning());
      setAlertConfigs(alertEngine.getAlertConfigs());
      
      const stats = alertEngine.getAlertStats();
      setRecentAlerts(stats.recentAlerts);
      setVariableChanges(alertEngine.getVariableChangeHistory());
      setPerformanceMetrics(performanceTracker.getPerformanceHistory());
    };

    updateData();

    const unsubscribeAlert = alertEngine.subscribe(updateData);
    const unsubscribePerformance = performanceTracker.subscribe(updateData);

    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => {
      unsubscribeAlert();
      unsubscribePerformance();
      clearInterval(interval);
    };
  }, [alertEngine, performanceTracker]);

  const handleEngineToggle = () => {
    if (isEngineRunning) {
      alertEngine.stopEngine();
    } else {
      alertEngine.startEngine();
    }
  };

  const handleTrackingToggle = () => {
    if (isTrackingRunning) {
      performanceTracker.stopTracking();
      setIsTrackingRunning(false);
    } else {
      performanceTracker.startTracking(5); // 5-minute intervals
      setIsTrackingRunning(true);
    }
  };

  const handleStrategyToggle = (strategyId: string, active: boolean) => {
    alertEngine.toggleStrategy(strategyId, active);
  };

  const getAlertStatusColor = (status: string): string => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'BUY': return 'bg-green-100 text-green-800';
      case 'SELL': return 'bg-red-100 text-red-800';
      case 'CLOSE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const strategyMetrics = selectedStrategy 
    ? performanceMetrics.filter(m => m.strategyId === selectedStrategy).slice(-24) // Last 24 measurements
    : [];

  const strategyVariables = selectedStrategy
    ? performanceTracker.getVariableEffectiveness(selectedStrategy)
    : [];

  const autoRules = selectedStrategy
    ? performanceTracker.getAutoAdjustmentRules(selectedStrategy)
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Engine Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Alert Generation Engine</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">Performance Tracking</span>
              <Switch
                checked={isTrackingRunning}
                onCheckedChange={handleTrackingToggle}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">Alert Engine</span>
              <Switch
                checked={isEngineRunning}
                onCheckedChange={handleEngineToggle}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Active Strategies</div>
            <div className="text-2xl font-bold text-white">
              {alertConfigs.filter(c => c.active).length}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Total Alerts (24h)</div>
            <div className="text-2xl font-bold text-white">
              {recentAlerts.filter(a => 
                a.timestamp.getTime() > Date.now() - 24*60*60*1000
              ).length}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Success Rate</div>
            <div className="text-2xl font-bold text-green-400">
              {recentAlerts.length > 0 
                ? `${((recentAlerts.filter(a => a.executionStatus === 'sent').length / recentAlerts.length) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Variable Changes</div>
            <div className="text-2xl font-bold text-blue-400">
              {variableChanges.filter(c => 
                c.timestamp.getTime() > Date.now() - 24*60*60*1000
              ).length}
            </div>
          </div>
        </div>

        {/* Strategy Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Strategy Configuration</h3>
          {alertConfigs.map((config) => (
            <div key={config.strategyId} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-white">{config.strategyId}</span>
                  <Badge className={config.active ? 'bg-green-600' : 'bg-gray-600'}>
                    {config.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Switch
                  checked={config.active}
                  onCheckedChange={(active) => handleStrategyToggle(config.strategyId, active)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Alerts:</span>
                  <span className="text-white ml-2">{config.performanceTracking.totalAlerts}</span>
                </div>
                <div>
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-white ml-2">
                    {config.performanceTracking.totalAlerts > 0
                      ? `${((config.performanceTracking.successfulTrades / config.performanceTracking.totalAlerts) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Return:</span>
                  <span className="text-white ml-2">{config.performanceTracking.avgReturn.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Webhook:</span>
                  <span className="text-white ml-2 text-xs">{config.webhookUrl.split('/').pop()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          <TabsTrigger value="variables">Variable Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="automation">Auto-Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentAlerts.slice(0, 20).map((alert) => (
                <div key={alert.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge className={getActionColor(alert.action)}>
                        {alert.action}
                      </Badge>
                      <span className="text-white font-medium">{alert.symbol}</span>
                      <span className="text-gray-400">@${alert.price.toFixed(2)}</span>
                      <div className={`w-2 h-2 rounded-full ${getAlertStatusColor(alert.executionStatus)}`}></div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{alert.reason}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Confidence:</span>
                      <Badge variant="secondary">{alert.confidence.toFixed(1)}%</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Variable Change History</h3>
              <select 
                className="bg-gray-800 text-white p-2 rounded"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option value="">All Strategies</option>
                {alertConfigs.map(config => (
                  <option key={config.strategyId} value={config.strategyId}>
                    {config.strategyId}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {variableChanges
                .filter(change => !selectedStrategy || change.strategyId === selectedStrategy)
                .slice(0, 20)
                .map((change, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">{change.variableName}</span>
                      <Badge variant="outline">
                        {change.oldValue} → {change.newValue}
                      </Badge>
                      {change.isImprovement !== undefined && (
                        <Badge className={change.isImprovement ? 'bg-green-600' : 'bg-red-600'}>
                          {change.isImprovement ? '↑ Improved' : '↓ Degraded'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {change.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">{change.reason}</div>
                  {change.performanceAfterChange !== undefined && (
                    <div className="text-sm">
                      <span className="text-gray-400">Performance Impact: </span>
                      <span className={change.performanceAfterChange > change.performanceBeforeChange ? 'text-green-400' : 'text-red-400'}>
                        {((change.performanceAfterChange - change.performanceBeforeChange) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
              <select 
                className="bg-gray-800 text-white p-2 rounded"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option value="">Select Strategy</option>
                {alertConfigs.map(config => (
                  <option key={config.strategyId} value={config.strategyId}>
                    {config.strategyId}
                  </option>
                ))}
              </select>
            </div>

            {selectedStrategy && strategyMetrics.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Win Rate</div>
                    <div className="text-2xl font-bold text-green-400">
                      {(strategyMetrics[strategyMetrics.length - 1].winRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Avg Return</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {strategyMetrics[strategyMetrics.length - 1].avgReturn.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {strategyMetrics[strategyMetrics.length - 1].sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-400">
                      {(strategyMetrics[strategyMetrics.length - 1].maxDrawdown * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Variable Effectiveness */}
                {strategyVariables.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Variable Effectiveness</h4>
                    {strategyVariables.map((variable) => (
                      <div key={variable.variableName} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{variable.variableName}</span>
                          <Badge className={variable.effectiveness > 0 ? 'bg-green-600' : 'bg-red-600'}>
                            {variable.recommendedAction}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Current Value:</span>
                            <span className="text-white">{variable.currentValue}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Effectiveness:</span>
                            <span className={`text-${variable.effectiveness > 0 ? 'green' : 'red'}-400`}>
                              {(variable.effectiveness * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${variable.effectiveness > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(variable.effectiveness) * 100}%` }}
                            ></div>
                          </div>
                          {variable.recommendedValue !== undefined && (
                            <div className="text-sm">
                              <span className="text-gray-400">Recommended: </span>
                              <span className="text-yellow-400">{variable.recommendedValue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Auto-Adjustment Rules</h3>
              <select 
                className="bg-gray-800 text-white p-2 rounded"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option value="">Select Strategy</option>
                {alertConfigs.map(config => (
                  <option key={config.strategyId} value={config.strategyId}>
                    {config.strategyId}
                  </option>
                ))}
              </select>
            </div>

            {selectedStrategy && (
              <div className="space-y-4">
                {autoRules.map((rule, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium">{rule.variableName}</span>
                        <Badge className={rule.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => 
                          performanceTracker.toggleAutoAdjustmentRule(selectedStrategy, rule.variableName, enabled)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Condition: </span>
                        <span className="text-white">
                          {rule.condition.metric} {rule.condition.comparison} {rule.condition.threshold}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Action: </span>
                        <span className="text-white">
                          {rule.adjustment.action} by {rule.adjustment.amount}
                        </span>
                      </div>
                      {rule.lastTriggered && (
                        <div className="col-span-2">
                          <span className="text-gray-400">Last Triggered: </span>
                          <span className="text-white">{rule.lastTriggered.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {autoRules.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No auto-adjustment rules configured for this strategy
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertManagementDashboard;