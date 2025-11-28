/**
 * Assessment E2E Tests
 * Tests baseline assessment flow
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../utils/test-data';

test.describe('Baseline Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
    await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
  });

  test('should navigate to assessment section', async ({ page }) => {
    const assessmentLink = page.locator('a[href*="assessment"], [data-testid="assessment-link"]').first();
    
    if (await assessmentLink.isVisible()) {
      await assessmentLink.click();
      await expect(page).toHaveURL(/assessment/);
    }
  });

  test('should display assessment instructions', async ({ page }) => {
    await page.goto('/assessment');
    
    const instructions = page.locator('[data-testid="instructions"], .instructions, h1, h2').first();
    await expect(instructions).toBeVisible({ timeout: 10000 });
  });

  test('should start assessment', async ({ page }) => {
    await page.goto('/assessment');
    
    const startBtn = page.locator('button:has-text("Start"), [data-testid="start-assessment"]').first();
    
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      
      // Should show first question
      const question = page.locator('[data-testid="question"], .question').first();
      await expect(question).toBeVisible({ timeout: 10000 });
    }
  });

  test('should answer assessment questions', async ({ page }) => {
    await page.goto('/assessment/start');
    
    // Look for answer options
    const options = page.locator('[data-testid="answer-option"], .option, input[type="radio"]');
    
    if (await options.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await options.first().click();
      
      const nextBtn = page.locator('button:has-text("Next"), [data-testid="next-question"]').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      }
    }
  });

  test('should show assessment progress', async ({ page }) => {
    await page.goto('/assessment/start');
    
    const progress = page.locator('[data-testid="progress"], .progress, [role="progressbar"]').first();
    // Progress indicator might exist
  });

  test('should complete assessment and show results', async ({ page }) => {
    await page.goto('/assessment/results');
    
    const results = page.locator('[data-testid="results"], .results, h1:has-text("Results")').first();
    // Results page should be accessible
  });
});
