# AIVO Unified Enterprise Design System

## Overview

The AIVO Unified Design System provides a comprehensive, accessible, and consistent visual language across all AIVO applications. Built for K-12 education with special consideration for neurodiverse learners.

## Quick Start

### Installation

```tsx
// In your app's layout/root component
import '@aivo/ui/themes/base.css';      // Required: Core variables
import '@aivo/ui/themes/learner.css';   // App-specific theme
import '@aivo/ui/themes/grades/k5.css'; // Optional: Grade theme
import '@aivo/ui/themes/accessibility.css'; // Optional: A11y utilities

// Then wrap with ThemeProvider
import { ThemeProvider } from '@aivo/ui';

export default function RootLayout({ children }) {
  return (
    <ThemeProvider initialGradeBand="k_5">
      {children}
    </ThemeProvider>
  );
}
```

### App-Specific Setup

| App | Theme Import | Data Attribute |
|-----|-------------|----------------|
| learner-web | `@aivo/ui/themes/learner.css` | `data-app="learner-web"` |
| parent-teacher-web | `@aivo/ui/themes/learner.css` | `data-app="parent-teacher-web"` |
| admin-web | `@aivo/ui/themes/admin.css` | `data-app="admin-web"` |
| district-admin-web | `@aivo/ui/themes/admin.css` | `data-app="district-admin-web"` |
| platform-admin-web | `@aivo/ui/themes/admin.css` | `data-app="platform-admin-web"` |
| marketing | `@aivo/ui/themes/marketing.css` | `data-app="marketing"` |

## Architecture

### File Structure

```
packages/ui/src/
├── tokens/                    # Design token definitions
│   ├── colors.ts             # Color palettes (brand, semantic, grade)
│   ├── spacing.ts            # Spacing scale & component presets
│   ├── typography.ts         # Fonts, sizes, line heights
│   ├── effects.ts            # Shadows, borders, animations
│   └── index.ts              # Token exports
├── themes/                    # CSS theme files
│   ├── base.css              # Core CSS variables (required)
│   ├── learner.css           # Learner app theme
│   ├── admin.css             # Admin app theme
│   ├── marketing.css         # Marketing theme
│   ├── accessibility.css     # A11y utilities
│   ├── index.css             # All themes import
│   ├── index.ts              # TypeScript exports
│   └── grades/               # Grade-specific themes
│       ├── k5.css            # K-5 Elementary
│       ├── middle.css        # 6-8 Middle School
│       ├── high.css          # 9-12 High School
│       └── index.css         # Grade themes import
└── providers/
    └── ThemeProvider.tsx     # React context provider
```

### Color Architecture

#### Tier 1: Brand Colors (Consistent)
```css
--brand-primary: #7C3AED;      /* Violet */
--brand-secondary: #A78BFA;    /* Light violet */
--brand-accent: #6EE7B7;       /* Mint green */
```

#### Tier 2: Semantic Colors (Consistent)
```css
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;
```

#### Tier 3: App-Specific Palettes

| Role | Primary | Character |
|------|---------|-----------|
| Learner | Violet #7C3AED | Warm, encouraging |
| Admin | Indigo #4F46E5 | Professional, clean |
| Marketing | Violet #7C3AED | Engaging, brand-forward |

#### Tier 4: Grade-Based Themes (Learner Web Only)

| Grade Band | Primary | Character |
|------------|---------|-----------|
| K-5 | Orange #F97316 | Playful, energetic |
| 6-8 | Purple #8B5CF6 | Creative, transitional |
| 9-12 | Indigo #4F46E5 | Mature, professional |

## CSS Variables Reference

### Using Theme Variables

```css
/* Colors */
.my-component {
  background: rgb(var(--theme-primary));
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-surface-border));
}

/* With opacity */
.overlay {
  background: rgb(var(--theme-primary) / 0.5);
}
```

### Core Variables

```css
/* Backgrounds */
--color-bg-primary       /* Main background */
--color-bg-secondary     /* Card backgrounds */
--color-bg-tertiary      /* Sunken areas */

/* Surfaces */
--color-surface-primary  /* Component backgrounds */
--color-surface-border   /* Border color */
--color-surface-hover    /* Hover state */

/* Text */
--color-text-primary     /* Main text */
--color-text-secondary   /* Secondary text */
--color-text-muted       /* Helper text */
--color-text-inverse     /* Text on dark backgrounds */

/* Theme */
--theme-primary          /* Primary action color */
--theme-primary-light    /* Light variant */
--theme-primary-dark     /* Dark variant */
--theme-secondary        /* Secondary color */
--theme-accent           /* Accent highlights */
```

## TypeScript Usage

### Importing Tokens

```typescript
import {
  brandColors,
  learnerPalette,
  adminPalette,
  spacing,
  fontSizes,
  shadows,
} from '@aivo/ui/tokens';

// Use in styled components or JS styling
const styles = {
  padding: spacing[4],           // '1rem'
  fontSize: fontSizes.lg,        // '1.125rem'
  boxShadow: shadows.md,         // Drop shadow
  color: brandColors.primary,    // '#7C3AED'
};
```

### Using ThemeProvider

```typescript
import { 
  ThemeProvider, 
  useTheme, 
  useGradeBand,
  useAccessibility,
  type GradeBandKey 
} from '@aivo/ui';

// Access theme in components
function MyComponent() {
  const { theme, gradeBand, accessibility } = useTheme();
  const { settings, setSettings } = useAccessibility();
  
  return (
    <div style={{ 
      color: theme.colors.primary.main,
      fontSize: settings.fontSize === 'large' ? '1.25rem' : '1rem'
    }}>
      Current grade: {gradeBand}
    </div>
  );
}
```

## Accessibility

### WCAG 2.1 AA Compliance

All color combinations meet minimum contrast requirements:
- **Text**: 4.5:1 contrast ratio
- **Large text (18px+)**: 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

### Accessibility Features

```tsx
// Enable dyslexia-friendly fonts
<ThemeProvider>
  {/* Add data attribute to root */}
  <div data-font="dyslexic">
    {children}
  </div>
</ThemeProvider>

// Or use the hook
const { setSettings } = useAccessibility();
setSettings({ dyslexicFont: true });
```

### Available Settings

| Setting | Values | Effect |
|---------|--------|--------|
| `highContrast` | boolean | Forces high contrast colors |
| `reducedMotion` | boolean | Disables animations |
| `dyslexicFont` | boolean | Uses OpenDyslexic font |
| `fontSize` | 'default' \| 'large' \| 'x-large' | Scales text size |
| `colorScheme` | 'default' \| 'warm' \| 'cool' \| 'muted' | Adjusts color tone |

### Data Attributes

Apply these to the root element:

```html
<html 
  data-theme="learner"
  data-grade="k5"
  data-contrast="high"
  data-font="dyslexic"
  data-reduced-motion="true"
>
```

## Component Guidelines

### Buttons

```tsx
// Use semantic classes
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-cta">Call to Action</button>
```

### Cards

```tsx
<div className="card">
  <div className="card-header">Title</div>
  <div className="card-body">Content</div>
</div>

// With stats (admin theme)
<div className="card card-stat">
  <div className="card-stat-value">1,234</div>
  <div className="card-stat-label">Active Users</div>
</div>
```

### Progress Indicators

```tsx
<div className="progress-bar">
  <div className="progress-bar-fill" style={{ width: '75%' }} />
</div>
```

## Migration Guide

### From Hardcoded Colors

Before:
```tsx
<div className="bg-violet-600 text-white">
```

After:
```tsx
<div className="bg-theme-primary text-theme-primary-foreground">
```

### CSS Variable Mapping

| Old | New |
|-----|-----|
| `bg-violet-600` | `bg-theme-primary` |
| `text-violet-600` | `text-theme-primary` |
| `border-violet-200` | `border-theme-primary/20` |
| `bg-slate-50` | `bg-background` |
| `text-slate-900` | `text-foreground` |

## Best Practices

1. **Always use CSS variables** for colors, never hardcode
2. **Import base.css first** before any theme
3. **Use semantic color names** (`--color-success`, not `--color-green`)
4. **Test with accessibility modes** enabled
5. **Respect user preferences** for motion and contrast
6. **Use the ThemeProvider** for consistent theming

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

CSS Variables (Custom Properties) are supported in all modern browsers.
