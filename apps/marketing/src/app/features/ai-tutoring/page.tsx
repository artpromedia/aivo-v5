'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, MessageSquare, Lightbulb, Target, Clock, Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

const benefits = [
  'Personalized learning paths for every student',
  'Real-time feedback and encouragement',
  'Adapts to individual learning styles',
  'Available 24/7 for homework help',
  'Safe, child-friendly AI interactions',
  'Supports multiple subjects and grade levels',
]

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Natural Conversations',
    description: 'Students interact with AIVO through friendly, age-appropriate dialogue.',
  },
  {
    icon: Lightbulb,
    title: 'Concept Explanations',
    description: 'Complex topics broken down into digestible, understandable pieces.',
  },
  {
    icon: Target,
    title: 'Targeted Practice',
    description: 'Exercises focused on areas where students need the most improvement.',
  },
  {
    icon: Clock,
    title: 'Spaced Repetition',
    description: 'Scientifically-proven review schedules for long-term retention.',
  },
]

export default function AITutoringPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                AI-Powered Tutoring
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Meet Your Child's Personal{' '}
                <span className="text-gradient">AI Tutor</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                AIVO's Virtual Brain provides personalized, one-on-one tutoring 
                that adapts to each student's unique learning journey.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button variant="coral" size="lg">
                    Try Free Demo
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                  <Brain className="w-32 h-32 text-violet-500" />
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 p-4 bg-white rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">98% Satisfaction</p>
                    <p className="text-sm text-gray-500">From parents & students</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Parents Choose AIVO
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-violet-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {capabilities.map((capability, index) => (
                <motion.div
                  key={capability.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl bg-gray-50"
                >
                  <capability.icon className="w-8 h-8 text-violet-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{capability.title}</h3>
                  <p className="text-sm text-gray-600">{capability.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Child's Learning?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Start with a free trial and see the difference AI-powered tutoring can make.
          </p>
          <Link href="/demo">
            <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100">
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
