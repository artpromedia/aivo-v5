'use client'

import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle, Brain, Users, Award, BookOpen, Star, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-theme-primary/5 via-white to-pink-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-theme-primary/20 to-pink-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-gradient-to-tr from-blue-200/30 to-theme-primary/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-theme-primary/10 to-pink-100 border border-theme-primary/20 mb-8"
          >
            <Brain className="w-5 h-5 text-theme-primary animate-pulse" />
            <span className="text-sm font-semibold text-theme-primary">
              Introducing Virtual Brain AI - A personalized learning companion for every child
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Welcome to{' '}
            <span className="text-gradient bg-gradient-to-r from-theme-primary to-pink-600 bg-clip-text text-transparent">
              AIVO Learning
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl">
              Where Every Mind Thrives
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed"
          >
            Revolutionary AI-powered learning platform that creates a personalized "Virtual Brain" 
            for each student. Supporting neurodiverse learners including those with ADHD, Autism, 
            Dyslexia, and all learning differences.
          </motion.p>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <Award className="w-5 h-5 text-theme-primary" />
              <span className="text-sm font-medium">EdTech Award 2024</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">50K+ Active Learners</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-theme-primary to-pink-600 hover:from-theme-primary/90 hover:to-pink-700 text-white rounded-xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsVideoOpen(true)}
              className="rounded-xl px-8 py-6 text-lg font-semibold border-2 border-theme-primary/30 text-theme-primary hover:bg-theme-primary/5 transition-all duration-300"
            >
              <PlayCircle className="mr-2 w-5 h-5" />
              Watch Demo (2 min)
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-600"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-theme-primary" />
              <span><strong className="text-gray-900">50,000+</strong> Active Learners</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-500" />
              <span><strong className="text-gray-900">AI-Powered</strong> Virtual Brain</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span><strong className="text-gray-900">K-12</strong> Full Curriculum</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual - Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-6xl">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-theme-primary to-pink-400 rounded-3xl blur-3xl opacity-20" />
            
            {/* Main Container */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-theme-primary/10 to-pink-100 p-1">
              <div className="rounded-3xl bg-white p-2">
                <div className="aspect-video bg-gradient-to-br from-theme-primary/5 to-pink-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Placeholder for Dashboard Preview */}
                  <div className="absolute inset-0 p-8">
                    <div className="bg-white rounded-2xl shadow-lg h-full p-6">
                      {/* Mock Dashboard Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-theme-primary to-pink-500 rounded-xl flex items-center justify-center">
                            <Brain className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">AIVO Learning Dashboard</h3>
                            <p className="text-sm text-gray-600">Welcome back, Alex!</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                            Streak: 7 days
                          </div>
                          <div className="px-3 py-1 bg-theme-primary/10 text-theme-primary rounded-lg text-sm font-medium">
                            Level 12
                          </div>
                        </div>
                      </div>
                      
                      {/* Mock Learning Cards */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                          <p className="font-semibold text-gray-900">Math</p>
                          <p className="text-xs text-gray-600">Continue lesson</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                          <Brain className="w-8 h-8 text-green-600 mb-2" />
                          <p className="font-semibold text-gray-900">Science</p>
                          <p className="text-xs text-gray-600">New activity</p>
                        </div>
                        <div className="bg-gradient-to-br from-theme-primary/5 to-theme-primary/10 rounded-xl p-4">
                          <Award className="w-8 h-8 text-theme-primary mb-2" />
                          <p className="font-semibold text-gray-900">Progress</p>
                          <p className="text-xs text-gray-600">View report</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Feature Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -left-10 top-20 bg-white rounded-2xl shadow-xl p-4 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-theme-primary to-pink-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Virtual Brain Active</p>
                  <p className="text-xs text-gray-600">Adapting in real-time</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -right-10 bottom-20 bg-white rounded-2xl shadow-xl p-4 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Achievement Unlocked</p>
                  <p className="text-xs text-gray-600">Math Master Level 5</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
          onClick={() => setIsVideoOpen(false)}
        >
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-2xl overflow-hidden">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/demo-video-id"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  )
}
