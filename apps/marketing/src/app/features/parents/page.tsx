'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, Heart, Bell, BarChart3, Shield, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description: 'Real-time insights into your child\'s learning journey with detailed analytics.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Get alerts for milestones, areas needing attention, and daily summaries.',
  },
  {
    icon: MessageCircle,
    title: 'Teacher Communication',
    description: 'Stay connected with educators through integrated messaging.',
  },
  {
    icon: Shield,
    title: 'Safety Controls',
    description: 'Manage screen time, content filters, and privacy settings.',
  },
]

export default function ParentsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                For Parents
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Support Your Child's{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Success</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Stay involved in your child's education with real-time progress updates, 
                personalized insights, and tools to help them thrive.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button variant="coral" size="lg">Start Free Trial</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">View Pricing</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                  <Users className="w-24 h-24 text-emerald-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need to Stay Involved
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 p-6 rounded-2xl bg-gray-50"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
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

      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of parents supporting their children's learning journey.
          </p>
          <Link href="/demo">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
