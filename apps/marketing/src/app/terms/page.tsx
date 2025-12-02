import { Metadata } from 'next'
import { Navigation } from '@/components/shared/navigation'
import { Footer } from '@/components/shared/footer'

export const metadata: Metadata = {
  title: 'Terms of Service | AIVO',
  description: 'AIVO Terms of Service - Terms and conditions for using our platform.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: December 2, 2024</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using AIVO's educational platform, you agree to be bound 
            by these Terms of Service. If you do not agree, please do not use our services.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            AIVO provides an AI-powered educational platform offering personalized tutoring, 
            progress tracking, and learning management tools for students, parents, teachers, 
            and educational institutions.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account 
            credentials and for all activities under your account. Parents/guardians 
            must create and manage accounts for children under 13.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>Share account credentials with others</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Upload harmful or inappropriate content</li>
            <li>Interfere with the service's operation</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of AIVO are owned by us and 
            protected by intellectual property laws. You may not copy, modify, or 
            distribute our content without permission.
          </p>

          <h2>6. Subscription and Payment</h2>
          <p>
            Paid plans are billed according to the selected subscription period. 
            You may cancel at any time, with access continuing until the end of 
            your current billing period.
          </p>

          <h2>7. Disclaimer</h2>
          <p>
            AIVO is provided "as is" without warranties of any kind. While we strive 
            to provide high-quality educational content, we do not guarantee specific 
            learning outcomes.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, AIVO shall not be liable for any 
            indirect, incidental, or consequential damages arising from your use of 
            our services.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We may update these terms periodically. Continued use of AIVO after changes 
            constitutes acceptance of the new terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these terms? Contact us at{' '}
            <a href="mailto:legal@aivo.edu">legal@aivo.edu</a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
