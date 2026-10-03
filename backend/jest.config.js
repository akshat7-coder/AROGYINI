export default {
  testEnvironment: "node",
  transform: {},
  setupFiles: ["<rootDir>/tests/env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 60000,
  clearMocks: true,
  restoreMocks: true,
};
