'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, Cpu, Zap, Target, Eye, Database, Layers, Network,
  TrendingUp, Activity, Users, Globe, Smartphone, Coins,
  CheckCircle, ArrowRight, ChevronRight, Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface IntelligenceMetric {
  category: string;
  icon: React.ReactNode;
  metrics: Array<{
    name: string;
    value: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

interface ProcessingStage {
  stage: string;
  description: string;
  technologies: string[];
  processingTime: string;
  confidence: number;
  status: 'active' | 'processing' | 'complete';
}

const SystemIntelligenceShowcase: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulate real-time processing stages
  const processingStages: ProcessingStage[] = [
    {
      stage: "Multi-Source Data Ingestion",
      description: "Parallel data collection from 47 sentiment sources",
      technologies: ["Reddit API v2", "Twitter Graph API", "Blockchain.info", "Fear&Greed Index"],
      processingTime: "340ms",
      confidence: 94.2,
      status: "complete"
    },
    {
      stage: "NLP Sentiment Classification", 
      description: "Advanced keyword weighting with context analysis",
      technologies: ["GPU-Accelerated Processing", "Parallel Tokenization", "Sentiment Lexicons"],
      processingTime: "180ms",
      confidence: 89.7,
      status: "complete"
    },
    {
      stage: "On-Chain Pattern Recognition",
      description: "Whale movement detection and exchange flow analysis",
      technologies: ["Blockchain Analytics", "Wallet Clustering", "Transaction Pattern ML"],
      processingTime: "290ms",
      confidence: 96.1,
      status: "complete"
    },
    {
      stage: "Market Context Integration",
      description: "Macro trend analysis with volatility assessment",
      technologies: ["Technical Indicators", "Volume Analysis", "Correlation Matrix"],
      processingTime: "150ms", 
      confidence: 87.4,
      status: "complete"
    },
    {
      stage: "AI Decision Synthesis",
      description: "Multi-layered confidence scoring and signal generation",
      technologies: ["Neural Weighting", "Bayesian Inference", "Risk Calibration"],
      processingTime: "95ms",
      confidence: 92.8,
      status: "complete"
    }
  ];

  const intelligenceMetrics: IntelligenceMetric[] = [
    {
      category: "Data Sources",
      icon: <Database className="w-5 h-5 text-purple-400" />,
      metrics: [
        {
          name: "Social Media Channels",
          value: "14 Subreddits",
          description: "Real-time sentiment from crypto communities",
          impact: "high"
        },
        {
          name: "On-Chain Metrics", 
          value: "23 Indicators",
          description: "Whale movements, exchange flows, network activity",
          impact: "high"
        },
        {
          name: "Market Data Feeds",
          value: "8 Sources",
          description: "Price action, volume, volatility indicators",
          impact: "medium"
        },
        {
          name: "Economic Indicators",
          value: "12 Metrics",
          description: "Macro factors affecting crypto markets",
          impact: "medium"
        }
      ]
    },
    {
      category: "Processing Intelligence",
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      metrics: [
        {
          name: "GPU Acceleration",
          value: "CUDA 13.0",
          description: "Parallel sentiment processing at scale",
          impact: "high"
        },
        {
          name: "Keyword Analysis",
          value: "2,847 Terms",
          description: "Weighted sentiment lexicon with context",
          impact: "high"
        },
        {
          name: "Pattern Recognition",
          value: "Neural ML",
          description: "Learning from 13,000+ historical signals",
          impact: "high"
        },
        {
          name: "Real-time Updates",
          value: "30 Seconds",
          description: "Continuous market sentiment monitoring",
          impact: "medium"
        }
      ]
    },
    {
      category: "Decision Framework",
      icon: <Brain className="w-5 h-5 text-pink-400" />,
      metrics: [
        {
          name: "Confidence Scoring",
          value: "Multi-Layer",
          description: "Bayesian inference with uncertainty quantification",
          impact: "high"
        },
        {
          name: "Risk Assessment", 
          value: "Dynamic",
          description: "Real-time risk calibration based on market conditions",
          impact: "high"
        },
        {
          name: "Signal Validation",
          value: "Cross-Source",
          description: "Multi-source consensus for trade confirmation",
          impact: "high"
        },
        {
          name: "Adaptive Learning",
          value: "Continuous",
          description: "Performance feedback loop for system optimization",
          impact: "medium"
        }
      ]
    }
  ];

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; 
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing': return <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />;
      case 'active': return <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />;
      default: return <div className="w-4 h-4 bg-gray-600 rounded-full" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Processing Pipeline Visualization */}
      <Card className="bg-gray-900 border-purple-500/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          <CardTitle className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <span className="text-xl">QUANTUM FORGE™ Processing Pipeline</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Zap className="w-3 h-3 mr-1" />
              ACTIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Stages */}
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-300 mb-4">
                Real-Time Processing Stages
              </div>
              {processingStages.map((stage, index) => (
                <div 
                  key={index}
                  className="relative p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(stage.status)}
                      <span className="font-medium text-white">{stage.stage}</span>
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                        {stage.processingTime}
                      </Badge>
                    </div>
                    <span className="text-sm text-green-400 font-mono">
                      {stage.confidence.toFixed(1)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{stage.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {stage.technologies.map((tech, techIndex) => (
                      <Badge 
                        key={techIndex}
                        className="bg-gray-700 text-gray-300 text-xs border-gray-600"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 bg-gray-700 rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                      style={{ width: `${stage.confidence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* System Architecture Diagram */}
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-300 mb-4">
                Intelligence Architecture
              </div>
              
              <div className="relative p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                <div className="text-center space-y-4">
                  {/* Data Layer */}
                  <div className="flex justify-center space-x-4 mb-4">
                    {[
                      { icon: <Smartphone className="w-6 h-6" />, label: "Social", color: "text-blue-400" },
                      { icon: <Coins className="w-6 h-6" />, label: "On-Chain", color: "text-green-400" },
                      { icon: <Globe className="w-6 h-6" />, label: "Market", color: "text-yellow-400" },
                      { icon: <TrendingUp className="w-6 h-6" />, label: "Economic", color: "text-red-400" }
                    ].map((source, i) => (
                      <div key={i} className={`flex flex-col items-center space-y-1 ${source.color}`}>
                        <div className="p-2 bg-gray-700 rounded-lg">
                          {source.icon}
                        </div>
                        <span className="text-xs font-medium">{source.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Arrow Down */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-purple-400 rotate-90" />
                  </div>
                  
                  {/* Processing Layer */}
                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Cpu className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-purple-300">GPU-Accelerated NLP</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Parallel processing • Context analysis • Pattern recognition
                    </div>
                  </div>
                  
                  {/* Arrow Down */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-pink-400 rotate-90" />
                  </div>
                  
                  {/* Decision Layer */}
                  <div className="p-4 bg-pink-900/30 rounded-lg border border-pink-500/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-pink-400" />
                      <span className="font-semibold text-pink-300">AI Decision Engine</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Multi-source fusion • Risk assessment • Signal generation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intelligence Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {intelligenceMetrics.map((category, categoryIndex) => (
          <Card 
            key={categoryIndex}
            className="bg-gray-900 border-purple-500/30 hover:border-purple-500/50 transition-colors"
          >
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setExpandedSection(
                expandedSection === category.category ? null : category.category
              )}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span>{category.category}</span>
                </div>
                <ChevronRight 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSection === category.category ? 'rotate-90' : ''
                  }`}
                />
              </CardTitle>
            </CardHeader>
            
            {expandedSection === category.category && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {category.metrics.map((metric, metricIndex) => (
                    <div 
                      key={metricIndex}
                      className="p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-white text-sm">
                          {metric.name}
                        </span>
                        <Badge className={`text-xs ${getImpactColor(metric.impact)}`}>
                          {metric.impact.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-lg font-bold text-purple-400 mb-1">
                        {metric.value}
                      </div>
                      
                      <p className="text-xs text-gray-400">
                        {metric.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-gray-900 via-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardContent className="p-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-1">47</div>
              <div className="text-sm text-gray-400">Data Sources</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">1.6s</div>
              <div className="text-sm text-gray-400">Processing Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-400 mb-1">92.1%</div>
              <div className="text-sm text-gray-400">Avg Confidence</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-1">13K+</div>
              <div className="text-sm text-gray-400">Learning Dataset</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className="text-lg text-gray-300 mb-2">
              Powered by <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">QUANTUM FORGE™</span> Intelligence
            </div>
            <div className="text-sm text-gray-500">
              Multi-source sentiment fusion with GPU-accelerated machine learning
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemIntelligenceShowcase;