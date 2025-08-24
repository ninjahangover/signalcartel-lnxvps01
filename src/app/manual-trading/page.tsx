"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ManualTradingDashboard from '@/components/manual-trading/ManualTradingDashboard';

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

export default function ManualTradingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Check subscription status
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/check');
        const result = await response.json();
        
        if (!result.hasAccess) {
          router.push('/pricing');
          return;
        }
        
        setSubscriptionStatus(result);
      } catch (error) {
        console.error('Subscription check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Loading QUANTUM FORGE™ Manual Trading...
          </p>
          <div className="text-gray-400">Verifying premium access...</div>
        </div>
      </div>
    );
  }

  if (!session || !subscriptionStatus?.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-red-900/30 to-purple-900/30 p-8 rounded-xl border border-red-500/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4">QUANTUM FORGE™ Access Required</h1>
            <p className="text-gray-300 mb-6">
              Manual Trading requires premium QUANTUM FORGE™ access. Please authenticate or upgrade your subscription.
            </p>
            <div className="text-yellow-300 text-sm">
              Redirecting to authentication...
            </div>
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
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              QUANTUM FORGE™
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-green-400 font-semibold">
              {session.user?.email}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="p-6">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎯 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">MANUAL TRADING</span>
            </h1>
            <div className="text-xl text-blue-300 mb-2">
              Human Wisdom + AI Precision = Extraordinary Results
            </div>
            <div className="text-green-400 font-semibold">
              🟢 LIVE DATA • GPU ACCELERATED • NEURAL ENHANCED
            </div>
          </div>
          
          {/* User Info */}
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-4 mb-6 text-center">
            <div className="text-white font-bold">
              🎯 QUANTUM FORGE™ Manual Trading • Premium Member: {session.user?.email}
            </div>
            <div className="text-pink-300 text-sm mt-1">
              Execute trades with AI-enhanced analysis and real-time market intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Trading Dashboard Component */}
      <div className="px-6 pb-6">
        <div className="container mx-auto">
          <ManualTradingDashboard />
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
              Every trade is an opportunity to create financial freedom for deserving families
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}