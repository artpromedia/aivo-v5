'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserPlus, Brain, Sparkles, BarChart3, ArrowRight, Check, Play } from 'lucide-react';
import { Navigation } from '@/components/shared/navigation';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description:
      'Sign up and tell us about your learner. Share their learning style, interests, and any specific needs like ADHD, dyslexia, or autism.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    icon: Brain,
    title: 'Meet Your Virtual Brain',
    description:
      "AIVO creates a personalized AI tutor that adapts to your child's unique learning profile. It remembers preferences and adjusts teaching methods.",
    color: 'from-violet-500 to-purple-500',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Learn Through Play',
    description:
      'Interactive lessons, games, and activities make learning fun. Earn rewards, unlock achievements, and stay motivated every step of the way.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Track Progress Together',
    description:
      "Parents and teachers get real-time insights. See what's working, celebrate wins, and adjust goals through the family dashboard.",
    color: 'from-amber-500 to-orange-500',
  },
];

const benefits = [
  "Adapts to each learner's unique pace",
  'Supports IEP goals and tracking',
  'Works for ADHD, autism, dyslexia & more',
  'Celebrates small wins to build confidence',
  'Connects parents, teachers & therapists',
  'Available on any device, anytime',
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-6">
              Simple & Effective
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              How{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                AIVO Works
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              From sign-up to success in four simple steps. See how AIVO creates personalized
              learning experiences for every neurodiverse learner.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="http://localhost:3000/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-2 gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: '-100px' }}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${step.color}`}
                    >
                      {step.number}
                    </span>
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
                  <p className="text-xl text-gray-600">{step.description}</p>
                </div>

                {/* Visual */}
                <div className="flex-1">
                  <div
                    className={`aspect-video rounded-3xl bg-gradient-to-br ${step.color} p-1 shadow-2xl`}
                  >
                    <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                      <step.icon className="w-24 h-24 text-gray-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Families Choose AIVO</h2>
            <p className="text-xl text-gray-600">
              Built by parents, for parents. Every feature serves a purpose.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700 font-medium">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join families who are transforming their children&apos;s learning experience with
              AIVO.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="http://localhost:3000/register">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  Talk to Our Team
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-white/70 text-sm">
              30-day free trial • No credit card required • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
