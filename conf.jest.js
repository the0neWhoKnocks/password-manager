const conf = {
  automock: false,
  collectCoverage: true,
  // This will collect coverage information for all the files inside the
  // project's `rootDir`.
  // If a file matches the specified glob pattern, coverage information will be
  // collected for it even if no tests exist for this file and it's never
  // required in the test suite.
  collectCoverageFrom: [
    'src/**/*.js',
    // exclusions
    '!**/node_modules/**',
    '!**/__mocks__/**',
    '!**/mocks/**',
    '!**/__snapshots__/**',
    '!**/stories.js',
    '!**/styles.js',
    '!**/vendor/**',
  ],
  coverageDirectory: 'reports/unit-tests',
  coveragePathIgnorePatterns: [
    // ignore everything from the root except for `src`
    '<rootDir>\\/(?!src).*\\.js$',
  ],
  coverageReporters: [
    'html',
    'json-summary',
    'lcov',
    'text-summary',
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 49.17,
      functions: 43.27,
      lines: 49.44,
    },
  },
  globals: {},
  moduleNameMapper: {},
  reporters: [
    'default',
    '<rootDir>/tests/reporters/UnhandledRejectionReporter',
  ],
  roots: [
    'src',
  ],
  setupFilesAfterEnv: [
    'jest-localstorage-mock',
    '<rootDir>/tests/testSetup.js',
  ],
  testEnvironment: 'jsdom',
  transform: {},
};

// While watching files, it's still useful to generate coverage, but we only
// want coverage for changed files to cut down on build time. This is
// accomplished via the `--changedSince=master` flag in the `package.json`.
// Note that this doesn't completely isolate per-file changes, but it does
// trim down on a lot.
if (process.env.JEST_WATCH) {
  delete conf.collectCoverageFrom;
  delete conf.coverageThreshold;
}

module.exports = conf;
