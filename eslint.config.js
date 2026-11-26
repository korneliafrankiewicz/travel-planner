// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // The back end in server/ has its own lint setup (it is Node code, not React Native).
    ignores: ['dist/*', 'server/**'],
  },
  {
    // Reports and files that a test run generates.
    ignores: ['coverage/**', 'report/**', 'playwright-report/**', 'test-results/**', 'e2e/.tmp/**'],
  },
]);
