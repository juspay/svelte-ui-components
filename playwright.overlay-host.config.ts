import { defineConfig } from '@playwright/test';
import { FUNCTIONAL, playwrightPort } from './scripts/pw-port';

const port = playwrightPort(FUNCTIONAL, {
  path: import.meta.dirname + '/owned-overlay-host',
  override: ''
});

process.env.SUI_OVERLAY_HOST_FIXTURE_URL = `http://127.0.0.1:${port}/`;

export default defineConfig({
  testDir: 'tests',
  testMatch: 'overlay-host-isolation.spec.ts',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: '.overlay-host-results/results.json' }]],
  outputDir: '.overlay-host-results/artifacts',
  webServer: {
    command: `pnpm exec vite build --config vite.config.overlay-host.ts && pnpm exec vite preview --config vite.config.overlay-host.ts --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60000
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 760, height: 720 },
    testIdAttribute: 'data-pw',
    trace: 'on',
    video: 'on'
  }
});
