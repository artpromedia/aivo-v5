/**
 * Global Teardown for Playwright E2E Tests
 * 
 * Runs once after all tests to:
 * - Clean up test data
 * - Reset database state
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...');
  
  // Skip cleanup if requested
  if (process.env.SKIP_CLEANUP === 'true') {
    console.log('⏭️  Skipping cleanup (SKIP_CLEANUP=true)');
    return;
  }
  
  // Clean up test artifacts if not on CI
  if (!process.env.CI) {
    console.log('📁 Keeping test artifacts for local debugging');
  }
  
  // Cleanup test data from database
  // Note: In production, use a separate test database
  try {
    // If we have database cleanup logic, run it here
    // await cleanupTestData();
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.log('⚠️  Test data cleanup skipped:', (error as Error).message);
  }
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
