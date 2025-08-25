"use client";

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import MathematicalIntuitionDashboard from '../../components/dashboard/MathematicalIntuitionDashboard';

export default function MathematicalIntuitionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === "loading") return;
      
      if (!session) {
        router.push('/auth/login?message=login_required');
        return;
      }

      // Check subscription status
      try {
        // Super admin and admin users always have access
        if (session.user.role === 'super_admin' || session.user.role === 'admin') {
          setHasAccess(true);
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/subscription/check');
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess) {
            setHasAccess(true);
          } else {
            router.push('/pricing?message=subscription_required');
            return;
          }
        } else {
          router.push('/pricing?message=subscription_required');
          return;
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
        router.push('/pricing?message=subscription_required');
        return;
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [session, status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading Mathematical Intuition Engine™...
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-8 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">🧠</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">Mathematical Intuition™ Access Required</h1>
            <p className="text-gray-300 mb-6">
              You need an active subscription to access the Mathematical Intuition Engine. Experience trading beyond calculation.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/pricing" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                View Pricing
              </Link>
              <Link 
                href="/dashboard" 
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <MathematicalIntuitionDashboard />;
}