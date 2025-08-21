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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-xl border border-red-200 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-red-600 font-bold text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/auth/login" 
                className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Login Again
              </Link>
              <Link 
                href="/" 
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-xl border border-gold-200 shadow-sm">
            <div className="w-16 h-16 bg-gold-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-gold-600 font-bold text-2xl">💎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h1>
            <p className="text-gray-600 mb-6">
              You need an active subscription to access the trading platform. Please upgrade to continue.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/pricing" 
                className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View Pricing
              </Link>
              <Link 
                href="/" 
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-xl border border-blue-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
            <p className="text-gray-600 mb-6">
              Please log in to access your trading dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/auth/login" 
                className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
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