'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, CheckCircle2, Loader2 } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(email)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }
    setStatus('loading')
    await new Promise(resolve => setTimeout(resolve, 1500))
    setStatus('success')
    setEmail('')
    setTimeout(() => setStatus('idle'), 5000)
  }
  
  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'AI Tutoring', href: '/features/ai-tutoring' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Demo', href: '/demo' },
      { name: 'Accessibility', href: '/features/accessibility' },
    ],
    solutions: [
      { name: 'For Parents', href: '/features/parents' },
      { name: 'For Teachers', href: '/features/teachers' },
      { name: 'For Schools', href: '/features/schools' },
    ],
    resources: [
      { name: 'Blog', href: '/blog' },
      { name: 'Contact', href: '/contact' },
    ],
    company: [
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  }

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="font-bold text-2xl text-gray-900">AIVO</div>
                <div className="text-sm text-gray-600">Learning</div>
              </div>
            </Link>
            <p className="text-gray-600 mb-6 max-w-xs">
              Personalized AI-powered learning for every child. Supporting neurodiverse learners 
              with adaptive, engaging education.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a href="https://facebook.com/aivolearning" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-violet-600 transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/aivolearning" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-violet-600 transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/aivolearning" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-violet-600 transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/aivolearning" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-violet-600 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@aivolearning" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-violet-600 transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-600 hover:text-violet-600 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Solutions</h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-600 hover:text-violet-600 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-600 hover:text-violet-600 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div id="newsletter" className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Mail className="w-5 h-5 text-violet-600" />
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-gray-900">Subscribe to our newsletter</h4>
                <p className="text-sm text-gray-600">Get the latest updates on AIVO Learning</p>
              </div>
            </div>
            
            {status === 'success' ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Thanks for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                    placeholder="Enter your email"
                    className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent flex-1 sm:w-64 ${status === 'error' ? 'border-red-500' : 'border-gray-300'}`}
                    disabled={status === 'loading'}
                  />
                  {status === 'error' && <p className="absolute -bottom-5 left-0 text-xs text-red-500">{errorMessage}</p>}
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all font-medium disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" />Subscribing...</> : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 text-center md:text-left">
              © {currentYear} AIVO Learning. All rights reserved. Made with ❤️ for learners everywhere.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {footerLinks.legal.map((link) => (
                <Link key={link.name} href={link.href} className="text-sm text-gray-600 hover:text-violet-600 transition-colors">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
