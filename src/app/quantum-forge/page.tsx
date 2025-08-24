"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import GPUQuantumVisualizer from '@/components/quantum-forge/gpu-quantum-visualizer';

export default function QuantumForgePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/login?callbackUrl=/quantum-forge&message=login_required");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading QUANTUM FORGE™...</div>
      </div>
    );
  }

  if (!session) {
    return null;
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
                Signal Cartel
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/charts" className="text-gray-400 hover:text-gray-300 transition-colors">
              Live Charts
            </Link>
            <Link href="/manual-trading" className="text-gray-400 hover:text-gray-300 transition-colors">
              Manual Trading
            </Link>
            <span className="text-green-400 font-semibold">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="p-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🌟 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM</span><br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">FORGE™</span>
          </h1>
          <div className="text-2xl text-blue-300 mb-2">
            "Revolutionary AI-Enhanced Trading System"
          </div>
          <div className="text-pink-300 italic">
            "We're not here to be ordinary... We're here to be EXTRAORDINARY!"
          </div>
        </div>

        {/* System Overview */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🧠 Advanced AI Trading Intelligence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-gray-300">
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Neural Evolution Engine</h3>
                <p className="mb-4">
                  Self-improving AI that learns from every market movement with neural precision. 
                  Our advanced neural networks continuously adapt and evolve trading strategies 
                  based on real-time market conditions.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Real-time pattern recognition</li>
                  <li>• Self-optimizing algorithms</li>
                  <li>• Continuous learning system</li>
                </ul>
              </div>
              <div className="text-gray-300">
                <h3 className="text-xl font-bold text-green-400 mb-3">GPU-Accelerated Processing</h3>
                <p className="mb-4">
                  CUDA-powered parallel processing enables lightning-fast market analysis 
                  and trade execution. Our GPU acceleration provides the computational 
                  power needed for advanced AI trading strategies.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• 2,048 CUDA cores active</li>
                  <li>• Parallel strategy execution</li>
                  <li>• Real-time data processing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-400/10 to-purple-600/5 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-2">Neural Evolution</h3>
              <p className="text-gray-300 text-sm">
                Self-improving AI that learns from every market movement with neural precision.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">CUDA Processing</h3>
              <p className="text-gray-300 text-sm">
                GPU-accelerated computation with advanced parallel processing capabilities.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-300 text-sm">
                Sophisticated market analysis with cutting-edge algorithmic processing.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-400/10 to-red-500/5 border border-pink-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Precision Trading</h3>
              <p className="text-gray-300 text-sm">
                High-precision trade execution with intelligent risk management systems.
              </p>
            </div>
          </div>

          {/* Technology Showcase */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-yellow-400/30 backdrop-blur-sm rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🚀 Revolutionary Technology Stack
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🔬</div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">AI Research</h3>
                <p className="text-gray-300 text-sm">
                  Cutting-edge machine learning algorithms and neural network architectures 
                  designed for financial market analysis.
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">High Performance</h3>
                <p className="text-gray-300 text-sm">
                  GPU-accelerated processing with CUDA cores enabling real-time analysis 
                  of complex market patterns and signals.
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Enterprise Security</h3>
                <p className="text-gray-300 text-sm">
                  Bank-level security protocols protecting proprietary algorithms and 
                  user data with advanced encryption standards.
                </p>
              </div>
            </div>
          </div>

          {/* Performance Preview */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-400/30 backdrop-blur-sm rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              📈 System Performance Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">4,200+</div>
                <p className="text-gray-300">Total Trades Analyzed</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">49.4%</div>
                <p className="text-gray-300">Baseline Win Rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
                <p className="text-gray-300">Real-Time Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* GPU Quantum Visualizer */}
        <div className="mt-12 mb-12">
          <GPUQuantumVisualizer />
        </div>

        {/* Quick Actions Dashboard */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 max-w-6xl mx-auto border border-purple-500/30">
            <div className="text-white font-bold text-3xl mb-4">
              🚀 QUANTUM FORGE™ COMMAND CENTER
            </div>
            <div className="text-purple-200 text-xl leading-relaxed mb-6">
              Welcome back, {session.user?.email}! Your AI-powered trading system is ready.
            </div>
            <div className="text-pink-300 font-semibold text-2xl mb-6">
              "Money means nothing. Changing lives means EVERYTHING."
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link href="/dashboard">
                <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-white mb-2">Trading Dashboard</h3>
                  <p className="text-cyan-300 text-sm">Monitor your AI trades in real-time</p>
                </div>
              </Link>

              <Link href="/charts">
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-xl font-bold text-white mb-2">Live Charts</h3>
                  <p className="text-purple-300 text-sm">Professional TradingView analysis</p>
                </div>
              </Link>

              <Link href="/manual-trading">
                <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-400/30 backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-white mb-2">Manual Trading</h3>
                  <p className="text-green-300 text-sm">Execute trades with AI assistance</p>
                </div>
              </Link>
            </div>
            
            <div className="text-yellow-300 font-semibold text-xl">
              ✨ {session.user?.role === 'super_admin' ? 'SUPER ADMIN ACCESS' : 'PREMIUM MEMBER'} • FULL SYSTEM CONTROL ✨
            </div>
            
            {/* Link to Platform Details */}
            <div className="mt-6 pt-6 border-t border-purple-500/30">
              <Link href="/legacy" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors">
                View Complete Platform Features →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}