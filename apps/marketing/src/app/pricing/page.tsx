'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  HelpCircle,
  ArrowRight,
  Zap,
  Users,
  Crown,
  Shield,
  Clock,
  UserCheck,
  ClipboardList,
  Star,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

type BillingPeriod = 'monthly' | 'annual';

interface PricingTier {
  name: string;
  description: string;
  icon: typeof Zap;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
  ctaLink: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    description: 'Start your learning journey with essential tools',
    icon: Users,
    price: {
      monthly: 0,
      annual: 0,
    },
    features: [
      'Access to Basic Lessons',
      'Core Subject Coverage',
      'Basic Progress Tracking',
      'Community Support',
    ],
    cta: 'Get Started Free',
    ctaLink: 'http://localhost:3000/register',
  },
  {
    name: 'Pro',
    description: 'Full access to personalized AI learning',
    icon: Zap,
    price: {
      monthly: 29.99,
      annual: 24.99,
    },
    features: [
      'Access to All Lessons',
      'Personalized AI Tutor (Virtual Brain)',
      'IEP Goal Integration',
      'Progress Tracking (Spider, Graph Charts)',
      'Parent Dashboard Access',
      'Priority Support',
      'Live Chat with Tutors (Limited)',
    ],
    highlighted: true,
    badge: 'Early Access',
    cta: 'Start Free Trial',
    ctaLink: 'http://localhost:3000/register',
  },
  {
    name: 'Premium',
    description: 'Complete solution for families with multiple learners',
    icon: Crown,
    price: {
      monthly: 49.99,
      annual: 41.99,
    },
    features: [
      'Access to All Lessons and Features',
      'Advanced AI Learning Agent',
      'Multiple Student Profiles',
      'Teacher Collaboration Tools',
      'Unlimited Live Chat with Tutors',
      '24/7 Priority Support',
      'Custom Learning Plans',
    ],
    cta: 'Start Free Trial',
    ctaLink: 'http://localhost:3000/register',
  },
];

const trustBadges = [
  {
    icon: Shield,
    title: 'FERPA & COPPA Compliant',
    description: 'Complete data protection',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock assistance',
  },
  {
    icon: UserCheck,
    title: 'Family Dashboard',
    description: 'Parent-teacher collaboration',
  },
  {
    icon: ClipboardList,
    title: 'IEP Integration',
    description: 'Goal tracking and reporting',
  },
];

const faqs = [
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! All Pro and Premium plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards and PayPal. Annual plans can also be paid via invoice.',
  },
  {
    question: 'Is AIVO FERPA and COPPA compliant?',
    answer:
      'Yes, AIVO is fully compliant with FERPA, COPPA, and other education data privacy regulations. We take student data protection seriously.',
  },
  {
    question: 'What age groups is AIVO designed for?',
    answer:
      'AIVO supports K-12 and college learners, with specialized features for neurodiverse students including those with ADHD, Autism, and Dyslexia.',
  },
  {
    question: 'What accessibility features are included?',
    answer:
      'All plans include our full suite of accessibility features: dyslexia-friendly fonts, high contrast mode, screen reader support, reduced motion options, and customizable interfaces for neurodiverse learners.',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');

  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 text-violet-700 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Early Access Pricing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Simple, Transparent Pricing
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-10"
          >
            Join the families who helped shape AIVO during our pilot. Early access members get
            special founding member benefits.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-4 p-1.5 rounded-full bg-gray-100"
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative rounded-3xl p-8 ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-violet-600 to-purple-700 text-white ring-4 ring-violet-300 scale-105'
                    : 'bg-white border-2 border-gray-100'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-xs font-bold text-gray-900">
                      Most Popular
                    </span>
                    {tier.badge && (
                      <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full text-xs font-bold text-gray-900">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                    tier.highlighted ? 'bg-white/20' : 'bg-violet-100'
                  }`}
                >
                  <tier.icon
                    className={`w-7 h-7 ${tier.highlighted ? 'text-white' : 'text-violet-600'}`}
                  />
                </div>

                <h3
                  className={`text-2xl font-bold mb-2 ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}
                >
                  {tier.name}
                </h3>

                <p
                  className={`text-sm mb-6 ${tier.highlighted ? 'text-violet-100' : 'text-gray-600'}`}
                >
                  {tier.description}
                </p>

                <div className="mb-6">
                  {tier.price.monthly === 0 ? (
                    <div
                      className={`text-5xl font-bold ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}
                    >
                      $0
                      <span
                        className={`text-lg font-normal ${tier.highlighted ? 'text-violet-200' : 'text-gray-500'}`}
                      >
                        /mo
                      </span>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-5xl font-bold ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}
                      >
                        ${billingPeriod === 'monthly' ? tier.price.monthly : tier.price.annual}
                      </span>
                      <span className={tier.highlighted ? 'text-violet-200' : 'text-gray-500'}>
                        /mo
                      </span>
                      {billingPeriod === 'annual' && (
                        <p
                          className={`text-sm mt-1 ${tier.highlighted ? 'text-violet-200' : 'text-gray-500'}`}
                        >
                          billed annually
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          tier.highlighted ? 'text-green-300' : 'text-green-500'
                        }`}
                      />
                      <span
                        className={`text-sm ${tier.highlighted ? 'text-violet-100' : 'text-gray-600'}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={tier.ctaLink}>
                  <Button
                    size="lg"
                    className={`w-full ${
                      tier.highlighted
                        ? 'bg-white text-violet-700 hover:bg-gray-100'
                        : tier.name === 'Free'
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="flex flex-col items-center text-center p-4"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                  <badge.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{badge.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilot Success Testimonial */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-3xl p-8 md:p-12 text-center"
          >
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed">
              &quot;AIVO has transformed how my child approaches learning. Being part of the pilot
              program, I&apos;ve seen firsthand how the personalized approach makes such a
              difference for children with ADHD.&quot;
            </blockquote>
            <div className="flex items-center justify-center gap-2">
              <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                Pilot Program Parent
              </span>
              <span className="text-sm text-gray-500">• Child with ADHD, Grade 4</span>
            </div>
          </motion.div>

          {/* Pilot Callout Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <span className="text-2xl">🎉</span>
              <p className="text-green-800">
                <strong>From Pilot to Launch:</strong> 150 families helped us build AIVO. Now
                we&apos;re ready to help yours.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Have another question?{' '}
              <Link href="/contact" className="text-violet-600 hover:underline">
                Contact our team
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * index }}
                className="group rounded-2xl border border-gray-200 bg-white"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-violet-600 transition-colors flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join Early Access?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Be among the first families to experience AIVO after our successful pilot program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="http://localhost:3000/register">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100">
                Join Early Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about#pilot-results">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                See Pilot Results
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
