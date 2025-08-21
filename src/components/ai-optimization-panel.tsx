"use client";

import React, { useState } from 'react';
import { useOptimizationSync } from '../lib/hooks';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export default function AIOptimizationPanel() {
  const { optimizationState, startOptimization, stopOptimization } = useOptimizationSync();
  const [selectedStrategy, setSelectedStrategy] = useState('ai-momentum-001');

  const optimizationProgress = optimizationState.totalIterations > 0
    ? (optimizationState.currentIteration / optimizationState.totalIterations) * 100
    : 0;

  const recentHistory = optimizationState.history.slice(-10).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Optimization Engine</h2>
          <p className="text-gray-600">Real-time parameter optimization and performance analysis</p>
        </div>
        <Badge variant={optimizationState.isRunning ? "default" : "secondary"}>
          {optimizationState.isRunning ? "OPTIMIZING" : "READY"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Control Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Optimization Control</h3>
              <Button
                onClick={() => optimizationState.isRunning ? stopOptimization() : startOptimization(selectedStrategy)}
                variant={optimizationState.isRunning ? "destructive" : "default"}
              >
                {optimizationState.isRunning ? 'Stop Optimization' : 'Start Optimization'}
              </Button>
            </div>

            {optimizationState.isRunning && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Optimization Progress</span>
                    <span>{optimizationState.currentIteration} / {optimizationState.totalIterations}</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {optimizationState.currentIteration}
                    </div>
                    <div className="text-sm text-gray-600">Current Iteration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {optimizationState.currentPerformance.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">Current Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(optimizationState.bestParameters.performance as number)?.toFixed(2) || '0.00'}%
                    </div>
                    <div className="text-sm text-gray-600">Best Performance</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Performance Chart Placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Evolution</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <p className="text-gray-600">Real-time optimization chart</p>
                <p className="text-sm text-gray-500">
                  {optimizationState.history.length} data points collected
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Current Best Parameters</h3>

            {Object.keys(optimizationState.bestParameters).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(optimizationState.bestParameters).map(([key, value]) => (
                  <div key={key} className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-lg font-semibold">
                      {typeof value === 'number' ? value.toFixed(4) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No optimization data available</p>
                <p className="text-sm text-gray-500">Start an optimization to see parameters</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Optimization History</h3>

            {recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((entry, index) => (
                  <div key={entry.iteration} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{entry.iteration}</Badge>
                      <div>
                        <div className="font-medium">Performance: {entry.performance.toFixed(2)}%</div>
                        <div className="text-sm text-gray-600">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Parameters</div>
                      <div className="text-xs text-gray-500">
                        {Object.keys(entry.parameters).length} values
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No optimization history</p>
                <p className="text-sm text-gray-500">Run optimizations to see history</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Alerts */}
      {optimizationState.isRunning && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-blue-800">
              AI optimization in progress... Analyzing parameter combinations
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
