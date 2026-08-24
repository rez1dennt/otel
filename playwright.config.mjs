import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'mobile-layout.spec.mjs',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4191',
    colorScheme: 'light',
    reducedMotion: 'reduce'
  },
  webServer: {
    command: 'node scripts/static-server.mjs 4191',
    url: 'http://127.0.0.1:4191',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
