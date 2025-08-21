"use client";

import { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  BarChart3, 
  Brain,
  TrendingUp,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  TestTube,
  DollarSign
} from 'lucide-react';
import { Card } from './ui/card';

interface GuideStep {
  id: string;
  phase: 'testing' | 'live';
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  details: string[];
}

export default function PositionManagementGuide() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'testing' | 'live'>('all');

  const steps: GuideStep[] = [
    {
      id: 'check-positions',
      phase: 'testing',
      title: 'Pre-Test Check',
      description: 'System automatically checks for open positions when you click "Start Clean Testing"',
      action: 'Automated position detection',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      details: [
        'Scans all connected trading accounts for open positions',
        'Identifies position types: long, short, pending orders',
        'Calculates total unrealized P&L across all positions',
        'Shows position details: pair, quantity, entry price, current P&L'
      ]
    },
    {
      id: 'user-decision',
      phase: 'testing',
      title: 'User Decision Modal',
      description: 'Modal appears asking whether to close existing positions or keep them',
      action: 'Choose your approach',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      details: [
        'Close All Positions: Recommended for clean testing metrics',
        'Keep Positions: Proceed with current positions (may affect accuracy)',
        'View detailed position breakdown with P&L impact',
        'See total realized P&L if positions are closed'
      ]
    },
    {
      id: 'clean-slate',
      phase: 'testing',
      title: 'Clean Slate Option',
      description: 'Close all positions to start with accurate baseline metrics',
      action: 'Market close all positions',
      icon: <TestTube className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      details: [
        'Sends market orders to close all open positions',
        'Realizes current P&L (profit or loss)',
        'Provides clean starting point for strategy testing',
        'Enables accurate win rate and performance calculations'
      ]
    },
    {
      id: 'start-testing',
      phase: 'testing',
      title: 'Begin Strategy Testing',
      description: 'Start testing with known baseline and track clean metrics',
      action: 'Initiate clean testing session',
      icon: <Play className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      details: [
        'Creates new clean testing session with session ID',
        'Tracks all trades from clean starting point',
        'Calculates accurate metrics: win rate, profit factor, drawdown',
        'Provides real-time performance updates during testing'
      ]
    },
    {
      id: 'live-no-interference',
      phase: 'live',
      title: 'NO Auto-Reversal',
      description: 'Live trading positions stay open based on strategy logic only',
      action: 'Natural position flow',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      details: [
        'No automatic position closures in live trading',
        'Positions managed by Pine Script strategy logic',
        'Stop loss and take profit levels control exits',
        'Preserves natural trading behavior and performance'
      ]
    },
    {
      id: 'strategy-controlled',
      phase: 'live',
      title: 'Strategy-Controlled',
      description: 'Only the Pine Script strategy decides when to close positions',
      action: 'Pine Script logic manages exits',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      details: [
        'Entry and exit signals from TradingView alerts',
        'Stop loss and take profit levels honored',
        'Risk management rules applied consistently',
        'No manual intervention in position management'
      ]
    },
    {
      id: 'ai-enhanced',
      phase: 'live',
      title: 'AI-Enhanced Trading',
      description: 'Stratus Engine AI algorithms optimize entry/exit timing',
      action: 'Continuous optimization',
      icon: <Brain className="w-5 h-5" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      details: [
        'AI analyzes market conditions for optimal timing',
        'Dynamic parameter adjustment based on performance',
        'Learning from successful and failed trades',
        'Adaptive strategies for different market regimes'
      ]
    },
    {
      id: 'natural-flow',
      phase: 'live',
      title: 'Natural Trading Flow',
      description: 'Positions close when stop loss, take profit, or strategy signals trigger',
      action: 'Organic position lifecycle',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      details: [
        'Market-driven position closures only',
        'Respects all risk management parameters',
        'Maintains trading discipline and consistency',
        'Builds genuine long-term performance track record'
      ]
    }
  ];

  const benefits = [
    {
      title: 'Clean Testing Metrics',
      description: 'Accurate win rates and P&L calculations from known starting point',
      icon: <BarChart3 className="w-5 h-5 text-green-600" />
    },
    {
      title: 'User Control',
      description: 'You decide whether to close existing positions before testing',
      icon: <CheckCircle className="w-5 h-5 text-blue-600" />
    },
    {
      title: 'Real Trading Integrity',
      description: 'No interference with actual position management in live trading',
      icon: <Shield className="w-5 h-5 text-red-600" />
    },
    {
      title: 'AI Learning',
      description: 'Clean data enables AI to learn from complete trade cycles',
      icon: <Brain className="w-5 h-5 text-purple-600" />
    }
  ];

  const userWorkflow = [
    'Click "Start Clean Testing" on any strategy',
    'If open positions exist → Modal appears asking what to do',
    'Choose: "Close positions for clean testing" OR "Keep positions and proceed"',
    'System proceeds with your choice',
    'AI learns from complete, clean trade data'
  ];

  const filteredSteps = selectedPhase === 'all' ? steps : steps.filter(step => step.phase === selectedPhase);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-gold-600" />
          <h1 className="text-3xl font-bold text-gray-900">Position Management Protocol</h1>
        </div>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
          Complete workflow for managing positions during strategy testing and live trading phases
        </p>
      </div>

      {/* Phase Filter */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setSelectedPhase('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedPhase === 'all'
              ? 'bg-gold-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Phases
        </button>
        <button
          onClick={() => setSelectedPhase('testing')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedPhase === 'testing'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🧪 Testing Phase
        </button>
        <button
          onClick={() => setSelectedPhase('live')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedPhase === 'live'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🚀 Live Trading Phase
        </button>
      </div>

      {/* Protocol Steps */}
      <div className="grid gap-4">
        {filteredSteps.map((step, index) => (
          <Card key={step.id} className="overflow-hidden">
            <div
              className={`${step.bgColor} p-4 cursor-pointer`}
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${step.color}`}>
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        step.phase === 'testing' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {step.phase === 'testing' ? '🧪 TESTING' : '🚀 LIVE TRADING'}
                      </span>
                    </div>
                    <p className="text-gray-700">{step.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Action:</strong> {step.action}
                    </p>
                  </div>
                </div>
                <div className="text-gray-500">
                  {expandedStep === step.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
            </div>
            
            {expandedStep === step.id && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <h4 className="font-medium text-gray-900 mb-2">Details:</h4>
                <ul className="space-y-1">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Benefits Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">📊 The Benefits</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {benefit.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* User Workflow */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🎯 User Workflow</h2>
        <Card className="p-6">
          <div className="space-y-4">
            {userWorkflow.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gold-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{step}</p>
                  {index < userWorkflow.length - 1 && (
                    <div className="w-px h-6 bg-gray-300 ml-4 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary */}
      <div className="mt-12 p-6 bg-gradient-to-r from-gold-50 to-blue-50 border border-gold-200 rounded-xl">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-gold-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Perfect Balance: Clean Testing + Natural Live Trading
          </h3>
          <p className="text-gray-700 max-w-4xl mx-auto">
            This gives you both <strong>accurate testing</strong> AND <strong>natural live trading behavior</strong>. 
            The position cleanup is purely for testing accuracy, not for interfering with your actual trading strategy logic.
          </p>
        </div>
      </div>
    </div>
  );
}