"use client";

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { usePineScript } from '../lib/hooks/use-pine-script';
import { useStrategySync } from '../lib/hooks';

export default function PineScriptTestingPanel() {
  const { strategies } = useStrategySync();
  const { 
    webhookConfigs, 
    alertHistory, 
    isLoading,
    configureWebhook,
    generatePineScriptAlert,
    testStrategy,
    toggleWebhook,
    toggleTestMode,
    getWebhookConfig,
    getAlertHistory
  } = usePineScript();

  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [testAlert, setTestAlert] = useState({
    action: 'BUY',
    symbol: 'BTCUSD',
    price: '50000',
    quantity: '0.01'
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleConfigureWebhook = async (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      try {
        setTestResult(`Configuring webhook for ${strategy.name}...`);
        const config = await configureWebhook(strategyId, strategy);
        console.log('Webhook configured with kraken.circuitcartel.com:', config);
        setTestResult(`✅ Webhook configured for ${strategy.name}`);
      } catch (error) {
        console.error('Webhook configuration failed:', error);
        setTestResult(`❌ Failed to configure webhook: ${error}`);
      }
    }
  };

  const handleTestStrategy = async (strategyId: string) => {
    try {
      setTestResult(null);
      const success = await testStrategy(strategyId, {
        ...testAlert,
        strategy_id: strategyId,
        timestamp: new Date().toISOString()
      });
      
      setTestResult(success ? 'Test successful! ✅' : 'Test failed ❌');
    } catch (error) {
      setTestResult(`Test error: ${error}`);
    }
  };

  const handleGeneratePineScript = (strategyId: string) => {
    try {
      const pineScriptCode = generatePineScriptAlert(strategyId);
      navigator.clipboard.writeText(pineScriptCode);
      alert('Pine Script code copied to clipboard!');
    } catch (error) {
      alert('Error generating Pine Script code');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pine Script Testing</h2>
          <p className="text-gray-600">Configure and test Pine Script webhook integrations</p>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Webhook Configuration</h3>
            
            <div className="space-y-4">
              {strategies.map(strategy => {
                const webhookConfig = getWebhookConfig(strategy.id);
                const hasWebhook = !!webhookConfig;

                return (
                  <div key={strategy.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-sm text-gray-600">
                          {strategy.type} | Status: {strategy.status}
                        </div>
                        {hasWebhook && (
                          <div className="text-xs text-gray-500 mt-1">
                            Webhook: {webhookConfig.url.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {hasWebhook && (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Active:</span>
                            <Switch
                              checked={webhookConfig.active}
                              onCheckedChange={(checked) => toggleWebhook(strategy.id, checked)}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Test Mode:</span>
                            <Switch
                              checked={webhookConfig.testMode}
                              onCheckedChange={(checked) => toggleTestMode(strategy.id, checked)}
                            />
                          </div>

                          <Badge variant={webhookConfig.testMode ? 'secondary' : 'destructive'}>
                            {webhookConfig.testMode ? 'TEST (validate: true)' : 'LIVE (validate: false)'}
                          </Badge>

                          <Badge variant={webhookConfig.active ? 'default' : 'secondary'}>
                            {webhookConfig.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </>
                      )}

                      <div className="flex space-x-2">
                        {!hasWebhook ? (
                          <Button
                            size="sm"
                            onClick={() => handleConfigureWebhook(strategy.id)}
                          >
                            Configure Webhook
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePineScript(strategy.id)}
                          >
                            Generate Pine Script
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Strategy Testing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Strategy</label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a strategy</option>
                    {strategies
                      .filter(s => getWebhookConfig(s.id))
                      .map(strategy => (
                        <option key={strategy.id} value={strategy.id}>
                          {strategy.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Action</label>
                    <select
                      value={testAlert.action}
                      onChange={(e) => setTestAlert(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="CLOSE">CLOSE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Symbol</label>
                    <input
                      type="text"
                      value={testAlert.symbol}
                      onChange={(e) => setTestAlert(prev => ({ ...prev, symbol: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      placeholder="BTCUSD"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <input
                      type="number"
                      value={testAlert.price}
                      onChange={(e) => setTestAlert(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      type="number"
                      step="0.001"
                      value={testAlert.quantity}
                      onChange={(e) => setTestAlert(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      placeholder="0.01"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => selectedStrategyId && handleTestStrategy(selectedStrategyId)}
                  disabled={!selectedStrategyId || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Testing...' : 'Test Strategy'}
                </Button>

                {testResult && (
                  <div className="p-3 bg-gray-100 rounded-md">
                    <div className="font-medium">Test Result:</div>
                    <div className="text-sm">{testResult}</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Test Instructions</h4>
                <div className="text-sm space-y-2 text-gray-600">
                  <p>1. Configure a webhook for your strategy</p>
                  <p>2. Enable test mode to prevent real trades</p>
                  <p>3. Use the test form to simulate Pine Script alerts</p>
                  <p>4. Monitor the alert history to verify processing</p>
                  <p>5. Generate Pine Script code to use in TradingView</p>
                </div>

                {selectedStrategyId && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="font-medium text-blue-900">Webhook URL:</div>
                      <div className="text-xs font-mono text-blue-700 break-all">
                        {getWebhookConfig(selectedStrategyId)?.url || 'Not configured'}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-900 mb-2">Expected JSON Payload:</div>
                      <pre className="text-xs font-mono text-gray-700 overflow-x-auto">
{JSON.stringify({
  passphrase: "sdfqoei1898498",
  ticker: "{{ticker}}",
  strategy: {
    order_action: "{{strategy.order.action}}",
    order_type: "limit",
    order_price: "{{strategy.order.price}}",
    order_contracts: "{{strategy.order.contracts}}",
    type: "{{strategy.order.action}}",
    volume: "{{strategy.order.contracts}}",
    pair: "{{ticker}}",
    validate: getWebhookConfig(selectedStrategyId)?.testMode ? "true" : "false",
    close: {
      order_type: "limit",
      price: "{{strategy.order.price}}"
    },
    stop_loss: "{{strategy.order.price - strategy.position.avg_price * 0.01}}"
  }
}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Alert History</h3>
            
            <div className="space-y-3">
              {alertHistory.slice(-10).reverse().map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={
                      alert.action === 'BUY' ? 'default' : 
                      alert.action === 'SELL' ? 'destructive' : 'secondary'
                    }>
                      {alert.action}
                    </Badge>
                    {alert.alertData?.isValidationMode && (
                      <Badge variant="secondary">TEST</Badge>
                    )}
                    <div>
                      <div className="font-medium">{alert.symbol}</div>
                      <div className="text-sm text-gray-600">
                        Strategy: {alert.strategyId} | Qty: {alert.quantity}
                      </div>
                      {alert.alertData?.passphrase && (
                        <div className="text-xs text-gray-500">
                          Auth: {alert.alertData.passphrase.substring(0, 8)}***
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">${alert.price}</div>
                    <div className="text-sm text-gray-600">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {alert.alertData?.isValidationMode ? 'No trade executed' : 'Trade executed'}
                    </div>
                  </div>
                </div>
              ))}
              
              {alertHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No alerts received yet. Configure webhooks and test strategies.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}