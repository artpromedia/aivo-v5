'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Users, BarChart3, FileText } from 'lucide-react'

const benefits = [
  {
    icon: GraduationCap,
    title: 'Differentiated Instruction',
    description: 'Automatically provide each student with personalized content at their exact level.',
  },
  {
    icon: Users,
    title: 'Classroom Insights',
    description: 'Understand class-wide trends and individual student needs at a glance.',
  },
  {
    icon: BarChart3,
    title: 'Standards Alignment',
    description: 'Track progress against state standards and curriculum goals in real-time.',
  },
  {
    icon: FileText,
    title: 'IEP Support',
    description: 'Generate reports and track accommodations for students with IEPs and 504 plans.',
  },
]

export function ForTeachers() {
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
            Built for{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Educators
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empower your teaching with AI-driven insights and tools
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
