'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-coral-50 via-white to-salmon-50 overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-coral-200/30 to-salmon-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-theme-primary/20 to-coral-200/30 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-coral-100 to-salmon-100 border border-coral-200 mb-8"
          >
            <Sparkles className="w-4 h-4 text-coral-600" />
            <span className="text-sm font-medium text-coral-700">
              AI-Powered Personalized Learning
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
          >
            Learning That{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Adapts
            </span>
            <br />
            To Every Child
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-10"
          >
            Revolutionary educational platform that personalizes learning for K-12 students, 
            including comprehensive support for ADHD, Dyslexia, and Autism.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-coral-500 to-salmon-500 hover:from-coral-600 hover:to-salmon-600 text-white rounded-2xl px-8 py-6 text-lg font-semibold shadow-coral hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl px-8 py-6 text-lg font-semibold border-2 border-coral-300 text-coral-700 hover:bg-coral-50 transition-all duration-300"
            >
              Watch Demo
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-600"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-coral-500" />
              <span className="font-semibold">50,000+</span>
              <span>Happy Learners</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-salmon-500" />
              <span className="font-semibold">1,000+</span>
              <span>Schools Enrolled</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-theme-primary" />
              <span className="font-semibold">98%</span>
              <span>Parent Satisfaction</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image/Animation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-coral-100 to-salmon-100 p-1">
              <div className="rounded-3xl bg-white p-8">
                {/* Placeholder for hero image/video */}
                <div className="aspect-video bg-gradient-to-br from-coral-50 to-salmon-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <Sparkles className="w-16 h-16 text-coral-400" />
                    </motion.div>
                    <p className="mt-4 text-gray-600 font-medium">Interactive Learning Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
