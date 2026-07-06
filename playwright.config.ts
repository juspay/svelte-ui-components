import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    // Dedicated port: 4173 is vite's shared default and a preview server from
    // an unrelated project on it silently satisfies reuseExistingServer.
    command: 'pnpm run build && pnpm run preview --port 43199 --strictPort',
    port: 43199,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:43199',
    // This repo's demo pages expose data-pw hooks; getByTestId must target them.
    testIdAttribute: 'data-pw'
  },
  projects: [
    {
      name: 'functional'
    }
  ]
};

export default config;
