'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Tablet,
  Brain,
  Wifi,
  Battery,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  EyeOff,
  Accessibility,
  Download,
  Lock,
  HardDrive,
  Package,
  Monitor,
  Signal,
  Gift,
} from 'lucide-react';
import { Navigation } from '@/components/shared/navigation';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: EyeOff,
    title: 'Distraction-Free Mode',
    description:
      'No social media, games, or notifications. Pure focus on learning without interruptions.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Accessibility,
    title: 'Accessibility First',
    description: 'Large text, high contrast, and screen reader optimized for all learning needs.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Download,
    title: 'Offline Learning',
    description: 'Download lessons for learning anywhere, even without internet connection.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Lock,
    title: 'Parental Controls',
    description: 'Full control over content and screen time. Set limits and monitor progress.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Durable Design',
    description: 'Kid-friendly, drop-resistant construction built to withstand everyday use.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Package,
    title: 'Pre-loaded Content',
    description: 'Comes with AIVO learning apps installed and ready to use out of the box.',
    color: 'from-indigo-500 to-violet-500',
  },
];

const specs = [
  { icon: Monitor, label: 'Display', value: '10.1" HD Display' },
  { icon: Battery, label: 'Battery Life', value: '12-hour battery life' },
  { icon: Signal, label: 'Connectivity', value: 'WiFi + LTE options' },
  { icon: Shield, label: 'Protection', value: 'Protective case included' },
  { icon: Gift, label: 'Subscription', value: '1-year AIVO Pro subscription included' },
];

const included = [
  'AIVO Pad Tablet',
  'Protective Kid-Proof Case',
  'USB-C Charging Cable',
  'Power Adapter',
  '1-Year AIVO Pro Subscription',
  'Quick Start Guide',
];

export default function AivoPadPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold mb-6">
                <Sparkles className="w-4 h-4" />
                New Product
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Introducing{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                  AIVO Pad
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                A dedicated learning tablet designed specifically for neurodiverse learners with
                distraction-free focus mode and accessibility features built-in.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="#preorder">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xl"
                  >
                    Pre-order Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="border-2">
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-8 shadow-2xl">
                <div className="w-full h-full rounded-2xl bg-white flex flex-col items-center justify-center gap-6">
                  <Tablet className="w-32 h-32 text-violet-500" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">AIVO Pad</p>
                    <p className="text-gray-600">Learning Made Simple</p>
                  </div>
                  <div className="flex gap-2">
                    {['🧠', '📚', '🎯', '⭐'].map((emoji, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="text-2xl"
                      >
                        {emoji}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -left-4 top-20 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="flex items-center gap-2">
                  <EyeOff className="w-6 h-6 text-blue-500" />
                  <span className="font-semibold text-gray-900">Focus Mode</span>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -right-4 bottom-20 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="flex items-center gap-2">
                  <Accessibility className="w-6 h-6 text-violet-500" />
                  <span className="font-semibold text-gray-900">Accessible</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every feature of AIVO Pad is built with neurodiverse learners in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-3xl bg-white border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-violet-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Specifications</h2>
            <p className="text-gray-600">
              Everything you need for the perfect learning experience.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="space-y-4">
              {specs.map((spec, index) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                    <spec.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-500 text-sm">{spec.label}</span>
                    <p className="font-semibold text-gray-900">{spec.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">What&apos;s in the Box</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {included.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pre-order Section */}
      <section id="preorder" className="py-20 px-4 bg-gradient-to-br from-violet-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 text-violet-200 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">Pre-order AIVO Pad Today</h2>
            <p className="text-xl text-violet-100 mb-4">
              Be among the first to experience the future of accessible learning.
            </p>
            <p className="text-3xl font-bold text-white mb-8">
              Starting at $299
              <span className="text-lg text-violet-200 font-normal ml-2">
                (includes 1-year AIVO Pro)
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-violet-600 hover:bg-gray-100 px-8 shadow-xl"
              >
                Pre-order Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-violet-200 text-sm">
              Expected shipping: Spring 2026 • Free shipping on all pre-orders
            </p>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h3>
          <p className="text-gray-600 mb-6">
            Get the latest news about AIVO Pad, including launch updates and exclusive offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8">
              Notify Me
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
