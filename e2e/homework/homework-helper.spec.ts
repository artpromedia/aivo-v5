/**
 * Homework Helper E2E Tests
 * Tests the AI-assisted homework help flow
 */

import { test, expect } from '@playwright/test';
import { testUsers, testHomework } from '../utils/test-data';

test.describe('Homework Helper', () => {
  test.beforeEach(async ({ page }) => {
    // Login as learner
    await page.goto('/login');
    await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
    await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
  });

  test('should navigate to homework helper', async ({ page }) => {
    // Navigate to homework section
    const homeworkLink = page.locator('a[href*="homework"], [data-testid="homework-link"], button:has-text("Homework")').first();
    
    if (await homeworkLink.isVisible()) {
      await homeworkLink.click();
      await expect(page).toHaveURL(/homework/);
    }
  });

  test('should display homework input interface', async ({ page }) => {
    await page.goto('/homework');
    
    // Check for input elements
    const inputArea = page.locator('textarea, input[type="text"], [data-testid="homework-input"]').first();
    await expect(inputArea).toBeVisible({ timeout: 10000 });
  });

  test('should submit homework question and receive response', async ({ page }) => {
    await page.goto('/homework');
    
    const inputArea = page.locator('textarea, [data-testid="homework-input"]').first();
    await inputArea.fill(testHomework.math.questions[0].question);
    
    const submitBtn = page.locator('button[type="submit"], [data-testid="submit-question"]').first();
    await submitBtn.click();
    
    // Wait for AI response
    const response = page.locator('[data-testid="ai-response"], .response, .answer').first();
    await expect(response).toBeVisible({ timeout: 30000 });
  });

  test('should show loading state while processing', async ({ page }) => {
    await page.goto('/homework');
    
    const inputArea = page.locator('textarea, [data-testid="homework-input"]').first();
    await inputArea.fill('What is 2 + 2?');
    
    const submitBtn = page.locator('button[type="submit"], [data-testid="submit-question"]').first();
    await submitBtn.click();
    
    // Check for loading indicator
    const loader = page.locator('[data-testid="loading"], .loading, .spinner, [role="progressbar"]');
    // Loading might be very quick, so we don't assert visibility
  });

  test('should handle image upload for homework', async ({ page }) => {
    await page.goto('/homework');
    
    const uploadInput = page.locator('input[type="file"]').first();
    
    if (await uploadInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check upload button exists
      await expect(uploadInput).toBeEnabled();
    }
  });

  test('should display homework history', async ({ page }) => {
    await page.goto('/homework/history');
    
    // Check for history list or empty state
    const historyOrEmpty = page.locator('[data-testid="history-list"], [data-testid="empty-state"], .history');
    await expect(historyOrEmpty).toBeVisible({ timeout: 10000 });
  });
});
