'use client'

import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Family',
    price: '$29',
    period: '/month',
    description: 'Perfect for families with 1-3 children',
    features: [
      'Up to 3 learner profiles',
      'Full AI personalization',
      'Progress tracking',
      'Parent dashboard',
      'Mobile app access',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'School',
    price: '$499',
    period: '/month',
    description: 'For classrooms and small schools',
    features: [
      'Up to 50 learner profiles',
      'Advanced analytics',
      'Teacher collaboration tools',
      'IEP support & tracking',
      'Priority support',
      'Professional development',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    popular: true,
  },
  {
    name: 'District',
    price: 'Custom',
    period: '',
    description: 'For school districts and large organizations',
    features: [
      'Unlimited learner profiles',
      'District-wide analytics',
      'Dedicated success manager',
      'Custom training',
      'SIS integration',
      'White-label options',
      '24/7 support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export function Pricing() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include a 30-day free trial.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-coral-500 to-salmon-500 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <div className={`h-full bg-white rounded-3xl p-8 ${
                plan.popular
                  ? 'ring-2 ring-coral-500 shadow-coral'
                  : 'shadow-soft hover:shadow-xl'
              } transition-all duration-300`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-coral-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl ${
                    plan.popular
                      ? 'bg-gradient-to-r from-coral-500 to-salmon-500 hover:from-coral-600 hover:to-salmon-600 text-white'
                      : 'border-2 border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
