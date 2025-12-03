'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const steps = [
  {
    step: '01',
    title: 'Quick Assessment',
    description:
      "Start with a fun 15-minute baseline assessment to understand your child's current level and learning preferences.",
  },
  {
    step: '02',
    title: 'Personalized Plan',
    description:
      "Our AI creates a custom learning path tailored to your child's strengths, challenges, and interests.",
  },
  {
    step: '03',
    title: 'Adaptive Learning',
    description:
      'Your child learns through interactive activities that adjust in real-time based on their performance.',
  },
  {
    step: '04',
    title: 'Track Progress',
    description:
      'Monitor achievements through detailed dashboards and celebrate milestones together.',
  },
];

const pilotStats = [
  {
    icon: Users,
    number: '150',
    label: 'pilot students',
    title: 'Real Students, Real Results',
    description:
      'Our pilot program included students with ADHD, Autism, Dyslexia, and other learning differences.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Star,
    number: '4.9/5',
    label: 'parent satisfaction',
    title: 'Parents Love AIVO',
    description: "Pilot families rated their experience and their children's progress highly.",
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: TrendingUp,
    number: '3 mo',
    label: 'to see improvement',
    title: 'Fast Results',
    description:
      'Pilot students showed measurable learning outcome improvements within just 3 months.',
    gradient: 'from-green-500 to-teal-500',
  },
];

export function HowItWorks() {
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
            How It{' '}
            <span className="bg-gradient-to-r from-coral-500 to-salmon-500 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in minutes and see results in days
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-coral-500 to-salmon-500 text-white font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full">
                  <ArrowRight className="w-6 h-6 text-coral-300 mx-auto" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="http://localhost:3000/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-coral-500 to-salmon-500 hover:from-coral-600 hover:to-salmon-600 text-white rounded-2xl px-8 shadow-coral"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Pilot Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-24 pt-16 border-t border-gray-100"
        >
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Proven Results from Our{' '}
              <span className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
                Pilot Program
              </span>
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real outcomes from 150 neurodiverse learners over 3 months
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pilotStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-3xl p-8 shadow-soft hover:shadow-xl transition-all duration-300 text-center h-full">
                  <div
                    className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="mb-4">
                    <span
                      className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                    >
                      {stat.number}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{stat.title}</h4>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Early Access CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="http://localhost:3000/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-theme-primary to-pink-600 hover:from-theme-primary/90 hover:to-pink-700 text-white rounded-2xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Join Early Access
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Be among the first families to experience AIVO after our successful pilot
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
