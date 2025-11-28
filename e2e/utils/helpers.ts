/**
 * E2E Test Helpers
 */

import { Page, expect } from '@playwright/test';

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function clearAndType(page: Page, selector: string, text: string) {
  const input = page.locator(selector);
  await input.clear();
  await input.fill(text);
}

export async function expectToast(page: Page, message: string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]');
  await expect(toast).toContainText(message, { timeout: 10000 });
}

export async function takeNamedScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}

export async function waitForApi(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    response => response.url().match(urlPattern) !== null && response.ok()
  );
}

export async function mockApiResponse(page: Page, url: string, data: unknown) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}
