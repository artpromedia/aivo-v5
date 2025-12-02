'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Bell, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              AIVO Blog
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Insights & Stories
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Educational research, product updates, and success stories from the AIVO community.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-12 rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We're working on exciting content about AI in education, learning science, 
              and stories from educators and families using AIVO.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#newsletter">
                <Button variant="coral" size="lg">
                  Get Notified <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  Try AIVO Today
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
