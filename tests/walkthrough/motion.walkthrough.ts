import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight, step } from './support/narrate.js';

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
 * fade+fly, Toast fly, Scroller arrow scrollBy, Tabs overflow-arrow scrollBy,
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

    await caption(page, 'Reduced motion is off. The default modal fades in over about 300ms.');
    const fadeWatch = watchTransition(page, {
      selector: '.modal-content',
      parent: true,
      windowMs: 500
    });
    await openFade.click();
    const fadeResult = await fadeWatch;
    await highlight(modalContent);

    expect(
      fadeResult.minOpacity,
      'the fade-in must pass through a partially transparent frame'
    ).toBeLessThan(0.9);
    expect(fadeResult.finalOpacity, 'the modal must settle fully visible').toBeGreaterThan(0.95);
    await expect(modalContent).toBeVisible();

    await beat(page);
    await page.getByTestId('confirm-modal-close').click();
    await beat(page);

    await caption(
      page,
      'Reduced motion is still off. The slide-up modal flies in from below over about 380ms.'
    );
    const flyWatch = watchTransition(page, {
      selector: '.modal-content',
      parent: true,
      windowMs: 500
    });
    await openFly.click();
    const flyResult = await flyWatch;
    await highlight(modalContent);

    expect(flyResult.maxOffset, 'the slide-up modal must actually travel').toBeGreaterThan(10);
    expect(
      flyResult.finalOffset,
      'the modal must settle back at its resting position'
    ).toBeLessThan(5);
    // svelte/transition's fly defaults opacity to 0, so this path fades too,
    // independently of the translate above.
    expect(flyResult.minOpacity, 'the fly-in also fades from transparent').toBeLessThan(0.9);
    expect(flyResult.finalOpacity).toBeGreaterThan(0.95);

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
    const fadeReducedWatch = watchTransition(page, {
      selector: '.modal-content',
      parent: true,
      windowMs: 250
    });
    await openFadeReduced.click();
    const fadeReducedResult = await fadeReducedWatch;
    await highlight(modalContentReduced);

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
    const flyReducedWatch = watchTransition(page, {
      selector: '.modal-content',
      parent: true,
      windowMs: 250
    });
    await openFlyReduced.click();
    const flyReducedResult = await flyReducedWatch;
    await highlight(modalContentReduced);

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

test.describe('Toast: fly-in/out collapses to an instant appear/disappear under reduced motion', () => {
  // PRODUCT DEFECT (fixed) -- was filed instead of asserted around.
  //
  // Toast's `in:fly` never played on the toast's first appearance. Measured
  // with the same `watchTransition` observer used everywhere else in this
  // file, started before the triggering click (so it could not be a
  // late-observer race -- see the helper's own doc comment): clicking "Show
  // Toast" under `no-preference` motion produced transform:'none',
  // opacity:'1' and animationName:'none' on `.toast` from the very first
  // frame it was found (~70ms after the click, well inside the configured
  // 400ms `in` duration) through the rest of a 500ms watch window --
  // `{ minOpacity: 1, maxOffset: 0, finalOpacity: 1, finalOffset: 0 }`.
  // `matchMedia('(prefers-reduced-motion: reduce)').matches` was sampled
  // alongside every frame and read `false` throughout, so it was not the
  // reduced-motion branch collapsing the animation to a zero-duration fly.
  //
  // The *out* transition on the same element, watched the same way over the
  // auto-hide at `duration` (default 2000ms), genuinely animated:
  // `{ minOpacity: 0.072, maxOffset: 92.8 }`. Same selector, same helper, same
  // page -- so the observer was not the difference. What differed was *which*
  // `{#if}` toggle drove the transition. In src/lib/Toast/Toast.svelte:
  //   - Outer: the demo route's own `{#if showToast}<Toast .../>{/if}`
  //     (src/routes/components/toast/+page.svelte) creates the Toast
  //     instance for the first time on click -- a genuine false->true flip.
  //   - Inner: Toast.svelte's `let showToast = $state(true)` starts already
  //     true, so the `{#if showToast}` wrapping `in:fly` was true on that
  //     instance's very first render, not a later flip.
  //   - `out:fly` fires later from a real true->false flip on the same,
  //     already-mounted block (`hideToast()`), which is why it worked.
  // A *local* transition (Svelte's default) only plays when its own enclosing
  // block flips as a later reactive update, not when the block is created
  // already-true -- even though the Toast component itself was freshly
  // created inside the outer block's own intro. Because the demo's default
  // props leave `overlapPage` at its `true` default, `inY` is -500 (not the
  // smaller -20 an explicit `overlapPage={false}` would give), so the missing
  // animation was a large, visible jump-cut in production, not a
  // rounding-scale gap.
  //
  // Fixed by adding the `|global` modifier to `in:fly` (Toast.svelte), which
  // plays the intro whenever the block is created regardless of whether that
  // creation was driven by its own local state or an ancestor's -- matching
  // the modifier Sheet's panel transition already used for the same reason.
  test('the toast flies in on a normal click under normal motion', async ({ page }) => {
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, false);

    const showToast = page.getByRole('button', { name: 'Show Toast', exact: true });
    const toast = page.locator('.toast');

    await caption(page, 'Reduced motion is off. The toast flies in from its anchored edge.');
    const flyInWatch = watchTransition(page, { selector: '.toast', windowMs: 500 });
    await showToast.click();
    const flyInResult = await flyInWatch;
    await highlight(toast);

    expect(flyInResult.maxOffset, 'the toast must actually travel in').toBeGreaterThan(10);
    expect(flyInResult.minOpacity, 'the fly-in must fade from transparent').toBeLessThan(0.9);
    expect(flyInResult.finalOffset, 'the toast must settle at its resting position').toBeLessThan(
      5
    );
    expect(flyInResult.finalOpacity).toBeGreaterThan(0.95);
    await expect(toast).toBeVisible();
    await beat(page);
  });

  test('the toast simply appears, with no travel, once reduced motion is set', async ({ page }) => {
    // Toast's fly properties are a memoised $derived (see the identical note
    // on the ModalAnimation test above) -- the preference is set before the
    // navigation that mounts it, matching every other reduced-motion-only
    // scenario in this file.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/toast');
    await setReducedMotion(page, true);

    const showToastReduced = page.getByRole('button', { name: 'Show Toast', exact: true });
    const toastReduced = page.locator('.toast');

    await caption(
      page,
      'Reduced motion is on. Showing the toast should simply place it, with no travel.'
    );
    const instantWatch = watchTransition(page, { selector: '.toast', windowMs: 300 });
    await showToastReduced.click();
    const instantResult = await instantWatch;
    await highlight(toastReduced);

    expect(instantResult.maxOffset, 'a zero-duration fly must not visibly travel').toBeLessThan(10);
    expect(
      instantResult.finalOpacity - instantResult.minOpacity,
      'no faded-in frame should be observable when the transition is instant'
    ).toBeLessThan(0.1);
    expect(instantResult.finalOpacity).toBeGreaterThan(0.95);
    await expect(toastReduced).toBeVisible();

    await beat(page);
  });
});

test.describe('Scroller: arrow-driven scrollBy() honours reduced motion at click time', () => {
  test('the horizontal demo glides on a normal click and jumps once reduced motion is set', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');
    await setReducedMotion(page, false);

    // Neither Scroller instance on this route carries a testId; the horizontal
    // one is the first in the DOM, before the "Vertical" heading.
    const container = page.locator('.scroll-container').first();
    const nextButton = page.getByRole('button', { name: 'Scroll next' }).first();
    const prevButton = page.getByRole('button', { name: 'Scroll previous' }).first();

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

    await caption(
      page,
      'Reduced motion is off. Revealing markdown should type in character by character.'
    );
    await startButton.click();
    const immediateItems = await demo.locator('li').count();
    await beat(page, 1_500);
    const settledItems = await demo.locator('li').count();
    await highlight(demo);

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

    await caption(
      page,
      'Reduced motion is now on. The same reveal should show the finished markdown at once.'
    );
    await startButtonAgain.click();
    // A short, deterministic wait rather than an immediate same-tick read: it
    // only needs to be well inside the ~900ms a character-by-character reveal
    // takes above, not an actual measurement of "instant".
    await beat(page, 150);
    const earlyItemsReduced = await demoAgain.locator('li').count();
    await highlight(demoAgain);

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
    const angleBefore = await readTransformAngle(page, selector);
    await beat(page, 400);
    const angleAfter = await readTransformAngle(page, selector);
    await highlight(loader);
    expect(
      rotationDelta(angleAfter, angleBefore),
      'the ring must have visibly rotated during an unfrozen 400ms window'
    ).toBeGreaterThan(20);

    await setReducedMotion(page, true);
    await caption(page, 'Reduced motion is now on. The spin stops, but the ring stays on screen.');
    expect(await animationName(page, selector)).toBe('none');

    const frozenFirst = await readTransformAngle(page, selector);
    await beat(page, 700);
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
    const offsetBefore = await readTransformOffset(page, secondDot);
    await beat(page, 400);
    const offsetAfter = await readTransformOffset(page, secondDot);
    await highlight(loader);
    expect(
      Math.abs(offsetAfter - offsetBefore),
      'the dot must have visibly moved during an unfrozen 400ms window'
    ).toBeGreaterThan(1);

    await setReducedMotion(page, true);
    await caption(
      page,
      'Reduced motion is now on. The background pulse and the dots both stop, leaving three dots visible.'
    );
    expect(await animationName(page, '[data-pw="brand-loader-default-demo"]')).toBe('none');
    expect(await animationName(page, secondDot)).toBe('none');

    const frozenFirst = await readTransformOffset(page, secondDot);
    await beat(page, 400);
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
