// Pine Script Strategy Parser for Stratus Engine
// Extracts parameters and variables from Pine Script code

export interface PineScriptParameter {
  name: string;
  type: 'integer' | 'float' | 'boolean' | 'string';
  category: 'entry' | 'exit' | 'risk_management' | 'timeframe' | 'indicator';
  currentValue: string;
  originalValue: string;
  minValue?: string;
  maxValue?: string;
  isOptimizable: boolean;
  priority: 1 | 2 | 3; // 1=high, 2=medium, 3=low
  description?: string;
  marketAdjustments: {
    volatility: boolean;
    volume: boolean;
    momentum: boolean;
  };
}

export interface ParsedPineStrategy {
  strategyType: 'RSI' | 'Fibonacci' | 'AI_Momentum' | 'Custom';
  timeframe: string;
  parameters: PineScriptParameter[];
  indicators: string[];
  tradingLogic: {
    entryConditions: string[];
    exitConditions: string[];
    riskManagement: string[];
  };
}

export class PineScriptParser {
  // Common Pine Script patterns to identify
  private static readonly PARAMETER_PATTERNS = {
    // Input declarations
    input: /input(?:\.(?:int|float|bool|string))?\s*\(\s*(?:title\s*=\s*)?["']([^"']+)["'](?:.*?defval\s*=\s*([^,)]+))?/gi,
    
    // Variable declarations
    variable: /(\w+)\s*=\s*input(?:\.(?:int|float|bool|string))?\s*\([^)]+\)/gi,
    
    // RSI indicators
    rsi: /rsi\s*\(\s*[^,]+,\s*(\d+)\s*\)/gi,
    
    // Moving averages
    sma: /sma\s*\(\s*[^,]+,\s*(\d+)\s*\)/gi,
    ema: /ema\s*\(\s*[^,]+,\s*(\d+)\s*\)/gi,
    
    // Bollinger Bands
    bollinger: /bb\s*\(\s*[^,]+,\s*(\d+),\s*([\d.]+)\s*\)/gi,
    
    // Stop loss and take profit
    stopLoss: /stop[_-]?loss|sl/gi,
    takeProfit: /take[_-]?profit|tp/gi,
    
    // Entry/exit conditions
    longCondition: /long[_-]?condition|buy[_-]?condition/gi,
    shortCondition: /short[_-]?condition|sell[_-]?condition/gi,
    
    // Strategy calls
    strategyEntry: /strategy\.entry\s*\(/gi,
    strategyExit: /strategy\.(?:exit|close)\s*\(/gi,
  };

  static parse(pineScriptCode: string): ParsedPineStrategy {
    const cleanCode = this.cleanCode(pineScriptCode);
    
    return {
      strategyType: this.detectStrategyType(cleanCode),
      timeframe: this.extractTimeframe(cleanCode),
      parameters: this.extractParameters(cleanCode),
      indicators: this.extractIndicators(cleanCode),
      tradingLogic: this.extractTradingLogic(cleanCode),
    };
  }

  private static cleanCode(code: string): string {
    // Remove comments and normalize whitespace
    return code
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private static detectStrategyType(code: string): 'RSI' | 'Fibonacci' | 'AI_Momentum' | 'Custom' {
    const codeUpper = code.toUpperCase();
    
    if (codeUpper.includes('RSI') && codeUpper.includes('OVERBOUGHT')) {
      return 'RSI';
    }
    if (codeUpper.includes('FIBONACCI') || codeUpper.includes('FIB')) {
      return 'Fibonacci';
    }
    if (codeUpper.includes('MOMENTUM') || codeUpper.includes('MACD')) {
      return 'AI_Momentum';
    }
    
    return 'Custom';
  }

  private static extractTimeframe(code: string): string {
    // Look for timeframe specifications
    const timeframePattern = /timeframe\s*[=:]\s*["']([^"']+)["']/gi;
    const match = timeframePattern.exec(code);
    
    if (match) {
      return match[1];
    }
    
    // Default timeframe
    return '1h';
  }

  private static extractParameters(code: string): PineScriptParameter[] {
    const parameters: PineScriptParameter[] = [];
    
    // Extract input parameters
    const inputMatches = [...code.matchAll(this.PARAMETER_PATTERNS.input)];
    
    for (const match of inputMatches) {
      const title = match[1];
      const defaultValue = match[2] || '';
      
      parameters.push(this.createParameter(title, defaultValue, code));
    }

    // Extract common trading parameters if not found in inputs
    this.addCommonParameters(parameters, code);
    
    return parameters;
  }

  private static createParameter(
    name: string, 
    value: string, 
    code: string
  ): PineScriptParameter {
    const param: PineScriptParameter = {
      name: this.normalizeParameterName(name),
      type: this.detectParameterType(value),
      category: this.categorizeParameter(name, code),
      currentValue: value.trim(),
      originalValue: value.trim(),
      isOptimizable: this.isOptimizable(name),
      priority: this.getPriority(name),
      description: name,
      marketAdjustments: {
        volatility: this.shouldAdjustForVolatility(name),
        volume: this.shouldAdjustForVolume(name),
        momentum: this.shouldAdjustForMomentum(name),
      },
    };

    // Set min/max values based on parameter type
    this.setParameterBounds(param);
    
    return param;
  }

  private static normalizeParameterName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private static detectParameterType(value: string): 'integer' | 'float' | 'boolean' | 'string' {
    if (value === 'true' || value === 'false') return 'boolean';
    if (/^\d+$/.test(value)) return 'integer';
    if (/^\d+\.\d+$/.test(value)) return 'float';
    return 'string';
  }

  private static categorizeParameter(name: string, code: string): PineScriptParameter['category'] {
    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('RSI') || nameUpper.includes('PERIOD') || nameUpper.includes('LENGTH')) {
      return 'indicator';
    }
    if (nameUpper.includes('STOP') || nameUpper.includes('RISK') || nameUpper.includes('SIZE')) {
      return 'risk_management';
    }
    if (nameUpper.includes('EXIT') || nameUpper.includes('CLOSE') || nameUpper.includes('TAKE')) {
      return 'exit';
    }
    if (nameUpper.includes('TIMEFRAME') || nameUpper.includes('INTERVAL')) {
      return 'timeframe';
    }
    
    return 'entry';
  }

  private static isOptimizable(name: string): boolean {
    const nameUpper = name.toUpperCase();
    
    // These parameters are typically good for optimization
    const optimizableKeywords = [
      'PERIOD', 'LENGTH', 'RSI', 'OVERBOUGHT', 'OVERSOLD',
      'STOP', 'TAKE', 'PROFIT', 'LOSS', 'THRESHOLD'
    ];
    
    return optimizableKeywords.some(keyword => nameUpper.includes(keyword));
  }

  private static getPriority(name: string): 1 | 2 | 3 {
    const nameUpper = name.toUpperCase();
    
    // High priority parameters (most impact on performance)
    if (['RSI', 'PERIOD', 'OVERBOUGHT', 'OVERSOLD'].some(k => nameUpper.includes(k))) {
      return 1;
    }
    
    // Medium priority
    if (['STOP', 'TAKE', 'PROFIT'].some(k => nameUpper.includes(k))) {
      return 2;
    }
    
    // Low priority
    return 3;
  }

  private static shouldAdjustForVolatility(name: string): boolean {
    const nameUpper = name.toUpperCase();
    return ['STOP', 'LOSS', 'BAND', 'THRESHOLD'].some(k => nameUpper.includes(k));
  }

  private static shouldAdjustForVolume(name: string): boolean {
    const nameUpper = name.toUpperCase();
    return ['PERIOD', 'LENGTH', 'TIMEFRAME'].some(k => nameUpper.includes(k));
  }

  private static shouldAdjustForMomentum(name: string): boolean {
    const nameUpper = name.toUpperCase();
    return ['RSI', 'OVERBOUGHT', 'OVERSOLD', 'MOMENTUM'].some(k => nameUpper.includes(k));
  }

  private static setParameterBounds(param: PineScriptParameter): void {
    const nameUpper = param.name.toUpperCase();
    
    if (nameUpper.includes('rsi')) {
      if (nameUpper.includes('period')) {
        param.minValue = '2';
        param.maxValue = '50';
      } else if (nameUpper.includes('overbought')) {
        param.minValue = '60';
        param.maxValue = '90';
      } else if (nameUpper.includes('oversold')) {
        param.minValue = '10';
        param.maxValue = '40';
      }
    }
    
    if (nameUpper.includes('stop') && nameUpper.includes('loss')) {
      param.minValue = '0.5';
      param.maxValue = '10.0';
    }
    
    if (nameUpper.includes('take') && nameUpper.includes('profit')) {
      param.minValue = '1.0';
      param.maxValue = '20.0';
    }
  }

  private static addCommonParameters(parameters: PineScriptParameter[], code: string): void {
    const existingNames = new Set(parameters.map(p => p.name));
    
    // Add common RSI parameters if RSI is detected but parameters aren't explicit
    if (code.toUpperCase().includes('RSI') && !existingNames.has('rsi_period')) {
      parameters.push({
        name: 'rsi_period',
        type: 'integer',
        category: 'indicator',
        currentValue: '14',
        originalValue: '14',
        minValue: '2',
        maxValue: '50',
        isOptimizable: true,
        priority: 1,
        description: 'RSI Period',
        marketAdjustments: { volatility: false, volume: true, momentum: true },
      });
    }
    
    // Add overbought/oversold if RSI exists but thresholds aren't defined
    if (code.toUpperCase().includes('RSI')) {
      if (!existingNames.has('rsi_overbought')) {
        parameters.push({
          name: 'rsi_overbought',
          type: 'integer',
          category: 'entry',
          currentValue: '70',
          originalValue: '70',
          minValue: '60',
          maxValue: '90',
          isOptimizable: true,
          priority: 1,
          description: 'RSI Overbought Level',
          marketAdjustments: { volatility: true, volume: false, momentum: true },
        });
      }
      
      if (!existingNames.has('rsi_oversold')) {
        parameters.push({
          name: 'rsi_oversold',
          type: 'integer',
          category: 'entry',
          currentValue: '30',
          originalValue: '30',
          minValue: '10',
          maxValue: '40',
          isOptimizable: true,
          priority: 1,
          description: 'RSI Oversold Level',
          marketAdjustments: { volatility: true, volume: false, momentum: true },
        });
      }
    }
  }

  private static extractIndicators(code: string): string[] {
    const indicators: string[] = [];
    const codeUpper = code.toUpperCase();
    
    const indicatorList = [
      'RSI', 'SMA', 'EMA', 'MACD', 'BOLLINGER', 'ATR', 
      'STOCHASTIC', 'CCI', 'WILLIAMS', 'MFI', 'ADX'
    ];
    
    for (const indicator of indicatorList) {
      if (codeUpper.includes(indicator)) {
        indicators.push(indicator);
      }
    }
    
    return indicators;
  }

  private static extractTradingLogic(code: string): {
    entryConditions: string[];
    exitConditions: string[];
    riskManagement: string[];
  } {
    const entryConditions: string[] = [];
    const exitConditions: string[] = [];
    const riskManagement: string[] = [];
    
    // Extract entry conditions
    const longMatches = [...code.matchAll(/long[_\s]*condition[^=]*=([^;]+)/gi)];
    const shortMatches = [...code.matchAll(/short[_\s]*condition[^=]*=([^;]+)/gi)];
    
    entryConditions.push(...longMatches.map(m => `Long: ${m[1].trim()}`));
    entryConditions.push(...shortMatches.map(m => `Short: ${m[1].trim()}`));
    
    // Extract exit conditions
    const exitMatches = [...code.matchAll(/strategy\.(exit|close)[^)]+\)/gi)];
    exitConditions.push(...exitMatches.map(m => m[0]));
    
    // Extract risk management
    if (code.includes('stop_loss') || code.includes('sl')) {
      riskManagement.push('Stop Loss Implementation');
    }
    if (code.includes('take_profit') || code.includes('tp')) {
      riskManagement.push('Take Profit Implementation');
    }
    if (code.includes('position_size') || code.includes('qty')) {
      riskManagement.push('Position Sizing');
    }
    
    return { entryConditions, exitConditions, riskManagement };
  }

  // Utility method to validate Pine Script syntax (basic)
  static validateSyntax(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for basic Pine Script structure
    if (!code.includes('//@version=') && !code.includes('//@ version=')) {
      errors.push('Missing Pine Script version declaration');
    }
    
    if (!code.includes('strategy(') && !code.includes('indicator(')) {
      errors.push('Missing strategy() or indicator() declaration');
    }
    
    // Check for balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Example Pine Script for testing
export const EXAMPLE_RSI_STRATEGY = `
//@version=5
strategy("Enhanced RSI Strategy", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=10)

// Input Parameters
rsi_period = input.int(14, title="RSI Period", minval=2, maxval=50)
rsi_overbought = input.int(70, title="RSI Overbought", minval=60, maxval=90)
rsi_oversold = input.int(30, title="RSI Oversold", minval=10, maxval=40)
stop_loss_pct = input.float(2.0, title="Stop Loss %", minval=0.5, maxval=10.0)
take_profit_pct = input.float(4.0, title="Take Profit %", minval=1.0, maxval=20.0)

// Calculate RSI
rsi = ta.rsi(close, rsi_period)

// Entry Conditions
long_condition = rsi < rsi_oversold and rsi[1] >= rsi_oversold
short_condition = rsi > rsi_overbought and rsi[1] <= rsi_overbought

// Strategy Execution
if long_condition
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=close * (1 - stop_loss_pct/100), limit=close * (1 + take_profit_pct/100))

if short_condition
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=close * (1 + stop_loss_pct/100), limit=close * (1 - take_profit_pct/100))

// Plot RSI
plot(rsi, title="RSI", color=color.blue)
hline(rsi_overbought, "Overbought", color=color.red)
hline(rsi_oversold, "Oversold", color=color.green)
`;