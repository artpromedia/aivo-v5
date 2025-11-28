/**
 * Global Setup for Playwright E2E Tests
 * 
 * Runs once before all tests to:
 * - Seed test database
 * - Create test users
 * - Set up authentication states
 */

import { chromium, FullConfig } from '@playwright/test';
import { testUsers } from './utils/test-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...');
  
  const { baseURL } = config.projects[0].use;
  
  // Skip setup if using existing server in dev mode
  if (process.env.SKIP_SETUP === 'true') {
    console.log('⏭️  Skipping global setup (SKIP_SETUP=true)');
    return;
  }
  
  // Wait for server to be ready
  console.log(`⏳ Waiting for server at ${baseURL}...`);
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Retry connecting to server
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await page.goto(baseURL || 'http://localhost:3000', { timeout: 5000 });
      serverReady = true;
      break;
    } catch (error) {
      console.log(`  Attempt ${i + 1}/30 - waiting for server...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!serverReady) {
    await browser.close();
    throw new Error('Server did not start in time');
  }
  
  console.log('✅ Server is ready');
  
  // Create authenticated states for different user roles
  const storageDir = './e2e/.auth';
  
  // Ensure auth directory exists
  const fs = await import('fs');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  // Login and save state for each user type (if auth endpoints exist)
  try {
    // Test if login page exists
    const loginResponse = await page.goto(`${baseURL}/login`);
    
    if (loginResponse?.ok()) {
      console.log('📝 Setting up authentication states...');
      
      // Save learner auth state
      if (testUsers.learner.email && testUsers.learner.password) {
        try {
          await loginAsUser(page, testUsers.learner.email, testUsers.learner.password, baseURL!);
          await context.storageState({ path: `${storageDir}/learner.json` });
          console.log('  ✅ Learner auth state saved');
        } catch (e) {
          console.log('  ⚠️  Could not create learner auth state (user may not exist)');
        }
      }
    } else {
      console.log('⚠️  Login page not available, skipping auth setup');
    }
  } catch (error) {
    console.log('⚠️  Auth setup skipped:', (error as Error).message);
  }
  
  await browser.close();
  
  console.log('✅ Global setup complete');
}

async function loginAsUser(page: any, email: string, password: string, baseURL: string) {
  await page.goto(`${baseURL}/login`);
  await page.waitForSelector('[name="email"], [data-testid="email-input"]', { timeout: 5000 });
  
  // Try different selectors for email input
  const emailInput = page.locator('[name="email"], [data-testid="email-input"]').first();
  await emailInput.fill(email);
  
  const passwordInput = page.locator('[name="password"], [data-testid="password-input"]').first();
  await passwordInput.fill(password);
  
  const submitButton = page.locator('button[type="submit"], [data-testid="login-button"]').first();
  await submitButton.click();
  
  // Wait for redirect after login
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
}

export default globalSetup;
