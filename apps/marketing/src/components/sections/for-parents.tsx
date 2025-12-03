'use client';

import { motion } from 'framer-motion';
import { Heart, Clock, LineChart, Shield, Star, BadgeCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const benefits = [
  {
    icon: Heart,
    title: 'Peace of Mind',
    description:
      'Know your child is learning in a safe, ad-free environment designed specifically for their needs.',
  },
  {
    icon: Clock,
    title: 'Save Time',
    description:
      'No more homework battles. AIVO makes learning engaging and manages practice schedules.',
  },
  {
    icon: LineChart,
    title: 'Track Progress',
    description:
      'See exactly where your child excels and where they need support with detailed insights.',
  },
  {
    icon: Shield,
    title: 'Expert Support',
    description:
      'Access resources from educators, therapists, and specialists whenever you need help.',
  },
];

const parentTestimonials = [
  {
    role: 'Pilot Program Parent',
    childInfo: 'Child, age 8',
    content:
      'AIVO has been a game-changer for our family. My child looks forward to learning time every day, and I can see real progress.',
    rating: 5,
    badge: 'Pilot Family',
  },
  {
    role: 'Pilot Program Parent',
    childInfo: 'Child, age 6',
    content:
      "The communication with my child's teachers through AIVO is incredible. I feel so much more involved in her education.",
    rating: 5,
    badge: 'Pilot Family',
  },
  {
    role: 'Pilot Parent & Healthcare Provider',
    childInfo: 'Child, age 7',
    content:
      'As both a parent and healthcare provider, I appreciate how AIVO respects our privacy while delivering results.',
    rating: 5,
    badge: 'Pilot Family',
  },
];

export function ForParents() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-coral-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Designed for{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Parents
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Support your child&apos;s learning journey with tools built for modern families
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Parent Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="font-display text-3xl font-bold text-gray-900 mb-4">
            What Pilot Parents Are Saying
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real feedback from families in our 3-month pilot program
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {parentTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <BadgeCheck className="w-3 h-3" />
                    {testimonial.badge}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed flex-grow text-sm">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="font-medium text-gray-900 text-sm">{testimonial.role}</div>
                  <div className="text-xs text-gray-500">{testimonial.childInfo}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pilot Success Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl mb-8">
            <p className="text-green-800">
              Our 3-month pilot program included <strong>150 neurodiverse learners</strong>. Parents
              rated their experience <strong>4.9 out of 5 stars</strong>.
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join the Families Who&apos;ve Seen Results
          </h3>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Start your free trial and experience what our pilot families discovered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="http://localhost:3000/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-coral-500 to-salmon-500 hover:from-coral-600 hover:to-salmon-600 text-white rounded-2xl px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-2xl px-8 border-2">
                Talk to a Parent Ambassador
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
