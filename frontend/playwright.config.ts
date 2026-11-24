// ============================================================================
// FILE: playwright.config.ts
// PURPOSE: Playwright End-to-End (E2E) configuration for Next.js App Router
// ============================================================================
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Only scan `e2e/` for Playwright specs (keeps Vitest `*.test.tsx` files untouched)
  testDir: './e2e',

  // Run tests sequentially on a single worker for predictable local dev server behavior
  fullyParallel: false,
  workers: 1,

  // Fail the build on CI if `test.only` was accidentally left in a spec
  forbidOnly: !!process.env.CI,

  // Retry once on CI only to absorb transient network/timing blips
  retries: process.env.CI ? 1 : 0,

  // Clean terminal reporter + HTML report artifact
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Matches your Next.js local dev/preview server URL
    baseURL: 'http://localhost:3000',

    // Capture screenshots and traces on failure to debug hydration or routing issues fast
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  // Run Chromium for a fast, reliable local setup first
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatically start Next.js if port 3000 isn't already running
  webServer: {
  command: 'npm run build && npx next start -p 3000',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 180 * 1000,
},
});