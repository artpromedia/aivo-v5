'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, Target, Users, Lightbulb, Award, Globe, ArrowRight } from 'lucide-react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: Heart,
    name: 'Every Learner Matters',
    description:
      'We believe every child deserves personalized education that meets them where they are and helps them reach their full potential.',
  },
  {
    icon: Target,
    name: 'Evidence-Based',
    description:
      'Our approach is grounded in learning science and continuously refined through research and data-driven insights.',
  },
  {
    icon: Users,
    name: 'Inclusive by Design',
    description:
      "Accessibility isn't an afterthought—it's built into everything we create, ensuring all learners can thrive.",
  },
  {
    icon: Lightbulb,
    name: 'Innovation with Purpose',
    description:
      'We leverage cutting-edge AI not for novelty, but to solve real challenges in education.',
  },
];

const stats = [
  { value: '500K+', label: 'Learners Served' },
  { value: '2,500+', label: 'Partner Schools' },
  { value: '50+', label: 'States & Countries' },
  { value: '98%', label: 'Parent Satisfaction' },
];

const team = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Co-Founder & CEO',
    image: '/team/sarah-chen.jpg',
    bio: 'Former Stanford education researcher with 15 years in ed-tech.',
  },
  {
    name: 'Marcus Williams',
    role: 'Co-Founder & CTO',
    image: '/team/marcus-williams.jpg',
    bio: 'AI/ML engineer who led personalization at leading ed-tech companies.',
  },
  {
    name: 'Dr. Elena Rodriguez',
    role: 'Chief Learning Officer',
    image: '/team/elena-rodriguez.jpg',
    bio: 'Curriculum specialist and former special education administrator.',
  },
  {
    name: 'David Park',
    role: 'VP of Engineering',
    image: '/team/david-park.jpg',
    bio: 'Previously built scalable systems at major tech companies.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Reimagining Education for
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {' '}
              Every Learner
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            AIVO was founded on a simple belief: every child learns differently, and every child
            deserves an education that adapts to them. We&apos;re building the AI-powered future of
            personalized learning.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
                <Target className="w-4 h-4" />
                Our Mission
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Democratizing World-Class Education
              </h2>
              <p className="text-gray-600 mb-6">
                We envision a world where every child—regardless of their location, background, or
                learning differences—has access to a patient, knowledgeable tutor who understands
                exactly how they learn best.
              </p>
              <p className="text-gray-600">
                Our AI Virtual Brain doesn&apos;t replace teachers—it amplifies them, handling
                personalized practice and immediate feedback while freeing educators to do what they
                do best: inspire, mentor, and connect.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Globe className="w-32 h-32 text-violet-300 mx-auto mb-4" />
                  <p className="text-violet-600 font-medium">Education Without Borders</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-violet-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything we build is guided by these core principles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.name}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Leadership</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A team of educators, technologists, and advocates united by a passion for learning.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="text-center"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-200 to-purple-200 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-violet-600 text-sm mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Award className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Recognition</h2>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <span className="text-lg font-semibold">EdTech Breakthrough 2024</span>
            <span className="text-lg font-semibold">ASU+GSV Cup Finalist</span>
            <span className="text-lg font-semibold">Fast Company Innovation</span>
            <span className="text-lg font-semibold">ISTE Seal of Alignment</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Us in Transforming Education
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Whether you&apos;re a parent, teacher, or school leader, we&apos;d love to help you
            bring personalized learning to your students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100">
                Schedule a Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
