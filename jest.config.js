/** @type {import('jest').Config} */
const config = {
  // Use projects to run tests across the monorepo
  // Only include packages that have jest.config.cjs files
  projects: [
    '<rootDir>/packages/persistence',
    '<rootDir>/packages/agents',
    '<rootDir>/services/api-gateway',
  ],

  // Global coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/*.config.{js,cjs,ts}',
    '!**/prisma/**',
  ],

  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',

  // Coverage reporters for CI integration
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds - enforced in CI
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Test result reporters for CI
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // Cache configuration for faster runs
  cacheDirectory: '<rootDir>/.jest-cache',

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/.next/', '/coverage/'],

  // Maximum workers for parallel execution
  maxWorkers: process.env.CI ? 2 : '50%',

  // Timeout for slow tests
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = config;
