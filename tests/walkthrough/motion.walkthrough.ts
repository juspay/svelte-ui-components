import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import {
  canHoldThroughDisplayExit,
  distance,
  expectExitOpacity,
  expectExitTransform,
  expectMs,
  onlyRun,
  parseTranslate,
  peekToastRecording,
  readToastRecording,
  startToastRecording,
  toastEnds,
  toastRuns
} from '../support/motion-observers.js';
import { assertInViewport, beat, caption, highlight, step } from './support/narrate.js';

/**
 * Proves the "motion" gaps from the audit packet (scratchpad/gaps/motion.json):
 * every place a reduced-motion guard was added or fixed in this PR, shown
 * actually running, then actually stopping, with the result still legible.
 *
 * That last clause is the whole reason this file exists. The PR's own shipped
 * evidence for the indefinite-loop population (Loader, BrandLoader, Shimmer) was
 * `07-indefinite-motion-stops-under-reduced-motion.mp4` -- 1.16s / 29 frames.
 * That is not long enough to show an animation running, then the preference
 * applied, then the animation stopped AND still visible, for even one of the
 * seven components tests/reduced-motion-indefinite.spec.ts covers, let alone
 * stand in for all of them. This file replaces it: every scenario below holds
 * on the "running" state, applies the preference on camera, and holds again on
 * the "stopped but present" state, with a real assertion at each stage.
 *
 * `page.emulateMedia({ reducedMotion: ... })` is used throughout, never the
 * `reducedMotion` fixture option -- the fixture form does not reliably reach
 * this app (matchMedia still reports no-preference), so every test probes
 * `matchMedia('(prefers-reduced-motion: reduce)').matches` right after setting
 * it. `setReducedMotion` below does both in one call.
 *
 * Covered gaps (in scratchpad/gaps/motion.json order): ModalAnimation
 * fade+fly, Toast tokenized travel and reduced-motion fade, Scroller arrow scrollBy, Tabs overflow-arrow scrollBy,
 * Tabs manual/disabled/loop=false + RTL direction, TypewriterText markdown
 * reveal, the VoiceOrb/LottiePlayer :host sizing fix, and the Loader/
 * BrandLoader/Shimmer indefinite loops.
 *
 * NOT covered: Input.focus()'s scrollIntoView (the packet's fifth entry). No
 * demo route calls the exported focus() method -- every Input on
 * /components/input is either already in view or reachable only by a native
 * Tab/click focus, neither of which exercises focus()'s own scrollIntoView
 * call. Driving it would mean adding a trigger button to a demo route, which
 * this assignment forbids; this walkthrough spec has nothing to show for that
 * gap and reports it blocked rather than inventing a selector.
 */

type TransitionSample = {
  readonly minOpacity: number;
  readonly maxOffset: number;
  readonly finalOpacity: number;
  readonly finalOffset: number;
};

/** Sets prefers-reduced-motion and proves the emulation actually reached the page. */
const setReducedMotion = async (page: Page, reduced: boolean): Promise<void> => {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const matches = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(matches, 'the reduced-motion emulation must actually reach the page').toBe(reduced);
};

/** Removes narration before filming a component state, so the state itself stays unobscured. */
const dismissCaption = async (page: Page): Promise<void> => {
  await page.locator('[data-walkthrough-caption]').evaluate((node) => node.remove());
};

/**
 * Injects the built custom-element bundle, the same pattern
 * tests/wc-motion-reachable.spec.ts uses: no route mounts these tags today, so
 * a spec navigates to '/' and builds the demo DOM itself rather than adding a
 * page under src/routes/ or static/.
 */
const loadWcBundle = async (page: Page, tags: readonly string[]): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    (tagList) => tagList.every((tag) => Boolean(customElements.get(tag))),
    tags,
    { timeout: 15_000 }
  );
};

/** The computed `animation-name` of an element or one of its pseudo-elements. */
const animationName = (page: Page, selector: string, pseudo?: string): Promise<string> =>
  page
    .locator(selector)
    .evaluate((el, arg) => getComputedStyle(el, arg.pseudo ?? null).animationName, { pseudo });

/** The translate distance (px) carried in an element's (or pseudo-element's) computed transform. */
const readTransformOffset = (page: Page, selector: string, pseudo?: string): Promise<number> =>
  page.locator(selector).evaluate(
    (el, arg) => {
      const { transform } = getComputedStyle(el, arg.pseudo ?? null);
      const match = /matrix\(([^)]+)\)/.exec(transform);
      if (!match) {
        return 0;
      }
      const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
      if (parts.length < 6) {
        return 0;
      }
      return Math.hypot(parts[4], parts[5]);
    },
    { pseudo }
  );

/** The rotation angle (degrees) carried in an element's computed transform. */
const readTransformAngle = (page: Page, selector: string): Promise<number> =>
  page.locator(selector).evaluate((el) => {
    const { transform } = getComputedStyle(el);
    const match = /matrix\(([^)]+)\)/.exec(transform);
    if (!match) {
      return 0;
    }
    const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 4) {
      return 0;
    }
    return (Math.atan2(parts[1], parts[0]) * 180) / Math.PI;
  });

/** The minimal rotation between two angles (degrees, in [0, 180]), independent of atan2 wraparound. */
const rotationDelta = (a: number, b: number): number =>
  Math.abs(((((a - b + 540) % 360) + 360) % 360) - 180);

/**
 * Watches a freshly-mounting element's opacity and transform-translate distance
 * over a window, starting from the moment it is called -- BEFORE the click that
 * triggers the mount, not after. `locator.evaluate()` read once immediately
 * after a click is not reliable here: Playwright's own actionability wait
 * before the click can consume an unpredictable slice of a short (300-800ms)
 * Svelte transition, so a single post-click read can land after the transition
 * has already settled. This starts an in-page requestAnimationFrame polling
 * loop before the triggering action and returns a promise that resolves once
 * `windowMs` has elapsed, so it cannot miss the transition regardless of when
 * the click actually lands.
 */
const watchTransition = (
  page: Page,
  options: { readonly selector: string; readonly parent?: boolean; readonly windowMs: number }
): Promise<TransitionSample> =>
  page.evaluate(
    ({ selector, parent, windowMs }) =>
      new Promise<TransitionSample>((resolve) => {
        const start = performance.now();
        let minOpacity = 1;
        let maxOffset = 0;
        let finalOpacity = 1;
        let finalOffset = 0;

        const readOffset = (transform: string): number => {
          const match = /matrix\(([^)]+)\)/.exec(transform);
          if (!match) {
            return 0;
          }
          const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
          if (parts.length < 6) {
            return 0;
          }
          return Math.hypot(parts[4], parts[5]);
        };

        const tick = (): void => {
          const found = document.querySelector(selector);
          const el = parent ? (found?.parentElement ?? null) : found;
          if (el instanceof HTMLElement) {
            const style = getComputedStyle(el);
            const opacity = Number.parseFloat(style.opacity);
            const offset = readOffset(style.transform);
            minOpacity = Math.min(minOpacity, opacity);
            maxOffset = Math.max(maxOffset, offset);
            finalOpacity = opacity;
            finalOffset = offset;
          }
          if (performance.now() - start < windowMs) {
            requestAnimationFrame(tick);
          } else {
            resolve({ minOpacity, maxOffset, finalOpacity, finalOffset });
          }
        };

        requestAnimationFrame(tick);
      }),
    { selector: options.selector, parent: options.parent === true, windowMs: options.windowMs }
  );

type MidTransitionSample = {
  readonly opacity: number;
  readonly offset: number;
};

/**
 * Freezes a freshly-mounting element's real transition on screen, so the
 * paused frame can be held for a full-length hold instead of flashing past in
 * whatever's left of a <400ms window.
 *
 * svelte/transition's fade/fly do not animate via a plain CSS class -- they
 * call the element's own `Element.animate()` (Web Animations API) with the
 * eased keyframes baked in (see node_modules/svelte's
 * internal/client/dom/elements/transitions.js), which is a real,
 * independently-controllable `Animation` object reachable through
 * `element.getAnimations()`. This polls (via requestAnimationFrame, started
 * BEFORE the triggering click for the same reason watchTransition's own doc
 * comment gives) until the element's rendered opacity enters `opacityBand`,
 * then calls `.pause()` on whatever `Animation` is running at that instant.
 * Pausing stops `currentTime` from advancing, so every subsequent paint keeps
 * showing that exact in-flight frame until `finishTransition` below seeks it
 * again -- a real animation held open, not a synthetic slow-motion effect or
 * a fabricated intermediate frame.
 *
 * Both fade (linear easing) and fly (cubic-out easing, and fly drives its
 * opacity off the same eased `t` as its x/y offset -- see svelte's
 * transition/index.js) reach a given opacity at *some* point in their run
 * regardless of the curve's shape, which is why the trigger is opacity-based
 * rather than raw elapsed-time-based: gating on elapsed time against a cubic
 * curve can land arbitrarily close to either endpoint depending on exactly
 * which frame the poll lands on, where opacity cannot.
 */
const pauseMidTransition = (
  page: Page,
  options: {
    readonly selector: string;
    readonly parent?: boolean;
    readonly opacityBand?: readonly [number, number];
    readonly timeoutMs?: number;
  }
): Promise<MidTransitionSample> =>
  page.evaluate(
    ({ selector, parent, opacityBand, timeoutMs }) =>
      new Promise<MidTransitionSample>((resolve, reject) => {
        const start = performance.now();
        const [lo, hi] = opacityBand;

        const readOffset = (transform: string): number => {
          const match = /matrix\(([^)]+)\)/.exec(transform);
          if (!match) {
            return 0;
          }
          const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
          if (parts.length < 6) {
            return 0;
          }
          return Math.hypot(parts[4], parts[5]);
        };

        const tick = (): void => {
          const found = document.querySelector(selector);
          const el = parent ? (found?.parentElement ?? null) : found;
          if (el instanceof HTMLElement) {
            const style = getComputedStyle(el);
            const opacity = Number.parseFloat(style.opacity);
            if (opacity >= lo && opacity <= hi) {
              const running = el.getAnimations().filter((anim) => anim.playState === 'running');
              if (running.length > 0) {
                running.forEach((anim) => anim.pause());
                const paused = getComputedStyle(el);
                resolve({
                  opacity: Number.parseFloat(paused.opacity),
                  offset: readOffset(paused.transform)
                });
                return;
              }
            }
          }
          if (performance.now() - start > timeoutMs) {
            reject(
              new Error(
                `"${selector}" never showed a running animation with opacity in [${lo}, ${hi}] within ${timeoutMs}ms`
              )
            );
            return;
          }
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    {
      selector: options.selector,
      parent: options.parent === true,
      opacityBand: options.opacityBand ?? [0.2, 0.8],
      timeoutMs: options.timeoutMs ?? 2_000
    }
  );

/**
 * Seeks every animation `pauseMidTransition` paused on `selector` straight to
 * its end (`Animation.finish()`, a standard Web Animations API call, not a
 * fabricated jump-cut -- with `fill: 'forwards'` it lands on exactly the same
 * end keyframe letting the animation run out the clock would) and reads the
 * settled computed style, so the "did it come to rest correctly" assertions
 * check the real tail of the same transition the hold just froze.
 *
 * Deliberately synchronous rather than resuming playback and awaiting real
 * elapsed time: Toast's own auto-hide is a plain `setTimeout(hideToast,
 * duration)` in Toast.svelte, started the instant the component mounts and
 * running regardless of this animation's play state, with a 2000ms default
 * in this file's demo. Between the required >=1.5s hold and the poll that
 * finds the pausable frame, real time is already tight against that window;
 * waiting out the remainder of the transition on top would risk the toast
 * starting its own out-transition mid-assertion. `finish()` reaches the same
 * pixels without spending any more of that budget.
 */
const finishTransition = (
  page: Page,
  options: { readonly selector: string; readonly parent?: boolean }
): Promise<MidTransitionSample> =>
  page.evaluate(({ selector, parent }) => {
    const readOffset = (transform: string): number => {
      const match = /matrix\(([^)]+)\)/.exec(transform);
      if (!match) {
        return 0;
      }
      const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
      if (parts.length < 6) {
        return 0;
      }
      return Math.hypot(parts[4], parts[5]);
    };

    const found = document.querySelector(selector);
    const el = parent ? (found?.parentElement ?? null) : found;
    if (!(el instanceof HTMLElement)) {
      return { opacity: 1, offset: 0 };
    }

    el.getAnimations()
      .filter((anim) => anim.playState === 'paused')
      .forEach((anim) => anim.finish());

    const style = getComputedStyle(el);
    return { opacity: Number.parseFloat(style.opacity), offset: readOffset(style.transform) };
  }, options);

/**
 * A hand-authored, minimal Bodymovin/Lottie document: one shape layer whose
 * opacity keyframes from 20 to 100 back to 20 over 60 frames at 30fps (2s,
 * looping). Passed as `animationData` directly, so mounting never depends on a
 * network fetch of a real asset.
 */
const LOTTIE_PULSE_ANIMATION = {
  v: '5.9.0',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'walkthrough-pulse',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'pulse',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [20], e: [100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: 30, s: [100], e: [20], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: 60, s: [20] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        { ty: 'el', nm: 'ellipse', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [120, 120] } },
        { ty: 'fl', nm: 'fill', c: { a: 0, k: [0.06, 0.53, 0.98, 1] }, o: { a: 0, k: 100 } }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
};

test.describe('ModalAnimation: fade and fly entrances collapse under reduced motion', () => {
  test('the default fade modal and the slide-up fly modal animate in, then appear instantly once reduced motion is set', async ({
    page
  }) => {
    // flyAnimationProperties/fadeAnimationProperties are $derived.by/$derived,
    // and prefersReducedMotion() reads matchMedia directly rather than
    // subscribing to it -- so the derived tracks nothing and is memoised at
    // whatever value was current on ITS OWN first evaluation. Toggling
    // emulateMedia on an already-mounted instance does not reach it, so the
    // preference is set before EACH navigation below, never mid-page.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoHydrated(page, '/components/modal');
    await setReducedMotion(page, false);

    const modalContent = page.locator('.modal-content');
    const openFade = page.getByText('Open Modal', { exact: true });
    const openFly = page.getByText('Open centered modal (slide-up)', { exact: true });

    // The fade is 300ms and the fly is 380ms -- both comfortably shorter than
    // one frame interval at a 3fps review sampling rate (333ms), so without
    // an explicit hold the in-flight frame can fall entirely between two
    // sampled frames and never be seen. pauseMidTransition freezes the real
    // Web Animations API animation svelte/transition creates (see its own
    // doc comment) the instant it is genuinely partway through, so the held
    // frame below is provable pixels, not a description of one.
    await caption(
      page,
      'Reduced motion is off. Watch the fade pause mid-transition -- a genuinely half-visible frame, held long enough to see.'
    );
    await dismissCaption(page);
    const fadeMidWatch = pauseMidTransition(page, { selector: '.modal-content', parent: true });
    await openFade.click();
    const fadeMid = await fadeMidWatch;
    await highlight(modalContent);
    await beat(page, 1_500);

    expect(
      fadeMid.opacity,
      'the paused frame must be genuinely mid-fade, not still fully transparent'
    ).toBeGreaterThan(0.1);
    expect(
      fadeMid.opacity,
      'the paused frame must be genuinely mid-fade, not already fully opaque'
    ).toBeLessThan(0.9);

    const fadeSettled = await finishTransition(page, { selector: '.modal-content', parent: true });
    expect(
      fadeSettled.opacity,
      'the modal must settle fully visible once the paused animation resumes'
    ).toBeGreaterThan(0.95);
    await expect(modalContent).toBeVisible();

    await beat(page);
    await page.getByTestId('confirm-modal-close').click();
    await beat(page);

    await caption(
      page,
      'Reduced motion is still off. Watch the slide-up modal pause mid-flight, still visibly off its resting position.'
    );
    await dismissCaption(page);
    const flyMidWatch = pauseMidTransition(page, { selector: '.modal-content', parent: true });
    await openFly.click();
    const flyMid = await flyMidWatch;
    await highlight(modalContent);
    await beat(page, 1_500);

    expect(
      flyMid.offset,
      'the paused frame must show real in-flight travel, not an already-settled modal'
    ).toBeGreaterThan(30);
    // svelte/transition's fly defaults opacity to 0, so this path fades too,
    // independently of the translate above.
    expect(
      flyMid.opacity,
      'the fly-in also fades from transparent while paused mid-flight'
    ).toBeLessThan(0.9);

    const flySettled = await finishTransition(page, { selector: '.modal-content', parent: true });
    expect(
      flySettled.offset,
      'the modal must settle back at its resting position once the paused animation resumes'
    ).toBeLessThan(5);
    expect(flySettled.opacity).toBeGreaterThan(0.95);

    await beat(page);
    await page.getByTestId('slide-up-modal-close').click();
    await beat(page);

    // A fresh navigation, not a close/reopen on this same page: see the
    // memoisation note above the first emulateMedia call.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/modal');
    await setReducedMotion(page, true);

    const modalContentReduced = page.locator('.modal-content');
    const openFadeReduced = page.getByText('Open Modal', { exact: true });
    const openFlyReduced = page.getByText('Open centered modal (slide-up)', { exact: true });

    await caption(page, 'Reduced motion is now on. The same fade modal should appear instantly.');
    await dismissCaption(page);
    const fadeReducedWatch = watchTransition(page, {
      selector: '.modal-content',
      parent: true,
      windowMs: 250
    });
    await openFadeReduced.click();
    const fadeReducedResult = await fadeReducedWatch;
    await highlight(modalContentReduced);
    await beat(page, 1_500);

    expect(
      fadeReducedResult.minOpacity,
      'a zero-duration fade must not show a transparent frame'
    ).toBeGreaterThan(0.9);
    expect(fadeReducedResult.finalOpacity).toBeGreaterThan(0.95);
    await expect(modalContentReduced).toBeVisible();

    await beat(page);
    await page.getByTestId('confirm-modal-close').click();
    await beat(page);

    await caption(page, 'The slide-up modal should now appear instantly too, with no travel.');
    await dismissCaption(page);
    const flyReducedWatch = watchTransition(page, {
      selector: '.modal-content',
      parent: true,
      windowMs: 250
    });
    await openFlyReduced.click();
    const flyReducedResult = await flyReducedWatch;
    await highlight(modalContentReduced);
    await beat(page, 1_500);

    expect(flyReducedResult.maxOffset, 'a zero-duration fly must not visibly travel').toBeLessThan(
      10
    );
    expect(flyReducedResult.minOpacity).toBeGreaterThan(0.9);
    expect(flyReducedResult.finalOpacity).toBeGreaterThan(0.95);
    await expect(modalContentReduced).toBeVisible();

    await beat(page);
    await page.getByTestId('slide-up-modal-close').click();
    await beat(page);
  });
});

/**
 * `--toast-top` is Toast's own documented CSS override point (Toast.svelte:
 * `top: var(--toast-top, 10px)`), not a private internal. The demo route never
 * sets it, so the default `top: 10px` applies.
 *
 * Toast enters from `--distance-overlay` (60px) above its resting position, so at
 * 10px the toast starts at y = -50 and a frame frozen mid-flight is partly above
 * the viewport. Resting it 300px down instead keeps the whole in-flight frame in
 * view for the hold, and changes nothing about the component or the demo route:
 * it is the same public CSS hook a real consumer would reach for to anchor a
 * toast lower on their own page.
 */
const TOAST_VISIBLE_REST_TOP_PX = 300;
const raiseToastRestPosition = async (page: Page): Promise<void> => {
  await page.addStyleTag({ content: `.toast { --toast-top: ${TOAST_VISIBLE_REST_TOP_PX}px; }` });
};

const DEFAULT_TOAST_TRAVEL_PX = 60;
const TOAST_OPEN_MS = 400;
const TOAST_CLOSE_MS = 800;
const TOAST_REDUCED_MS = 50;

/**
 * Toast is CSS-native (`@starting-style`, `transition`), not `in:fly`/`out:fly`,
 * so the sections below read the CSSTransition objects the engine runs
 * (tests/support/motion-observers.ts) instead of sampling frames:
 *
 *  - normal motion travels `--distance-overlay` (60px) over 400ms in and 800ms out,
 *    and any of `--distance-overlay`, `--toast-open-duration`,
 *    `--toast-close-duration` retunes it;
 *  - reduced motion removes the spatial travel but KEEPS a 50ms opacity fade. That
 *    is deliberate: a 0s transition never starts, so it never fires
 *    `transitionend`, and `transitionend` is what raises `ontoasthide` so the
 *    consumer can remove the toast. An earlier version of this walkthrough asserted
 *    "no faded-in frame is observable" and failed against the intended 50ms fade;
 *  - the exit needs the engine to hold the toast through `display: flex -> none`
 *    (a discrete transition). Where it cannot (Firefox 150) there is no exit
 *    animation, and what is asserted is that the hide is still reported and the
 *    toast removed -- chosen by probing the capability, never by engine name.
 */
test.describe('Toast: tokenized travel under normal motion, a 50ms fade and no travel under reduced motion', () => {
  test('the toast flies in from the 60px token position, frozen mid-flight in view, settles, then hides and is removed', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);
    // See raiseToastRestPosition: without it the frozen frame is partly off the top.
    await raiseToastRestPosition(page);
    const canExit = await canHoldThroughDisplayExit(page);

    const showToast = page.getByRole('button', { name: 'Show Toast', exact: true });
    const toast = page.locator('.toast');

    // Installed before the click, so the entrance is observed from its first frame.
    const recorder = await startToastRecording(page);

    // The `in` transition is 400ms -- shorter than one frame interval at a 3fps
    // review sampling rate (333ms) -- so without an explicit hold the in-flight
    // frame can fall entirely between two sampled frames. This freezes the real
    // transition mid-flight (pauseMidTransition's own doc comment) instead of only
    // asserting on it in JS.
    //
    // The hold is a single highlight rather than highlight-then-beat: Toast.svelte
    // starts a real `setTimeout(hideToast, duration)` (2000ms here) the instant it
    // mounts, independent of this paused transition's play state, and
    // finishTransition below is deliberately instantaneous to keep the whole
    // paused-hold-then-assert sequence inside that window.
    await caption(
      page,
      'Reduced motion is off. The toast starts 60px above its resting place; watch it pause mid-flight, in view.'
    );
    await dismissCaption(page);
    const flyMidWatch = pauseMidTransition(page, { selector: '.toast' });
    await showToast.click();
    const flyMid = await flyMidWatch;
    await highlight(toast, 1_200);

    expect(
      flyMid.offset,
      'the paused frame must show real in-flight travel, not an already-settled toast'
    ).toBeGreaterThan(2);
    expect(
      flyMid.offset,
      'and never more than the 60px token distance (the retired 500px/400px fly would)'
    ).toBeLessThanOrEqual(DEFAULT_TOAST_TRAVEL_PX + 0.5);
    expect(flyMid.opacity, 'the entrance also fades from transparent').toBeLessThan(0.9);
    // A mid-flight frame is worthless as proof if it is paused off screen.
    await assertInViewport(page, toast);

    const flySettled = await finishTransition(page, { selector: '.toast' });
    expect(
      flySettled.offset,
      'the toast must settle at its resting position once the paused transition resumes'
    ).toBeLessThan(1);
    expect(flySettled.opacity, 'the toast must settle fully visible').toBeGreaterThan(0.95);
    await expect(toast).toBeVisible();

    // Eventual cleanup: the auto-hide fires, the exit runs (where the engine can),
    // and the consumer's ontoasthide handler removes the node.
    await caption(page, 'The toast now hides by itself and is removed.');
    await expect(toast).toHaveCount(0, { timeout: 10_000 });
    const recording = await readToastRecording(recorder);

    const enterTransform = onlyRun(recording, 'enter', 'transform');
    expect(parseTranslate(enterTransform.from)).toEqual({ x: 0, y: -DEFAULT_TOAST_TRAVEL_PX });
    expect(distance(parseTranslate(enterTransform.to))).toBe(0);
    expectMs(enterTransform.durationMs, TOAST_OPEN_MS);
    expectExitTransform(recording, canExit, {
      to: { x: 0, y: -DEFAULT_TOAST_TRAVEL_PX },
      durationMs: TOAST_CLOSE_MS
    });
    expect(recording.removedAfterMs, 'the toast was never removed').not.toBeNull();
    await beat(page);
  });

  test('a themed distance and duration reach the transition, and a mounted toast keeps the new preference', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);
    await raiseToastRestPosition(page);
    const canExit = await canHoldThroughDisplayExit(page);
    await page.addStyleTag({
      content:
        ':root { --distance-overlay: 140px; --toast-open-duration: 700ms; --toast-close-duration: 350ms; }'
    });

    const toast = page.locator('.toast');
    const recorder = await startToastRecording(page);

    await caption(
      page,
      'Same toast, themed: --distance-overlay 140px, open 700ms, close 350ms. The preference then flips on the mounted toast.'
    );
    await dismissCaption(page);
    await page.getByRole('button', { name: 'Show Toast', exact: true }).click();
    await expect(toast).toBeVisible();
    await expect
      .poll(async () => toastEnds(await peekToastRecording(recorder), 'enter', 'transform').length)
      .toBe(1);
    await highlight(toast, 500);

    // Inside the 2s auto-hide, on the SAME mounted toast: no reload, no remount.
    await setReducedMotion(page, true);
    expect(
      await toast.evaluate((node) => getComputedStyle(node).transitionDuration),
      'the mounted toast must pick up reduced motion without remounting'
    ).toBe('0.05s');

    await expect(toast).toHaveCount(0, { timeout: 10_000 });
    const recording = await readToastRecording(recorder);

    const enter = onlyRun(recording, 'enter', 'transform');
    expect(parseTranslate(enter.from)).toEqual({ x: 0, y: -140 });
    expectMs(enter.durationMs, 700);
    // The exit happened AFTER the flip: no travel, a 50ms fade (or none at all where
    // the engine has no exit), and still reported hidden.
    expect(toastRuns(recording, 'exit', 'transform')).toHaveLength(0);
    expectExitOpacity(recording, canExit, TOAST_REDUCED_MS);
    expect(recording.removedAfterMs).not.toBeNull();
    await beat(page);
  });

  test('under reduced motion the toast fades in over 50ms with no travel, then hides and is removed', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, true);
    const canExit = await canHoldThroughDisplayExit(page);
    // A consumer token must not be able to revive travel or slow the hide.
    await page.addStyleTag({
      content:
        ':root { --distance-overlay: 200px; --toast-open-duration: 900ms; --toast-close-duration: 900ms; }'
    });

    const toast = page.locator('.toast');
    const recorder = await startToastRecording(page);

    await caption(
      page,
      'Reduced motion is on, and the theme asks for 200px / 900ms. The toast fades in place for 50ms and does not travel.'
    );
    await dismissCaption(page);
    await page.getByRole('button', { name: 'Show Toast', exact: true }).click();
    await expect(toast).toBeVisible();
    await highlight(toast, 1_200);

    await expect(toast).toHaveCount(0, { timeout: 10_000 });
    const recording = await readToastRecording(recorder);

    // No spatial movement, in either direction, even with the 200px token set.
    expect(toastRuns(recording, 'enter', 'transform')).toHaveLength(0);
    expect(toastRuns(recording, 'exit', 'transform')).toHaveLength(0);
    expect(recording.maxFrameOffsetPx.enter).toBeLessThan(0.5);
    expect(recording.maxFrameOffsetPx.exit).toBeLessThan(0.5);
    // The 50ms fade is what remains -- and what lets the toast report it is hidden.
    const enterFade = onlyRun(recording, 'enter', 'opacity');
    expect(Number(enterFade.from)).toBe(0);
    expect(Number(enterFade.to)).toBe(1);
    expectMs(enterFade.durationMs, TOAST_REDUCED_MS);
    expectExitOpacity(recording, canExit, TOAST_REDUCED_MS);
    expect(recording.removedAfterMs, 'the toast was never removed').not.toBeNull();
    await beat(page);
  });
});

test.describe('Scroller: arrow-driven scrollBy() honours reduced motion at click time', () => {
  test('the horizontal demo glides on a normal click and jumps once reduced motion is set', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');
    await setReducedMotion(page, false);

    const demo = page.getByTestId('scroller-horizontal-default');
    const container = demo.locator('.scroll-container');
    const nextButton = demo.getByRole('button', { name: 'Scroll next' });
    const prevButton = demo.getByRole('button', { name: 'Scroll previous' });

    await caption(page, 'Reduced motion is off. The right arrow should glide the row, not jump.');
    const start = await container.evaluate((el) => el.scrollLeft);
    await nextButton.click();
    const rightAfterClickOff = await container.evaluate((el) => el.scrollLeft);
    await beat(page);
    const settledOff = await container.evaluate((el) => el.scrollLeft);
    await highlight(container);

    expect(settledOff, 'the arrow must actually move the track').toBeGreaterThan(start);
    expect(
      rightAfterClickOff,
      'a smooth scroll should not already be at its resting position the instant the click resolves'
    ).not.toBe(settledOff);

    await setReducedMotion(page, true);
    await caption(
      page,
      'Reduced motion is now on. The left arrow should jump straight to its target, with no glide.'
    );
    const beforeReduced = settledOff;
    await prevButton.click();
    const rightAfterClickReduced = await container.evaluate((el) => el.scrollLeft);
    await beat(page);
    const settledReduced = await container.evaluate((el) => el.scrollLeft);
    await highlight(container);

    expect(settledReduced, 'the arrow must still actually move the track').toBeLessThan(
      beforeReduced
    );
    expect(
      rightAfterClickReduced,
      'an instant jump must already be at its resting position the instant the click resolves'
    ).toBe(settledReduced);

    await beat(page);
  });
});

test.describe('Tabs: the overflow-arrow auto-scroll honours reduced motion at click time', () => {
  test('the overflow demo glides on a normal click and jumps once reduced motion is set', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');
    await setReducedMotion(page, false);

    const wrapper = page.getByTestId('tabs-overflow-demo');
    const track = wrapper.locator('[role="tablist"]');
    const rightArrow = wrapper.getByRole('button', { name: 'Scroll tabs right' });
    const leftArrow = wrapper.getByRole('button', { name: 'Scroll tabs left' });

    await caption(page, 'Reduced motion is off. The overflow arrow should glide the tab strip.');
    const start = await track.evaluate((el) => el.scrollLeft);
    await rightArrow.click();
    const rightAfterClickOff = await track.evaluate((el) => el.scrollLeft);
    await beat(page);
    const settledOff = await track.evaluate((el) => el.scrollLeft);
    await highlight(track);

    expect(settledOff, 'the arrow must actually move the strip').toBeGreaterThan(start);
    expect(
      rightAfterClickOff,
      'a smooth scroll should not already be at its resting position the instant the click resolves'
    ).not.toBe(settledOff);

    await setReducedMotion(page, true);
    await caption(
      page,
      'Reduced motion is now on. The same arrow should snap the strip, with no glide.'
    );
    const beforeReduced = settledOff;
    await leftArrow.click();
    const rightAfterClickReduced = await track.evaluate((el) => el.scrollLeft);
    await beat(page);
    const settledReduced = await track.evaluate((el) => el.scrollLeft);
    await highlight(track);

    expect(settledReduced, 'the arrow must still actually move the strip').toBeLessThan(
      beforeReduced
    );
    expect(
      rightAfterClickReduced,
      'an instant jump must already be at its resting position the instant the click resolves'
    ).toBe(settledReduced);

    await beat(page);
  });
});

test.describe('Tabs: manual activation, a disabled item, loop=false, and inherited RTL direction', () => {
  test('manual demo: arrow keys move focus and skip disabled items without selecting, Enter selects, and the end does not wrap', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');

    const wrapper = page.getByTestId('tabs-manual-demo');
    const overview = wrapper.getByRole('tab', { name: 'Overview' });
    const members = wrapper.getByRole('tab', { name: 'Members' });
    const auditLog = wrapper.getByRole('tab', { name: 'Audit log' });
    // `.state-display` is a sibling <p> after <Tabs>, not a descendant of its
    // testId'd root (src/routes/components/tabs/+page.svelte, manual-demo
    // block) -- scope through their shared `.demo-row` wrapper instead of
    // assuming containment.
    const state = page.locator('.demo-row', { has: wrapper }).locator('.state-display');

    await step(page, 'Click "Overview" to focus it.', async () => {
      await overview.click();
    });
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(state).toHaveText('Active key: overview');

    await step(
      page,
      'Press ArrowRight -- focus should skip the disabled "Billing" tab and land on "Members".',
      async () => {
        await page.keyboard.press('ArrowRight');
      }
    );
    await expect(members).toBeFocused();
    // Manual activation: moving focus must not have selected anything yet.
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(members).toHaveAttribute('aria-selected', 'false');
    await expect(state).toHaveText('Active key: overview');

    await step(page, 'Press Enter -- selection now actually switches to "Members".', async () => {
      await page.keyboard.press('Enter');
    });
    await expect(members).toHaveAttribute('aria-selected', 'true');
    await expect(overview).toHaveAttribute('aria-selected', 'false');
    await expect(state).toHaveText('Active key: members');

    await step(page, 'Press End -- focus jumps to the last enabled tab, "Audit log".', async () => {
      await page.keyboard.press('End');
    });
    await expect(auditLog).toBeFocused();
    // End moves focus only; selection is unchanged from the Enter above.
    await expect(members).toHaveAttribute('aria-selected', 'true');
    await expect(state).toHaveText('Active key: members');

    await step(
      page,
      'Press ArrowRight again from the last tab -- loop=false means it must not wrap back to the start.',
      async () => {
        await page.keyboard.press('ArrowRight');
      }
    );
    await expect(auditLog).toBeFocused();

    await beat(page);
  });

  test('RTL demo: ArrowLeft moves selection forward because the container inherits CSS direction:rtl, with no dir attribute', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/tabs');

    const rtlWrapper = page.getByTestId('tabs-rtl-demo');
    const tabsRoot = rtlWrapper.locator('.tabs-wrapper');
    const alpha = rtlWrapper.getByRole('tab', { name: 'Alpha' });
    const beta = rtlWrapper.getByRole('tab', { name: 'Beta' });
    const gamma = rtlWrapper.getByRole('tab', { name: 'Gamma' });

    const dirAttribute = await tabsRoot.evaluate((el) => el.getAttribute('dir'));
    expect(
      dirAttribute,
      'no dir attribute is passed -- direction must come from the ancestor style only'
    ).toBeNull();

    await step(page, 'Click "Beta", the demo’s initial selection, to focus it.', async () => {
      await beta.click();
    });
    await expect(beta).toHaveAttribute('aria-selected', 'true');

    await step(
      page,
      'Press ArrowLeft -- under inherited RTL this moves forward, to "Gamma".',
      async () => {
        await page.keyboard.press('ArrowLeft');
      }
    );
    await expect(gamma).toBeFocused();
    await expect(gamma).toHaveAttribute('aria-selected', 'true');
    await expect(beta).toHaveAttribute('aria-selected', 'false');
    await expect(alpha).toHaveAttribute('aria-selected', 'false');

    await beat(page);
  });
});

test.describe('TypewriterText: markdown mode honours the reduced-motion reveal guard', () => {
  test('the refund-summary markdown types in character by character, then appears all at once', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/typewriter-text');
    await setReducedMotion(page, false);

    const demo = page.getByTestId('typewriter-markdown-demo');
    const startButton = page.getByTestId('typewriter-markdown-start');

    // The markdown demo sits below three earlier TypewriterText sections, so
    // it starts off-screen at the top of a fresh navigation. A previous
    // repair moved the toast that was covering it, but never brought the
    // region itself into view -- scroll to it and prove the demo landed on
    // screen BEFORE narrating or typing, so an invisible reveal fails the
    // spec. The output element itself is legitimately empty and therefore
    // zero-size at this point -- .demo-row is a flex column with
    // align-items:flex-start, and markdown hasn't rendered anything until
    // the button is clicked -- so the pre-content viewport proof is anchored
    // on its always-sized sibling, the start button, right beside it in the
    // same row. `demo` is asserted directly further down, once it actually
    // has content to be visible.
    await demo.scrollIntoViewIfNeeded();
    await assertInViewport(page, startButton);

    await caption(
      page,
      'Reduced motion is off. Revealing markdown should type in character by character.'
    );
    await dismissCaption(page);
    await startButton.click();
    await beat(page, 250);
    const immediateItems = await demo.locator('li').count();

    // The scroll above landed on `demo` while it was still empty -- as it
    // types in, the box grows and outgrows that position, sliding its own
    // bottom edge below the fold. Wait for the reveal to fully settle, then
    // scroll again against the now-final box before highlighting and
    // holding, so the position we scroll to, highlight, and hold is the one
    // that is still true 1.5s from now -- not a shorter one about to be
    // outgrown mid-hold.
    await expect(demo.locator('li')).toHaveCount(2);
    await demo.scrollIntoViewIfNeeded();
    await highlight(demo);
    await beat(page, 1_500);
    // Re-assert after the hold, not just before it: this is the frame a
    // reviewer actually samples, and typed content growing the list must not
    // have pushed the region itself back out of the viewport.
    await assertInViewport(page, demo);
    const settledItems = await demo.locator('li').count();

    expect(settledItems, 'the full markdown list must finish rendering').toBe(2);
    expect(
      immediateItems,
      'a character-by-character reveal must not already show the finished list the instant the click resolves'
    ).toBeLessThan(settledItems);
    await expect(demo.locator('strong')).toHaveText('Refund summary');

    // typeNextCharacter()'s one-shot effect only re-runs when the `text` prop
    // itself changes, and the demo always assigns the same string, so a second
    // click on the same instance is a no-op. gotoHydrated both navigates and
    // waits for hydration in one call, which is this repo's own helper for
    // starting over -- used here instead of page.reload().
    await gotoHydrated(page, '/components/typewriter-text');
    await setReducedMotion(page, true);

    const demoAgain = page.getByTestId('typewriter-markdown-demo');
    const startButtonAgain = page.getByTestId('typewriter-markdown-start');

    // The fresh navigation above resets scroll to the top of the page, so the
    // region is off-screen again regardless of where the previous pass left
    // it. Same proof as the first pass: scroll, then confirm the row landed
    // on screen, before doing anything the recording is supposed to show.
    // Anchored on the button for the same reason as the first pass: `demoAgain`
    // has not rendered anything yet and is genuinely zero-size until clicked.
    await demoAgain.scrollIntoViewIfNeeded();
    await assertInViewport(page, startButtonAgain);

    await caption(
      page,
      'Reduced motion is now on. The same reveal should show the finished markdown at once.'
    );
    await dismissCaption(page);
    await startButtonAgain.click();
    // A short, deterministic wait rather than an immediate same-tick read: it
    // only needs to be well inside the ~900ms a character-by-character reveal
    // takes above, not an actual measurement of "instant".
    await beat(page, 150);
    const earlyItemsReduced = await demoAgain.locator('li').count();

    // Same reason as the first pass: the scroll above landed on `demoAgain`
    // while it was still empty, and reduced motion reveals the whole list
    // in that same beat, growing the box past where that scroll put it.
    // Re-scroll against the now-settled box before highlighting and holding.
    await demoAgain.scrollIntoViewIfNeeded();
    await highlight(demoAgain);
    await beat(page, 1_500);
    await assertInViewport(page, demoAgain);

    expect(
      earlyItemsReduced,
      'reduced motion must reveal the whole list well inside one typed character’s delay'
    ).toBe(2);
    await expect(demoAgain.locator('strong')).toHaveText('Refund summary');

    await beat(page);
  });
});

test.describe('VoiceOrb and LottiePlayer: the :host sizing fix and running animation', () => {
  test('sui-voice-orb fills a constrained light-DOM container and its canvas animation is running', async ({
    page
  }) => {
    await loadWcBundle(page, ['sui-voice-orb']);

    // .voice-orb has width:100% and no height percentage at all -- its canvas
    // gets an explicit inline px height (400 by default) -- so only a
    // width-providing light-DOM ancestor is needed, unlike LottiePlayer below.
    await page.evaluate(() => {
      document.body.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.id = 'wrap';
      wrap.style.cssText = 'width:320px;padding:24px;';
      document.body.append(wrap);
      const host = document.createElement('sui-voice-orb');
      wrap.append(host);
    });

    await page.waitForFunction(
      () => {
        const host = document.querySelector('sui-voice-orb');
        const canvas = host?.shadowRoot?.querySelector('canvas');
        return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
      },
      null,
      { timeout: 10_000 }
    );

    const orbBox = await page.locator('sui-voice-orb').evaluate((el) => {
      const canvas = el.shadowRoot?.querySelector('canvas');
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('expected a canvas inside the sui-voice-orb shadow root');
      }
      const rect = canvas.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(
      orbBox.width,
      'the orb must fill its 320px container, not collapse to zero'
    ).toBeGreaterThan(50);
    expect(orbBox.height).toBeGreaterThan(50);

    const sampleOrb = (): Promise<number> =>
      page.locator('sui-voice-orb').evaluate((el) => {
        const canvas = el.shadowRoot?.querySelector('canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
          throw new Error('expected a canvas inside the sui-voice-orb shadow root');
        }
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
          throw new Error('expected a 2d context');
        }
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let checksum = 0;
        for (let i = 0; i < data.length; i += 97) {
          checksum += data[i];
        }
        return checksum;
      });

    await caption(page, 'sui-voice-orb now fills its container, with its animation running.');
    const firstSample = await sampleOrb();
    await beat(page, 1_000);
    const secondSample = await sampleOrb();
    await highlight(page.locator('sui-voice-orb'));

    expect(secondSample, 'the orb must actually be animating, not a frozen frame').not.toBe(
      firstSample
    );

    await beat(page);
  });

  test('sui-lottie-player fills an explicitly-sized host and its animation is playing', async ({
    page
  }) => {
    await loadWcBundle(page, ['sui-lottie-player']);

    // .lottie-player has BOTH width:100% and height:100% -- and a block
    // element's height:auto is shrink-to-fit, not fill-parent, so a
    // definite-height wrapper alone is not enough. The host itself needs an
    // explicit height set directly, on top of a width-providing wrapper.
    await page.evaluate((animation) => {
      document.body.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.id = 'wrap';
      wrap.style.cssText = 'width:320px;padding:24px;';
      document.body.append(wrap);
      const host = document.createElement('sui-lottie-player');
      host.style.cssText = 'display:block;width:240px;height:240px;';
      Reflect.set(host, 'onerror', () => {
        document.body.dataset.lottieLoadError = 'true';
      });
      Reflect.set(host, 'animationData', animation);
      wrap.append(host);
    }, LOTTIE_PULSE_ANIMATION);

    await page.waitForFunction(
      () => {
        const host = document.querySelector('sui-lottie-player');
        return (host?.shadowRoot?.querySelector('svg') ?? null) !== null;
      },
      null,
      { timeout: 10_000 }
    );

    const box = await page.locator('sui-lottie-player').evaluate((el) => {
      const svg = el.shadowRoot?.querySelector('svg');
      if (!(svg instanceof SVGSVGElement)) {
        throw new Error('expected an svg inside the sui-lottie-player shadow root');
      }
      const rect = svg.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(box.width, 'the player must fill its explicitly-sized 240px host').toBeGreaterThan(50);
    expect(box.height).toBeGreaterThan(50);

    const sampleMarkup = (): Promise<string> =>
      page.locator('sui-lottie-player').evaluate((el) => {
        const svg = el.shadowRoot?.querySelector('svg');
        if (!(svg instanceof SVGSVGElement)) {
          throw new Error('expected an svg inside the sui-lottie-player shadow root');
        }
        return svg.innerHTML;
      });

    await caption(page, 'sui-lottie-player now fills its container, with its animation playing.');
    const firstMarkup = await sampleMarkup();
    await beat(page, 800);
    const secondMarkup = await sampleMarkup();
    await highlight(page.locator('sui-lottie-player'));

    expect(secondMarkup, 'the animation must actually be playing, not a frozen frame').not.toBe(
      firstMarkup
    );

    const loadError = await page.evaluate(() => document.body.dataset.lottieLoadError);
    expect(
      loadError,
      'lottie-web must not have failed to load the hand-authored animation'
    ).toBeUndefined();

    await beat(page);
  });
});

test.describe('The indefinite-loop population: running, then stopped and still visible', () => {
  test('Loader: the ring spins, then freezes in place without disappearing', async ({ page }) => {
    await gotoHydrated(page, '/components/loader');
    await setReducedMotion(page, false);

    const loader = page.getByTestId('loader-demo');
    const selector = '[data-pw="loader-demo"]';
    await expect(loader).toBeVisible();
    expect(await animationName(page, selector)).not.toBe('none');

    await caption(page, 'Reduced motion is off. The ring spins continuously.');
    await dismissCaption(page);
    const angleBefore = await readTransformAngle(page, selector);
    await beat(page, 400);
    const angleAfter = await readTransformAngle(page, selector);
    await highlight(loader);
    await beat(page, 1_500);
    expect(
      rotationDelta(angleAfter, angleBefore),
      'the ring must have visibly rotated during an unfrozen 400ms window'
    ).toBeGreaterThan(20);

    await setReducedMotion(page, true);
    await caption(page, 'Reduced motion is now on. The spin stops, but the ring stays on screen.');
    await dismissCaption(page);
    expect(await animationName(page, selector)).toBe('none');

    const frozenFirst = await readTransformAngle(page, selector);
    await highlight(loader);
    await beat(page, 1_500);
    const frozenSecond = await readTransformAngle(page, selector);
    expect(frozenSecond, 'a stopped ring must not still be rotating').toBe(frozenFirst);

    await expect(loader).toBeVisible();
    const box = await loader.boundingBox();
    expect(box, 'the ring must still occupy a real box, not have vanished').not.toBeNull();
    if (box !== null) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }

    await beat(page);
  });

  test('BrandLoader: the four-dot ellipsis animates, then freezes as three evenly-spaced dots', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/brand-loader');
    await setReducedMotion(page, false);

    const loader = page.getByTestId('brand-loader-default-demo');
    await expect(loader).toBeVisible();

    // .background's own `animateBackground` keyframes do not exist anywhere in
    // src/ (confirmed by grep), so it is a dead rule -- toggling its
    // animation-name to 'none' under reduce is a real CSS-guard assertion but
    // never a visible change. The second dot's lds-ellipsis2 translate (which
    // DOES have a matching @keyframes rule) is this test's real motion proof.
    const secondDot = '[data-pw="brand-loader-default-demo"] .lds-ellipsis div:nth-child(2)';
    expect(await animationName(page, secondDot)).not.toBe('none');

    await caption(page, 'Reduced motion is off. The second dot glides continuously.');
    await dismissCaption(page);
    const offsetBefore = await readTransformOffset(page, secondDot);
    await beat(page, 400);
    const offsetAfter = await readTransformOffset(page, secondDot);
    await highlight(loader);
    await beat(page, 1_500);
    expect(
      Math.abs(offsetAfter - offsetBefore),
      'the dot must have visibly moved during an unfrozen 400ms window'
    ).toBeGreaterThan(1);

    await setReducedMotion(page, true);
    await caption(
      page,
      'Reduced motion is now on. The background pulse and the dots both stop, leaving three dots visible.'
    );
    await dismissCaption(page);
    expect(await animationName(page, '[data-pw="brand-loader-default-demo"]')).toBe('none');
    expect(await animationName(page, secondDot)).toBe('none');

    const frozenFirst = await readTransformOffset(page, secondDot);
    await highlight(loader);
    await beat(page, 1_500);
    const frozenSecond = await readTransformOffset(page, secondDot);
    expect(frozenSecond, 'a stopped dot must not still be moving').toBe(frozenFirst);

    const dots = page.locator('[data-pw="brand-loader-default-demo"] .lds-ellipsis div');
    const visible = await dots.evaluateAll((els) =>
      els
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => Math.round(el.getBoundingClientRect().left))
    );
    expect(visible, 'three evenly-spaced dots must remain, not a blank row').toHaveLength(3);
    expect(new Set(visible).size).toBe(3);

    await beat(page);
  });

  test('Shimmer: the highlight sweeps, then freezes without the skeleton disappearing', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/shimmer');
    await setReducedMotion(page, false);

    const shimmer = page.getByTestId('shimmer-avatar');
    const selector = '[data-pw="shimmer-avatar"]';
    await expect(shimmer).toBeVisible();
    expect(await animationName(page, selector, '::after')).not.toBe('none');

    await caption(
      page,
      'Reduced motion is off. The highlight sweeps across the skeleton continuously.'
    );
    const offsetBefore = await readTransformOffset(page, selector, '::after');
    await beat(page, 500);
    const offsetAfter = await readTransformOffset(page, selector, '::after');
    await highlight(shimmer);
    expect(
      Math.abs(offsetAfter - offsetBefore),
      'the sweep must have visibly moved during an unfrozen 500ms window'
    ).toBeGreaterThan(1);

    await setReducedMotion(page, true);
    await caption(page, 'Reduced motion is now on. The sweep stops, but the skeleton remains.');

    // Shimmer's reduced-motion guard (src/lib/Shimmer/Shimmer.svelte:55-62) is
    // `display: none` on `.shimmer::after`, not `animation: none` -- the
    // `animation: shimmer ...` declaration itself is never touched, so
    // `animationName` stays reported as the sweep's keyframe name even once
    // stopped. `display` is the actual contract, matching the reference
    // assertion in tests/reduced-motion-indefinite.spec.ts:70-81. There is
    // consequently no "frozen offset read twice, N ms apart, and equal" check
    // here the way the other indefinite-loop tests in this file have one: a
    // non-displayed pseudo-element has no rendered transform to sample, so
    // that freeze-check shape does not fit this component -- `display: none`
    // already proves the sweep cannot be moving.
    const sweepDisplay = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el, '::after').display);
    expect(sweepDisplay, 'the sweep pseudo-element must be removed from rendering').toBe('none');

    await expect(shimmer).toBeVisible();
    const background = await shimmer.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background, 'the placeholder block itself must survive, not vanish').not.toBe(
      'rgba(0, 0, 0, 0)'
    );

    await beat(page);
  });
});
