'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BarChart3, TrendingUp, Target, Award, Calendar, Download, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

const features = [
  { icon: TrendingUp, title: 'Growth Tracking', description: 'Visualize learning progress over time with clear trends.' },
  { icon: Target, title: 'Goal Setting', description: 'Set and track personalized learning objectives.' },
  { icon: Award, title: 'Achievement System', description: 'Celebrate milestones with badges and certificates.' },
  { icon: Download, title: 'Report Generation', description: 'Export detailed progress reports for parents and teachers.' },
]

export default function ProgressPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-6">
                <BarChart3 className="w-4 h-4" />
                Progress Analytics
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Track Every{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Milestone</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Comprehensive analytics that show exactly where students are excelling 
                and where they need support.
              </p>
              <Link href="/demo"><Button variant="coral" size="lg">See Demo</Button></Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                  <BarChart3 className="w-24 h-24 text-pink-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="flex gap-4 p-6 rounded-2xl bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
