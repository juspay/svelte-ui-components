import type { PlaywrightTestConfig } from '@playwright/test';

// Dedicated port: 4173 is vite's shared default and a preview server from an unrelated project
// on it silently satisfies reuseExistingServer. 43199 avoids that collision, but it is still a
// FIXED port, so two checkouts of THIS repo collide with each other — the second run reuses the
// first's server and asserts against the wrong build, reporting failures that belong to another
// worktree's code (or, worse, passes that were never earned). Set PW_PORT to a private value
// when running alongside another checkout.
const port = Number(process.env.PW_PORT ?? 43199);

const config: PlaywrightTestConfig = {
  webServer: {
    command: `pnpm run build && pnpm run preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${port}`,
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
