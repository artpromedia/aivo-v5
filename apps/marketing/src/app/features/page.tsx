'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, Users, School, Sparkles, BarChart3, Accessibility, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'

const features = [
  {
    icon: Brain,
    title: 'AI Virtual Brain',
    description: 'Personalized AI tutor that adapts to each student\'s learning style and pace.',
    href: '/features/ai-tutoring',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Sparkles,
    title: 'Adaptive Learning',
    description: 'Smart curriculum that adjusts difficulty based on student performance.',
    href: '/features/adaptive-learning',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'For Parents',
    description: 'Track progress, receive insights, and support your child\'s education journey.',
    href: '/features/parents',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: School,
    title: 'For Schools',
    description: 'District-wide analytics, curriculum alignment, and teacher tools.',
    href: '/features/schools',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Detailed insights into learning outcomes and growth trajectories.',
    href: '/features/progress',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Accessibility,
    title: 'Accessibility',
    description: 'Inclusive design ensuring every learner can succeed.',
    href: '/features/accessibility',
    color: 'from-indigo-500 to-violet-500',
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for{' '}
              <span className="text-gradient">Every Learner</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how AIVO transforms education with AI-powered personalization,
              adaptive learning paths, and comprehensive progress tracking.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={feature.href}>
                  <div className="group h-full p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-violet-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <span className="inline-flex items-center text-violet-600 font-medium">
                      Learn more <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
