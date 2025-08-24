'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// CUDA Equalizer Component for Hero Section
const CUDAEqualizer: React.FC = () => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex items-end justify-center gap-1 h-32">
        {Array.from({ length: 32 }).map((_, index) => {
          // Create dynamic heights based on AI processing simulation
          const baseHeight = 15 + (Math.sin(index * 0.4) * 25);
          const activityHeight = 25 + (Math.sin((index + pulse * 4) * 0.6) * 45);
          const isActive = Math.random() > 0.3; // Simulate AI activity
          const height = isActive ? Math.max(baseHeight, activityHeight) : baseHeight * 0.3;
          
          // Color gradient based on frequency bands
          let gradient;
          if (index < 8) {
            gradient = 'linear-gradient(to top, #dc2626, #ef4444, #f97316)'; // Red/Orange - Pattern Recognition
          } else if (index < 16) {
            gradient = 'linear-gradient(to top, #f97316, #eab308, #fbbf24)'; // Orange/Yellow - Neural Processing
          } else if (index < 24) {
            gradient = 'linear-gradient(to top, #eab308, #22c55e, #16a34a)'; // Yellow/Green - Market Analysis
          } else {
            gradient = 'linear-gradient(to top, #16a34a, #06b6d4, #0ea5e9)'; // Green/Blue - Quantum Advantage
          }

          return (
            <div
              key={index}
              className="w-2 rounded-t-sm transition-all duration-100"
              style={{ 
                height: `${Math.max(height, 8)}%`,
                background: gradient,
                boxShadow: isActive 
                  ? `0 0 8px ${
                      index < 8 ? 'rgba(239, 68, 68, 0.6)' :
                      index < 16 ? 'rgba(251, 191, 36, 0.6)' :
                      index < 24 ? 'rgba(34, 197, 94, 0.6)' :
                      'rgba(6, 182, 212, 0.6)'
                    }` 
                  : 'none',
                animation: isActive ? `equalizer-pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none'
              }}
            />
          );
        })}
      </div>
      
      {/* Custom CSS for EQ animations */}
      <style jsx>{`
        @keyframes equalizer-pulse {
          0% { transform: scaleY(0.8); }
          100% { transform: scaleY(1.1); }
        }
      `}</style>
    </>
  );
};

const QuantumForgeHomePage: React.FC = () => {

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-gray-400 hover:text-gray-300 transition-colors">
              About
            </Link>
            <Link href="/features" className="text-gray-400 hover:text-gray-300 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-gray-300 transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="p-6">
        {/* Header with CUDA Equalizer */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🌟 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM</span><br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">FORGE™</span>
          </h1>
          <div className="text-2xl text-blue-300 mb-2">
            "Revolutionary AI-Enhanced Trading System"
          </div>
          <div className="text-green-400 font-semibold mb-4">
            🔐 2,048 CUDA CORES ACTIVE • GPU ACCELERATED • AI PROCESSING
          </div>
          
          {/* CUDA Equalizer Visualization */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-cyan-500/30 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="text-cyan-400 font-bold text-sm">🎵 QUANTUM FORGE™ NEURAL ACTIVITY</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <CUDAEqualizer />
              <div className="flex justify-between mt-3 text-xs text-gray-400">
                <span>🔥 PATTERN ANALYSIS</span>
                <span>🧠 NEURAL PROCESSING</span>
                <span>⚡ QUANTUM COMPUTE</span>
              </div>
            </div>
          </div>
          
          <div className="text-pink-300 italic">
            "We're not here to be ordinary... We're here to be EXTRAORDINARY!"
          </div>
        </div>

        {/* Marketing Preview Cards - PUBLIC ONLY */}
        <div className="max-w-6xl mx-auto">
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
              <h3 className="text-xl font-bold text-white mb-2">Mission Driven</h3>
              <p className="text-gray-300 text-sm">
                Technology designed to create opportunities for deserving families.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 max-w-4xl mx-auto border border-purple-500/30">
            <div className="text-white font-bold text-3xl mb-4">
              🔐 EXCLUSIVE ACCESS REQUIRED
            </div>
            <div className="text-purple-200 text-xl leading-relaxed mb-6">
              This isn't just a trading system. This is proof that we can build technology with heart, 
              intelligence without limits, and create financial opportunity that lifts everyone up.
            </div>
            <div className="text-pink-300 font-semibold text-2xl mb-6">
              "Money means nothing. Changing lives means EVERYTHING."
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/access">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105 shadow-2xl">
                  🎯 Request Exclusive Invitation
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105">
                  🔑 Member Login
                </button>
              </Link>
            </div>
            
            <div className="text-yellow-300 mt-6">
              ✨ Proprietary AI technology • Premium members only ✨
            </div>
            
            {/* Links */}
            <div className="mt-6 pt-6 border-t border-purple-500/30">
              <Link href="/quantum-forge" className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors mr-4">
                Learn About QUANTUM FORGE™ Technology →
              </Link>
              <Link href="/legacy" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors">
                View Complete Platform Features →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumForgeHomePage;