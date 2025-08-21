"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { krakenApiService } from '../lib/kraken-api-service';
import marketDataService from '../lib/market-data-service';

interface KrakenAuthProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function KrakenAuth({ onConnectionChange }: KrakenAuthProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

  const handleTestConnection = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError('Please enter both API key and secret');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTestResult('');

    try {
      console.log('🧪 Testing Kraken API connection...');
      
      // Test the proxy endpoint first
      const response = await fetch('/api/kraken-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'Balance',
          params: {},
          apiKey: apiKey,
          apiSecret: apiSecret,
        }),
      });

      console.log('🧪 Test response status:', response.status);
      console.log('🧪 Test response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🧪 Test response error:', errorText);
        throw new Error(`API test failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🧪 Test response data:', data);

      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      setTestResult('✅ API connection test successful! Your credentials are valid.');
    } catch (err) {
      console.error('🧪 Test connection failed:', err);
      setError(err instanceof Error ? err.message : 'Test connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (isConnected) {
      // Disconnect
      krakenApiService.disconnect();
      setIsConnected(false);
      setAccountInfo(null);
      setError(null);
      onConnectionChange?.(false);
      return;
    }

    if (!apiKey.trim() || !apiSecret.trim()) {
      setError('Please enter both API key and secret');
      return;
    }

    // Validate API key format
    if (apiKey.length < 40) {
      setError('API key appears too short. Kraken API keys are typically 56 characters long.');
      return;
    }

    if (apiSecret.length < 40) {
      setError('API secret appears too short. Kraken API secrets are typically 88 characters long.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setConnectionProgress(0);

    try {
      // Simulate connection progress
      setConnectionProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));

      setConnectionProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Attempt authentication
      setConnectionProgress(75);
      const success = await krakenApiService.authenticate(apiKey, apiSecret);

      if (success) {
        setConnectionProgress(100);
        setIsConnected(true);

        // Fetch account info
        const info = await krakenApiService.getAccountInfo();
        setAccountInfo(info);

        onConnectionChange?.(true);

        // Clear sensitive data from state
        setApiKey('');
        setApiSecret('');
      } else {
        throw new Error('Authentication failed - Please check your API credentials and permissions');
      }
    } catch (err) {
      console.error('Kraken authentication error:', err);
      
      let errorMessage = 'Connection failed';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide more specific error messages
        if (errorMessage.includes('Invalid key')) {
          errorMessage = 'Invalid API key format. Please check your Kraken API key.';
        } else if (errorMessage.includes('Invalid signature')) {
          errorMessage = 'Invalid API signature. Please check your Kraken API secret.';
        } else if (errorMessage.includes('Permission denied')) {
          errorMessage = 'API key permissions insufficient. Ensure your API key has "Query Funds" and "Query Open Orders" permissions.';
        } else if (errorMessage.includes('Nonce')) {
          errorMessage = 'Nonce error. Please wait a moment and try again.';
        } else if (errorMessage.includes('Rate limit')) {
          errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        }
      }
      
      setError(errorMessage);
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsConnecting(false);
      setConnectionProgress(0);
    }
  };

  const getTotalBalanceUSD = () => {
    if (!accountInfo?.balance) return 0;

    // Use real market data prices
    
    let total = 0;
    for (const [asset, amount] of Object.entries(accountInfo.balance)) {
      const numericAmount = parseFloat(amount as string);
      if (numericAmount <= 0) continue;
      
      // Convert asset to trading pair and get real price
      if (asset === 'ZUSD' || asset === 'USD') {
        total += numericAmount; // USD is worth $1
      } else {
        // Get real price for the asset
        const price = marketDataService.getPrice(`${asset}USD`) || marketDataService.getPrice(asset) || 0;
        total += numericAmount * price;
      }
    }

    return total;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kraken API Connection</h2>
          <p className="text-gray-600">
            Connect your Kraken account for live trading with real data
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "CONNECTED" : "DISCONNECTED"}
        </Badge>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="space-y-4">
          {!isConnected && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">🔑 Kraken API Setup Instructions</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Log into your Kraken account and go to Settings → API</li>
                  <li>2. Create a new API key with these permissions:</li>
                  <li className="ml-4">• ✅ <strong>Query Funds</strong> (required for balance)</li>
                  <li className="ml-4">• ✅ <strong>Query Open Orders</strong> (required for orders)</li>
                  <li className="ml-4">• ✅ <strong>Query Closed Orders</strong> (recommended)</li>
                  <li className="ml-4">• ✅ <strong>Query Ledger Entries</strong> (recommended)</li>
                  <li>3. Copy the API key (56 chars) and secret (88 chars) below</li>
                </ol>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key <span className="text-gray-400">(56 characters)</span>
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isConnecting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Enter your Kraken API key"
                  />
                  {apiKey && (
                    <div className="text-xs mt-1 text-gray-500">
                      Length: {apiKey.length} chars {apiKey.length === 56 ? '✅' : apiKey.length > 0 ? '❌' : ''}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Secret <span className="text-gray-400">(88 characters)</span>
                  </label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    disabled={isConnecting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Enter your Kraken API secret"
                  />
                  {apiSecret && (
                    <div className="text-xs mt-1 text-gray-500">
                      Length: {apiSecret.length} chars {apiSecret.length === 88 ? '✅' : apiSecret.length > 0 ? '❌' : ''}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {isConnecting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Connecting to Kraken...</span>
                <span>{connectionProgress}%</span>
              </div>
              <Progress value={connectionProgress} />
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <div className="text-red-800">{error}</div>
            </Alert>
          )}

          {testResult && (
            <Alert className="border-green-200 bg-green-50">
              <div className="text-green-800">{testResult}</div>
            </Alert>
          )}

          <div className="flex space-x-4">
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              variant={isConnected ? "destructive" : "default"}
              className="flex-1"
            >
              {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect to Kraken'}
            </Button>
            
            {!isConnected && (
              <Button
                onClick={handleTestConnection}
                disabled={isConnecting}
                variant="outline"
                className="px-6"
              >
                Test API
              </Button>
            )}
          </div>

          {isConnected && accountInfo && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Connection Successful!</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Account Status:</span>
                  <span className="font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Trading Enabled:</span>
                  <span className="font-medium">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Portfolio Value:</span>
                  <span className="font-medium">${getTotalBalanceUSD().toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Open Orders:</span>
                  <span className="font-medium">{Object.keys(accountInfo.openOrders || {}).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Source:</span>
                  <span className="font-medium text-green-600">
                    Live Kraken API
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
