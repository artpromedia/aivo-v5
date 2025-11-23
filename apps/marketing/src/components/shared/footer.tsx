import Link from 'next/link'
import { Brain, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Virtual Brain AI', href: '/features/virtual-brain' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Demo', href: '/demo' },
      { name: 'Accessibility', href: '/features/accessibility' },
    ],
    solutions: [
      { name: 'For Parents', href: '/features/parents' },
      { name: 'For Teachers', href: '/features/teachers' },
      { name: 'For Schools', href: '/features/schools' },
      { name: 'For Therapists', href: '/features/therapists' },
    ],
    resources: [
      { name: 'Blog', href: '/blog' },
      { name: 'Research', href: '/research' },
      { name: 'Success Stories', href: '/success-stories' },
      { name: 'Help Center', href: '/help' },
      { name: 'API Documentation', href: '/docs' },
    ],
    company: [
      { name: 'About AIVO Learning', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Partners', href: '/partners' },
      { name: 'Contact', href: '/contact' },
      { name: 'Press Kit', href: '/press' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'COPPA Compliance', href: '/coppa' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  }

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
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
              <a 
                href="https://facebook.com/aivolearning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-600 transition-colors"
                aria-label="AIVO Learning on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/aivolearning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-600 transition-colors"
                aria-label="AIVO Learning on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/aivolearning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-600 transition-colors"
                aria-label="AIVO Learning on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/aivolearning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-600 transition-colors"
                aria-label="AIVO Learning on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com/@aivolearning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-600 transition-colors"
                aria-label="AIVO Learning on YouTube"
              >
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
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm"
                  >
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
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm"
                  >
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
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-purple-600 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="font-semibold text-gray-900">Subscribe to our newsletter</h4>
                <p className="text-sm text-gray-600">Get the latest updates on AIVO Learning</p>
              </div>
            </div>
            <form className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex-1 sm:w-64"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
              >
                Subscribe
              </button>
            </form>
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
                <Link 
                  key={link.name}
                  href={link.href} 
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
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
