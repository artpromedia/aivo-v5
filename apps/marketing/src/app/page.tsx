import { HeroSection } from '@/components/marketing/hero/hero-section'
import { Features } from '@/components/sections/features'
import { HowItWorks } from '@/components/sections/how-it-works'
import { ForParents } from '@/components/sections/for-parents'
import { ForTeachers } from '@/components/sections/for-teachers'
import { Testimonials } from '@/components/sections/testimonials'
import { Pricing } from '@/components/sections/pricing'
import { FAQ } from '@/components/sections/faq'
import { CTA } from '@/components/sections/cta'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="overflow-x-hidden">
        <HeroSection />
        <Features />
        <HowItWorks />
        <ForParents />
        <ForTeachers />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
