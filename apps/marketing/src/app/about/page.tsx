'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, Target, Users, Shield, ArrowRight, Linkedin, Quote } from 'lucide-react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: Heart,
    name: 'Empathy First',
    description: 'Every feature is designed with neurodiverse learners at the center.',
  },
  {
    icon: Target,
    name: 'Evidence-Based',
    description: 'Grounded in special education best practices and continuous improvement.',
  },
  {
    icon: Users,
    name: 'Community Driven',
    description: 'Built with continuous feedback from families, educators, and therapists.',
  },
  {
    icon: Shield,
    name: 'Accessibility',
    description: 'Committed to making quality education accessible to all learners.',
  },
];

const advisors = [
  {
    name: 'Dr. Ike Osuji',
    role: 'Chairman, Advisory Board & Medical Advisor',
    expertise: 'Family Physician',
    bio: 'Chairman of the Advisory Board bringing extensive medical expertise in child development and neurodiversity to guide platform health integration.',
    initials: 'IO',
  },
  {
    name: 'Dr. Patrick Ukata',
    role: 'Academic Advisor',
    expertise: 'Professor at Johns Hopkins',
    bio: 'Leading academic voice in educational technology and adaptive learning systems.',
    initials: 'PU',
  },
  {
    name: 'Nnamdi Uzokwe',
    role: 'Strategic Advisor',
    expertise: 'Retired Navy Veteran & Med Device Sales Director',
    bio: 'Combines military discipline with medical device industry expertise to drive operational excellence.',
    initials: 'NU',
  },
  {
    name: 'Edward Hamilton',
    role: 'Special Education Advisor',
    expertise: '9/11 NYPD Veteran & Special Education Advocate',
    bio: 'Dedicated special education expert bringing decades of advocacy and real-world classroom insights.',
    initials: 'EH',
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
            Our Mission:{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Every Mind Matters
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            AIVO was founded by parents and educators who believe that neurodiversity is a strength.
            We&apos;re building the future of personalized education, one learner at a time.
          </motion.p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Founder</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-xl">
                <span className="text-5xl font-bold text-white">OO</span>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Ofem Ekapong Ofem</h3>
                <p className="text-violet-600 font-medium mb-4">Founder & CEO</p>
                <p className="text-gray-600 mb-6">
                  Passionate advocate for neurodiverse education and parent dedicated to creating
                  personalized learning solutions for every child.
                </p>
                <a
                  href="https://linkedin.com/in/ofem-ofem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  Connect on LinkedIn
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder Quote */}
      <section className="py-16 px-4 bg-purple-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Quote className="w-12 h-12 text-violet-300 mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed italic">
              &quot;Every child deserves an education that adapts to their unique learning style.
              AIVO was born from the belief that AI can create truly personalized learning
              experiences that help neurodiverse students thrive. With guidance from our exceptional
              advisory board of medical professionals, educators, and advocates, we&apos;re making
              this vision a reality.&quot;
            </blockquote>
            <p className="font-semibold text-gray-900">— Ofem Ekapong Ofem</p>
            <p className="text-sm text-gray-500">Founder & CEO</p>
          </motion.div>
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

      {/* Advisory Board Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Advisory Board</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              AIVO is guided by distinguished experts in medicine, education, and special needs
              advocacy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advisors.map((advisor, index) => (
              <motion.div
                key={advisor.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">{advisor.initials}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{advisor.name}</h3>
                <p className="text-violet-600 text-sm font-medium mb-1">{advisor.role}</p>
                <p className="text-xs text-gray-500 mb-3">{advisor.expertise}</p>
                <p className="text-gray-600 text-sm">{advisor.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Us in Revolutionizing Education
          </h2>
          <p className="text-xl text-violet-100 mb-8 max-w-3xl mx-auto">
            Together, we&apos;re building a world where every learner has access to personalized,
            compassionate education that celebrates neurodiversity and unlocks human potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/careers">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100">
                Careers at AIVO
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Partner with Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
