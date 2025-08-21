"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface MarketingNavProps {
  currentPage?: string;
}

export default function MarketingNav({ currentPage }: MarketingNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { href: '/features', label: 'Features' },
    { href: '/stratus-engine', label: 'The Stratus Engine™' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' }
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-yellow-400/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/signal.cartel.shield.trans.png" 
              alt="Signal Cartel Logo" 
              width={40} 
              height={40}
              className="w-10 h-10"
              priority
            />
            <span className="text-xl md:text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Signal Cartel</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`transition-colors ${
                  currentPage === item.href 
                    ? 'text-yellow-400 font-semibold' 
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/auth/login">
              <button className="text-yellow-400 hover:text-yellow-300 bg-transparent border-none cursor-pointer">
                Sign In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-4 py-2 rounded">
                Start Trading
              </button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="lg:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-yellow-400/20">
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`transition-colors ${
                    currentPage === item.href 
                      ? 'text-yellow-400 font-semibold' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 pt-2">
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="text-yellow-400 hover:text-yellow-300 bg-transparent border-none cursor-pointer text-left">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                  <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-4 py-2 rounded w-fit">
                    Start Trading
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}