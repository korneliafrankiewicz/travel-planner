// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The end-to-end tests (`npm run e2e`) set the address of their own back end in the environment.
// In development the app bundle also reads the `.env*` files and lets them win over the
// environment, so a developer's `.env.local` (usually pointing at their own server) would send
// the tests to the wrong place. For the tests only, hide those files from Metro.
if (process.env.E2E_TEST === '1') {
  config.resolver.blockList = [].concat(config.resolver.blockList ?? [], /\/\.env(\.[a-z]+)*$/);
}

module.exports = config;
