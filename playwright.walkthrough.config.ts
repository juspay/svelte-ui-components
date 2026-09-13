import type { PlaywrightTestConfig } from '@playwright/test';
import { FUNCTIONAL, playwrightPort, reuseExistingServer } from './scripts/pw-port.js';

// Recordings meant to be WATCHED, kept apart from the assertion suite.
//
// playwright.config.ts already sets `video: 'on'`, and that is what produced the
// evidence attached to this PR: ten clips totalling 19 seconds, eight under two,
// at 800x450. They are a byproduct of recording tests that were never written to
// be viewed. Raising the functional suite's video size would not fix it -- the
// clips are short because the tests are short, and slowing 933 assertion tests
// down so they film well would be a straightforwardly bad trade.
//
// So walkthroughs are a separate project with different economics: one worker,
// real wall-clock pacing, a viewport large enough to read, and a handful of specs
// rather than hundreds.
//
// The port offset is FUNCTIONAL, not a third value. scripts/pw-port.ts steps
// checkouts by two precisely so one checkout's VISUAL (+1) cannot land on
// another's FUNCTIONAL; a third offset would reintroduce that collision. Sharing
// the functional port is safe because both serve the same `pnpm run build`
// output, and the two commands are run one after the other rather than together.
const port = playwrightPort(FUNCTIONAL);

const config: PlaywrightTestConfig = {
  webServer: {
    command: `pnpm run build && pnpm run preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: reuseExistingServer(),
    timeout: 180_000
  },
  testDir: 'tests/walkthrough',
  testMatch: /.*\.walkthrough\.ts/,
  // A walkthrough spends most of its time deliberately waiting, so the functional
  // suite's 30s ceiling would fail these for doing their job.
  timeout: 180_000,
  // One worker: parallel recordings contend for CPU, and a contended recording
  // drops frames, which is the one defect this project exists to avoid.
  workers: 1,
  // A retry would append a SECOND recording for the same scenario, leaving two
  // files where the report expects one and no way to tell which is current.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-walkthrough' }]],
  outputDir: 'test-results-walkthrough',
  use: {
    baseURL: `http://localhost:${port}`,
    testIdAttribute: 'data-pw',
    // 1280x720 rather than the 800x450 default: these are watched full-size in a
    // PR comment, where 800x450 renders component text too small to read.
    viewport: { width: 1280, height: 720 },
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    // Deliberately no trace. The trace is the instrument for debugging a failure;
    // these exist to be watched, and a trace on every one would triple the
    // artifact for no reviewer benefit.
    trace: 'off'
  },
  projects: [{ name: 'walkthrough' }]
};

export default config;
