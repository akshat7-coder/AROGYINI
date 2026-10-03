export default {
  testEnvironment: "node",
  transform: {},
  setupFiles: ["<rootDir>/tests/env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 60000,
  clearMocks: true,
  restoreMocks: true,
  // twilioProvider is excluded: it constructs a live Twilio client at import, so it cannot be
  // loaded without real credentials, and CLAUDE.md rules out ESM module mocking.
  collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!src/server.js", "!src/seed/**", "!src/services/sms/twilioProvider.js"],
  coverageThreshold: {
    // Services hold the business logic, so they carry the explicit floor.
    "src/services/**/*.js": { statements: 80, branches: 80, functions: 80, lines: 80 },
    global: { statements: 85, branches: 75, functions: 85, lines: 85 },
  },
};
