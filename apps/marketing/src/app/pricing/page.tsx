'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, ArrowRight, Zap, Users, Building2, GraduationCap } from 'lucide-react';
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
  cta: string;
  ctaVariant: 'default' | 'coral' | 'outline';
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Family',
    description: 'Perfect for homeschool families or parents wanting to supplement education',
    icon: Users,
    price: {
      monthly: 29,
      annual: 24,
    },
    features: [
      'Up to 3 learner profiles',
      'AI Virtual Brain tutor',
      'K-12 curriculum access',
      'Progress tracking dashboard',
      'Parent mobile app',
      'Email support',
      'Weekly progress reports',
    ],
    cta: 'Start Free Trial',
    ctaVariant: 'coral',
  },
  {
    name: 'School',
    description: 'Ideal for individual schools and small learning centers',
    icon: GraduationCap,
    price: {
      monthly: 8,
      annual: 6,
    },
    features: [
      'Per student pricing (min 50)',
      'Unlimited teacher accounts',
      'Advanced analytics dashboard',
      'IEP/504 accommodation tools',
      'Classroom management',
      'LMS integration (Canvas, Google)',
      'Priority email & chat support',
      'Professional development training',
      'Custom branding options',
    ],
    highlighted: true,
    cta: 'Schedule Demo',
    ctaVariant: 'coral',
  },
  {
    name: 'District',
    description: 'Enterprise solution for school districts and large organizations',
    icon: Building2,
    price: {
      monthly: 0,
      annual: 0,
    },
    features: [
      'Volume-based pricing',
      'Unlimited schools & students',
      'District-wide analytics',
      'SSO & rostering integration',
      'Data privacy compliance (FERPA, COPPA)',
      'Dedicated success manager',
      '24/7 premium support',
      'Custom implementation',
      'API access',
      'SLA guarantees',
    ],
    cta: 'Contact Sales',
    ctaVariant: 'outline',
  },
];

const faqs = [
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! All Family plans come with a 14-day free trial. School and District plans can request a demo to explore the platform before committing.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, PayPal, and for School/District plans, we can arrange invoicing and PO-based payments.',
  },
  {
    question: 'Is AIVO FERPA and COPPA compliant?',
    answer:
      'Yes, AIVO is fully compliant with FERPA, COPPA, and other education data privacy regulations. We take student data protection seriously.',
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer:
      'Yes, we offer special pricing for non-profit educational organizations. Contact our sales team to learn more.',
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4" />
            Simple, transparent pricing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Invest in Every Learner&apos;s Future
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-10"
          >
            Choose the plan that fits your needs. All plans include our AI Virtual Brain tutor and
            comprehensive accessibility features.
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
                Save 20%
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-sm font-bold text-gray-900">
                    Most Popular
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
                      className={`text-3xl font-bold ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}
                    >
                      Custom Pricing
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-5xl font-bold ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}
                      >
                        ${billingPeriod === 'monthly' ? tier.price.monthly : tier.price.annual}
                      </span>
                      <span className={tier.highlighted ? 'text-violet-200' : 'text-gray-500'}>
                        /{tier.name === 'School' ? 'student/mo' : 'mo'}
                      </span>
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

                <Link href={tier.name === 'District' ? '/contact' : '/demo'}>
                  <Button
                    variant={
                      tier.highlighted
                        ? 'default'
                        : (tier.ctaVariant as 'default' | 'coral' | 'outline')
                    }
                    size="lg"
                    className={`w-full ${
                      tier.highlighted ? 'bg-white text-violet-700 hover:bg-gray-100' : ''
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
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-6">Trusted by educators and families nationwide</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <span className="text-xl font-semibold text-gray-400">FERPA Compliant</span>
            <span className="text-xl font-semibold text-gray-400">COPPA Certified</span>
            <span className="text-xl font-semibold text-gray-400">SOC 2 Type II</span>
            <span className="text-xl font-semibold text-gray-400">WCAG 2.1 AA</span>
          </div>
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
            Ready to Transform Learning?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Start your free trial today and see how AIVO can help every learner thrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="http://localhost:3000/register">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
