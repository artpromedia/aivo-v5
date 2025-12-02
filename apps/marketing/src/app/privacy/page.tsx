import { Metadata } from 'next'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | AIVO',
  description: 'AIVO Privacy Policy - How we protect and handle your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: December 2, 2024</p>
          
          <h2>Introduction</h2>
          <p>
            AIVO ("we", "our", or "us") is committed to protecting the privacy of children, 
            parents, teachers, and all users of our educational platform. This Privacy Policy 
            explains how we collect, use, and protect your information.
          </p>

          <h2>Information We Collect</h2>
          <h3>Account Information</h3>
          <p>
            When you create an account, we collect your name, email address, and role 
            (student, parent, teacher, or administrator).
          </p>

          <h3>Learning Data</h3>
          <p>
            We collect information about learning activities, progress, and interactions 
            with our AI tutor to personalize the educational experience.
          </p>

          <h2>Children's Privacy (COPPA Compliance)</h2>
          <p>
            We comply with the Children's Online Privacy Protection Act (COPPA). For users 
            under 13, we require verifiable parental consent before collecting personal information.
          </p>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>Provide personalized learning experiences</li>
            <li>Track and report educational progress</li>
            <li>Improve our AI tutoring algorithms</li>
            <li>Communicate important updates</li>
            <li>Ensure platform safety and security</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption, 
            secure data storage, and regular security audits to protect your information.
          </p>

          <h2>FERPA Compliance</h2>
          <p>
            For educational institutions, we comply with the Family Educational Rights 
            and Privacy Act (FERPA) regarding student education records.
          </p>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt out of non-essential communications</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            For privacy-related questions, contact us at{' '}
            <a href="mailto:privacy@aivo.edu">privacy@aivo.edu</a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
