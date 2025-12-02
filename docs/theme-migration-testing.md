# Theme Migration Testing Strategy
## Aivo v5 - Comprehensive Testing Guide

---

## 1. Automated Visual Regression Tests

### Setup

```bash
# Install dependencies
pnpm add -D @playwright/test @percy/playwright axe-playwright

# Configure Playwright
npx playwright install
```

### Visual Test Structure

```
e2e/
├── visual/
│   ├── theme-k5.spec.ts         # K-5 Elementary theme tests
│   ├── theme-6-8.spec.ts        # 6-8 Middle School theme tests
│   ├── theme-9-12.spec.ts       # 9-12 High School theme tests
│   ├── theme-switching.spec.ts  # Dynamic theme switching tests
│   ├── accessibility.spec.ts    # High contrast, reduced motion, etc.
│   └── components/
│       ├── button.visual.ts
│       ├── card.visual.ts
│       ├── input.visual.ts
│       ├── badge.visual.ts
│       ├── progress.visual.ts
│       └── alert.visual.ts
└── fixtures/
    ├── theme-k5.ts
    ├── theme-6-8.ts
    └── theme-9-12.ts
```

### Sample Visual Test

```typescript
// e2e/visual/theme-k5.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('K-5 Elementary Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-grade-band', 'k_5');
    });
  });

  test('button variants render correctly', async ({ page }) => {
    await page.goto('/components/button');
    
    // Visual snapshot
    await expect(page.locator('[data-testid="button-gallery"]'))
      .toHaveScreenshot('k5-buttons.png');
  });

  test('card layouts render correctly', async ({ page }) => {
    await page.goto('/components/card');
    
    await expect(page.locator('[data-testid="card-gallery"]'))
      .toHaveScreenshot('k5-cards.png');
  });

  test('passes accessibility audit', async ({ page }) => {
    await page.goto('/dashboard');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true,
      rules: {
        'color-contrast': { enabled: true },
        'focus-visible': { enabled: true },
      },
    });
  });
});
```

### Percy Integration (Optional)

```typescript
// e2e/visual/percy-snapshots.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Percy Visual Snapshots', () => {
  const themes = ['k_5', '6_8', '9_12'];
  const pages = ['/dashboard', '/lessons', '/profile'];

  for (const theme of themes) {
    for (const pagePath of pages) {
      test(`${theme} - ${pagePath}`, async ({ page }) => {
        await page.goto(pagePath);
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-grade-band', t);
        }, theme);
        
        await page.waitForTimeout(500); // Wait for CSS transition
        await percySnapshot(page, `${theme}${pagePath.replace('/', '-')}`);
      });
    }
  }
});
```

---

## 2. Accessibility Audit Checklist

### WCAG 2.1 AA Compliance Matrix

| Criterion | Description | Test Method | Pass Criteria |
|-----------|-------------|-------------|---------------|
| 1.4.3 | Color Contrast (Minimum) | axe-core | ≥ 4.5:1 normal text, ≥ 3:1 large text |
| 1.4.6 | Color Contrast (Enhanced) | axe-core | ≥ 7:1 normal text (AAA) |
| 1.4.11 | Non-text Contrast | Manual | ≥ 3:1 for UI components |
| 2.1.1 | Keyboard | Manual | All functions keyboard accessible |
| 2.4.7 | Focus Visible | Manual | Visible focus indicator (≥ 2px) |
| 2.4.11 | Focus Not Obscured | Manual | Focus indicator fully visible |
| 2.5.5 | Target Size | Manual | ≥ 44x44 CSS pixels |
| 1.4.4 | Resize Text | Manual | Readable at 200% zoom |
| 2.3.3 | Animation from Interactions | Manual | Respects prefers-reduced-motion |

### Automated Accessibility Testing

```typescript
// e2e/accessibility/audit.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  const criticalPages = [
    '/',
    '/dashboard',
    '/lessons/123',
    '/profile',
    '/settings',
  ];

  for (const page of criticalPages) {
    test(`${page} has no accessibility violations`, async ({ page: pw }) => {
      await pw.goto(page);
      
      const results = await new AxeBuilder({ page: pw })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(results.violations).toEqual([]);
    });
  }

  test('high contrast mode improves contrast ratios', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Enable high contrast
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    });
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aaa']) // Test against stricter AAA
      .analyze();
    
    // Should have fewer violations in high contrast mode
    expect(results.violations.length).toBeLessThan(3);
  });
});
```

### Manual Testing Checklist

#### Color Contrast Testing
- [ ] All text meets 4.5:1 ratio against background
- [ ] Large text (18pt+) meets 3:1 ratio
- [ ] UI components (borders, icons) meet 3:1 ratio
- [ ] Focus indicators meet 3:1 ratio
- [ ] Links distinguishable from surrounding text
- [ ] Errors visible without relying solely on color

#### Keyboard Navigation Testing
- [ ] Tab order follows logical reading order
- [ ] All interactive elements focusable
- [ ] No keyboard traps
- [ ] Skip links work correctly
- [ ] Modal focus management works
- [ ] Dropdown/menu navigation works

#### Screen Reader Testing
- [ ] All content announced correctly
- [ ] Headings structured properly
- [ ] Images have meaningful alt text
- [ ] Form labels associated correctly
- [ ] Live regions announce dynamic content
- [ ] ARIA roles used appropriately

#### Touch Target Testing
- [ ] Buttons ≥ 44x44 CSS pixels
- [ ] Links ≥ 44x44 CSS pixels (or inline text)
- [ ] Form inputs ≥ 44x44 CSS pixels
- [ ] K-5 theme has ≥ 48x48 targets

---

## 3. Cross-Browser Testing Matrix

### Browser Versions

| Browser | Minimum Version | Testing Priority |
|---------|-----------------|------------------|
| Chrome | 120+ | High |
| Firefox | 120+ | High |
| Safari | 17+ | High |
| Edge | 120+ | Medium |
| Samsung Internet | 23+ | Low |
| Safari iOS | 17+ | High |
| Chrome Android | 120+ | High |

### Testing Checklist per Browser

```markdown
## Chrome 120+ Testing
- [ ] Windows 11
- [ ] Windows 10
- [ ] macOS Sonoma
- [ ] Linux (Ubuntu 22.04)

### CSS Features to Verify
- [ ] CSS custom properties (--variable)
- [ ] CSS color-mix()
- [ ] oklch() color function (if used)
- [ ] Container queries (if used)
- [ ] :has() selector (if used)
- [ ] @layer (if used)

### JavaScript Features to Verify
- [ ] IntersectionObserver
- [ ] ResizeObserver
- [ ] matchMedia for prefers-reduced-motion
- [ ] matchMedia for prefers-color-scheme
```

### BrowserStack/LambdaTest Configuration

```javascript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Desktop browsers
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    
    // Mobile browsers
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
    
    // Tablet
    { name: 'iPad', use: { ...devices['iPad Pro 11'] } },
  ],
});
```

---

## 4. Device/Viewport Testing Matrix

### Viewport Breakpoints

| Name | Width | Target Devices |
|------|-------|----------------|
| Mobile XS | 320px | iPhone SE, older Android |
| Mobile S | 375px | iPhone 12 mini, Pixel 5 |
| Mobile M | 390px | iPhone 14, Pixel 7 |
| Mobile L | 428px | iPhone 14 Pro Max |
| Tablet Portrait | 768px | iPad mini, iPad |
| Tablet Landscape | 1024px | iPad Pro |
| Laptop | 1280px | MacBook Air, standard laptops |
| Desktop | 1440px | iMac, external monitors |
| Large Desktop | 1920px | Full HD monitors |
| 4K | 2560px | 4K monitors |

### Responsive Testing Script

```typescript
// e2e/responsive/viewports.spec.ts
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile-xs', width: 320, height: 568 },
  { name: 'mobile-s', width: 375, height: 667 },
  { name: 'mobile-m', width: 390, height: 844 },
  { name: 'mobile-l', width: 428, height: 926 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'large-desktop', width: 1920, height: 1080 },
];

test.describe('Responsive Design', () => {
  for (const viewport of viewports) {
    test(`renders correctly at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      
      await page.goto('/dashboard');
      
      // Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
      
      // Visual snapshot
      await expect(page).toHaveScreenshot(`${viewport.name}-dashboard.png`);
    });
  }
});
```

### Touch Device Testing

```typescript
// e2e/touch/interactions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Touch Interactions', () => {
  test.use({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });

  test('touch targets are 44px minimum', async ({ page }) => {
    await page.goto('/dashboard');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('K-5 theme has larger touch targets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-grade-band', 'k_5');
    });
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(48);
      expect(box?.height).toBeGreaterThanOrEqual(48);
    }
  });
});
```

---

## 5. Performance Testing

### Core Web Vitals Targets

| Metric | Target | Grade |
|--------|--------|-------|
| LCP (Largest Contentful Paint) | < 2.5s | Good |
| FID (First Input Delay) | < 100ms | Good |
| CLS (Cumulative Layout Shift) | < 0.1 | Good |
| INP (Interaction to Next Paint) | < 200ms | Good |

### Theme Switching Performance

```typescript
// e2e/performance/theme-switch.spec.ts
import { test, expect } from '@playwright/test';

test('theme switch is fast', async ({ page }) => {
  await page.goto('/dashboard');
  
  const startTime = Date.now();
  
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-grade-band', '6_8');
  });
  
  // Wait for CSS transitions to complete
  await page.waitForTimeout(300);
  
  const endTime = Date.now();
  const switchTime = endTime - startTime;
  
  // Theme switch should be under 500ms
  expect(switchTime).toBeLessThan(500);
});
```

### CSS Bundle Size

```bash
# Measure CSS bundle size
pnpm build
ls -lh .next/static/css/*.css

# Target: < 50KB gzipped for main CSS bundle
```

---

## 6. Test Automation Pipeline

### GitHub Actions Configuration

```yaml
# .github/workflows/theme-tests.yml
name: Theme Migration Tests

on:
  pull_request:
    paths:
      - 'packages/ui/**'
      - 'apps/*/styles/**'
      - 'tailwind.config.cjs'

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Run visual tests
        run: pnpm test:visual
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diff
          path: e2e/visual/*.png

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Run accessibility tests
        run: pnpm test:a11y
      
      - name: Check accessibility score
        run: |
          SCORE=$(cat a11y-report.json | jq '.score')
          if [ $SCORE -lt 90 ]; then
            echo "Accessibility score too low: $SCORE"
            exit 1
          fi

  cross-browser:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      
      - run: pnpm install
      - run: npx playwright install ${{ matrix.browser }}
      
      - name: Run tests
        run: pnpm test:e2e --project=${{ matrix.browser }}
```

---

## 7. Manual QA Checklist

### Pre-Release Checklist

#### Theme Functionality
- [ ] K-5 theme applies correctly for grades K-5
- [ ] 6-8 theme applies correctly for grades 6-8
- [ ] 9-12 theme applies correctly for grades 9-12
- [ ] Theme persists across page reloads
- [ ] Theme syncs across tabs
- [ ] Theme respects user preference override

#### Accessibility Settings
- [ ] High contrast mode works
- [ ] Reduced motion is respected
- [ ] Font size scaling works (100%, 125%, 150%, 200%)
- [ ] Dyslexic font option works
- [ ] Settings persist across sessions

#### Component Verification
- [ ] All button variants look correct
- [ ] All card variants render properly
- [ ] Form inputs are accessible
- [ ] Progress bars animate smoothly
- [ ] Alerts are properly styled
- [ ] Badges display correctly

#### Edge Cases
- [ ] Theme works with browser zoom (50%-200%)
- [ ] Theme works in print mode
- [ ] Theme works in forced colors mode
- [ ] Theme works with browser extensions (dark mode, etc.)
- [ ] Theme works with system-level accessibility settings

---

## 8. Reporting Template

### Test Run Report

```markdown
# Theme Migration Test Report
**Date:** YYYY-MM-DD
**Version:** v5.x.x
**Tester:** Name

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

## Visual Regression
| Theme | Passed | Failed | Notes |
|-------|--------|--------|-------|
| K-5   | ✅     | 0      |       |
| 6-8   | ✅     | 0      |       |
| 9-12  | ✅     | 0      |       |

## Accessibility
| Criterion | Status | Notes |
|-----------|--------|-------|
| Color Contrast | ✅ | All pass |
| Keyboard Navigation | ✅ | |
| Screen Reader | ✅ | |

## Cross-Browser
| Browser | Status | Notes |
|---------|--------|-------|
| Chrome  | ✅     |       |
| Firefox | ✅     |       |
| Safari  | ✅     |       |

## Issues Found
1. [Issue description, severity, steps to reproduce]

## Recommendations
1. [Recommendation]
```
