"use client";

import React from 'react';
import { Badge } from '../ui/badge';

interface StrategyParameterDisplayProps {
  strategy: any;
}

export default function StrategyParameterDisplay({ strategy }: StrategyParameterDisplayProps) {
  // Determine strategy type based on ID or available parameters
  const getStrategyType = (strategy: any): 'rsi' | 'quantum' | 'neural' => {
    if (strategy.id === 'rsi-pullback-pro') return 'rsi';
    if (strategy.id === 'claude-quantum-oscillator') return 'quantum';
    if (strategy.id === 'stratus-core-neural') return 'neural';
    
    // Fallback detection based on inputs
    if (strategy.inputs?.quantum_period) return 'quantum';
    if (strategy.inputs?.neural_layers) return 'neural';
    return 'rsi';
  };

  const strategyType = getStrategyType(strategy);

  // Render RSI strategy parameters
  const renderRSIParameters = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-600">RSI Period:</span>
        <span className="ml-2 font-mono">{strategy.inputs.rsi_length}</span>
      </div>
      <div>
        <span className="text-gray-600">RSI Levels:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.rsi_oversold}/{strategy.inputs.rsi_overbought}
        </span>
      </div>
      <div>
        <span className="text-gray-600">MACD:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.macd_fast}/{strategy.inputs.macd_slow}/{strategy.inputs.macd_signal}
        </span>
      </div>
      <div>
        <span className="text-gray-600">Stop Loss:</span>
        <span className="ml-2 font-mono">{strategy.inputs.stop_loss_percent}%</span>
      </div>
      <div>
        <span className="text-gray-600">Take Profit:</span>
        <span className="ml-2 font-mono">{strategy.inputs.take_profit_percent}%</span>
      </div>
      <div>
        <span className="text-gray-600">Position:</span>
        <span className="ml-2 font-mono">{strategy.inputs.position_size_percent}%</span>
      </div>
      <div>
        <span className="text-gray-600">Risk/Reward:</span>
        <span className="ml-2 font-mono">{strategy.inputs.risk_reward_ratio}:1</span>
      </div>
      <div>
        <span className="text-gray-600">Trend Filter:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.trend_filter_enabled ? '✅' : '❌'}
        </span>
      </div>
    </div>
  );

  // Render Quantum Oscillator parameters
  const renderQuantumParameters = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Quantum Period:</span>
        <span className="ml-2 font-mono text-purple-600">{strategy.inputs.quantum_period}</span>
      </div>
      <div>
        <span className="text-gray-600">Q-Multiplier:</span>
        <span className="ml-2 font-mono text-purple-600">{strategy.inputs.quantum_multiplier}x</span>
      </div>
      <div>
        <span className="text-gray-600">Q-Threshold:</span>
        <span className="ml-2 font-mono text-purple-600">{strategy.inputs.quantum_threshold}</span>
      </div>
      <div>
        <span className="text-gray-600">Confluence:</span>
        <span className="ml-2 font-mono text-blue-600">
          {strategy.inputs.confluence_factors} factors
        </span>
      </div>
      <div>
        <span className="text-gray-600">Wave Periods:</span>
        <span className="ml-2 font-mono text-blue-600">
          {strategy.inputs.wave_period_short}/{strategy.inputs.wave_period_medium}/{strategy.inputs.wave_period_long}
        </span>
      </div>
      <div>
        <span className="text-gray-600">Min Score:</span>
        <span className="ml-2 font-mono text-blue-600">{strategy.inputs.confluence_score_min}%</span>
      </div>
      <div>
        <span className="text-gray-600">Dynamic Stops:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.dynamic_stop_loss ? 
            `ATR×${strategy.inputs.stop_loss_atr_mult}` : 
            'Fixed'}
        </span>
      </div>
      <div>
        <span className="text-gray-600">Regime Filter:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.regime_filter ? '✅' : '❌'}
        </span>
      </div>
      <div className="col-span-2">
        <span className="text-gray-600">Factor Weights:</span>
        <div className="flex gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            Mom: {(strategy.inputs.momentum_weight * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline" className="text-xs">
            Vol: {(strategy.inputs.volume_weight * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline" className="text-xs">
            Vty: {(strategy.inputs.volatility_weight * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>
    </div>
  );

  // Render Neural Engine parameters
  const renderNeuralParameters = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Neural Layers:</span>
        <span className="ml-2 font-mono text-green-600">{strategy.inputs.neural_layers} layers</span>
      </div>
      <div>
        <span className="text-gray-600">Neurons/Layer:</span>
        <span className="ml-2 font-mono text-green-600">{strategy.inputs.neurons_per_layer}</span>
      </div>
      <div>
        <span className="text-gray-600">Learning Rate:</span>
        <span className="ml-2 font-mono text-green-600">{strategy.inputs.learning_rate}</span>
      </div>
      <div>
        <span className="text-gray-600">Lookback:</span>
        <span className="ml-2 font-mono text-green-600">{strategy.inputs.training_lookback} bars</span>
      </div>
      <div>
        <span className="text-gray-600">Pattern Library:</span>
        <span className="ml-2 font-mono text-yellow-600">{strategy.inputs.pattern_library_size} patterns</span>
      </div>
      <div>
        <span className="text-gray-600">Match Threshold:</span>
        <span className="ml-2 font-mono text-yellow-600">{(strategy.inputs.pattern_match_threshold * 100).toFixed(0)}%</span>
      </div>
      <div>
        <span className="text-gray-600">Prediction:</span>
        <span className="ml-2 font-mono text-blue-600">{strategy.inputs.prediction_horizon} bars</span>
      </div>
      <div>
        <span className="text-gray-600">Confidence:</span>
        <span className="ml-2 font-mono text-blue-600">{(strategy.inputs.confidence_threshold * 100).toFixed(0)}%</span>
      </div>
      <div>
        <span className="text-gray-600">Adaptive:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.adaptive_mode ? 
            `✅ (${strategy.inputs.adaptation_speed} speed)` : 
            '❌'}
        </span>
      </div>
      <div>
        <span className="text-gray-600">ML Sizing:</span>
        <span className="ml-2 font-mono">
          {strategy.inputs.ml_position_sizing ? 
            `${strategy.inputs.base_position_percent}-${strategy.inputs.max_position_percent}%` : 
            'Fixed'}
        </span>
      </div>
      <div className="col-span-2">
        <span className="text-gray-600">Pattern Types:</span>
        <div className="flex gap-2 mt-1">
          {strategy.inputs.enable_candlestick && <Badge variant="outline" className="text-xs">Candle</Badge>}
          {strategy.inputs.enable_harmonic && <Badge variant="outline" className="text-xs">Harmonic</Badge>}
          {strategy.inputs.enable_wyckoff && <Badge variant="outline" className="text-xs">Wyckoff</Badge>}
          {strategy.inputs.enable_fractal && <Badge variant="outline" className="text-xs">Fractal</Badge>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {strategyType === 'rsi' && renderRSIParameters()}
      {strategyType === 'quantum' && renderQuantumParameters()}
      {strategyType === 'neural' && renderNeuralParameters()}
    </div>
  );
}