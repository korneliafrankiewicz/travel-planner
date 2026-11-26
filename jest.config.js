// Pin the timezone so date logic is tested the same everywhere. Poland observes daylight
// saving time, which lets the tests cover the days when the clocks change.
process.env.TZ = 'Europe/Warsaw';

// `npm run test:report` writes the HTML test report to report/index.html (git-ignored) and
// opens it in the browser. Other test runs (`npm test`) do not create a report.
const createHtmlReport = process.env.npm_lifecycle_event === 'test:report';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Do not depend on Watchman being installed; Jest's own file crawler is fast enough here.
  watchman: false,
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Same alias as in tsconfig.json.
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The back end in server/ has its own tests (Vitest), and e2e/ has Playwright tests.
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/server/', '/e2e/'],
  reporters: createHtmlReport
    ? [
        'default',
        [
          'jest-html-reporters',
          {
            publicPath: './report',
            filename: 'index.html',
            pageTitle: 'travel-planner',
            openReport: true,
          },
        ],
      ]
    : ['default'],
  // `npm run test:coverage` writes an HTML report to coverage/index.html (git-ignored) and
  // prints a short summary in the terminal.
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/app/**',
    '!src/test-utils/**',
    '!**/*.test.{ts,tsx}',
  ],
};
