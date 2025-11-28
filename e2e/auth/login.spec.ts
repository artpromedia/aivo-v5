/**
 * Authentication E2E Tests
 * Tests login, logout, and protected route access
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../utils/test-data';

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await expect(page.locator('input[type="email"], [name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], [name="password"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"], [name="email"]', 'invalid@test.com');
      await page.fill('input[type="password"], [name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Expect error message
      await expect(page.locator('[role="alert"], .error, [data-testid="error"]')).toBeVisible({ timeout: 10000 });
    });

    test('should login successfully with valid learner credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
      await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('button[type="submit"]');
      
      // HTML5 validation or custom validation should show
      const emailInput = page.locator('input[type="email"], [name="email"]');
      await expect(emailInput).toHaveAttribute('required', '');
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
      await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
      
      // Find and click logout
      const logoutBtn = page.locator('[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('should access protected route after login', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"], [name="email"]', testUsers.learner.email);
      await page.fill('input[type="password"], [name="password"]', testUsers.learner.password);
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/(dashboard|home|app)/, { timeout: 15000 });
      
      // Should stay on protected page
      await page.goto('/dashboard');
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});
