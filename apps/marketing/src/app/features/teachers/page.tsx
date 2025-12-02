'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { GraduationCap, BookOpen, PenTool, Users, BarChart3, Lightbulb, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

const features = [
  { icon: PenTool, title: 'AI-Assisted Grading', description: 'Save hours with intelligent assessment tools.' },
  { icon: BookOpen, title: 'Lesson Planning', description: 'Generate personalized lesson plans aligned to standards.' },
  { icon: BarChart3, title: 'Student Insights', description: 'Understand each student\'s progress and needs.' },
  { icon: Users, title: 'Differentiation Tools', description: 'Easily adapt content for diverse learners.' },
]

export default function TeachersPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                For Teachers
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Your AI{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Teaching Assistant</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Free up time for what matters most—connecting with students. Let AIVO 
                handle grading, planning, and differentiation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/demo"><Button variant="coral" size="lg">Get Started Free</Button></Link>
                <Link href="/pricing"><Button variant="outline" size="lg">View Pricing</Button></Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                  <GraduationCap className="w-24 h-24 text-blue-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Tools That Save You Time</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="flex gap-4 p-6 rounded-2xl bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-blue-600" />
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

      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Join Thousands of Educators</h2>
          <p className="text-xl text-blue-100 mb-8">Start using AIVO free in your classroom today.</p>
          <Link href="/demo">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
