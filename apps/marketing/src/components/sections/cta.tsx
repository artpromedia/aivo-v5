'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-coral-500 via-salmon-500 to-theme-primary relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Child&apos;s Learning Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the families who have discovered the power of personalized, AI-driven education.
            Our pilot program proved it works—now it&apos;s your turn.
          </p>

          {/* Pilot Proof Points */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-white/90">
              <Users className="w-5 h-5" />
              <span className="font-medium">150 pilot students</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-medium">4.9/5 parent rating</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Results in 3 months</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="http://localhost:3000/register">
              <Button
                size="lg"
                className="bg-white text-coral-600 hover:bg-gray-100 rounded-2xl px-8 py-6 text-lg font-semibold shadow-xl"
              >
                Join Early Access
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about#pilot-results">
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl px-8 py-6 text-lg font-semibold border-2 border-white text-white hover:bg-white/10"
              >
                See Pilot Results
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/80">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
