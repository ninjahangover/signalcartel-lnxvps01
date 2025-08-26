'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, Cpu, Zap, Target, Eye, Database, Layers, Network,
  TrendingUp, Activity, Users, Globe, Smartphone, Coins,
  CheckCircle, ArrowRight, ChevronRight, Play, Pause,
  BarChart3, PieChart, LineChart, Workflow
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface SentimentData {
  confidence: number;
  sourceCount: number;
}

interface FlowStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  processingTime: string;
  status: 'pending' | 'processing' | 'complete';
  details: string[];
}

interface DecisionNode {
  id: string;
  label: string;
  type: 'input' | 'process' | 'decision' | 'output';
  icon: React.ReactNode;
  color: string;
  position: { x: number; y: number };
  connections: string[];
}

const QuantumBrainFlow: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    confidence: 0,
    sourceCount: 0
  });

  // Animated flow stages
  const flowStages: FlowStage[] = [
    {
      id: 'data-ingestion',
      title: 'Multi-Source Data Ingestion',
      description: 'Collecting real-time sentiment from 47 sources',
      icon: <Database className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      processingTime: '340ms',
      status: 'pending',
      details: [
        'Twitter/X sentiment analysis',
        'Reddit community discussions', 
        'On-chain whale movements',
        'Fear & Greed Index',
        'News sentiment analysis'
      ]
    },
    {
      id: 'gpu-processing',
      title: 'GPU-Accelerated NLP',
      description: 'CUDA-powered sentiment classification',
      icon: <Cpu className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      processingTime: '180ms',
      status: 'pending',
      details: [
        'Parallel tokenization',
        '2,847 keyword analysis',
        'Context-aware scoring',
        'Confidence calculation',
        'Multi-language support'
      ]
    },
    {
      id: 'intelligence-fusion',
      title: 'Sentiment Intelligence Fusion',
      description: 'Multi-source confidence weighting',
      icon: <Brain className="w-8 h-8" />,
      color: 'from-pink-500 to-red-500',
      processingTime: '95ms',
      status: 'pending',
      details: [
        'Source reliability scoring',
        'Conflict detection',
        'Bayesian inference',
        'Risk calibration',
        'Signal validation'
      ]
    },
    {
      id: 'portfolio-analysis',
      title: 'Current Portfolio Analysis',
      description: 'Analyzing existing positions & opportunities',
      icon: <PieChart className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      processingTime: '125ms',
      status: 'pending',
      details: [
        'Position sizing analysis',
        'Risk exposure calculation',
        'Correlation matrix',
        'Opportunity scoring',
        'Exit strategy validation'
      ]
    },
    {
      id: 'decision-synthesis',
      title: 'AI Decision Synthesis',
      description: 'Quantum probability calculation',
      icon: <Target className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      processingTime: '200ms',
      status: 'pending',
      details: [
        'Multi-factor decision matrix',
        'Expected value calculation',
        'Kelly Criterion sizing',
        'Market timing analysis',
        'Risk-reward optimization'
      ]
    },
    {
      id: 'quantum-brain',
      title: 'QUANTUM FORGE™ Brain',
      description: 'Learning & executing optimal trades',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      processingTime: '50ms',
      status: 'pending',
      details: [
        'Pattern recognition learning',
        'Historical performance analysis',
        'Adaptive strategy evolution',
        'Trade execution optimization',
        'Continuous improvement loop'
      ]
    }
  ];

  // Decision flow nodes for the network diagram
  const decisionNodes: DecisionNode[] = [
    {
      id: 'social-data',
      label: 'Social\nSentiment',
      type: 'input',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      position: { x: 50, y: 100 },
      connections: ['nlp-processor']
    },
    {
      id: 'onchain-data', 
      label: 'On-Chain\nMetrics',
      type: 'input',
      icon: <Coins className="w-5 h-5" />,
      color: 'bg-green-500',
      position: { x: 50, y: 200 },
      connections: ['nlp-processor']
    },
    {
      id: 'market-data',
      label: 'Market\nData',
      type: 'input', 
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-yellow-500',
      position: { x: 50, y: 300 },
      connections: ['nlp-processor']
    },
    {
      id: 'nlp-processor',
      label: 'GPU-NLP\nProcessor',
      type: 'process',
      icon: <Cpu className="w-5 h-5" />,
      color: 'bg-purple-500',
      position: { x: 200, y: 200 },
      connections: ['sentiment-fusion']
    },
    {
      id: 'sentiment-fusion',
      label: 'Sentiment\nFusion',
      type: 'process',
      icon: <Brain className="w-5 h-5" />,
      color: 'bg-pink-500',
      position: { x: 350, y: 200 },
      connections: ['decision-engine']
    },
    {
      id: 'portfolio-state',
      label: 'Current\nPortfolio',
      type: 'input',
      icon: <PieChart className="w-5 h-5" />,
      color: 'bg-emerald-500',
      position: { x: 350, y: 100 },
      connections: ['decision-engine']
    },
    {
      id: 'decision-engine',
      label: 'Decision\nEngine',
      type: 'decision',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-orange-500',
      position: { x: 500, y: 150 },
      connections: ['quantum-brain']
    },
    {
      id: 'quantum-brain',
      label: 'QUANTUM\nBRAIN',
      type: 'output',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-red-500',
      position: { x: 650, y: 150 },
      connections: []
    }
  ];

  // Fetch real sentiment data
  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        const response = await fetch('/api/multi-source-sentiment?symbol=BTC');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Calculate confidence from sentiment data (convert 0-1 to percentage)
            const confidence = Math.round(data.data.confidence * 100);
            
            // Count active sources that returned data
            const sourceCount = data.data.sources ? data.data.sources.length : 0;
            
            setSentimentData({
              confidence: confidence > 0 ? confidence : 0,
              sourceCount: sourceCount > 0 ? sourceCount : 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch sentiment data:', error);
        // On error, show 0 values (no fallback fake data)
        setSentimentData({ confidence: 0, sourceCount: 0 });
      }
    };

    fetchSentimentData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchSentimentData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Animation control
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStage((prev) => {
          const nextStage = (prev + 1) % flowStages.length;
          return nextStage;
        });
      }, 2000); // 2 seconds per stage
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, flowStages.length]);

  // Update stage statuses based on current stage
  const getUpdatedStages = () => {
    return flowStages.map((stage, index) => ({
      ...stage,
      status: index < currentStage ? 'complete' as const :
              index === currentStage ? 'processing' as const :
              'pending' as const
    }));
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing': return <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />;
      case 'pending': return <div className="w-5 h-5 bg-gray-600 rounded-full opacity-50" />;
      default: return <div className="w-5 h-5 bg-gray-600 rounded-full" />;
    }
  };

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentStage(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Animation Controls */}
      <Card className="bg-gray-900 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Workflow className="w-6 h-6 text-purple-400" />
              <span>QUANTUM FORGE™ Decision Flow</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleAnimation}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Watch Flow'}
              </Button>
              <Button
                onClick={() => setShowConnections(!showConnections)}
                variant="outline" 
                size="sm"
                className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
              >
                <Network className="w-4 h-4 mr-2" />
                {showConnections ? 'Hide' : 'Show'} Network
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Animated Flow Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getUpdatedStages().map((stage, index) => (
          <Card 
            key={stage.id}
            className={`bg-gray-900 border transition-all duration-500 ${
              stage.status === 'processing' ? 'border-purple-500 shadow-lg shadow-purple-500/25' :
              stage.status === 'complete' ? 'border-green-500/50' :
              'border-gray-700'
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stage.color}`}>
                    {stage.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{stage.title}</div>
                    <div className="text-sm text-gray-400">{stage.description}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {getStatusIcon(stage.status)}
                  <Badge className="bg-gray-700 text-gray-300 text-xs">
                    {stage.processingTime}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stage.details.map((detail, detailIndex) => (
                  <div 
                    key={detailIndex}
                    className={`flex items-center space-x-2 text-sm transition-opacity duration-300 ${
                      stage.status === 'processing' ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      stage.status === 'complete' ? 'bg-green-400' :
                      stage.status === 'processing' ? 'bg-purple-400 animate-pulse' :
                      'bg-gray-600'
                    }`} />
                    <span className="text-gray-300">{detail}</span>
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    stage.status === 'complete' ? 'w-full bg-green-500' :
                    stage.status === 'processing' ? 'w-3/4 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse' :
                    'w-0 bg-gray-600'
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Network Flow Diagram */}
      {showConnections && (
        <Card className="bg-gray-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Network className="w-6 h-6 text-cyan-400" />
              <span>Decision Network Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 bg-gray-800 rounded-lg p-6 overflow-hidden">
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {decisionNodes.map(node => 
                  node.connections.map(connectionId => {
                    const targetNode = decisionNodes.find(n => n.id === connectionId);
                    if (!targetNode) return null;
                    
                    return (
                      <line
                        key={`${node.id}-${connectionId}`}
                        x1={node.position.x + 40}
                        y1={node.position.y + 20}
                        x2={targetNode.position.x + 40}
                        y2={targetNode.position.y + 20}
                        stroke="rgb(147, 51, 234)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />
                    );
                  })
                )}
              </svg>
              
              {/* Decision Nodes */}
              {decisionNodes.map(node => (
                <div
                  key={node.id}
                  className="absolute flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-110"
                  style={{ 
                    left: node.position.x, 
                    top: node.position.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`${node.color} p-3 rounded-full shadow-lg`}>
                    {node.icon}
                  </div>
                  <div className="text-xs text-center text-gray-300 font-medium whitespace-pre-line">
                    {node.label}
                  </div>
                </div>
              ))}
              
              {/* Animated Data Flow Particles */}
              {isPlaying && (
                <div className="absolute inset-0">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-purple-400 rounded-full animate-ping"
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${40 + (i * 5)}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: '2s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-Time Metrics */}
      <Card className="bg-gradient-to-r from-gray-900 via-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {isPlaying ? (currentStage + 1) : '6'}
              </div>
              <div className="text-sm text-gray-400">Active Stages</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">940ms</div>
              <div className="text-sm text-gray-400">Total Processing</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-400 mb-1">
                {sentimentData.confidence}%
              </div>
              <div className="text-sm text-gray-400">Decision Confidence</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-1">
                {sentimentData.sourceCount}
              </div>
              <div className="text-sm text-gray-400">Data Sources</div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <div className="text-lg text-gray-300 mb-2">
              Powered by <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">QUANTUM FORGE™</span> Decision Intelligence
            </div>
            <div className="text-sm text-gray-500">
              Real-time multi-source sentiment fusion with GPU-accelerated neural processing
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantumBrainFlow;