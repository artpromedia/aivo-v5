import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://aivolearning.com'),
  title: {
    default: 'AIVO Learning - Virtual Brain for Every Learner | AI-Powered Personalized Education',
    template: '%s | AIVO Learning'
  },
  description: 'Revolutionary adaptive learning platform with personalized AI agents (Virtual Brains) for neurodiverse K-12 and college learners. Supporting ADHD, Autism, Dyslexia, and all learning differences.',
  keywords: [
    'AIVO Learning',
    'virtual brain AI',
    'personalized learning',
    'neurodiverse education',
    'ADHD learning support',
    'autism education tools',
    'dyslexia assistance',
    'adaptive learning platform',
    'AI tutor',
    'special education technology',
    'inclusive education'
  ],
  authors: [{ name: 'AIVO Learning' }],
  creator: 'AIVO Learning',
  publisher: 'AIVO Learning',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aivolearning.com',
    siteName: 'AIVO Learning',
    title: 'AIVO Learning - Virtual Brain for Every Learner',
    description: 'Personalized AI agents that adapt to each student\'s unique learning style',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AIVO Learning Virtual Brain Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIVO Learning - AI-Powered Personalized Learning',
    description: 'Virtual Brain agents for every learner',
    site: '@aivolearning',
    creator: '@aivolearning',
    images: ['/twitter-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="AIVO Learning" />
        <meta name="apple-mobile-web-app-title" content="AIVO Learning" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
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
