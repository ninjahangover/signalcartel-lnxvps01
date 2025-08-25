/**
 * GPU-Accelerated Quantum Oscillator Strategy
 * Advanced quantum-inspired oscillator using GPU parallel computation
 */

import { BaseStrategy, TradingSignal, MarketData } from './strategy-implementations';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface GPUQuantumResult {
  quantum_oscillator: number[];
  quantum_momentum: number[];
  quantum_energy: number[];
  phase_transitions: boolean[];
  coherence_factor: number[];
  timestamp: number;
  gpu_accelerated: boolean;
}

export class GPUQuantumOscillatorStrategy extends BaseStrategy {
  private config: {
    lookbackPeriod: number;
    quantumPeriod: number;
    energyThreshold: number;
    coherenceThreshold: number;
    phaseShiftSensitivity: number;
  };
  
  private lastLongCondition: number = -1;
  private lastShortCondition: number = -1;
  private lastGPUCalculation: number = 0;
  private gpuResultCache: GPUQuantumResult | null = null;
  
  constructor(strategyId: string, symbol: string, config: any) {
    super(strategyId, symbol);
    this.config = {
      lookbackPeriod: config.lookbackPeriod || 60, // Reduced from 100 to 60 for faster quantum calculations
      quantumPeriod: config.quantumPeriod || 15, // Reduced from 20 to 15 for more responsive oscillations
      energyThreshold: config.energyThreshold || 0.2, // Reduced from 0.3 to 0.2 for more energy signals
      coherenceThreshold: config.coherenceThreshold || 0.3, // Reduced from 0.4 to 0.3 for more coherence signals
      phaseShiftSensitivity: config.phaseShiftSensitivity || 0.4 // Reduced from 0.5 to 0.4 for more phase shift detection
    };
  }
  
  analyzeMarket(marketData: MarketData): TradingSignal {
    const price = marketData.price;
    this.state.priceHistory.push(price);
    
    // Keep optimal history for quantum calculations
    if (this.state.priceHistory.length > 2000) {
      this.state.priceHistory = this.state.priceHistory.slice(-1000);
    }
    
    // Use GPU for quantum oscillator calculations every 15 data points
    const shouldUseGPU = !this.gpuResultCache || 
                        (this.state.priceHistory.length - this.lastGPUCalculation) >= 15 ||
                        this.state.priceHistory.length < this.config.lookbackPeriod;
    
    if (shouldUseGPU && this.state.priceHistory.length >= this.config.lookbackPeriod) {
      try {
        this.calculateGPUQuantumOscillator();
        this.lastGPUCalculation = this.state.priceHistory.length;
      } catch (error) {
        console.log('GPU Quantum calculation failed, using classical approximation:', error.message);
        this.updateQuantumFromCache(price);
      }
    } else {
      this.updateQuantumFromCache(price);
    }
    
    // Need sufficient data for quantum analysis
    if (this.state.priceHistory.length < this.config.lookbackPeriod) {
      return {
        action: 'HOLD',
        confidence: 0.1,
        price,
        quantity: 0,
        reason: `Building Quantum Oscillator (${this.state.priceHistory.length}/${this.config.lookbackPeriod} data points)`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { lookbackPeriod: this.config.lookbackPeriod, usingGPU: shouldUseGPU }
      };
    }
    
    // Get quantum oscillator values
    const quantum = this.getQuantumValues();
    if (!quantum) {
      return {
        action: 'HOLD',
        confidence: 0.1,
        price,
        quantity: 0,
        reason: 'Waiting for quantum oscillator calculations',
        stopLoss: 0,
        takeProfit: 0,
        metadata: { usingGPU: shouldUseGPU }
      };
    }
    
    const { oscillator, momentum, energy, phaseTransition, coherence } = quantum;
    
    // Quantum Trading Logic
    const highEnergy = energy >= this.config.energyThreshold;
    const highCoherence = coherence >= this.config.coherenceThreshold;
    const quantumResonance = highEnergy && highCoherence;
    
    // Quantum phase analysis
    const bullishPhase = oscillator > 0 && momentum > 0;
    const bearishPhase = oscillator < 0 && momentum < 0;
    const neutralPhase = Math.abs(oscillator) < 0.1;
    
    // Entry conditions with quantum signals (more aggressive - remove phase transition requirement)
    const longCondition = quantumResonance && bullishPhase;
    const shortCondition = quantumResonance && bearishPhase;
    
    // Track quantum conditions for confirmation
    if (longCondition) {
      this.lastLongCondition = 0;
    } else if (this.lastLongCondition >= 0) {
      this.lastLongCondition++;
    }
    
    if (shortCondition) {
      this.lastShortCondition = 0;
    } else if (this.lastShortCondition >= 0) {
      this.lastShortCondition++;
    }
    
    // Quantum confirmation (within 2-3 bars for phase coherence)
    const longConfirmed = this.lastLongCondition >= 0 && this.lastLongCondition <= 2 && longCondition;
    const shortConfirmed = this.lastShortCondition >= 0 && this.lastShortCondition <= 2 && shortCondition;
    
    // Position sizing based on quantum energy
    const baseQuantity = 0.001;
    const energyMultiplier = Math.min(2.0, 1.0 + energy);
    const quantity = baseQuantity * energyMultiplier;
    
    // Generate quantum signals
    if (longConfirmed) {
      const confidence = Math.min(0.95, 0.7 + (energy * coherence * 0.3));
      return {
        action: 'BUY',
        confidence,
        price,
        quantity,
        reason: `Quantum Long: Resonance detected, energy=${(energy*100).toFixed(1)}%, coherence=${(coherence*100).toFixed(1)}%`,
        stopLoss: price * 0.97,
        takeProfit: price * (1 + (energy * 0.06)), // Dynamic take profit based on energy
        metadata: {
          oscillator,
          momentum,
          energy,
          coherence,
          phaseTransition,
          quantumResonance,
          confirmationBars: this.lastLongCondition,
          gpuAccelerated: true,
          strategy: 'gpu-quantum-oscillator'
        }
      };
    }
    
    if (shortConfirmed) {
      const confidence = Math.min(0.95, 0.7 + (energy * coherence * 0.3));
      return {
        action: 'SELL',
        confidence,
        price,
        quantity,
        reason: `Quantum Short: Resonance detected, energy=${(energy*100).toFixed(1)}%, coherence=${(coherence*100).toFixed(1)}%`,
        stopLoss: price * 1.03,
        takeProfit: price * (1 - (energy * 0.06)),
        metadata: {
          oscillator,
          momentum,
          energy,
          coherence,
          phaseTransition,
          quantumResonance,
          confirmationBars: this.lastShortCondition,
          gpuAccelerated: true,
          strategy: 'gpu-quantum-oscillator'
        }
      };
    }
    
    // Quantum exit conditions
    if (this.state.position === 'long' && (bearishPhase || energy < 0.3)) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: `Quantum Exit Long: ${bearishPhase ? 'Phase reversal' : 'Energy depletion'}`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { exitType: 'quantum_phase_change', gpuAccelerated: true }
      };
    }
    
    if (this.state.position === 'short' && (bullishPhase || energy < 0.3)) {
      return {
        action: 'CLOSE',
        confidence: 0.9,
        price,
        quantity: 0,
        reason: `Quantum Exit Short: ${bullishPhase ? 'Phase reversal' : 'Energy depletion'}`,
        stopLoss: 0,
        takeProfit: 0,
        metadata: { exitType: 'quantum_phase_change', gpuAccelerated: true }
      };
    }
    
    // Hold with quantum analysis
    const holdConfidence = Math.min(0.8, Math.max(0.2, 
      quantumResonance ? 0.8 : (highEnergy ? 0.6 : (neutralPhase ? 0.3 : 0.4))
    ));
    
    return {
      action: 'HOLD',
      confidence: holdConfidence,
      price,
      quantity: 0,
      reason: `Quantum monitoring: ${quantumResonance ? 'Resonance' : neutralPhase ? 'Neutral phase' : 'Building energy'} (E=${(energy*100).toFixed(1)}%, C=${(coherence*100).toFixed(1)}%)`,
      stopLoss: 0,
      takeProfit: 0,
      metadata: {
        oscillator,
        momentum,
        energy,
        coherence,
        phaseTransition,
        quantumResonance,
        bullishPhase,
        bearishPhase,
        neutralPhase,
        gpuAccelerated: true,
        longConditionActive: this.lastLongCondition >= 0 && this.lastLongCondition <= 2,
        shortConditionActive: this.lastShortCondition >= 0 && this.lastShortCondition <= 2
      }
    };
  }
  
  private calculateGPUQuantumOscillator(): void {
    const tempDir = '/tmp/signalcartel';
    const inputFile = join(tempDir, 'quantum_data.txt');
    
    execSync(`mkdir -p ${tempDir}`, { stdio: 'ignore' });
    
    const priceData = this.state.priceHistory.join('\n');
    writeFileSync(inputFile, priceData);
    
    const pythonScript = `
import sys
import os
sys.path.append('${process.cwd()}/src/lib')

try:
    import numpy as np
    import cupy as cp
    import math
    
    # Read price data
    with open('${inputFile}', 'r') as f:
        data = f.read().replace('\\\\n', '\\n')  # Fix double-escaped newlines
        prices = [float(line.strip()) for line in data.split('\\n') if line.strip()]
    
    prices_gpu = cp.array(prices, dtype=cp.float32)
    quantum_period = ${this.config.quantumPeriod}
    lookback = ${this.config.lookbackPeriod}
    
    quantum_oscillator = []
    quantum_momentum = []
    quantum_energy = []
    phase_transitions = []
    coherence_factor = []
    
    for i in range(lookback, len(prices)):
        # Get analysis window
        window = prices_gpu[i-lookback:i]
        recent_window = prices_gpu[i-quantum_period:i]
        
        # Quantum-inspired calculations using GPU
        
        # 1. Quantum Oscillator (wave function superposition)
        normalized_prices = (recent_window - cp.mean(recent_window)) / cp.std(recent_window)
        
        # Quantum state vector (price momentum in phase space)
        momentum_component = cp.diff(normalized_prices)
        position_component = normalized_prices[1:]
        
        # Quantum oscillator value (expectation value of position-momentum)
        oscillator = float(cp.mean(position_component * momentum_component))
        
        # 2. Quantum Momentum (time derivative of probability amplitude)
        price_changes = cp.diff(recent_window)
        momentum_magnitude = cp.sqrt(cp.mean(price_changes ** 2))
        momentum_direction = cp.mean(cp.sign(price_changes))
        quantum_mom = float(momentum_direction * momentum_magnitude)
        
        # 3. Quantum Energy (Hamiltonian expectation value)
        kinetic_energy = cp.mean(momentum_component ** 2) / 2
        potential_energy = cp.mean(position_component ** 2) / 2
        total_energy = float(kinetic_energy + potential_energy)
        
        # Normalize energy to [0, 1]
        energy_normalized = min(1.0, total_energy / 2.0)
        
        # 4. Phase Transition Detection (sudden change in quantum state)
        if i > lookback + 5:
            prev_oscillator = quantum_oscillator[-1]
            phase_change = abs(oscillator - prev_oscillator)
            transition = phase_change > ${this.config.phaseShiftSensitivity}
        else:
            transition = False
        
        # 5. Coherence Factor (quantum state purity)
        # Measure of how "pure" or coherent the quantum state is
        price_variance = cp.var(recent_window)
        price_range = cp.max(recent_window) - cp.min(recent_window)
        coherence = float(1.0 / (1.0 + price_variance / (price_range ** 2 + 1e-8)))
        
        quantum_oscillator.append(oscillator)
        quantum_momentum.append(quantum_mom)
        quantum_energy.append(energy_normalized)
        phase_transitions.append(transition)
        coherence_factor.append(coherence)
    
    # Output results
    import json
    result = {
        'quantum_oscillator': quantum_oscillator,
        'quantum_momentum': quantum_momentum,
        'quantum_energy': quantum_energy,
        'phase_transitions': phase_transitions,
        'coherence_factor': coherence_factor,
        'timestamp': int(__import__('time').time()),
        'gpu_accelerated': True
    }
    
    print(json.dumps(result))

except Exception as e:
    # Fallback to classical oscillator approximation
    import json
    import math
    
    # Read price data
    with open('${inputFile}', 'r') as f:
        data = f.read().replace('\\\\n', '\\n')  # Fix double-escaped newlines
        prices = [float(line.strip()) for line in data.split('\\n') if line.strip()]
    
    quantum_period = ${this.config.quantumPeriod}
    lookback = ${this.config.lookbackPeriod}
    
    quantum_oscillator = []
    quantum_momentum = []
    quantum_energy = []
    phase_transitions = []
    coherence_factor = []
    
    for i in range(lookback, len(prices)):
        recent_window = prices[i-quantum_period:i]
        
        # Classical approximations
        mean_price = sum(recent_window) / len(recent_window)
        normalized = [(p - mean_price) for p in recent_window]
        
        # Simple oscillator
        oscillator = sum(normalized) / len(normalized)
        
        # Momentum approximation
        price_changes = [recent_window[j] - recent_window[j-1] for j in range(1, len(recent_window))]
        momentum = sum(price_changes) / len(price_changes) if price_changes else 0
        
        # Energy approximation (volatility-based)
        variance = sum((p - mean_price) ** 2 for p in recent_window) / len(recent_window)
        energy = min(1.0, math.sqrt(variance) / mean_price) if mean_price != 0 else 0
        
        # Phase transition (momentum change)
        if i > lookback + 5:
            prev_momentum = quantum_momentum[-1]
            transition = abs(momentum - prev_momentum) > ${this.config.phaseShiftSensitivity * 0.5}
        else:
            transition = False
        
        # Coherence (inverse of relative volatility)
        price_range = max(recent_window) - min(recent_window)
        coherence = 1.0 / (1.0 + variance / (price_range ** 2 + 1e-8)) if price_range > 0 else 0.5
        
        quantum_oscillator.append(oscillator)
        quantum_momentum.append(momentum)
        quantum_energy.append(energy)
        phase_transitions.append(transition)
        coherence_factor.append(coherence)
    
    result = {
        'quantum_oscillator': quantum_oscillator,
        'quantum_momentum': quantum_momentum,
        'quantum_energy': quantum_energy,
        'phase_transitions': phase_transitions,
        'coherence_factor': coherence_factor,
        'timestamp': int(__import__('time').time()),
        'gpu_accelerated': False
    }
    
    print(json.dumps(result))
`;
    
    const output = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const result = JSON.parse(output.trim());
    this.gpuResultCache = result;
    
    execSync(`rm -f ${inputFile}`, { stdio: 'ignore' });
  }
  
  private updateQuantumFromCache(price: number): void {
    if (!this.gpuResultCache) {
      // Simple classical oscillator fallback
      const prices = this.state.priceHistory;
      if (prices.length >= this.config.quantumPeriod) {
        const recent = prices.slice(-this.config.quantumPeriod);
        const mean = recent.reduce((sum, p) => sum + p, 0) / recent.length;
        const oscillator = (price - mean) / mean;
        
        // Simple momentum
        const momentum = recent.length >= 2 ? 
          (recent[recent.length - 1] - recent[recent.length - 2]) / recent[recent.length - 2] : 0;
        
        // Simple energy (normalized volatility)
        const variance = recent.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / recent.length;
        const energy = Math.min(1.0, Math.sqrt(variance) / mean);
        
        this.gpuResultCache = {
          quantum_oscillator: [oscillator],
          quantum_momentum: [momentum],
          quantum_energy: [energy],
          phase_transitions: [false],
          coherence_factor: [0.5],
          timestamp: Date.now(),
          gpu_accelerated: false
        };
      }
    }
  }
  
  private getQuantumValues() {
    if (!this.gpuResultCache) return null;
    
    const cache = this.gpuResultCache;
    const lastIndex = cache.quantum_oscillator.length - 1;
    
    if (lastIndex < 0) return null;
    
    return {
      oscillator: cache.quantum_oscillator[lastIndex],
      momentum: cache.quantum_momentum[lastIndex],
      energy: cache.quantum_energy[lastIndex],
      phaseTransition: cache.phase_transitions[lastIndex],
      coherence: cache.coherence_factor[lastIndex]
    };
  }
}