'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Gamepad2,
  Trophy,
  Users,
  Sparkles,
  ArrowRight,
  Star,
  BookOpen,
  Palette,
  Music,
  Calculator,
} from 'lucide-react';
import { Navigation } from '@/components/shared/navigation';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';

const gameFeatures = [
  {
    icon: Gamepad2,
    title: 'Fun Learning Games',
    description: 'Turn learning into an adventure with interactive games designed just for you!',
    gradient: 'from-pink-500 to-red-500',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    description: 'Collect badges, unlock achievements, and show off your progress!',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Learn with Friends',
    description: 'Work together on fun projects and help each other learn new things.',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    icon: Sparkles,
    title: 'Magic Moments',
    description: 'Discover amazing facts and celebrate every step of your learning journey!',
    gradient: 'from-purple-500 to-pink-500',
  },
];

const learningActivities = [
  {
    title: 'Reading Adventures',
    emoji: '📚',
    description: 'Go on exciting reading journeys with stories that adapt to your interests!',
    gradient: 'from-blue-400 to-purple-500',
  },
  {
    title: 'Math Magic',
    emoji: '🎲',
    description: 'Solve puzzles and play number games that make math super fun!',
    gradient: 'from-green-400 to-blue-500',
  },
  {
    title: 'Creative Corner',
    emoji: '🎨',
    description: 'Draw, create, and express yourself while learning new skills!',
    gradient: 'from-pink-400 to-red-500',
  },
  {
    title: 'Music & Movement',
    emoji: '🎵',
    description: 'Dance, sing, and move while practicing important skills!',
    gradient: 'from-yellow-400 to-orange-500',
  },
];

const achievements = [
  { emoji: '⭐', name: 'Reading Star', requirement: 'Read 10 stories' },
  { emoji: '🧙‍♀️', name: 'Math Wizard', requirement: 'Complete 20 math games' },
  { emoji: '🎨', name: 'Creative Genius', requirement: 'Finish 5 art projects' },
  { emoji: '🦸‍♂️', name: 'Helper Hero', requirement: 'Help 3 classmates' },
  { emoji: '🏆', name: 'Focus Champion', requirement: 'Stay focused for 30 minutes' },
  { emoji: '🧩', name: 'Problem Solver', requirement: 'Solve 15 puzzles' },
];

const testimonials = [
  {
    avatar: '🦁',
    age: 8,
    quote: 'AIVO makes learning so much fun! I love the games and earning stars.',
  },
  {
    avatar: '🦄',
    age: 7,
    quote: 'My favorite part is the art activities. I made a rainbow story!',
  },
  {
    avatar: '🚀',
    age: 9,
    quote: "I used to think math was hard, but now it's my favorite subject!",
  },
];

export default function StudentsPage() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 relative">
        {/* Floating Animated Elements */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-32 left-8 text-5xl"
        >
          🎈
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-40 right-12 text-5xl"
        >
          🌈
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute bottom-32 left-16 text-4xl"
        >
          ⭐
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          className="absolute bottom-40 right-20 text-4xl"
        >
          🦋
        </motion.div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-purple-700 font-bold mb-8"
          >
            🌟 Just for Students! 🌟
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
          >
            Learning is{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500">
              Super Fun!
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl text-gray-600 mb-10"
          >
            Play games, earn rewards, and become a learning superstar! 🚀
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="http://localhost:3000/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl"
              >
                🎮 Start Playing Now!
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-purple-300 text-purple-700 text-lg px-8 py-6 rounded-2xl hover:bg-purple-50"
              >
                🎬 Watch Fun Videos
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Game Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Learning with AIVO is Awesome! 🎉
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="relative group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity`}
                />
                <div className="relative p-6 rounded-3xl border-2 border-gray-100 bg-white hover:shadow-xl transition-all">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Activities Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Cool Things You Can Do! 🌟</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningActivities.map((activity, index) => (
              <motion.div
                key={activity.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`p-6 rounded-3xl bg-gradient-to-br ${activity.gradient} text-white shadow-xl`}
              >
                <span className="text-5xl block mb-4">{activity.emoji}</span>
                <h3 className="font-bold text-xl mb-2">{activity.title}</h3>
                <p className="text-white/90 text-sm">{activity.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Gallery */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Badges You Can Earn! 🏅</h2>
            <p className="text-gray-600 text-lg">Complete challenges to collect them all!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((badge, index) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring', bounce: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-amber-200 text-center hover:shadow-lg transition-shadow"
              >
                <span className="text-4xl block mb-2">{badge.emoji}</span>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{badge.name}</h4>
                <p className="text-xs text-gray-500">{badge.requirement}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Kids Are Saying! 💬</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-100"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-4xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        Pilot Student
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Age {testimonial.age}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg italic">&quot;{testimonial.quote}&quot;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Learning Adventure? 🚀
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join kids who are having fun while learning amazing new things every day!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="http://localhost:3000/register">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-2xl shadow-xl font-bold"
                >
                  🎮 Start Playing Now!
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl"
                >
                  🎬 Watch Fun Videos
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-white/80">
              Ask your parents to help you get started - it&apos;s free to try! 🎉
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
