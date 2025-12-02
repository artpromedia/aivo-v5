'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone, Send, CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-white">
        <Navigation />
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Message Sent!</h1>
            <p className="text-xl text-gray-600">Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
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
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get in Touch</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about AIVO? We're here to help. Reach out and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">hello@aivo.edu</p>
                  <p className="text-gray-600">support@aivo.edu</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Office</h3>
                  <p className="text-gray-600">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="lg:col-span-2 p-8 rounded-3xl bg-gray-50">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea required rows={5} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all resize-none" />
              </div>
              <Button type="submit" variant="coral" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'} <Send className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
