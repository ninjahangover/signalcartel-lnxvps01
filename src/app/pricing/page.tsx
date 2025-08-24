"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PricingContent() {
  const searchParams = useSearchParams();
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation - Match Landing Page */}
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
            <Link href="/about" className="text-gray-400 hover:text-gray-300 transition-colors">
              About
            </Link>
            <Link href="/features" className="text-gray-400 hover:text-gray-300 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-cyan-400 font-semibold">
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
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🌟 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM</span><br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">FORGE™</span>
            <div className="text-3xl mt-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">EXCLUSIVE ACCESS</span>
            </div>
          </h1>
          <div className="text-2xl text-blue-300 mb-4">
            "Investment in Technology That Changes Lives"
          </div>
          <div className="text-pink-300 italic">
            "Money means nothing. Changing lives means EVERYTHING."
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 border border-purple-500/30 text-center">
            <div className="text-white font-bold text-4xl mb-6">
              🔐 INVITE-ONLY ACCESS
            </div>
            <div className="text-purple-200 text-xl leading-relaxed mb-8">
              QUANTUM FORGE™ is currently available exclusively through personal invitation. 
              We're building something extraordinary for deserving families, not the masses.
            </div>
            
            <div className="bg-black/30 rounded-xl p-6 mb-8 border border-cyan-400/20">
              <div className="text-cyan-400 font-bold text-2xl mb-4">
                ⭐ PREMIUM MEMBERSHIP
              </div>
              <div className="text-gray-300 mb-4">
                • Full access to QUANTUM FORGE™ AI system<br/>
                • 2,048 CUDA cores at your disposal<br/>
                • Sentiment-enhanced trading strategies<br/>
                • Human + AI collaborative approach<br/>
                • Mission-driven ethical technology
              </div>
              <div className="text-yellow-400 font-bold text-xl">
                By invitation only
              </div>
            </div>

            <div className="flex flex-col gap-4 justify-center">
              <Link href="/access">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105 shadow-2xl w-full">
                  🎯 Request Exclusive Invitation
                </button>
              </Link>
            </div>
            
            <div className="text-yellow-300 mt-6">
              ✨ Technology with heart • Premium access • Extraordinary results ✨
            </div>
            
            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-purple-500/30">
              <Link href="/features" className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors mr-4">
                ← View Features
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors mr-4">
                Our Story
              </Link>
              <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}