'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import KrakenChart from '../kraken-chart';
import DynamicTriggerDashboard from '../dynamic-triggers/DynamicTriggerDashboard';
import ErrorBoundary from '../error-boundary';

interface LiveTradingEngineProps {
  isKrakenConnected: boolean;
  engineStatus?: {
    isRunning: boolean;
    activeStrategies: number;
    totalAlerts: number;
    optimizationActive: boolean;
  };
}

export default function LiveTradingEngine({ isKrakenConnected, engineStatus }: LiveTradingEngineProps) {
  const [activeSubTab, setActiveSubTab] = useState('charts');

  return (
    <div className="space-y-6">
      {/* Live Trading Setup Status */}
      {!isKrakenConnected && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-red-50 border-yellow-200">
          <h2 className="text-xl font-bold mb-3">⚠️ Live Trading Not Ready</h2>
          <div className="text-sm text-yellow-800">
            <div className="mb-2">To start AI-powered live trading:</div>
            <div className="space-y-1">
              <div>1. Go to <strong>"Account"</strong> tab → Connect Kraken API</div>
              <div>2. Switch to <strong>"Live"</strong> mode (top right)</div>
              <div>3. Stratus Engine automatically trades via kraken.circuitcartel.com/webhook</div>
              <div>4. Return here to monitor AI trades in real-time</div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Live Trading Engine</h2>
          </div>
          
          {isKrakenConnected && (
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-600 font-medium">Live Data Active</span>
              </span>
            </div>
          )}
        </div>
        
        {!isKrakenConnected ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect Kraken API</h3>
            <p className="text-gray-600 mb-8">
              Connect your Kraken API credentials in the Account tab to enable live trading charts and data
            </p>
          </div>
        ) : (
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
              <TabsTrigger value="charts" className="flex items-center justify-center space-x-2 py-2">
                <BarChart3 size={16} />
                <span>Live Charts</span>
              </TabsTrigger>
              <TabsTrigger value="ai-triggers" className="flex items-center justify-center space-x-2 py-2">
                <TrendingUp size={16} />
                <span>AI Triggers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid gap-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🔴 LIVE Real-Time Trading Charts
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Professional TradingView charts with real-time Kraken data
                  </p>
                </div>
                
                {/* Real-time charts component */}
                <ErrorBoundary fallback={<div className="p-8 text-center text-red-600">Error loading charts. Please refresh the page.</div>}>
                  <KrakenChart />
                </ErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="ai-triggers" className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🤖 Dynamic AI Trading Triggers
                </h3>
                <p className="text-gray-600 text-sm">
                  AI-powered trigger generation and performance tracking
                </p>
              </div>
              
              {/* Dynamic trigger system dashboard */}
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-600">Error loading AI triggers. Please refresh the page.</div>}>
                <DynamicTriggerDashboard />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
}