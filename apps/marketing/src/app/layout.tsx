import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AIVO - AI-Powered Personalized Learning for Every Child',
  description: 'Revolutionary educational platform that adapts to each child\'s unique learning style, providing personalized support for K-12 students including those with ADHD, Dyslexia, and Autism.',
  keywords: 'personalized learning, AI education, special education, ADHD support, dyslexia tools, autism learning, K-12 education',
  authors: [{ name: 'AIVO Education' }],
  openGraph: {
    title: 'AIVO - Personalized Learning Revolution',
    description: 'AI-powered education that adapts to your child',
    images: ['/og-image.png'],
    url: 'https://aivo.education',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIVO - AI Learning Platform',
    description: 'Personalized education for every child',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
