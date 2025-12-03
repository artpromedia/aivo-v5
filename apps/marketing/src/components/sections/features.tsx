'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Users,
  Shield,
  Zap,
  Heart,
  BookOpen,
  Award,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Virtual Brain',
    description:
      'Each student gets a personalized AI agent that creates unique learning paths based on their strengths, challenges, and cognitive patterns.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'IEP Goal Alignment',
    description:
      'Syncs with Individual Education Programs. Track IEP goals, generate progress reports, and share with teachers and therapists.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Neurodiversity Support',
    description:
      'Specialized features for ADHD, Dyslexia, Autism, and other learning differences with evidence-based therapeutic approaches.',
    gradient: 'from-coral-500 to-salmon-500',
  },
  {
    icon: Shield,
    title: 'FERPA & COPPA Compliant',
    description:
      "Enterprise-grade security with bank-level encryption. No ads, no data selling. Complete privacy for your child's educational data.",
    gradient: 'from-green-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Adaptation',
    description:
      'Content difficulty and presentation style adjust instantly based on performance, attention levels, and engagement patterns.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Heart,
    title: 'Emotional Intelligence',
    description:
      'Recognizes frustration, anxiety, and disengagement. Provides encouragement, recommends breaks, and offers emotional support when needed.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: BookOpen,
    title: 'Full K-12 Curriculum',
    description:
      'Comprehensive coverage across Math, Reading, Science, and all core subjects. One platform for complete academic support.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Award,
    title: 'Progress Tracking',
    description:
      'Comprehensive dashboards for parents and teachers to monitor progress, celebrate achievements, and collaborate on goals.',
    gradient: 'from-blue-500 to-indigo-500',
  },
];

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
            Features validated by our pilot program with 150 neurodiverse learners and their
            families.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative h-full bg-white rounded-3xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div
                  className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pilot Validation Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              All features tested and validated with 150 students in our pilot program
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
