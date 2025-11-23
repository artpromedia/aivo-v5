# AIVO Marketing Website

Modern, accessible marketing website for AIVO built with Next.js 14, showcasing AI-powered personalized learning.

## Features

- 🎨 Beautiful coral/salmon brand design with rounded corners
- ♿ Accessibility-first approach (WCAG 2.1 AA compliant)
- ⚡ Blazing fast performance with Next.js 14 App Router
- 📱 Fully responsive design for all devices
- 🎭 Smooth animations with Framer Motion
- 🌙 Theme support (light/dark mode)
- 📊 Analytics with Vercel Analytics & Speed Insights

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **UI Components:** Radix UI primitives
- **Analytics:** Vercel Analytics & Speed Insights

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

From the workspace root:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm --filter @aivo/marketing dev

# Build for production
pnpm --filter @aivo/marketing build

# Start production server
pnpm --filter @aivo/marketing start
```

The site will be available at `http://localhost:3002`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with fonts & metadata
│   ├── page.tsx           # Home page (landing)
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Layout components
│   │   ├── navigation.tsx # Header navigation
│   │   └── footer.tsx     # Footer
│   ├── sections/          # Page sections
│   │   ├── hero.tsx       # Hero section
│   │   ├── features.tsx   # Features grid
│   │   ├── how-it-works.tsx
│   │   ├── for-parents.tsx
│   │   ├── for-teachers.tsx
│   │   ├── testimonials.tsx
│   │   ├── pricing.tsx
│   │   ├── faq.tsx
│   │   └── cta.tsx
│   ├── ui/                # Reusable UI components
│   │   └── button.tsx
│   └── theme-provider.tsx # Theme context
└── lib/
    └── utils.ts           # Utility functions
```

## Brand Colors

```typescript
// Coral
coral-500: #ff7b5c (Primary)
coral-100: #ffe8e3 (Light backgrounds)

// Salmon
salmon-500: #ff636f (Secondary)
salmon-100: #ffe7e8 (Light backgrounds)

// Purple
purple-500: #a855f7 (Accent)
```

## Development

### Running Locally

```bash
pnpm dev
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Deployment

The site is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Set the root directory to `apps/marketing`
3. Deploy!

## Performance

- Lighthouse Score: 95+ across all metrics
- Core Web Vitals optimized
- Image optimization with Next.js Image
- Font optimization with next/font
- Automatic code splitting

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast ratios meet WCAG AA
- Screen reader friendly

## License

Proprietary - AIVO Education © 2025
