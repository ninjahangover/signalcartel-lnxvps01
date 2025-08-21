"use client";

import { useState } from 'react';
import Link from 'next/link';
import MarketingNav from '../../components/marketing-nav';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    inquiry: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Message Sent!</h1>
            <p className="text-gray-300 mb-6">
              Thank you for contacting Signal Cartel. We'll get back to you within 24 hours.
            </p>
            <Link href="/" className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <MarketingNav currentPage="/contact" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Have questions about Signal Cartel? Need help getting started? 
            Our team of trading experts is here to help.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Chat</h3>
              <p className="text-gray-300 mb-4">
                Get instant answers to your questions from our support team.
              </p>
              <p className="text-gold-400 text-sm">Available 24/7</p>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">📞</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Phone Support</h3>
              <p className="text-gray-300 mb-4">
                Speak directly with our trading specialists.
              </p>
              <p className="text-gold-400 text-sm">+1 (555) 123-TRADE</p>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">✉️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Email Support</h3>
              <p className="text-gray-300 mb-4">
                Send us a detailed message and we'll respond quickly.
              </p>
              <p className="text-gold-400 text-sm">support@signalcartel.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-6 bg-black/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Send Us a Message
            </h2>
            <p className="text-gray-300">
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
                    Company (Optional)
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label htmlFor="inquiry" className="block text-sm font-medium text-white mb-2">
                    Type of Inquiry
                  </label>
                  <select
                    id="inquiry"
                    name="inquiry"
                    value={formData.inquiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  >
                    <option value="general">General Question</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="press">Press & Media</option>
                    <option value="ultra">Ultra Elite Plan</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                  Subject *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  placeholder="Brief description of your inquiry"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  placeholder="Please provide details about your inquiry..."
                />
              </div>

              <div className="flex items-start">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-gold-400 focus:ring-gold-400 border-gray-300 rounded mt-1"
                />
                <label htmlFor="consent" className="ml-2 text-sm text-gray-300">
                  I agree to Signal Cartel's{' '}
                  <a href="#" className="text-gold-400 hover:text-gold-300">Privacy Policy</a>
                  {' '}and consent to being contacted about my inquiry.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                How quickly do you respond to inquiries?
              </h3>
              <p className="text-gray-300">
                We aim to respond to all inquiries within 24 hours during business days. 
                For Ultra Elite customers, we provide priority support with response times 
                under 4 hours.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Can I schedule a demo of Signal Cartel?
              </h3>
              <p className="text-gray-300">
                Absolutely! We offer personalized demos for all potential customers. 
                Select "Sales Inquiry" in the form above or call us directly to schedule 
                a 30-minute demo with one of our trading specialists.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Do you offer institutional pricing?
              </h3>
              <p className="text-gray-300">
                Yes, we have special pricing for institutions, hedge funds, and large trading teams. 
                Contact our sales team to discuss custom pricing and enterprise features.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                What's the best way to get technical support?
              </h3>
              <p className="text-gray-300">
                For technical issues, our live chat is the fastest option. You can also 
                email us at support@signalcartel.com or use the form above selecting 
                "Technical Support" as your inquiry type.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Offices
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <h3 className="text-xl font-bold text-white mb-4">New York</h3>
              <div className="text-gray-300 space-y-2">
                <p>123 Wall Street</p>
                <p>Suite 4500</p>
                <p>New York, NY 10005</p>
                <p className="text-gold-400">Headquarters</p>
              </div>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <h3 className="text-xl font-bold text-white mb-4">San Francisco</h3>
              <div className="text-gray-300 space-y-2">
                <p>456 Market Street</p>
                <p>Floor 12</p>
                <p>San Francisco, CA 94102</p>
                <p className="text-gold-400">Technology Hub</p>
              </div>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <h3 className="text-xl font-bold text-white mb-4">London</h3>
              <div className="text-gray-300 space-y-2">
                <p>789 Canary Wharf</p>
                <p>Level 25</p>
                <p>London E14 5HQ, UK</p>
                <p className="text-gold-400">European Operations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black/50 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-gold-400 mb-4">Signal Cartel</div>
              <p className="text-gray-400">
                Elevating wealth through intelligent trading solutions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Signal Cartel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}