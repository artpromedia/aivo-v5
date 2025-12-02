'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Accessibility, Eye, Ear, Hand, Brain, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

const features = [
  { icon: Eye, title: 'Visual Accessibility', description: 'High contrast modes, screen reader support, and adjustable text sizes.' },
  { icon: Ear, title: 'Audio Support', description: 'Text-to-speech, captions, and audio descriptions for all content.' },
  { icon: Hand, title: 'Motor Accessibility', description: 'Keyboard navigation, switch control, and voice commands.' },
  { icon: Brain, title: 'Cognitive Support', description: 'Simplified interfaces, reading guides, and focus tools.' },
]

const compliance = ['WCAG 2.1 AA Compliant', 'Section 508 Compliant', 'ADA Compliant', 'VPAT Available']

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
                <Accessibility className="w-4 h-4" />
                Accessibility
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Learning for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Everyone</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                AIVO is built with accessibility at its core, ensuring every learner 
                can access high-quality, personalized education.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {compliance.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                    <CheckCircle2 className="w-3 h-3" /> {item}
                  </span>
                ))}
              </div>
              <Link href="/demo"><Button variant="coral" size="lg">Try AIVO Free</Button></Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                  <Accessibility className="w-32 h-32 text-indigo-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Inclusive by Design</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="flex gap-4 p-6 rounded-2xl bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
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
