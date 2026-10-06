import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';
import base from './playwright.walkthrough.config.js';

// The walkthrough gate (`pnpm run test:walkthrough`) declares one unnamed
// project, so it only ever ran in Chromium: a motion or focus assertion that is
// wrong in Firefox or WebKit was invisible to it. This config reuses that file's
// server, test directory, timeouts, viewport and selectors and adds one project
// per engine, mirroring playwright.engines.config.ts for the functional suite.
//
// It is opt-in (`pnpm run test:walkthrough:engines`) and the default walkthrough
// command is untouched: its recordings are produced to be watched, and tripling
// them is not what that gate is for. Select an engine with
// `--project chromium|firefox|webkit`.
//
// Retries stay at zero (inherited), one worker stays (inherited -- parallel
// engines contend for CPU and a contended page drops the animation frames the
// motion assertions sample), and video is kept for failures only: with three
// engines the clips are verification output, not the reviewed PR recordings.
const config: PlaywrightTestConfig = {
  ...base,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-walkthrough-engines' }]
  ],
  outputDir: 'test-results-walkthrough-engines',
  use: {
    ...base.use,
    video: { mode: 'retain-on-failure', size: { width: 1280, height: 720 } }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
};

export default config;
