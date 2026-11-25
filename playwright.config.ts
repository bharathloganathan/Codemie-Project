import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results/playwright-artifacts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-html-report', open: 'never' }],
    ['list']
  ]
});
