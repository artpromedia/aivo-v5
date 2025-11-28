/**
 * Visual Regression E2E Tests
 * Screenshot comparisons for key pages
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../utils/test-data';

test.describe('Visual Regression', () => {
  test.describe('Public Pages', () => {
    test('landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('login-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('signup page', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('signup-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Authenticated Pages', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
      await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
    });

    test('dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('dashboard.png', {
        maxDiffPixelRatio: 0.1, // More tolerance for dynamic content
      });
    });

    test('homework page', async ({ page }) => {
      await page.goto('/homework');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homework-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('profile page', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('profile-page.png', {
        maxDiffPixelRatio: 0.1,
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile viewport - landing', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('tablet viewport - landing', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('landing-tablet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });
});
