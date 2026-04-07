module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",
    "lcov",
    "html"
  ],
  collectCoverageFrom: [
    "routes/**/*.js",
    "utils/**/*.js",
    "models/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  testTimeout: 10000,
  verbose: true
};
