import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';
import base from './playwright.config.js';

// The functional suite ran in Chromium only: playwright.config.ts declares one
// unnamed project, so Firefox and WebKit regressions were invisible to
// `pnpm run test:integration`. This config reuses that file's server, test
// directory, timeouts and selectors and adds one project per engine, so the same
// specs run unchanged in all three.
//
// It is opt-in (`pnpm run test:integration:engines`) rather than folded into
// playwright.config.ts: `playwright test` runs every project, so adding engines
// there would triple the merge gate's runtime in one step.
//
// Select an engine with `--project chromium|firefox|webkit`. Local retries stay
// at zero (inherited from the base config) so a first-pass result is a real
// first-pass result.
//
// Video and trace are retained on failure only. The base config records every
// test as reviewable proof; across three engines that is roughly three times the
// disk for passes nobody opens, while a failure still keeps its recording.
const config: PlaywrightTestConfig = {
  ...base,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-engines' }]],
  outputDir: 'test-results-engines',
  use: {
    ...base.use,
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
};

export default config;
