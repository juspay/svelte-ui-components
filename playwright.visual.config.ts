import type { PlaywrightTestConfig } from '@playwright/test';

// Separate from playwright.config.ts on purpose. Screenshot baselines are only
// meaningful against a fixed renderer, so this suite runs ONLY inside the
// pinned Playwright container (`pnpm run test:visual`) -- both locally and in
// CI, via the same image. Folding these specs into the functional project would
// make `pnpm run test:integration` fail on macOS for reasons that have nothing
// to do with the code under test.
const port = Number(process.env.PW_PORT ?? 43200);

const config: PlaywrightTestConfig = {
  webServer: {
    command: `pnpm run build && pnpm run preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  },
  testDir: 'tests/visual',
  testMatch: /.*\.visual\.ts/,
  timeout: 60_000,
  // Baselines are byte-comparisons; a retry cannot change the bytes, so a retry
  // here would only burn CI minutes re-rendering an identical diff.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  // Drops Playwright's default {platform} and {projectName} suffixes. Safe ONLY
  // because the container is the single supported renderer -- see docs. If this
  // suite ever runs on a second platform, restore the suffixes or the two
  // platforms will silently overwrite each other's baselines.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${port}`,
    testIdAttribute: 'data-pw',
    // Starting size only. Each test grows the viewport to its own page height
    // before capturing (see fitViewportToContent), because scrolling to stitch
    // a tall element is itself an input -- content that renders lazily on
    // scroll changes height mid-capture. A fixed tall viewport is not enough:
    // 11 demos exceed 4000px, the tallest at 12209px.
    viewport: { width: 1280, height: 800 },
    // Physical pixels per CSS pixel. Pinned so a runner defaulting to a
    // different DPR cannot silently rescale every baseline.
    deviceScaleFactor: 1,
    // A diff is worth watching; a pass is not worth 94 videos.
    video: 'off'
  },
  projects: [{ name: 'visual' }]
};

export default config;
