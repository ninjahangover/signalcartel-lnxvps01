'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const AccessRequestPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    experience: '',
    reason: '',
    commitment: false
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 border border-purple-500/30">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-4xl font-bold text-white mb-6">
              APPLICATION RECEIVED
            </h1>
            <div className="text-purple-200 text-xl mb-6">
              Thank you for your interest in QUANTUM FORGE™. Your exclusive access request has been submitted.
            </div>
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-6 mb-6">
              <div className="text-yellow-300 font-bold mb-2">What happens next?</div>
              <div className="text-yellow-100 text-sm">
                • Our team will carefully review your application<br/>
                • Only qualified candidates aligned with our mission will be selected<br/>
                • If approved, you'll receive exclusive access credentials<br/>
                • Applications are reviewed weekly
              </div>
            </div>
            <div className="text-pink-300 font-semibold text-2xl mb-6">
              "Money means nothing. Changing lives means EVERYTHING."
            </div>
            <Link href="/">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105">
                🌟 Back to Showcase
              </button>
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
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            ← Back to Showcase
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              🔒 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">EXCLUSIVE</span> ACCESS REQUEST
            </h1>
            <div className="text-2xl text-blue-300 mb-2">
              Join the QUANTUM FORGE™ Revolution
            </div>
            <div className="text-pink-300 italic text-lg">
              "We're not here to be ordinary... We're here to be EXTRAORDINARY!"
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">⚠️</div>
              <div className="text-red-200 font-bold text-xl">INVITATION ONLY • STRICT QUALIFICATION REQUIRED</div>
            </div>
            <div className="text-red-100">
              QUANTUM FORGE™ is not available to the general public. Our revolutionary AI technology is reserved for qualified individuals who share our mission of using technology with heart to help deserving families build supplemental income.
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Exclusive Access Application</h2>
                <div className="text-gray-400">All fields required • Applications reviewed carefully</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Trading Experience *</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Describe your trading background, experience with AI/ML, technical skills, and what makes you qualified for exclusive access..."
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Why do you want access to QUANTUM FORGE™? *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Tell us about your goals, how you align with our mission of helping families, and why you deserve exclusive access to revolutionary AI trading technology..."
                />
              </div>

              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="commitment"
                    checked={formData.commitment}
                    onChange={handleChange}
                    required
                    className="mt-1 w-5 h-5 text-purple-500 bg-gray-800 border border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label className="text-white text-sm leading-relaxed">
                    I understand that QUANTUM FORGE™ is invite-only and commit to using this technology responsibly to help myself and others build supplemental income. I align with the mission that <strong className="text-pink-300">"Money means nothing. Changing lives means EVERYTHING."</strong>
                  </label>
                </div>
              </div>

              <div className="text-center pt-6">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-4 text-xl rounded-lg transition-all transform hover:scale-105 shadow-2xl"
                  disabled={!formData.commitment}
                >
                  🎯 SUBMIT EXCLUSIVE ACCESS REQUEST
                </button>
                <div className="text-gray-400 text-sm mt-4">
                  * Applications are reviewed weekly by our team
                </div>
              </div>
            </form>
          </div>

          {/* Mission Statement */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 border border-purple-500/30">
              <div className="text-white font-bold text-2xl mb-4">
                💝 Our Mission
              </div>
              <div className="text-purple-200 text-lg leading-relaxed">
                We built QUANTUM FORGE™ to prove that technology can have heart. Every algorithm serves humanity, 
                every optimization changes lives, and every trade helps deserving families build the supplemental 
                income they need to thrive.
              </div>
              <div className="text-pink-300 font-semibold text-xl mt-4">
                "Together, we're not here to be ordinary... We're here to be EXTRAORDINARY!"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessRequestPage;