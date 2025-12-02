# Theme Migration Quick Reference
## Developer Checklist & Code Patterns

---

## Quick Color Replacement Guide

### Find & Replace Patterns

Use these regex patterns in VS Code (Ctrl+Shift+H):

```
# Find violet classes
violet-\d+

# Find purple classes  
purple-\d+

# Find hardcoded hex
#7C3AED|#8B5CF6|#A78BFA|#6D28D9
```

### Class Replacements

| Old Class | New Class |
|-----------|-----------|
| `bg-violet-600` | `bg-primary` |
| `bg-violet-700` | `bg-primary-dark` |
| `bg-violet-500` | `bg-primary` |
| `bg-violet-400` | `bg-primary-light` |
| `bg-violet-100` | `bg-primary/10` |
| `bg-violet-50` | `bg-surface` |
| `text-violet-600` | `text-primary` |
| `text-violet-700` | `text-primary-dark` |
| `text-violet-500` | `text-primary` |
| `text-violet-400` | `text-primary-light` |
| `border-violet-600` | `border-primary` |
| `border-violet-500` | `border-primary` |
| `ring-violet-500` | `ring-primary` |
| `hover:bg-violet-700` | `hover:bg-primary-dark` |
| `hover:bg-violet-600` | `hover:bg-primary` |
| `focus:ring-violet-500` | `focus:ring-primary` |
| `from-violet-600` | `from-primary` |
| `to-violet-400` | `to-primary-light` |

---

## Component Migration Examples

### Button

```tsx
// ❌ BEFORE
<button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg">
  Click me
</button>

// ✅ AFTER - Option 1: Use Button component
import { Button } from '@aivo/ui/components';
<Button intent="primary">Click me</Button>

// ✅ AFTER - Option 2: Use theme classes
<button className="bg-primary hover:bg-primary-dark text-on-primary px-4 py-2 rounded-lg">
  Click me
</button>
```

### Card

```tsx
// ❌ BEFORE
<div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
  <h3 className="text-violet-900">Title</h3>
  <p className="text-violet-700">Content</p>
</div>

// ✅ AFTER
import { Card, CardHeader, CardTitle, CardContent } from '@aivo/ui/components';
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Gradient

```tsx
// ❌ BEFORE
<div className="bg-gradient-to-r from-violet-600 to-violet-400">
  Gradient content
</div>

// ✅ AFTER
<div className="bg-gradient-to-r from-primary to-primary-light">
  Gradient content
</div>
```

### Badge/Tag

```tsx
// ❌ BEFORE
<span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-full text-sm">
  Active
</span>

// ✅ AFTER
import { Badge } from '@aivo/ui/components';
<Badge intent="primary">Active</Badge>
```

### Input Focus

```tsx
// ❌ BEFORE
<input className="focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />

// ✅ AFTER
<input className="focus:ring-2 focus:ring-primary focus:border-primary" />

// ✅ BEST: Use Input component
import { Input } from '@aivo/ui/components';
<Input label="Email" type="email" />
```

---

## CSS Variable Reference

### Using Theme Colors in Custom CSS

```css
/* Access theme colors */
.custom-element {
  /* Solid color */
  background-color: rgb(var(--color-primary));
  
  /* With opacity */
  background-color: rgb(var(--color-primary) / 0.5);
  
  /* Border */
  border-color: rgb(var(--color-border));
  
  /* Text */
  color: rgb(var(--color-text));
  
  /* Surface */
  background-color: rgb(var(--color-surface));
}
```

### Available CSS Variables

```css
/* Core Colors */
--color-primary
--color-primary-light
--color-primary-dark
--color-secondary
--color-secondary-light
--color-secondary-dark
--color-accent

/* Semantic Colors */
--color-success
--color-warning
--color-error
--color-info

/* Surface Colors */
--color-background
--color-surface
--color-surface-elevated

/* Text Colors */
--color-text
--color-text-muted
--color-text-inverted

/* Border */
--color-border
--color-border-light

/* Spacing (grade-adaptive) */
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--spacing-xl

/* Radius (grade-adaptive) */
--radius-small
--radius-medium
--radius-large
--radius-full

/* Transitions */
--transition-fast
--transition-normal
--transition-slow

/* Font Scale (grade-adaptive) */
--font-scale
```

---

## Theme Provider Setup

### Root Layout

```tsx
// app/layout.tsx
import { ThemeProvider } from '@aivo/ui/providers';
import { ThemeDevTools } from '@aivo/ui/components';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          initialGradeBand="k_5"
          learnerProfile={{
            gradeLevel: 3,
            accessibilityNeeds: ['dyslexic'],
          }}
        >
          {children}
          <ThemeDevTools /> {/* Dev only */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Using Theme Hooks

```tsx
import { useTheme, useAccessibility, useGradeBand } from '@aivo/ui/providers';

function MyComponent() {
  // Get current grade band
  const gradeBand = useGradeBand(); // 'k_5' | '6_8' | '9_12'
  
  // Get accessibility settings
  const { highContrast, reducedMotion, fontSize } = useAccessibility();
  
  // Get full theme context
  const { 
    currentTheme, 
    setGradeBand, 
    setAccessibilitySettings 
  } = useTheme();
  
  return (
    <div>
      <p>Current grade band: {gradeBand}</p>
      <button onClick={() => setGradeBand('6_8')}>
        Switch to Middle School
      </button>
    </div>
  );
}
```

---

## Grade-Specific Styling

### Tailwind Data Attributes

```tsx
// Style differently per grade band
<div className="
  p-4
  group-data-[grade-band=k_5]:p-6
  group-data-[grade-band=6_8]:p-5
  group-data-[grade-band=9_12]:p-4
">
  Content adjusts padding per grade
</div>

// Font sizes per grade
<h1 className="
  text-xl
  group-data-[grade-band=k_5]:text-3xl
  group-data-[grade-band=6_8]:text-2xl
  group-data-[grade-band=9_12]:text-xl
">
  Grade-adaptive heading
</h1>
```

### Conditional Rendering

```tsx
function AdaptiveContent() {
  const gradeBand = useGradeBand();
  
  if (gradeBand === 'k_5') {
    return <PlayfulLayout />;
  } else if (gradeBand === '6_8') {
    return <BalancedLayout />;
  } else {
    return <ProfessionalLayout />;
  }
}
```

---

## Common Gotchas

### 1. Don't Hardcode Colors in Inline Styles

```tsx
// ❌ BAD
<div style={{ backgroundColor: '#7C3AED' }}>

// ✅ GOOD
<div style={{ backgroundColor: 'rgb(var(--color-primary))' }}>

// ✅ BEST - Use Tailwind classes
<div className="bg-primary">
```

### 2. Use Semantic Intent, Not Colors

```tsx
// ❌ BAD - Describes visual appearance
<Button variant="violet">Submit</Button>

// ✅ GOOD - Describes purpose
<Button intent="primary">Submit</Button>
<Button intent="danger">Delete</Button>
<Button intent="success">Confirm</Button>
```

### 3. Check Contrast in All Themes

```tsx
// ❌ MAY FAIL - Works in one theme, not others
<div className="bg-yellow-100 text-yellow-800">

// ✅ SAFE - Uses theme-aware colors
<div className="bg-warning-light text-warning-dark">
```

### 4. Respect Reduced Motion

```tsx
// ❌ BAD - Always animates
<div className="animate-bounce">

// ✅ GOOD - Respects preference
<div className="animate-bounce motion-reduce:animate-none">
```

### 5. Ensure Touch Targets

```tsx
// ❌ BAD - Too small
<button className="p-1 text-sm">×</button>

// ✅ GOOD - Meets minimum 44px
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  ×
</button>
```

---

## Testing Your Migration

### 1. Visual Check

```bash
# Start dev server
pnpm dev

# Open browser dev tools
# Set data-grade-band attribute on <html>
document.documentElement.setAttribute('data-grade-band', 'k_5')
document.documentElement.setAttribute('data-grade-band', '6_8')
document.documentElement.setAttribute('data-grade-band', '9_12')
```

### 2. Accessibility Check

```bash
# Run accessibility tests
pnpm test:a11y

# Or use browser extension
# - axe DevTools
# - WAVE
# - Lighthouse
```

### 3. Contrast Check

Use the ThemeDevTools contrast checker:
1. Press `Ctrl+Shift+T` to open
2. Click "Contrast" tab
3. Click "Rescan" to analyze page

---

## Need Help?

1. **Theme not applying?** Check ThemeProvider wraps your app
2. **Colors look wrong?** Verify CSS variables are defined
3. **Contrast failing?** Use ContrastChecker in ThemeDevTools
4. **Build errors?** Check tailwind.config.cjs safelist

**Reference Docs:**
- `docs/theme-migration-plan.md` - Full migration plan
- `docs/theme-migration-testing.md` - Testing strategy
- `packages/ui/src/theme/types.ts` - Type definitions
