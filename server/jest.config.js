/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Set env vars before any module is loaded
  setupFiles: ['<rootDir>/tests/setEnv.js'],
  testTimeout: 30000, // argon2 is intentionally slow
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  forceExit: true, // ensure process exits after all tests
  verbose: true,
  maxWorkers: 1,
  // Clear mock state between tests
  clearMocks: true,
};
