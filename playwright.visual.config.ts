import type { PlaywrightTestConfig } from '@playwright/test';
import { VISUAL, playwrightPort, reuseExistingServer } from './scripts/pw-port.js';

// Separate from playwright.config.ts on purpose. Screenshot baselines are only
// meaningful against a fixed renderer, so this suite runs ONLY inside the
// pinned Playwright container (`pnpm run test:visual`) -- both locally and in
// CI, via the same image. Folding these specs into the functional project would
// make `pnpm run test:integration` fail on macOS for reasons that have nothing
// to do with the code under test.
//
// VISUAL sits one above this checkout's functional port; see scripts/pw-port.ts.
const port = playwrightPort(VISUAL);

const config: PlaywrightTestConfig = {
  webServer: {
    command: `pnpm run build && pnpm run preview --port ${port} --strictPort`,
    port,
    // See playwright.config.ts — reuse only a deliberately named port.
    reuseExistingServer: reuseExistingServer(),
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
  /*
   * Set explicitly, and equal to Playwright's own default, so the number is a
   * decision on the record rather than an inherited value nobody measured.
   *
   * `threshold` is the PER-PIXEL tolerance: a pixel is not counted as different
   * until its pixelmatch YIQ delta exceeds `35215 * threshold^2` -- 1408.6 here.
   * `maxDiffPixelRatio: 0` in the spec bounds how many pixels may exceed that;
   * it does NOT make the comparison exact, which is what it reads like.
   *
   * 0.2 is not arbitrary. Measured across six captures of the same tree in this
   * container, `hitl` differs from itself by up to 1314.3 and `theme-switcher`
   * by 520.2 -- so the suite's own capture noise reaches 93% of this budget.
   * Lowering it to 0.1 (352.2) puts 16 hitl pixels over the line on an
   * UNCHANGED tree; 0.05 (88.0) puts 394 over. Tightening this number buys
   * colour sensitivity and pays for it in a flaky suite.
   *
   * The consequence is a real limit, documented rather than papered over: this
   * suite cannot see a colour-only change smaller than ~1409 per pixel. A
   * WCAG contrast fix (#637c95 -> #4d6174) measures 354.6 and is invisible to
   * it. Colour belongs in unit assertions -- see src/lib/a11y-contrast.test.ts
   * -- and this suite guards geometry, which it does well because a size
   * mismatch is rejected outright before any pixel is compared.
   *
   * Raising it is not a free win either: it would hide real regressions. The
   * route to lowering it is making `hitl` deterministic, not adjusting this.
   */
  expect: {
    toHaveScreenshot: { threshold: 0.2 }
  },
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
