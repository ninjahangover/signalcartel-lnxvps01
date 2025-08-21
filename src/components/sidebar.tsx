"use client";

import React, { useState } from 'react';
import { 
  BarChart3, 
  Settings, 
  User, 
  TrendingUp, 
  Target, 
  TestTube, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
  FileCode
} from 'lucide-react';
import { Badge } from './ui/badge';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isKrakenConnected: boolean;
  engineStatus?: {
    isRunning: boolean;
    activeStrategies: number;
    totalAlerts: number;
  };
}

const menuItems = [
  { 
    id: 'auth', 
    label: 'API Connection', 
    icon: Settings, 
    description: 'Connect Kraken API' 
  },
  { 
    id: 'account', 
    label: 'Account', 
    icon: User, 
    description: 'Portfolio & Balance' 
  },
  { 
    id: 'trading', 
    label: 'Live Trading', 
    icon: BarChart3, 
    description: 'Charts & Markets' 
  },
  { 
    id: 'strategies', 
    label: 'Pine Strategies', 
    icon: FileCode, 
    description: 'Manage & Optimize' 
  },
  { 
    id: 'stratus', 
    label: 'Stratus Engine', 
    icon: Zap, 
    description: 'AI Strategy Engine' 
  },
  { 
    id: 'testing', 
    label: 'Strategy Testing', 
    icon: TestTube, 
    description: 'Test & Configure' 
  }
];

export default function Sidebar({ 
  currentPage, 
  onPageChange, 
  isKrakenConnected,
  engineStatus 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } min-h-screen flex flex-col`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">Signal Cartel</h1>
              <p className="text-xs text-gray-400">Trading Platform</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-4 border-b border-gray-700">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Kraken API</span>
              <Badge variant={isKrakenConnected ? "default" : "secondary"} className="text-xs">
                {isKrakenConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            {engineStatus && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Engine</span>
                <Badge variant={engineStatus.isRunning ? "default" : "secondary"} className="text-xs">
                  {engineStatus.isRunning ? "Active" : "Stopped"}
                </Badge>
              </div>
            )}
            
            {engineStatus && engineStatus.isRunning && (
              <div className="text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Strategies:</span>
                  <span className="text-green-400">{engineStatus.activeStrategies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alerts:</span>
                  <span className="text-blue-400">{engineStatus.totalAlerts}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-3 h-3 rounded-full ${isKrakenConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
            {engineStatus && (
              <div className={`w-3 h-3 rounded-full ${engineStatus.isRunning ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-xs text-gray-400 truncate">{item.description}</div>
                  </div>
                )}
                
                {/* Active indicator */}
                {isActive && !isCollapsed && (
                  <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="text-center">
            <div className="text-xs text-gray-400">
              Stratus Engine v1.0
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Real-time Trading AI
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Activity size={16} className="text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}