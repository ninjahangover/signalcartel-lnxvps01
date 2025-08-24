"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UnifiedDashboard from '../../components/dashboard/UnifiedDashboard';

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isKrakenConnected, setIsKrakenConnected] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and subscription status
  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('Dashboard: Checking access...', { status, session });
        
        if (status === "loading") return;
        
        if (!session) {
          console.log('Dashboard: No session found, redirecting to login');
          router.push('/auth/login?message=login_required');
          return;
        }

        console.log('Dashboard: Session found:', {
          email: session.user?.email,
          role: session.user?.role,
          subscriptionTier: session.user?.subscriptionTier
        });

        // Super admin and admin users always have access
        if (session.user.role === 'super_admin' || session.user.role === 'admin') {
          console.log('Dashboard: Admin user detected, granting access');
          setSubscriptionStatus({
            hasAccess: true,
            user: {
              role: session.user.role,
              subscriptionTier: session.user.subscriptionTier || 'ultra_elite',
              subscriptionStatus: 'active',
              apiKeysVerified: true
            }
          });
          setLoading(false);
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
        setError('Failed to verify access. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [session, status, router]);

  const handleKrakenConnectionChange = (connected: boolean) => {
    setIsKrakenConnected(connected);
  };


  // Show loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading QUANTUM FORGE™ Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-red-900/30 to-purple-900/30 p-8 rounded-xl border border-red-500/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">QUANTUM FORGE™ Access Error</h1>
            <p className="text-red-300 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/auth/login" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Login Again
              </Link>
              <Link 
                href="/" 
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription required state
  if (subscriptionStatus && !subscriptionStatus.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-8 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">💎</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">QUANTUM FORGE™ Access Required</h1>
            <p className="text-gray-300 mb-6">
              You need an active subscription to access the QUANTUM FORGE™ trading platform. Upgrade to experience the AI revolution.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/pricing" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                View Pricing
              </Link>
              <Link 
                href="/" 
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login required state (shouldn't happen due to middleware, but just in case)
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-8 rounded-xl border border-cyan-400/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">QUANTUM FORGE™ Login Required</h1>
            <p className="text-gray-300 mb-6">
              Please log in to access your QUANTUM FORGE™ trading dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/auth/login" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboard 
      isKrakenConnected={isKrakenConnected}
      onKrakenConnectionChange={handleKrakenConnectionChange}
    />
  );
}