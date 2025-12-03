'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  Brain,
  Users,
  BookOpen,
  GraduationCap,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = {
    features: [
      {
        name: 'For Parents',
        href: '/features/parents',
        icon: Users,
        description: "Support your child's unique learning journey",
      },
      {
        name: 'For Students',
        href: '/features/students',
        icon: GraduationCap,
        description: 'Fun, engaging learning experiences',
      },
      {
        name: 'For Teachers',
        href: '/features/teachers',
        icon: BookOpen,
        description: 'Personalized tools for every student',
      },
    ],
    mainLinks: [
      { name: 'Features', href: '/features', hasDropdown: true },
      { name: 'AIVO Pad', href: '/aivo-pad', badge: 'New' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
  };

  return (
    <header
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100'
          : 'bg-transparent',
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-gray-900 leading-tight">AIVO</span>
              <span className="text-xs font-medium text-gray-600 -mt-1">Learning</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-6">
            {navigation.mainLinks.map((item) => (
              <div key={item.name} className="relative group">
                {item.hasDropdown ? (
                  <>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-1 text-gray-700 hover:text-violet-600 font-medium transition-colors',
                        pathname === item.href && 'text-violet-600',
                      )}
                    >
                      {item.name}
                      <ChevronDown className="h-4 w-4" />
                    </Link>
                    {/* Features Dropdown */}
                    <div className="absolute top-full left-0 mt-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                        {navigation.features.map((feature) => (
                          <Link
                            key={feature.name}
                            href={feature.href}
                            className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-violet-50 transition-colors"
                          >
                            <div className="p-2 bg-violet-100 rounded-lg">
                              <feature.icon className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{feature.name}</p>
                              <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 text-gray-700 hover:text-violet-600 font-medium transition-colors',
                      pathname === item.href && 'text-violet-600',
                    )}
                  >
                    {item.name}
                    {item.badge && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Link href="http://localhost:3000/login">
              <Button variant="ghost" className="text-gray-700 hover:text-violet-600">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
            <Link href="http://localhost:3000/register">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                Start Free Trial
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Main navigation items */}
              {navigation.mainLinks.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {item.hasDropdown && (
                    <div className="ml-4 mt-1 space-y-1">
                      {navigation.features.map((feature) => (
                        <Link
                          key={feature.name}
                          href={feature.href}
                          className="block px-3 py-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {feature.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 space-y-2 border-t border-gray-100">
                <Link href="http://localhost:3000/login">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="http://localhost:3000/register">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
