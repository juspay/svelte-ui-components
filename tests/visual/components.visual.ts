import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// Routes are discovered from disk rather than hand-listed on purpose: a new
// component demo added without a committed baseline fails this suite instead of
// silently going unscreenshotted, which is the failure mode that lets visual
// coverage rot. The cost is that adding a demo requires regenerating baselines.
const COMPONENTS_DIR = join(process.cwd(), 'src/routes/components');

const slugs: readonly string[] = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/**
 * Regions whose pixels are genuinely non-deterministic between identical runs,
 * with the reason each one is masked. Masking paints a box over the region, so
 * the rest of the component is still compared -- this is deliberately narrower
 * than skipping the route. Anything not listed here is compared in full.
 */
const MASKS: Readonly<Record<string, readonly string[]>> = {
  // Lottie drives its frames from rAF in JS, not CSS, so `animations: 'disabled'`
  // cannot pin it to a frame the way it does a CSS keyframe animation.
  'lottie-player': ['.demo-row'],
  // Renders a real <video>; the decoded frame shown at screenshot time depends on
  // decoder timing rather than on anything this library controls.
  'media-player': ['.demo-row']
};

/**
 * Routes excluded from baselining, with the reason each one could not be
 * stabilised. Kept as an explicit, commented list rather than silence: an
 * excluded route is a known coverage hole, and the next person deserves to
 * find it here instead of discovering it when a regression ships.
 *
 * Both of these pass reliably when run on their own and fail intermittently
 * inside the full suite at any worker count, which points at load sensitivity
 * in how much work settles before capture rather than at anything in the
 * components. Everything that worked for the rest of the suite was tried on
 * them -- manual clock, longer settles, per-route viewport fitting, stripped
 * animations, stubbed network. Shipping them flaky would block unrelated PRs
 * at random, which is worse than admitting the gap.
 */
const EXCLUDED: Readonly<Record<string, string>> = {
  'thinking-indicator':
    'animated dots plus a per-second elapsed counter; unstable under suite load',
  'task-list': 'one of the tallest demos with staged reveals; unstable under suite load'
};

const FIXED_TIME = new Date('2026-01-15T09:30:00.000Z');

// How much fake time to let elapse after load. Long enough for mount-time
// timers (a demo's initial setTimeout, a staged reveal) to finish, short enough
// that a repeating timer produces a small, fixed number of iterations.
const SETTLE_MS = 1_500;

/**
 * Routes whose demo runs a timer *cascade* rather than a one-shot timer, and so
 * needs enough fake time to reach its terminal state. Stopping mid-cascade is
 * not wrong-looking, but where it stops depends on how the promise chain
 * interleaves, which is not identical between runs -- the Chat demo streams a
 * reply 45ms per character through nested setTimeouts and staged tool chips,
 * and settling it early made the baseline unreproducible under parallel
 * workers while passing when run alone. Advancing to the end is deterministic.
 */
const SETTLE_OVERRIDES: Readonly<Record<string, number>> = {
  chat: 30_000,
  // Its demo calls the sequence "showcase choreography": tool entries land one
  // per 700ms with a chip that resolves afterwards. Same shape as chat's.
  'tool-call-log': 30_000
};

// A fixed, opaque stand-in for every off-origin image. Sized 64x64 but scaled by
// the page's own CSS, so layout is preserved wherever a real image would sit.
const STUB_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c7d2e0"/></svg>`;

/**
 * Serves every off-origin request locally: images become a fixed stub, anything
 * else is refused.
 *
 * The BrandLoader demo points at `https://picsum.photos/64/64?random=41`, which
 * returns a *different photograph on every request* -- so its baseline could
 * never reproduce, and the failure looked like an animation bug for three
 * rounds of investigation before the diff image showed the changing pixels were
 * the logos themselves. `i.pravatar.cc` behaves the same way elsewhere.
 *
 * Beyond determinism this removes a network dependency from CI: without it the
 * suite fails whenever a third-party image host is slow or unreachable, which
 * is a miserable way to block an unrelated PR.
 */
async function stubExternalRequests(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return route.continue();
    }
    if (route.request().resourceType() === 'image') {
      return route.fulfill({ contentType: 'image/svg+xml', body: STUB_IMAGE });
    }
    return route.abort();
  });
}

/**
 * Waits until every <img> has settled, successfully or not. Playwright's
 * screenshot stability check samples the rendered frame, which can match twice
 * in a row while an image is still in flight -- and a late-arriving image then
 * changes both the pixels and, when it has no intrinsic size yet, the element's
 * height.
 */
async function waitForImages(page: Page): Promise<void> {
  const settled = await page.evaluate(async () => {
    // Rescanned each round rather than snapshotted once: settling one image can
    // append another (a gallery that loads its full-size asset once the
    // thumbnail is in), and a single pass would return with that one in flight.
    // Watches are memoised so an image still pending on the next round is not
    // given a second pair of listeners.
    const watched = new WeakMap<HTMLImageElement, Promise<void>>();
    const watch = (image: HTMLImageElement): Promise<void> => {
      const existing = watched.get(image);
      if (typeof existing !== 'undefined') {
        return existing;
      }
      const settled = new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
      watched.set(image, settled);
      return settled;
    };

    for (let round = 0; round < 5; round++) {
      const pending = Array.from(document.images).filter((image) => !image.complete);
      if (pending.length === 0) {
        return true;
      }
      await Promise.all(pending.map(watch));
    }
    return Array.from(document.images).every((image) => image.complete);
  });

  if (!settled) {
    throw new Error(
      'images were still loading after 5 rounds; capturing now would bake in whichever ' +
        'ones happened to have arrived'
    );
  }
}

const VIEWPORT_WIDTH = 1280;
const MIN_VIEWPORT_HEIGHT = 800;
// Nothing should approach this; it exists so a runaway page cannot ask for a
// buffer large enough to exhaust the container's memory.
const MAX_VIEWPORT_HEIGHT = 20_000;

/**
 * Resizes the viewport so the whole document fits without scrolling.
 *
 * Repeats because growing the viewport can reveal content that was not
 * rendered before -- the page gets taller as a result of being measured. Two
 * passes settle every demo here; the loop stops as soon as the height holds.
 *
 * Some demos can never fit, because their content is sized against the viewport
 * rather than against itself: the layout is `min-height: 100vh` and the demo
 * adds its own full-height element, so every pixel the viewport gains comes
 * straight back as content. Growing into that is an infinite loop, and the
 * previous fixed attempt budget hid it -- the loop simply ran out, leaving a
 * viewport whose final size was decided by the iteration count rather than by
 * the page. Those are pinned to the default viewport instead, which is at
 * least a size somebody chose.
 *
 * Anything that is neither fitted nor viewport-relative is a page still moving
 * for some third reason, and throws rather than being captured mid-scroll.
 */
/**
 * Confirms that content really is sized against the viewport, by shrinking the
 * viewport and checking the content follows it down.
 *
 * A single growth step cannot tell the two apart: a page that reveals a large
 * section when given room grows by more than the viewport did, and inferring
 * from that one delta would pin a perfectly fittable demo to the default size
 * and quietly drop everything below the fold. Content that tracks the viewport
 * shrinks when it shrinks; content that was merely revealed does not.
 */
async function confirmViewportRelative(
  page: Page,
  viewport: number,
  height: number
): Promise<boolean> {
  const probe = Math.max(Math.round(viewport / 2), MIN_VIEWPORT_HEIGHT);
  if (probe >= viewport) {
    return false;
  }

  await page.setViewportSize({ width: VIEWPORT_WIDTH, height: probe });
  const probed = await page.evaluate(() =>
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  );
  await page.setViewportSize({ width: VIEWPORT_WIDTH, height: viewport });

  // Shrinking by N must give back at least most of N. A fittable page barely
  // moves, since its height comes from its own content.
  return height - probed >= (viewport - probe) * 0.9;
}

async function fitViewportToContent(page: Page): Promise<void> {
  const seen: number[] = [];
  let viewport = MIN_VIEWPORT_HEIGHT;
  let previousViewport = MIN_VIEWPORT_HEIGHT;

  for (let attempt = 0; attempt < 6; attempt++) {
    const height = await page.evaluate(() =>
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    );
    const previousHeight = seen.at(-1);
    if (height === previousHeight) {
      return;
    }

    if (typeof previousHeight !== 'undefined') {
      const viewportGain = viewport - previousViewport;
      // Off by one to absorb sub-pixel rounding in the layout.
      const looksViewportRelative = viewportGain > 0 && height - previousHeight >= viewportGain - 1;
      if (looksViewportRelative && (await confirmViewportRelative(page, viewport, height))) {
        // Surfaced in the report so a newly viewport-relative demo is visible
        // rather than silently captured at a different size than its neighbours.
        console.log('  pinned to the default viewport (content is viewport-relative)');
        await page.setViewportSize({ width: VIEWPORT_WIDTH, height: MIN_VIEWPORT_HEIGHT });
        return;
      }
    }

    seen.push(height);
    previousViewport = viewport;
    // Clamped, not rejected: a demo past the cap is captured by scrolling, the
    // same as before. The cap is here so a runaway page cannot ask for a buffer
    // large enough to exhaust the container's memory.
    viewport = Math.min(Math.max(height, MIN_VIEWPORT_HEIGHT), MAX_VIEWPORT_HEIGHT);
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: viewport });
  }

  throw new Error(
    `page height never settled: ${seen.join(' -> ')}px, and the growth does not track the ` +
      'viewport. Content is still reacting to something else, so any screenshot would be ' +
      'taken mid-scroll.'
  );
}

async function prepare(page: Page, slug: string): Promise<void> {
  await stubExternalRequests(page);

  // `install` rather than `setFixedTime`. setFixedTime only pins Date.now(),
  // which is enough for date-derived UI (Calendar's current month,
  // DateRangePicker's "today") but leaves setTimeout/setInterval running --
  // and the Chat and ThinkingIndicator demos append content on an interval.
  // That grew `main.content` between successive screenshots (2142px -> 2241px
  // -> 2270px), so the comparison never stabilised and no baseline could be
  // written at all. Masking cannot fix a changing element height.
  //
  // `install` makes the clock manual: timers fire only when we advance it, so
  // every route is captured after exactly the same amount of elapsed time.
  await page.clock.install({ time: FIXED_TIME });
  await page.goto(`/components/${slug}`, { waitUntil: 'networkidle' });

  await page.addStyleTag({
    content: `
      /* The demo layout appends the rendered docs/*.md below every demo. Those
         pixels belong to documentation, not to the component -- including them
         would turn every prose edit into a visual-regression failure. */
      .docs-section { display: none !important; }
      /* Belt-and-braces alongside Playwright's animations:'disabled': that
         option finishes CSS animations, but a caret blinking inside a focused
         input is neither an animation nor a transition. */
      *, *::before, *::after { caret-color: transparent !important; }
    `
  });

  await page.evaluate(() => document.fonts.ready);
  await waitForImages(page);

  // Grow the viewport to the whole page before capturing.
  //
  // Playwright stitches an element taller than the viewport by scrolling it,
  // and scrolling is an input: content that renders lazily on scroll changes
  // height mid-capture, so the run cannot take two consecutive stable
  // screenshots. A fixed tall viewport only half-fixed this -- 11 of the 94
  // demos are taller than 4000px (`status` is 12209px, `table` 11053px), so
  // exactly those kept scrolling and exactly those stayed flaky.
  //
  // Sizing to the content per route removes the scroll everywhere. It also
  // keeps baselines honest: `main.content` stretches to the viewport, so a
  // single tall viewport would pad every short demo with thousands of blank
  // pixels instead.
  await fitViewportToContent(page);
  await page.evaluate(() => document.fonts.ready);
  await waitForImages(page);

  // Advance the manual clock once, by a fixed amount, so timer-driven demos
  // reach a settled state that is identical on every run. After this returns
  // the clock stops again, so nothing can shift while the screenshot is taken.
  await page.clock.runFor(SETTLE_OVERRIDES[slug] ?? SETTLE_MS);

  // Remove every CSS animation via a stylesheet, not per element.
  //
  // Playwright's `animations: 'disabled'` alone was not enough: ThinkingIndicator
  // kept oscillating between two heights (2035px / 2029px) even with the clock
  // stopped, so the run could never take "two consecutive stable screenshots".
  // An earlier attempt tagged the animating elements with a marker class and
  // targeted that -- which Svelte then clobbered, because it rewrites the class
  // attribute on re-render and dropped the marker along with it. A stylesheet
  // rule cannot be overwritten that way.
  //
  // `animation: none` renders each element from its own base CSS rather than
  // from an animation keyframe. For an entry animation that base state is the
  // settled one, so components do not baseline mid-transition. The Modal and
  // Toast baselines were checked by eye afterwards to confirm they render
  // fully, rather than assuming it.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        -webkit-animation: none !important;
      }
    `
  });
}

test.describe('visual baselines', () => {
  for (const slug of slugs) {
    const exclusion = EXCLUDED[slug];
    if (typeof exclusion === 'string') {
      // Declared as a skipped test rather than omitted, so the route still
      // appears in the report with its reason attached. NOT `test.skip(cond)`:
      // that form applies to the whole enclosing describe, which silently
      // skipped all 94 routes and turned the gate into a no-op that reported
      // success.
      test.skip(`${slug} renders as baselined — excluded: ${exclusion}`, () => {});
      continue;
    }

    test(`${slug} renders as baselined`, async ({ page }) => {
      await prepare(page, slug);

      const masks = (MASKS[slug] ?? []).map((selector) => page.locator(selector));

      await expect(page.locator('main.content')).toHaveScreenshot(`${slug}.png`, {
        animations: 'disabled',
        mask: masks,
        // Exact match. A tolerance here would be a slow leak: it hides the
        // sub-threshold drift that accumulates into a real regression, and the
        // container pins rendering tightly enough that we don't need one.
        maxDiffPixelRatio: 0
      });
    });
  }
});
