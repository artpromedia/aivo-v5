'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How does AIVO personalize learning for my child?',
    answer: 'AIVO uses advanced AI to analyze your child\'s learning patterns, strengths, and challenges. It creates a unique learning path that adapts in real-time based on performance, engagement, and learning preferences.',
  },
  {
    question: 'What subjects and grade levels does AIVO cover?',
    answer: 'AIVO covers Math, Reading, Science, and Social Studies for grades K-12. Content aligns with Common Core and state standards, with specialized support for students with ADHD, Dyslexia, and Autism.',
  },
  {
    question: 'Is my child\'s data safe and private?',
    answer: 'Absolutely. AIVO is COPPA and FERPA compliant with bank-level encryption. We never sell data or show ads. Your child\'s information is used solely to personalize their learning experience.',
  },
  {
    question: 'How much time should my child spend on AIVO daily?',
    answer: 'We recommend 15-30 minutes per day for elementary students and 30-45 minutes for middle/high school students. AIVO\'s AI monitors engagement and suggests breaks to prevent burnout.',
  },
  {
    question: 'Can I try AIVO before committing?',
    answer: 'Yes! We offer a 30-day free trial with full access to all features. No credit card required. You can explore everything AIVO has to offer risk-free.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 bg-gradient-to-b from-white to-coral-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about AIVO
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full bg-white rounded-2xl p-6 text-left shadow-soft hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-coral-500 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {openIndex === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 text-gray-600 leading-relaxed"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
