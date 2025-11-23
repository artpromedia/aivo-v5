'use client'

import { motion } from 'framer-motion'
import { Heart, Clock, LineChart, Shield } from 'lucide-react'

const benefits = [
  {
    icon: Heart,
    title: 'Peace of Mind',
    description: 'Know your child is learning in a safe, ad-free environment designed specifically for their needs.',
  },
  {
    icon: Clock,
    title: 'Save Time',
    description: 'No more homework battles. AIVO makes learning engaging and manages practice schedules.',
  },
  {
    icon: LineChart,
    title: 'Track Progress',
    description: 'See exactly where your child excels and where they need support with detailed insights.',
  },
  {
    icon: Shield,
    title: 'Expert Support',
    description: 'Access resources from educators, therapists, and specialists whenever you need help.',
  },
]

export function ForParents() {
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
            Designed for{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Parents
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Support your child's learning journey with tools built for modern families
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-coral-100 to-salmon-100 mb-4">
                  <benefit.icon className="w-8 h-8 text-coral-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
