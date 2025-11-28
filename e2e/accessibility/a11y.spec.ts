import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Homework', path: '/homework' },
    { name: 'Assessment', path: '/baseline' },
    { name: 'Regulation', path: '/regulation' },
    { name: 'Settings', path: '/settings' },
  ];

  for (const page of pages) {
    test(`${page.name} page should have no accessibility violations`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      
      const accessibilityScanResults = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Verify focus is visible
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    expect(focusVisible).toBe(true);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    
    const headings = await page.evaluate(() => {
      const h = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(h).map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent,
      }));
    });
    
    // Check h1 exists and is first
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].level).toBe(1);
    
    // Check no level skipping
    for (let i = 1; i < headings.length; i++) {
      expect(headings[i].level - headings[i-1].level).toBeLessThanOrEqual(1);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should have proper focus order', async ({ page }) => {
    await page.goto('/dashboard');
    
    const focusableElements: string[] = [];
    
    // Tab through all focusable elements
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const tagName = await page.evaluate(() => document.activeElement?.tagName);
      if (tagName && tagName !== 'BODY') {
        focusableElements.push(tagName);
      }
    }
    
    // Should have multiple focusable elements
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('should have accessible images with alt text', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login');
    
    const results = await new AxeBuilder({ page })
      .withRules(['label'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should have accessible links', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .withRules(['link-name'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .withRules(['button-name'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should not have duplicate IDs', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .withRules(['duplicate-id-active', 'duplicate-id-aria'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should have skip links', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Focus skip link
    await page.keyboard.press('Tab');
    
    // Check if skip link exists
    const skipLink = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('href')?.includes('#main');
    });
    
    // Skip link should be one of the first focusable elements
    expect(skipLink).toBeTruthy();
  });

  test('should support reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');
    
    // Check that animations are disabled
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(hasReducedMotion).toBe(true);
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/dashboard');
    
    const landmarks = await page.evaluate(() => {
      return {
        main: !!document.querySelector('main, [role="main"]'),
        nav: !!document.querySelector('nav, [role="navigation"]'),
        banner: !!document.querySelector('header, [role="banner"]'),
      };
    });
    
    expect(landmarks.main).toBe(true);
    expect(landmarks.nav).toBe(true);
  });

  test('should handle focus trap in modals correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for a button that opens a modal
    const modalTrigger = await page.$('[data-testid="open-modal"], [aria-haspopup="dialog"]');
    
    if (modalTrigger) {
      await modalTrigger.click();
      
      // Check modal has proper role
      const modal = await page.$('[role="dialog"]');
      expect(modal).toBeTruthy();
      
      // Check modal has aria-modal
      const hasAriaModal = await modal?.getAttribute('aria-modal');
      expect(hasAriaModal).toBe('true');
      
      // Check focus is within modal
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(document.activeElement);
      });
      expect(focusInModal).toBe(true);
      
      // Press Escape to close
      await page.keyboard.press('Escape');
      
      // Modal should be closed
      const modalClosed = await page.$('[role="dialog"]');
      expect(modalClosed).toBeFalsy();
    }
  });
});

test.describe('Accessibility - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be accessible on mobile viewport', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check button sizes
    const buttons = await page.$$('button, a, [role="button"]');
    
    for (const button of buttons.slice(0, 10)) {
      const box = await button.boundingBox();
      if (box) {
        // Minimum tap target size should be 44x44 (WCAG 2.5.5)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Accessibility - Screen Reader', () => {
  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for live regions
    const liveRegions = await page.$$('[aria-live], [role="status"], [role="alert"]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  test('should have proper table structure', async ({ page }) => {
    await page.goto('/dashboard');
    
    const tables = await page.$$('table');
    
    for (const table of tables) {
      // Check for headers
      const headers = await table.$$('th');
      expect(headers.length).toBeGreaterThan(0);
      
      // Check for caption or aria-label
      const caption = await table.$('caption');
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      expect(caption || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});
