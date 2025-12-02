'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { School, BarChart3, Users, Settings, Shield, FileText, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: BarChart3,
    title: 'District Analytics',
    description: 'Comprehensive dashboards showing performance across all schools.',
  },
  {
    icon: Users,
    title: 'Teacher Tools',
    description: 'Empower educators with AI-assisted lesson planning and grading.',
  },
  {
    icon: Settings,
    title: 'Curriculum Alignment',
    description: 'Map content to state standards and learning objectives.',
  },
  {
    icon: Shield,
    title: 'FERPA Compliant',
    description: 'Enterprise-grade security protecting student data.',
  },
]

export default function SchoolsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                <School className="w-4 h-4" />
                For Schools & Districts
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Transform Learning{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">District-Wide</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Scalable AI-powered education platform with comprehensive analytics, 
                curriculum alignment, and tools for teachers and administrators.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button variant="coral" size="lg">Schedule Demo</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">View Pricing</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                  <School className="w-24 h-24 text-orange-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Enterprise Features</h2>
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
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-orange-600" />
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

      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready for a District Demo?</h2>
          <p className="text-xl text-orange-100 mb-8">
            See how AIVO can transform education across your entire district.
          </p>
          <Link href="/demo">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
              Contact Sales <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
