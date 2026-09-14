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
  'media-player': ['.demo-row'],
  // Same reason as lottie-player: VoiceOrb draws to a canvas from rAF, so the
  // frame captured depends on when the screenshot lands, not on the component.
  // The moving orbs are masked; `.orb-still` deliberately is NOT, because a
  // `speedMultiplier={0}` orb paints the same pixels on every frame. Masking
  // every canvas on the route -- which the first revision of this entry did --
  // left a baseline of nothing but headings, and a passing visual suite that
  // would not have noticed the orb going blank. It did go blank.
  'voice-orb': ['.demo-row', '.orb-grid']
};

/**
 * Routes excluded from baselining, with the reason each one could not be
 * stabilised. Kept as an explicit, commented list rather than silence: an
 * excluded route is a known coverage hole, and the next person deserves to
 * find it here instead of discovering it when a regression ships.
 *
 * One route remains. Everything that worked for the rest of the suite was
 * tried on it -- manual clock, longer settles, per-route viewport fitting,
 * stripped animations, stubbed network -- and its height still moves between
 * capture attempts. Shipping it flaky would block unrelated PRs at random,
 * which is worse than admitting the gap.
 *
 * `task-list` used to sit here too. Its instability was the viewport-fitting
 * problem, fixed since, and it is baselined now: re-check an entry here before
 * assuming the reason still holds.
 */
/**
 * Per-route pixel allowances, for a route whose baseline is stable everywhere
 * except one antialiased edge. Scoped to the named route only: every other
 * snapshot stays on the zero-count comparison below -- which bounds how many
 * pixels may exceed the per-pixel `threshold`, and is NOT a pixel-identity
 * check. See that comparison's own comment, and the threshold in
 * playwright.visual.config.ts.
 *
 * The allowance is a COUNT, not a ratio, and it is deliberately far below the
 * smallest real change this suite has ever caught, so a genuine regression
 * cannot hide underneath it. For reference, the real diffs seen so far were
 * 415px (a one-line demo row added to Toggle), 1577px (the Toolbar back-control
 * rewrite) and 137982px (a new section on the Input page).
 */
const TOLERANCES: Readonly<Record<string, number>> = {
  // Measured, not assumed. Two failures on two different branches, neither of
  // which touches TaskList, produced the SAME five pixels: x=83, y=332-336.
  // That column is the antialiased left edge of the part-filled progress circle
  // beside "Draft migration plan"; it rasterises at rgb(220) in the baseline and
  // rgb(107) when the arc boundary lands one column over. A re-run on unchanged
  // code cleared it both times. Two of the nine runs since this baseline landed
  // hit it, so it is frequent enough to gate merges on noise.
  'task-list': 12
};

/*
 * `hitl` is the route that sets the per-pixel `threshold` in
 * playwright.visual.config.ts, so its instability is the suite's budget.
 * Recorded here because the number in that config is meaningless without it.
 *
 * Measured across six captures of an unchanged tree: `hitl` differs from itself
 * in 13 of 15 pairs, and the max delta is ALWAYS exactly 1314.3 while the
 * differing-pixel count steps 212 / 412 / 612 / 1012 / 1212 / 1612. A constant
 * magnitude with a quantised count is not a continuous tail -- it is one edge
 * landing on a discrete set of positions, four screen columns apart.
 *
 * The edge is the auto-confirm countdown's progress fill on the Confirm button
 * (x=587..598, y=605..654); 1314.3 is simply the distance between the fill
 * colour and the track behind it. `startCountdown` decrements on a
 * `setInterval(..., 100)` and the bar carries `width 0.1s linear`, so the
 * captured width depends on how many ticks have landed.
 *
 * That matters because the injected stylesheet below kills `animation` but not
 * `transition`, and Playwright's `animations: 'disabled'` fast-forwards a
 * transition at CAPTURE time on the real compositor clock -- which the manual
 * clock does not drive. So the tick count is pinned and the transition is not.
 *
 * The fix is to make this route deterministic, NOT to raise the threshold and
 * not to mask the button. Masking is what the `voice-orb` entry below warns
 * about: an over-broad mask once left a baseline of nothing but headings, and a
 * passing suite that did not notice the orb had gone blank. Masking a Confirm
 * button would hide the control this route exists to cover.
 *
 * Second-largest is `theme-switcher` at 520.2, in 5 of 15 pairs -- the segment
 * indicator, same shape of problem. If both are pinned, the floor drops far
 * enough that a materially tighter threshold becomes possible.
 */

const EXCLUDED: Readonly<Record<string, string>> = {
  // Measured across full-suite runs rather than assumed: the captured height
  // walks 2029 -> 2035 -> 2121 -> 2150 -> 2059px within a single test's own
  // retries, so no baseline is stable. The animated dots are pinned by the
  // stylesheet, but the per-second elapsed counter changes the text on a real
  // timer that the manual clock does not drive.
  'thinking-indicator':
    'elapsed counter retimes the layout mid-capture; height varies 2029-2150px between attempts'
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

/**
 * Returns how the viewport was settled. `'viewport-pinned'` routes deliberately
 * keep a viewport smaller than their content (see the escape path below), so a
 * caller must not treat their capture box as fittable.
 */
async function fitViewportToContent(page: Page): Promise<'fitted' | 'viewport-pinned'> {
  const seen: number[] = [];
  let viewport = MIN_VIEWPORT_HEIGHT;
  let previousViewport = MIN_VIEWPORT_HEIGHT;

  for (let attempt = 0; attempt < 6; attempt++) {
    const height = await page.evaluate(() =>
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    );
    const previousHeight = seen.at(-1);
    if (height === previousHeight) {
      return 'fitted';
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
        return 'viewport-pinned';
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
  /*
   * Ordering invariant: nothing that changes layout may run after this measures,
   * or the capture disagrees with the viewport it was sized for.
   *
   * That is the rule the sub-pixel pin at the end of this function restores --
   * it broke the invariant by growing the element after the fit, and had to
   * refit to put it back. The rule is stated here because nothing else in the
   * file encodes it, which is how it has been broken three separate times.
   *
   * The three known ways, as failure modes rather than a status list -- whether
   * any is live depends on the ordering below, so read that rather than trust
   * this:
   *
   *   - Growing the captured element after the fit. What the pin did; it
   *     refits for that reason.
   *   - Advancing timers after the fit (`clock.runFor`), so a demo that settles
   *     during it relayouts against a viewport already sized. Note the pin
   *     absorbs this for fitted routes when it runs later in the function --
   *     positionally, not by design, so do not rely on it.
   *   - A transition on a layout property. Playwright's `animations:'disabled'`
   *     fast-forwards a running transition to its end state at *capture* time,
   *     after everything in this function, so no loop here can absorb it --
   *     only suppressing transitions before the fit does. Accordion transitions
   *     `grid-template-rows`, and `task-list` was observed growing 852px ->
   *     855px between consecutive captures of an otherwise idle page.
   *
   * Anything added to this function after this line should either not affect
   * layout, or re-establish the fit the way the pin does.
   */
  const viewportFit = await fitViewportToContent(page);
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

  /*
   * Skipped for viewport-relative routes. Those took the escape path above and
   * are deliberately pinned to a viewport smaller than their content, so they
   * are captured by scrolling by design. Growing the viewport to match their
   * padded height is exactly what that path refuses to do -- it would capture
   * them at a different size from their neighbours -- and their height is a
   * function of the viewport, so pinning then resizing would feed itself.
   */
  if (viewportFit === 'fitted') {
    await pinCaptureHeightToWholePixels(page, slug);
  }
}

/**
 * Absorbs the capture target's sub-pixel remainder so its box lands on a whole
 * pixel.
 *
 * `fitViewportToContent` settles on `scrollHeight`, which is *already* rounded,
 * so it never constrains `main.content`'s own height -- and a fifth of the demo
 * routes lay out to a fractional one. Playwright rounds a fractional element box
 * when it captures, and which way it rounds depends on the element's sub-pixel
 * offset, so those routes can emit a bitmap one pixel taller or shorter than
 * their baseline on an otherwise identical run. A pixel tolerance cannot absorb
 * that: `toHaveScreenshot` rejects a size mismatch before comparing any pixels.
 *
 * The remainder is added to the existing bottom padding rather than written as a
 * height, because the element has to stay auto-height. Two earlier attempts show
 * why this is the narrow path:
 *
 *   - Setting `box-sizing: border-box` so the measured box could be assigned
 *     directly reinterpreted `.content`'s `max-width:900px` against the border
 *     box, narrowing every capture from 980px to 900px and failing all 94 routes.
 *   - Assigning an explicit `height` (with the padding subtracted, so the width
 *     was safe) stopped the block growing for its descendants' trailing margins.
 *     That moved pages by as much as 11px in both directions -- `accordion`
 *     1613 -> 1602, `tool-call-log` 969 -> 975 -- which changes what the
 *     screenshot contains rather than just how it rounds.
 *
 * Adding under a pixel of padding leaves the layout algorithm untouched and
 * moves nothing that was not already ambiguous.
 */
async function pinCaptureHeightToWholePixels(page: Page, slug: string): Promise<void> {
  /*
   * Padding and viewport are settled together, and iteratively, because each can
   * disturb the other: growing the element can leave the viewport a pixel short,
   * and resizing the viewport relayouts the page, which can produce a fresh
   * fractional height.
   *
   * Only a pass that changes nothing proves they agree, so that is the only way
   * out -- exhausting the budget throws rather than returning. A silent give-up
   * would be indistinguishable from convergence while leaving the route in the
   * stitching state this function exists to prevent, and every baseline
   * regenerated for it would look settled and not be. `fitViewportToContent`
   * throws on the same kind of non-convergence, for the same reason.
   */
  const seen: string[] = [];

  for (let attempt = 0; attempt < 6; attempt++) {
    const padded = await page.evaluate(() => {
      const main = document.querySelector('main.content');
      if (!(main instanceof HTMLElement)) {
        return false;
      }
      const height = main.getBoundingClientRect().height;
      const remainder = Math.ceil(height) - height;
      if (remainder <= 0) {
        return false;
      }
      const paddingBottom = parseFloat(window.getComputedStyle(main).paddingBottom);
      main.style.paddingBottom = `${paddingBottom + remainder}px`;
      return true;
    });

    /*
     * The viewport was fitted from `scrollHeight` before this padding existed,
     * so it can now be a pixel short of the content. Playwright scrolls a target
     * taller than the viewport and stitches the capture -- the scroll-dependent
     * screenshot this suite goes to lengths elsewhere to avoid, and which would
     * reintroduce the instability the padding is here to remove.
     */
    const documentHeight = await page.evaluate(() =>
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    );
    /*
     * A route taller than the cap clamps here, so the viewport stops growing and
     * this loop returns while the element still exceeds it -- stitched, on
     * purpose. That is not the failure the throw below describes: the padding
     * has already run, so the box is integral, and a stitched capture of an
     * integral box still has one possible height. `fitViewportToContent` clamps
     * the same way, noting that a demo past the cap is captured by scrolling as
     * it always was. Nothing reaches it today, but the margin belongs to the
     * merged tree rather than to either branch -- any branch that lengthens a
     * demo moves the tallest route -- so measure it there before relying on it.
     */
    const wanted = Math.min(Math.max(documentHeight, MIN_VIEWPORT_HEIGHT), MAX_VIEWPORT_HEIGHT);
    const current = page.viewportSize()?.height ?? MIN_VIEWPORT_HEIGHT;
    const resized = wanted > current;
    if (resized) {
      await page.setViewportSize({ width: VIEWPORT_WIDTH, height: wanted });
    }

    seen.push(`${attempt}: document ${documentHeight}px, viewport ${current} -> ${wanted}`);

    if (!padded && !resized) {
      return;
    }
  }

  throw new Error(
    `capture box never settled for "${slug}": ${seen.join('; ')}. The padding and the ` +
      'viewport are still moving each other, so the box is not integral and its captured ' +
      'height would depend on sub-pixel rounding. (A route clamped at MAX_VIEWPORT_HEIGHT ' +
      'does not reach this: it returns stitched but integral, which is safe.)'
  );
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

      const allowance = TOLERANCES[slug];

      // Zero pixels may EXCEED the per-pixel threshold. That is the default and
      // it stays the default -- but it is not an exact match, which an earlier
      // revision of this comment claimed and which is worth correcting here
      // rather than in a commit message nobody reads twice.
      //
      // `threshold` (set in playwright.visual.config.ts, 0.2) decides when a
      // pixel counts as different at all: its pixelmatch YIQ delta must exceed
      // 1408.6. `maxDiffPixelRatio: 0` then allows none of those. So a colour
      // change under 1409 per pixel passes no matter how many pixels carry it.
      //
      // Measured, not assumed: a WCAG contrast fix on three components
      // (#637c95 -> #4d6174, delta 354.6) passed 94/94 and rewrote nothing,
      // leaving baselines asserting the failure it fixed. The control that
      // proves the instrument still works is an injected #ff0000 at delta
      // 10175.9, which fails with 3381 differing pixels.
      //
      // Two consequences worth knowing before trusting a green run:
      //
      //   - A green result means "no pixel differs by more than 1408.6", not
      //     "the baselines match the tree". Colour regressions live under it;
      //     geometry does not, because a size mismatch is rejected before any
      //     pixel is compared. Pin colour in a unit test instead --
      //     src/lib/a11y-contrast.test.ts is the working example.
      //
      //   - `--update-snapshots` CANNOT repair a sub-threshold stale baseline.
      //     It applies this same threshold, so it writes nothing and reports
      //     success. Verified: five tests ran, passed, and left an 8,351-pixel
      //     drift in place. Delete the PNG and re-run instead -- a missing
      //     baseline is not a comparison, so the threshold never applies.
      //
      // A route in TOLERANCES trades the zero-count for a bounded pixel count
      // on that route alone -- and only maxDiffPixels is passed there, since
      // maxDiffPixelRatio: 0 alongside it is the stricter bound and would fail
      // the comparison anyway.
      const comparison =
        typeof allowance === 'number' ? { maxDiffPixels: allowance } : { maxDiffPixelRatio: 0 };

      await expect(page.locator('main.content')).toHaveScreenshot(`${slug}.png`, {
        animations: 'disabled',
        mask: masks,
        ...comparison
      });
    });
  }
});
