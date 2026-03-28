import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './tests/e2e/setup/auth.setup.ts',
  use: {
    baseURL,
    storageState: './tests/e2e/.auth/admin.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
