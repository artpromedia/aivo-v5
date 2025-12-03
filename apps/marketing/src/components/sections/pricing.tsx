'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  Shield,
  Clock,
  Users,
  ClipboardList,
  Star,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type BillingPeriod = 'monthly' | 'annual';

interface PricingTier {
  name: string;
  price: { monthly: number; annual: number };
  originalPrice?: number;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  badges?: string[];
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Essential Tools to Begin Learning Journey with Ease',
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
    price: { monthly: 29.99, annual: 24.99 },
    originalPrice: 39.99,
    description: 'Unlock Advanced Features for Faster Progress and Deeper Learning',
    features: [
      'Access to All Lessons',
      'Personalized AI Tutor (Virtual Brain)',
      'IEP Goal Integration',
      'Progress Tracking (Spider, Graph Charts)',
      'Parent Dashboard Access',
      'Priority Support',
      'Live Chat with Tutors (Limited)',
    ],
    cta: 'Start Pro Trial',
    ctaLink: 'http://localhost:3000/register?plan=pro',
    popular: true,
    badges: ['Most Popular', '50% Off'],
  },
  {
    name: 'Premium',
    price: { monthly: 49.99, annual: 41.99 },
    description: 'Complete Learning Solution for Families with Multiple Learners',
    features: [
      'Access to All Lessons and Features',
      'Advanced AI Learning Agent',
      'Multiple Student Profiles',
      'Teacher Collaboration Tools',
      'Unlimited Live Chat with Tutors',
      '24/7 Priority Support',
      'Custom Learning Plans',
    ],
    cta: 'Start Premium Trial',
    ctaLink: 'http://localhost:3000/register?plan=premium',
  },
];

const trustBadges = [
  {
    icon: Shield,
    title: 'FERPA & COPPA Compliant',
    description: 'Complete data protection for student privacy',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock assistance for families',
  },
  {
    icon: Users,
    title: 'Family Dashboard',
    description: 'Parent and teacher collaboration tools',
  },
  {
    icon: ClipboardList,
    title: 'IEP Integration',
    description: 'Seamless goal tracking and reporting',
  },
];

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'All plans include a 30-day free trial with full access to features. No credit card required to start.',
  },
  {
    question: 'How does billing work?',
    answer: 'We bill monthly or annually. Annual plans save 50% and include priority support.',
  },
  {
    question: 'What if my child has multiple learning differences?',
    answer:
      'AIVO is designed to support multiple learning differences simultaneously. Our AI adapts to each unique profile.',
  },
];

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-4">
            Transparent Pricing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include a 30-day free trial.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex justify-center items-center gap-4 mb-12"
        >
          <span
            className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            style={{ backgroundColor: billingPeriod === 'annual' ? '#7c3aed' : undefined }}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-7' : ''
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}
          >
            Annual
          </span>
          <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            Save 50%
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Badges */}
              {tier.badges && tier.badges.length > 0 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {tier.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        badge === 'Most Popular'
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`h-full bg-white rounded-3xl p-8 ${
                  tier.popular
                    ? 'ring-2 ring-violet-500 shadow-xl'
                    : 'shadow-lg hover:shadow-xl border border-gray-100'
                } transition-all duration-300`}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6 text-sm">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {tier.originalPrice && (
                    <span className="text-lg text-gray-400 line-through mr-2">
                      ${tier.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl font-bold text-gray-900">
                    ${billingPeriod === 'monthly' ? tier.price.monthly : tier.price.annual}
                  </span>
                  <span className="text-gray-600">/month</span>
                  {billingPeriod === 'annual' && tier.price.annual > 0 && (
                    <p className="text-sm text-gray-500 mt-1">billed annually</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={tier.ctaLink}>
                  <Button
                    className={`w-full rounded-xl py-6 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg'
                        : 'border-2 border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 p-8 bg-white rounded-3xl shadow-lg border border-gray-100"
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                <badge.icon className="w-6 h-6 text-violet-600" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{badge.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 md:p-12 text-center mb-16"
        >
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed max-w-3xl mx-auto">
            &quot;AIVO has transformed how my child approaches learning. The personalized approach
            makes such a difference for children with ADHD.&quot;
          </blockquote>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full font-medium">
              Pilot Program Parent
            </span>
            <span className="text-sm text-gray-500">• Parent of ADHD student</span>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
