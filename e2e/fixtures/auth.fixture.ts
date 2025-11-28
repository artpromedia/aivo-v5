/**
 * Authentication Fixtures for E2E Tests
 */

import { test as base, Page } from '@playwright/test';
import { testUsers, UserRole } from '../utils/test-data';

type AuthFixtures = {
  authenticatedPage: Page;
  learnerPage: Page;
  parentPage: Page;
  teacherPage: Page;
  adminPage: Page;
};

async function loginAs(page: Page, role: UserRole): Promise<Page> {
  const user = testUsers[role];
  const baseURL = page.url().split('/').slice(0, 3).join('/') || 'http://localhost:3000';
  
  await page.goto(`${baseURL}/login`);
  
  // Try to find login form
  const emailInput = page.locator('[name="email"], [data-testid="email-input"], input[type="email"]').first();
  const passwordInput = page.locator('[name="password"], [data-testid="password-input"], input[type="password"]').first();
  
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  
  await page.locator('button[type="submit"], [data-testid="login-button"]').first().click();
  
  // Wait for navigation
  await page.waitForURL(/\/(dashboard|home|app)/, { timeout: 15000 });
  
  return page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, 'learner');
    await use(page);
  },
  
  learnerPage: async ({ page }, use) => {
    await loginAs(page, 'learner');
    await use(page);
  },
  
  parentPage: async ({ page }, use) => {
    await loginAs(page, 'parent');
    await use(page);
  },
  
  teacherPage: async ({ page }, use) => {
    await loginAs(page, 'teacher');
    await use(page);
  },
  
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'admin');
    await use(page);
  },
});

export { expect } from '@playwright/test';
