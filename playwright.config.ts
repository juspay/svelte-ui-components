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
  // This suite became a merge gate (ci.yml), so a single timing hiccup on a
  // shared runner would now block an unrelated PR. Retries are not here to hide
  // that: Playwright reports a test that failed then passed as "flaky", a status
  // distinct from "passed", so the signal stays visible in the uploaded report
  // while only genuinely reproducible failures stop a merge. Local runs keep 0
  // retries -- a flake you can reproduce is a flake you can fix.
  retries: process.env.CI ? 2 : 0,
  // No reporter was ever configured, so CI's "Upload Playwright report" step
  // (ci.yml) had nothing to upload -- playwright-report/ was never written,
  // in CI or locally (verified: absent after a full local run). 'list' keeps
  // today's console output; 'html' is what actually gets attached as a real,
  // openable artifact.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
    // This repo's demo pages expose data-pw hooks; getByTestId must target them.
    testIdAttribute: 'data-pw',
    // Real proof, not just a pass/fail assertion: a playable recording of every
    // test, embedded into the html report so it travels with the CI artifact.
    video: 'on',
    // The video shows what happened; the trace shows why. It carries the DOM
    // snapshot at every step, so a reviewer can inspect the custom element's
    // actual attributes and shadow tree at the moment of the assertion rather
    // than taking the recording's word for it.
    trace: 'on'
  },
  projects: [
    {
      name: 'functional'
    }
  ]
};

export default config;
