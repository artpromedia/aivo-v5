'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, ChevronDown, Brain, Users, BookOpen, 
  BarChart3, LogIn, Sparkles 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = {
    solutions: [
      {
        name: 'For Parents',
        href: '/features/parents',
        icon: Users,
        description: 'Support your child\'s unique learning journey',
      },
      {
        name: 'For Teachers',
        href: '/features/teachers',
        icon: BookOpen,
        description: 'Personalized tools for every student',
      },
      {
        name: 'For Schools',
        href: '/features/schools',
        icon: BarChart3,
        description: 'Transform your special education program',
      },
    ],
    product: [
      {
        name: 'Virtual Brain AI',
        href: '/features/virtual-brain',
        description: 'Personalized AI agent for each learner',
      },
      {
        name: 'Adaptive Learning',
        href: '/features/adaptive-learning',
        description: 'Real-time content adaptation',
      },
      {
        name: 'Accessibility',
        href: '/features/accessibility',
        description: 'Built for neurodiversity',
      },
      {
        name: 'Progress Tracking',
        href: '/features/progress',
        description: 'Detailed insights and analytics',
      },
    ],
    resources: [
      { name: 'Research', href: '/research' },
      { name: 'Success Stories', href: '/success-stories' },
      { name: 'Blog', href: '/blog' },
      { name: 'Help Center', href: '/help' },
    ],
  }

  return (
    <header
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-gray-900 leading-tight">AIVO</span>
              <span className="text-xs font-medium text-gray-600 -mt-1">Learning</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <DropdownMenu title="Solutions" items={navigation.solutions} />
            <DropdownMenu title="Product" items={navigation.product} />
            <Link 
              href="/pricing" 
              className={cn(
                "text-gray-700 hover:text-purple-600 font-medium transition-colors",
                pathname === '/pricing' && "text-purple-600"
              )}
            >
              Pricing
            </Link>
            <DropdownMenu title="Resources" items={navigation.resources} simple />
            <Link 
              href="/demo" 
              className={cn(
                "text-gray-700 hover:text-purple-600 font-medium transition-colors",
                pathname === '/demo' && "text-purple-600"
              )}
            >
              Demo
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Link href="/signin">
              <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
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
        {mobileMenuOpen && <MobileMenu navigation={navigation} />}
      </AnimatePresence>
    </header>
  )
}

function DropdownMenu({ title, items, simple = false }: { title: string; items: any[]; simple?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-gray-700 hover:text-purple-600 font-medium transition-colors">
        {title}
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-2">
              {items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 rounded-xl hover:bg-purple-50 transition-colors group"
                >
                  {!simple && (
                    <div className="flex items-start gap-3">
                      {item.icon && (
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  )}
                  {simple && (
                    <p className="font-medium text-gray-700 hover:text-purple-600 transition-colors">
                      {item.name}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileMenu({ navigation }: { navigation: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="lg:hidden bg-white border-t border-gray-100"
    >
      <div className="px-4 py-6 space-y-4">
        {/* Mobile navigation items */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Solutions</p>
          {navigation.solutions.map((item: any) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</p>
          {navigation.product.map((item: any) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="pt-4 space-y-2">
          <Link href="/signin">
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
