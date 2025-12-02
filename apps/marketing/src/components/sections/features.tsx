'use client'

import { motion } from 'framer-motion'
import { Brain, Users, Shield, Zap, Heart, Award } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Personalization',
    description: 'Advanced AI creates unique learning paths for each child based on their strengths, challenges, and learning style.',
    gradient: 'from-theme-primary to-pink-500',
  },
  {
    icon: Users,
    title: 'Neurodiversity Support',
    description: 'Specialized features for ADHD, Dyslexia, Autism, and other learning differences with evidence-based approaches.',
    gradient: 'from-coral-500 to-salmon-500',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'COPPA and FERPA compliant platform with bank-level encryption and no ads or data selling.',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Adaptation',
    description: 'Content difficulty and presentation style adjust instantly based on performance and engagement.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Heart,
    title: 'Emotional Intelligence',
    description: 'Recognizes frustration and provides encouragement, breaks, and emotional support when needed.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Award,
    title: 'Progress Tracking',
    description: 'Comprehensive dashboards for parents and teachers to monitor progress and celebrate achievements.',
    gradient: 'from-blue-500 to-indigo-500',
  },
]

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-coral-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything Your Child Needs to{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive features designed by educators, therapists, and AI experts 
            to support every learner's journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative h-full bg-white rounded-3xl p-8 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
