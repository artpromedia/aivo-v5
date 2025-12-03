'use client';

import { motion } from 'framer-motion';
import { Star, BadgeCheck } from 'lucide-react';

const testimonials = [
  {
    role: 'Pilot Program Parent',
    childInfo: 'Child with ADHD, Grade 3',
    content:
      'AIVO has been a game-changer for our family. My son actually looks forward to learning now, and his confidence has soared!',
    rating: 5,
    avatar: 'P1',
    badge: 'Pilot Family',
  },
  {
    role: 'Pilot Program Educator',
    childInfo: 'Special Education Teacher',
    content:
      "The insights I get from AIVO help me better support each student. It's like having an AI teaching assistant for every child.",
    rating: 5,
    avatar: 'E1',
    badge: 'Pilot Educator',
  },
  {
    role: 'Pilot Program Parent',
    childInfo: 'Child with Dyslexia, Grade 5',
    content:
      "Finally, a platform that truly understands my daughter's needs. Her reading has improved dramatically in just 3 months.",
    rating: 5,
    avatar: 'P2',
    badge: 'Pilot Family',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-b from-coral-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Loved by{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Pilot Families & Educators
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real feedback from our 150-student pilot program
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-soft hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-coral-500 text-coral-500" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <BadgeCheck className="w-3 h-3" />
                    {testimonial.badge}
                  </span>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed flex-grow">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral-500 to-salmon-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.role}</div>
                    <div className="text-sm text-gray-600">{testimonial.childInfo}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pilot Success Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-4 bg-gradient-to-r from-coral-50 to-salmon-50 border border-coral-200 rounded-2xl">
            <p className="text-gray-700">
              These testimonials are from real families in our 3-month pilot program with 150
              neurodiverse learners.
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900">4.9/5</span>
              <span className="text-sm text-gray-500">from pilot parents</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
