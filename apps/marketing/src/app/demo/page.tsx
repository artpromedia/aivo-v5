'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, Users, Sparkles } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

export default function DemoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    organization: '',
    students: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-white">
        <Navigation />
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Demo Request Received!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for your interest in AIVO. Our team will contact you within 
              24 hours to schedule your personalized demo.
            </p>
            <div className="p-6 rounded-2xl bg-violet-50 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">What to expect:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-violet-600 mt-0.5" />
                  <span className="text-gray-700">30-minute personalized walkthrough</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-violet-600 mt-0.5" />
                  <span className="text-gray-700">Q&A with our education specialists</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-violet-600 mt-0.5" />
                  <span className="text-gray-700">Live demo of AI tutoring features</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
                <Calendar className="w-4 h-4" />
                Schedule a Demo
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                See AIVO in Action
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Get a personalized walkthrough of how AIVO can transform learning 
                for your students, children, or school district.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">30-Minute Session</h3>
                    <p className="text-gray-600">Quick, focused demo tailored to your needs</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Expert Guidance</h3>
                    <p className="text-gray-600">Our education specialists answer all your questions</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live AI Demo</h3>
                    <p className="text-gray-600">See our Virtual Brain tutor in action</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Request Your Demo
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I am a... *
                  </label>
                  <select
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  >
                    <option value="">Select your role</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="administrator">School Administrator</option>
                    <option value="district">District Official</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization/School
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions or Comments
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="coral"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Request Demo'}
                </Button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  By submitting, you agree to our{' '}
                  <a href="/privacy" className="text-violet-600 hover:underline">Privacy Policy</a>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
