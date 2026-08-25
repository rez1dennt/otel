import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(CONFIG_DIR, 'tests/e2e'),
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['line']],
  use: {
    baseURL: process.env.FORMA_WP_BASE_URL ?? 'http://127.0.0.1:9411',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  outputDir: path.resolve(CONFIG_DIR, '../test-results/wordpress-theme')
});
