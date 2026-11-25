import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Every test file starts its own in-memory database, which takes a moment to boot.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
