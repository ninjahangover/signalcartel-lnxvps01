'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { positionSizingService, type PositionSizingConfig, type PositionSizeCalculation } from '../../lib/position-sizing-service';
import { tradingAccountService, type AccountData } from '../../lib/trading-account-service';
import { 
  Settings, 
  Target, 
  DollarSign, 
  Percent, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Calculator 
} from 'lucide-react';

interface ConfigurationPanelProps {
  engineStatus: {
    isRunning: boolean;
    activeStrategies: number;
    totalAlerts: number;
    optimizationActive: boolean;
  };
}

export default function QuantumForgeCommandCenter({ engineStatus }: ConfigurationPanelProps) {
  const [config, setConfig] = useState<PositionSizingConfig>(positionSizingService.getConfig());
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [calculation, setCalculation] = useState<PositionSizeCalculation | null>(null);
  const [testSymbol, setTestSymbol] = useState('BTCUSD');
  const [testPrice, setTestPrice] = useState(50000);

  // Subscribe to position sizing config changes
  useEffect(() => {
    const unsubscribe = positionSizingService.subscribe(setConfig);
    return unsubscribe;
  }, []);

  // Subscribe to account data changes
  useEffect(() => {
    const unsubscribe = tradingAccountService.subscribe(setAccountData);
    tradingAccountService.getAccountData().then(setAccountData);
    return unsubscribe;
  }, []);

  // Calculate position size when config or account data changes
  useEffect(() => {
    if (accountData) {
      const calc = positionSizingService.calculatePositionSize(
        accountData.totalValue,
        accountData.availableBalance,
        testPrice,
        'test'
      );
      setCalculation(calc);
    }
  }, [config, accountData, testPrice]);

  const updateConfig = (updates: Partial<PositionSizingConfig>) => {
    const validation = positionSizingService.validateConfig(updates);
    if (validation.valid) {
      positionSizingService.updateConfig(updates);
    } else {
      alert('Invalid configuration: ' + validation.errors.join(', '));
    }
  };

  const applyPreset = (preset: 'conservative' | 'moderate' | 'aggressive') => {
    positionSizingService.applyPreset(preset);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-cyan-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-purple-300">QUANTUM FORGE Command Center</h2>
          </div>
          <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-500/30">
            📊 Neural Risk Management
          </Badge>
        </div>
        <p className="text-purple-200 mt-2">
          Configure neural position sizing and advanced risk parameters with quantum-level precision
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Position Sizing Configuration */}
        <Card className="p-6 bg-gray-800 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center">
            <Target className="mr-2 h-5 w-5 text-purple-400" />
            Neural Position Sizing Mode
          </h3>

          {/* Mode Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="percentage"
                  checked={config.mode === 'percentage'}
                  onChange={(e) => updateConfig({ mode: e.target.value as 'percentage' })}
                  className="text-blue-500"
                />
                <Percent className="h-4 w-4 text-cyan-400" />
                <span className="text-white">Percentage of Portfolio</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="fixed_amount"
                  checked={config.mode === 'fixed_amount'}
                  onChange={(e) => updateConfig({ mode: e.target.value as 'fixed_amount' })}
                  className="text-green-500"
                />
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-white">Fixed Dollar Amount</span>
              </label>
            </div>

            {/* Percentage Mode Settings */}
            {config.mode === 'percentage' && (
              <div className="space-y-3 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-1">
                    Portfolio Percentage per Trade: {config.percentage}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="25"
                    step="0.1"
                    value={config.percentage}
                    onChange={(e) => updateConfig({ percentage: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.1%</span>
                    <span>Conservative</span>
                    <span>Aggressive</span>
                    <span>25%</span>
                  </div>
                </div>
                
                {accountData && (
                  <div className="text-sm text-cyan-300">
                    💡 {config.percentage}% of {formatCurrency(accountData.totalValue)} = {formatCurrency(accountData.totalValue * config.percentage / 100)}
                  </div>
                )}
              </div>
            )}

            {/* Fixed Amount Mode Settings */}
            {config.mode === 'fixed_amount' && (
              <div className="space-y-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-green-300 mb-1">
                    Fixed Amount per Trade
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      value={config.fixedAmount}
                      onChange={(e) => updateConfig({ fixedAmount: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="1"
                      max="1000000"
                    />
                  </div>
                  <div className="text-sm text-green-300 mt-1">
                    Every trade will use exactly {formatCurrency(config.fixedAmount)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Safety Limits */}
          <div className="mt-6">
            <h4 className="font-medium text-orange-300 mb-3 flex items-center">
              <Shield className="mr-2 h-4 w-4 text-orange-400" />
              Neural Safety Limits
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">
                  Max % of Portfolio per Trade: {config.maxPercentagePerTrade}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={config.maxPercentagePerTrade}
                  onChange={(e) => updateConfig({ maxPercentagePerTrade: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Min Trade Amount
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={config.minTradeAmount}
                      onChange={(e) => updateConfig({ minTradeAmount: parseFloat(e.target.value) || 1 })}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Trade Amount
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={config.maxTradeAmount}
                      onChange={(e) => updateConfig({ maxTradeAmount: parseFloat(e.target.value) || 10 })}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                      min="10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Level Presets */}
          <div className="mt-6">
            <h4 className="font-medium text-white mb-3">Neural Quick Presets</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('conservative')}
                className="text-xs"
              >
                🛡️ Conservative<br/>1% per trade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('moderate')}
                className="text-xs"
              >
                ⚖️ Moderate<br/>2% per trade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('aggressive')}
                className="text-xs"
              >
                🚀 Aggressive<br/>5% per trade
              </Button>
            </div>
          </div>
        </Card>

        {/* Position Size Calculator & Preview */}
        <Card className="p-6 bg-gray-800 border border-green-500/30">
          <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-green-400" />
            Neural Position Calculator
          </h3>

          {/* Test Parameters */}
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Test Symbol
                </label>
                <select
                  value={testSymbol}
                  onChange={(e) => setTestSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
                >
                  <option value="BTCUSD">BTC/USD</option>
                  <option value="ETHUSD">ETH/USD</option>
                  <option value="XRPUSD">XRP/USD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Asset Price
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    value={testPrice}
                    onChange={(e) => setTestPrice(parseFloat(e.target.value) || 1)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Results */}
          {accountData && calculation && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Portfolio Value</div>
                    <div className="font-semibold text-white">{formatCurrency(accountData.totalValue)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Available Balance</div>
                    <div className="font-semibold text-white">{formatCurrency(accountData.availableBalance)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Trading Mode</div>
                    <div className="font-semibold text-white">
                      {accountData.tradingMode === 'paper' ? '📝 Paper' : '💰 Live'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Current Config</div>
                    <div className="font-semibold text-white text-xs">{positionSizingService.getConfigSummary()}</div>
                  </div>
                </div>
              </div>

              {/* Position Size Result */}
              <div className={`p-4 rounded-lg border-l-4 ${
                calculation.withinLimits 
                  ? 'bg-green-900/20 border-green-400' 
                  : 'bg-orange-900/20 border-orange-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center">
                    {calculation.withinLimits ? (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="mr-2 h-4 w-4 text-orange-400" />
                    )}
                    <span className="text-white">Calculated Position Size</span>
                  </h4>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(calculation.actualAmount)}
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  Reasoning: {calculation.reasoning}
                </div>
                
                <div className="text-sm">
                  <div className="text-white">Units to buy: {(calculation.actualAmount / testPrice).toFixed(6)} {testSymbol?.replace('USD', '') || 'N/A'}</div>
                  <div className="text-gray-400">
                    This represents {((calculation.actualAmount / accountData.totalValue) * 100).toFixed(2)}% of your portfolio
                  </div>
                </div>
                
                {calculation.warnings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {calculation.warnings.map((warning, i) => (
                      <div key={i} className="text-sm text-orange-300 flex items-center">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Account Data */}
          {!accountData && (
            <div className="text-center py-8 text-gray-400">
              <Calculator className="mx-auto h-12 w-12 mb-2 text-gray-500" />
              <p className="text-white">Connect your trading account to see position size calculations</p>
            </div>
          )}
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card className="p-6 bg-gray-800 border border-cyan-500/30">
        <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-cyan-400" />
          Advanced Neural Risk Management
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-white mb-2">Kelly Criterion Calculator</h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p>Optimal bet sizing based on win rate and average win/loss ratios</p>
              <div className="bg-gray-900 border border-gray-600 p-3 rounded">
                <div className="text-white">Win Rate: 60%</div>
                <div className="text-white">Avg Win: $150</div>
                <div className="text-white">Avg Loss: $100</div>
                <div className="font-semibold text-green-400 mt-1">
                  Kelly Optimal: 2.5% per trade
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This will be calculated from your actual trading history
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">Current Configuration Summary</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Position Sizing:</span>
                <span className="text-white">{config.mode === 'percentage' ? `${config.percentage}%` : formatCurrency(config.fixedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Safety Limit:</span>
                <span className="text-white">{config.maxPercentagePerTrade}% max</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trade Range:</span>
                <span className="text-white">{formatCurrency(config.minTradeAmount)} - {formatCurrency(config.maxTradeAmount)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">Neural Risk Assessment</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Risk Level:</span>
                <Badge variant={
                  config.percentage <= 1 ? 'outline' : 
                  config.percentage <= 3 ? 'secondary' : 'destructive'
                }>
                  {config.percentage <= 1 ? '🛡️ Conservative' : 
                   config.percentage <= 3 ? '⚖️ Moderate' : '🚀 Aggressive'}
                </Badge>
              </div>
              <Progress 
                value={Math.min(config.percentage * 4, 100)} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500">
                Based on position size as % of portfolio
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}