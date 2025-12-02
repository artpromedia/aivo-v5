'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  GraduationCap,
  Brain,
  Gamepad2,
  Trophy,
  Sparkles,
  Headphones,
  Palette,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Navigation } from '@/components/shared/navigation';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Brain,
    title: 'Your Personal AI Tutor',
    description:
      'Meet Brain, your smart study buddy who explains things in ways that make sense to you.',
  },
  {
    icon: Gamepad2,
    title: 'Learning That Feels Like Playing',
    description: 'Earn points, unlock achievements, and level up as you master new skills.',
  },
  {
    icon: Trophy,
    title: 'Celebrate Your Wins',
    description: "Track your streaks, collect badges, and see how much you've grown.",
  },
  {
    icon: Headphones,
    title: 'Learn Your Way',
    description: 'Videos, games, reading, or hands-on activities - choose what works best for you.',
  },
  {
    icon: Palette,
    title: 'Make It Yours',
    description:
      'Pick your favorite colors, themes, and avatar to create your perfect learning space.',
  },
  {
    icon: Sparkles,
    title: 'Gets Smarter With You',
    description: 'The more you use AIVO, the better it knows how to help you succeed.',
  },
];

const subjects = [
  { name: 'Math', color: 'from-blue-500 to-indigo-500', emoji: '➗' },
  { name: 'Reading', color: 'from-emerald-500 to-teal-500', emoji: '📚' },
  { name: 'Science', color: 'from-amber-500 to-orange-500', emoji: '🔬' },
  { name: 'Social Studies', color: 'from-purple-500 to-pink-500', emoji: '🌎' },
];

const testimonials = [
  {
    quote: 'AIVO makes learning so fun! I actually want to do my homework now.',
    name: 'Maya, Age 10',
    grade: '5th Grade',
  },
  {
    quote: 'Brain helps me understand math problems without making me feel dumb.',
    name: 'Jackson, Age 13',
    grade: '7th Grade',
  },
  {
    quote: 'I love earning badges! I have 47 so far.',
    name: 'Sofia, Age 8',
    grade: '3rd Grade',
  },
];

export default function StudentsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-violet-50 via-pink-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 text-violet-700 text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                For Students
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Learning That&apos;s Actually{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">
                  Fun!
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Say goodbye to boring homework! AIVO&apos;s AI tutor &quot;Brain&quot; makes
                learning feel like playing your favorite game. Earn points, unlock achievements, and
                become a learning superstar! 🌟
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="http://localhost:3000/register">
                  <Button variant="coral" size="lg" className="gap-2">
                    <Sparkles className="w-5 h-5" />
                    Start Learning Free
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg">
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex flex-col items-center justify-center gap-4 p-8">
                  <Brain className="w-24 h-24 text-violet-500" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">Hi, I&apos;m Brain! 👋</p>
                    <p className="text-gray-600">Your personal AI study buddy</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['🎮', '🏆', '⭐', '🚀'].map((emoji, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="text-2xl"
                      >
                        {emoji}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -left-6 top-20 bg-white rounded-2xl shadow-lg p-3"
              >
                <span className="text-2xl">🎯</span>
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -right-6 bottom-20 bg-white rounded-2xl shadow-lg p-3"
              >
                <span className="text-2xl">💯</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Master All Your Subjects
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${subject.color} text-white text-center`}
              >
                <span className="text-4xl mb-2 block">{subject.emoji}</span>
                <p className="font-bold">{subject.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Students Love AIVO</h2>
            <p className="text-gray-600">
              It&apos;s like having a super-smart friend who&apos;s always ready to help! 🤓
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white border-2 border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What Students Say 💬
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-md"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.grade}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Level Up Your Learning? 🚀
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Join thousands of students who are having fun while getting smarter!
          </p>
          <Link href="http://localhost:3000/register">
            <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 gap-2">
              <Sparkles className="w-5 h-5" />
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="mt-4 text-violet-200 text-sm">
            Ask your parents to sign you up - it&apos;s free to try!
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
