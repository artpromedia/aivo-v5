/**
 * Session Management E2E Tests
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../utils/test-data';

test.describe('Session Management', () => {
  test('should persist session across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
    await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should handle session expiry gracefully', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
    await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
    
    // Clear cookies to simulate session expiry
    await context.clearCookies();
    
    // Navigate and expect redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
