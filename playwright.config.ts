import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for AIVO v5
 * 
 * Run tests: pnpm exec playwright test
 * Run specific test: pnpm exec playwright test e2e/auth/login.spec.ts
 * Debug mode: pnpm exec playwright test --debug
 * UI mode: pnpm exec playwright test --ui
 */

export default defineConfig({
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit workers on CI to avoid resource issues
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for relative navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Default timeout for actions
    actionTimeout: 15000,
    
    // Default navigation timeout
    navigationTimeout: 30000,
    
    // Accept cookies and permissions
    permissions: ['geolocation', 'microphone'],
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },
  
  // Global timeout for each test
  timeout: 60000,
  
  // Timeout for expect assertions
  expect: {
    timeout: 10000,
    // Visual comparison settings
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  
  // Test projects for different browsers/devices
  projects: [
    // Setup project for authentication state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    
    // Mobile browsers (important for AIVO learner experience)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
      },
      dependencies: ['setup'],
    },
    
    // Tablet (for teacher/parent experience)
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
      dependencies: ['setup'],
    },
  ],
  
  // Local dev server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // Output folder for test artifacts
  outputDir: 'test-results/e2e-artifacts',
  
  // Global setup and teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
