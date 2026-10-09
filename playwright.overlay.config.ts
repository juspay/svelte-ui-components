import { defineConfig } from '@playwright/test';
process.env.SUI_OVERLAY_FIXTURE_URL = 'http://127.0.0.1:43323';
export default defineConfig({
  testDir: 'tests',
  testMatch: 'overlay-scroll-ownership.test.ts',
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report/overlay-scroll-ownership',
        open: 'never'
      }
    ]
  ],
  webServer: {
    command:
      'pnpm run build:wc && pnpm exec vite build --config vite.config.fixtures.ts && pnpm exec vite preview --config vite.config.fixtures.ts --host 127.0.0.1 --port 43323 --strictPort',
    url: 'http://127.0.0.1:43323/overlay-scroll-ownership/',
    reuseExistingServer: false,
    timeout: 120000
  },
  use: { baseURL: 'http://127.0.0.1:43323', testIdAttribute: 'data-pw', trace: 'on', video: 'on' }
});
