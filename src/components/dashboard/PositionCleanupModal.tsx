"use client";

import { useState } from 'react';
import { AlertTriangle, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface OpenPosition {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  strategy?: string;
}

interface PositionCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (closePositions: boolean) => void;
  openPositions: OpenPosition[];
  strategyName: string;
}

export default function PositionCleanupModal({
  isOpen,
  onClose,
  onProceed,
  openPositions,
  strategyName
}: PositionCleanupModalProps) {
  const [selectedAction, setSelectedAction] = useState<'close' | 'keep' | null>(null);

  if (!isOpen) return null;

  const totalUnrealizedPnL = openPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Open Positions Detected</h2>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  🧪 TESTING PHASE
                </span>
              </div>
              <p className="text-gray-600">Strategy: {strategyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="p-6 bg-amber-50 border-l-4 border-amber-500 mx-6 mt-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Clean Testing Environment Required</h3>
              <p className="text-amber-700 text-sm mt-1">
                Open positions can skew testing metrics and affect AI optimization accuracy. 
                For reliable results, we recommend starting with a clean slate.
              </p>
            </div>
          </div>
        </div>

        {/* Open Positions List */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Current Open Positions ({openPositions.length})</h3>
          
          <div className="space-y-3 mb-6">
            {openPositions.map((position) => (
              <div key={position.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      position.side === 'buy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{position.pair}</div>
                      <div className="text-sm text-gray-500">
                        {position.side.toUpperCase()} {position.quantity}
                        {position.strategy && ` • ${position.strategy}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Entry: ${position.entryPrice.toFixed(2)} → Current: ${position.currentPrice.toFixed(2)}
                    </div>
                    <div className={`font-semibold ${
                      position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total P&L Summary */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Total Unrealized P&L:</span>
              <span className={`text-lg font-bold ${
                totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Choose Action:</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="close"
                  checked={selectedAction === 'close'}
                  onChange={(e) => setSelectedAction(e.target.value as 'close')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    Close All Open Positions (Recommended)
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Closes all open positions at market price to start with clean metrics. 
                    Ensures accurate win rate and P&L tracking for new strategy testing.
                  </p>
                  <div className="text-xs text-amber-600 mt-2">
                    ⚠️ This will realize current P&L: {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="keep"
                  checked={selectedAction === 'keep'}
                  onChange={(e) => setSelectedAction(e.target.value as 'keep')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Keep Open Positions
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Proceed with testing while keeping current positions open. 
                    Note: This may affect testing accuracy and AI optimization.
                  </p>
                  <div className="text-xs text-amber-600 mt-2">
                    ⚠️ Win rates and metrics may be skewed by existing positions
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => onProceed(selectedAction === 'close')}
              disabled={!selectedAction}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                selectedAction
                  ? 'bg-gold-500 hover:bg-gold-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedAction === 'close' ? 'Close Positions & Start Testing' : 
               selectedAction === 'keep' ? 'Keep Positions & Start Testing' : 
               'Select Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}