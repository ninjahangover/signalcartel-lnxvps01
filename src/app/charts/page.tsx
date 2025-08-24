"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LiveTradingChartDashboard from '@/components/dashboard/LiveTradingChartDashboard';

interface SubscriptionStatus {
  hasAccess: boolean;
  user: {
    role: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    subscriptionEndsAt?: string;
    apiKeysVerified: boolean;
  };
}

export default function ChartsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (status === "loading") return;
        
        if (!session) {
          router.push('/auth/login?message=login_required');
          return;
        }

        const response = await fetch('/api/subscription/check');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
          
          if (!data.hasAccess) {
            router.push('/pricing?message=subscription_required');
            return;
          }
        } else {
          throw new Error('Failed to check subscription status');
        }
      } catch (error) {
        console.error('Failed to check access:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [session, status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📈</div>
          <div className="text-white text-xl mb-2">QUANTUM FORGE™ Charts</div>
          <div className="text-gray-400">Loading live trading data...</div>
          <div className="mt-4">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !subscriptionStatus?.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="text-6xl mb-6">🔒</div>
          <div className="text-white text-3xl mb-4">Premium Charts Access Required</div>
          <div className="text-blue-300 text-xl mb-6">Live trading charts are exclusive to verified members</div>
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6 mb-6">
            <div className="text-pink-200 text-lg mb-4">
              Our live trading charts show real-time market data and AI trading decisions in action.
            </div>
            <div className="text-purple-200">
              Sign up for QUANTUM FORGE™ premium access to view live trading performance.
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/access" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all transform hover:scale-105">
              🎯 Request Access
            </Link>
            <Link href="/auth/login" className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold px-8 py-4 rounded-lg text-lg transition-all transform hover:scale-105">
              🔑 Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/signal.cartel.shield.trans.png" 
                alt="Signal Cartel Logo" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                QUANTUM FORGE™
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-300 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/manual-trading" className="text-purple-400 hover:text-purple-300 transition-colors">
              Trading
            </Link>
            <span className="text-green-400 font-bold">Charts</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="p-6">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              📈 <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">LIVE TRADING CHARTS</span>
            </h1>
            <div className="text-xl text-blue-300 mb-2">
              Real-time QUANTUM FORGE™ AI Trading Performance
            </div>
            <div className="text-green-400 font-semibold">
              🟢 LIVE DATA • 2,048 CUDA CORES • NEURAL ENHANCED
            </div>
          </div>
          
          {/* User Info */}
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-4 mb-6 text-center">
            <div className="text-white font-bold">
              🎯 QUANTUM FORGE™ Live Charts • Premium Member: {session.user?.email}
            </div>
            <div className="text-cyan-300 text-sm mt-1">
              Viewing real-time AI trading decisions and market analysis
            </div>
          </div>
        </div>
      </div>

      {/* Live Trading Charts Component */}
      <div className="px-6 pb-6">
        <div className="container mx-auto">
          <LiveTradingChartDashboard />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 p-6 bg-black/30">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-6 text-center">
            <div className="text-white font-bold text-xl mb-2">
              💝 "Money means nothing. Changing lives means EVERYTHING."
            </div>
            <div className="text-purple-200">
              Every chart represents real families we're helping through AI-enhanced trading
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}