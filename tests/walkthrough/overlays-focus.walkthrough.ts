import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight, step } from './support/narrate.js';

/**
 * Stacked-overlay ownership and focus restore, watched rather than screenshot.
 *
 * Five behaviours from the dismissal-stack / focus-restore / reduced-motion /
 * shadow-portal pass, none of which a still frame can prove:
 *
 *  - Escape ownership: the first Escape must close only the menu on top of a
 *    modal, the second must close the modal. A screenshot of "the menu is
 *    closed" cannot show whether the modal closed WITH it -- that's the whole
 *    defect this replaces. The PR's own evidence for this exact spec,
 *    `04-escape-belongs-to-the-surface-that-opened-last.mp4` (1.64s), was the
 *    only clip the auditor judged even partially on-target and still too
 *    rushed for a viewer to register "modal still open" as its own beat
 *    before the second Escape. This file replaces it.
 *  - The same ownership question for an outside pointerdown, which has no
 *    video evidence at all.
 *  - Focus restore on Sheet close: "focus returned to the trigger" and "focus
 *    fell to <body>" render identically in a screenshot. Only watching the
 *    ring travel back onto the button proves which one happened.
 *  - Sheet's reduced-motion fallback: a single frame cannot show the absence
 *    of 400px of travel -- that requires two passes, in motion, contrasted.
 *    Filmed as two separate tests rather than one test with two passes: the
 *    guard only takes effect on a fresh mount (see the comment on the second
 *    of the two below), so each pass needs its own navigation, not a reused
 *    page with the preference flipped mid-test.
 *  - A portalled panel landing inside a shadow root instead of `document.body`:
 *    the defect was "renders as unstyled text at the bottom of the page", so
 *    the fix is a panel that looks and sits like every other dropdown in the
 *    library the instant it opens.
 *
 * Every test still asserts for real -- see the note atop narrate.ts. The
 * pacing exists so a human watching the recording can register the same
 * thing the assertions check.
 */

/** One frame's reading, timestamped on the page's own animation clock. */
type TranslateXSample = { readonly tMs: number; readonly translateX: number };

/** A |translateX| this small is noise (sub-pixel rounding), not travel. */
const MOTION_NOISE_FLOOR_PX = 5;

/**
 * `.sheet-panel`'s rendered `transform` on every animation frame, while
 * Sheet's `fly` transition plays.
 *
 * A single peak number cannot tell a real slide from a one-frame flash:
 * `fly` writes its fully-offset start state as the FIRST keyframe the
 * instant the transition is created, so even a transition that is
 * immediately overridden back to rest would still read as one brief
 * nonzero sample. Those two cases look identical as a scalar and completely
 * different as a series -- one decays across dozens of frames over the
 * transition's duration, the other is gone by the very next frame. Keeping
 * the series (rather than reducing to a peak in-page) lets the caller tell
 * them apart after the fact.
 *
 * Two earlier instruments both read zero motion here, and the common cause
 * was timing, not technique. Sheet's panel is rendered with `{#if open}`
 * (`Sheet.svelte`), so `transition:fly|global` starts driving it the instant
 * the click handler mounts the node -- not when Playwright's own
 * `toBeVisible()` settles, well after the click's microtask queue (and a
 * chunk of the 300ms transition itself) has already run. This is therefore
 * called (and its returned promise held, NOT awaited) before the trigger is
 * clicked at all, so the very first animation frame it schedules is already
 * polling for `.sheet-panel` to exist. Once found, it samples every frame
 * for a window comfortably longer than the 300ms transition; the wait for
 * the node itself is capped separately so a sheet that never opens resolves
 * with an empty series instead of hanging.
 */
const sampleTranslateXSeries = (page: Page): Promise<readonly TranslateXSample[]> =>
  page.evaluate(
    () =>
      new Promise<{ tMs: number; translateX: number }[]>((resolve) => {
        const giveUpWaitingForPanelAt = performance.now() + 3_000;
        const samples: { tMs: number; translateX: number }[] = [];
        let sampleUntil: number | null = null;
        const sample = () => {
          const node = document.querySelector('.sheet-panel');
          const now = performance.now();
          if (node !== null) {
            if (sampleUntil === null) {
              sampleUntil = now + 600;
            }
            const computed = getComputedStyle(node).transform;
            const match = computed.match(/matrix\(([^)]+)\)/);
            const values =
              match !== null ? match[1].split(',').map((part) => Number(part.trim())) : [];
            const translateX = values.length === 6 ? Math.abs(values[4]) : 0;
            samples.push({ tMs: now, translateX });
          } else if (now > giveUpWaitingForPanelAt) {
            resolve(samples);
            return;
          }
          if (sampleUntil !== null && now >= sampleUntil) {
            resolve(samples);
          } else {
            requestAnimationFrame(sample);
          }
        };
        requestAnimationFrame(sample);
      })
  );

/** Reduces a sampled series to the numbers a real-slide-vs-flash call needs. */
type MotionReading = {
  readonly peak: number;
  readonly finalX: number;
  readonly sampleCount: number;
  readonly samplesAboveFloor: number;
  readonly msAboveFloor: number;
};

const summarizeMotion = (samples: readonly TranslateXSample[]): MotionReading => {
  if (samples.length === 0) {
    return { peak: 0, finalX: 0, sampleCount: 0, samplesAboveFloor: 0, msAboveFloor: 0 };
  }
  const peak = samples.reduce((max, sample) => Math.max(max, sample.translateX), 0);
  const aboveFloor = samples.filter((sample) => sample.translateX >= MOTION_NOISE_FLOOR_PX);
  // A duration, not a timestamp -- the difference cancels out that these are
  // wall-clock `performance.now()` values, not series-relative ones.
  const msAboveFloor =
    aboveFloor.length === 0 ? 0 : aboveFloor[aboveFloor.length - 1].tMs - aboveFloor[0].tMs;
  return {
    peak,
    finalX: samples[samples.length - 1].translateX,
    sampleCount: samples.length,
    samplesAboveFloor: aboveFloor.length,
    msAboveFloor
  };
};

test('Escape belongs to the surface that opened last: the menu goes first, the modal stays', async ({
  page
}) => {
  await gotoHydrated(page, '/components/modal');

  await step(
    page,
    'Open a modal, then open a menu inside it -- two surfaces stacked.',
    async () => {
      await page.getByTestId('nested-menu-modal-trigger').click();
    }
  );
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.getByTestId('nested-menu').getByRole('button', { name: 'Row actions' }).click();
  const editItem = page.getByRole('menuitem', { name: 'Edit' });
  await expect(editItem).toBeVisible();
  await highlight(dialog);

  await step(page, 'First Escape: the menu is topmost, so only the menu closes.', async () => {
    await page.keyboard.press('Escape');
  });
  await expect(editItem).toBeHidden();
  await expect(dialog).toBeVisible();

  // The beat IS the point of this recording: give a viewer real time to see
  // "modal still open" as its own frame before the second Escape lands.
  await highlight(dialog);
  await beat(page, 1_200);

  await step(page, 'Second Escape: the modal is topmost again, so now it closes.', async () => {
    await page.keyboard.press('Escape');
  });
  await expect(dialog).toBeHidden();
});

test('Outside pointerdown belongs to the surface that opened last, same as Escape', async ({
  page
}) => {
  await gotoHydrated(page, '/components/modal');

  await page.getByTestId('nested-menu-modal-trigger').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const menuTrigger = page.getByTestId('nested-menu').getByRole('button', { name: 'Row actions' });
  const editItem = page.getByRole('menuitem', { name: 'Edit' });

  await step(page, 'Open the menu inside the modal.', async () => {
    await menuTrigger.click();
  });
  await expect(editItem).toBeVisible();

  await step(
    page,
    "A press inside the modal, outside the menu -- the modal's header -- closes only the menu.",
    async () => {
      // No data-pw on the header for this demo; `.header` is the real, scoped
      // class straight from Modal.svelte, same as the class-selector fallback
      // portal-shadow-styling.spec.ts already uses where there is no testId.
      await dialog.locator('.header').click();
    }
  );
  await expect(editItem).toBeHidden();
  await expect(dialog).toBeVisible();

  await beat(page, 800);

  await step(page, 'Reopen the menu, then press the true page backdrop this time.', async () => {
    await menuTrigger.click();
  });
  await expect(editItem).toBeVisible();

  await step(
    page,
    'A press on the backdrop -- outside the modal AND the menu -- closes both.',
    async () => {
      // testId lives on the outer overlay div, which spans the full viewport;
      // (10, 10) sits on the backdrop itself, well clear of the centered
      // modal-content box this demo renders.
      await page.getByTestId('nested-menu-modal').click({ position: { x: 10, y: 10 } });
    }
  );
  await expect(editItem).toBeHidden();
  await expect(dialog).toBeHidden();
});

test('Sheet gives focus back to the exact element that opened it', async ({ page }) => {
  await gotoHydrated(page, '/components/sheet');

  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  await step(page, 'Focus the trigger by keyboard first, so its own ring is visible.', async () => {
    await trigger.focus();
  });
  await highlight(trigger);

  await step(page, 'Enter opens the sheet -- focus leaves the trigger for the panel.', async () => {
    await trigger.press('Enter');
  });
  await expect(panel).toBeVisible();
  await expect(trigger).not.toBeFocused();
  // Sheet's scrollLockAction focuses the panel container itself on open, not
  // its close button (unlike Modal's focusEntryPoint) -- the ring this draws
  // is .sheet-panel:focus-visible around the whole panel, not the button.
  const panelIsActive = await panel.evaluate((node) => document.activeElement === node);
  expect(panelIsActive, 'focus did not land on the panel Sheet moved it into').toBe(true);
  await highlight(panel);
  await beat(page, 700);

  await step(
    page,
    'Escape closes it -- watch focus travel all the way back to the trigger.',
    async () => {
      await page.keyboard.press('Escape');
    }
  );
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  // toBeFocused() already checks this exact element against activeElement --
  // spelled out directly too, since "something regained focus" is precisely
  // the weaker claim this test exists to rule out.
  const restoredToExactTrigger = await trigger.evaluate((node) => document.activeElement === node);
  expect(restoredToExactTrigger, 'focus landed somewhere other than the exact trigger').toBe(true);
  await highlight(trigger);
  await beat(page, 1_000);
});

test('Sheet without a reduced-motion preference slides the panel in 400px from the right', async ({
  page
}) => {
  await gotoHydrated(page, '/components/sheet');

  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  // Installed and held, not awaited, before the click that mounts the panel --
  // see the comment atop sampleTranslateXSeries for why sampling has to start
  // this early to see the transition at all.
  const samplesPromise = sampleTranslateXSeries(page);
  await step(
    page,
    'With no motion preference, opening slides the panel in 400px from the right.',
    async () => {
      await trigger.click();
    }
  );
  await expect(panel).toBeVisible();
  const reading = summarizeMotion(await samplesPromise);
  expect(
    reading.peak,
    `the unguarded transition should travel through at least 100px on its way in from 400px ` +
      `(measured: ${JSON.stringify(reading)})`
  ).toBeGreaterThan(100);
  // A real slide holds above the noise floor for a meaningful slice of the
  // 300ms transition, not one incidental frame -- this is the known-real-
  // travel case the reduced-motion test below is screened against.
  expect(
    reading.msAboveFloor,
    `the unguarded transition should stay in motion for a real slice of its 300ms duration ` +
      `(measured: ${JSON.stringify(reading)})`
  ).toBeGreaterThan(100);
  await highlight(panel);
  await beat(page, 700);
});

test('Sheet with prefers-reduced-motion already set before it mounts only fades in place', async ({
  page
}) => {
  // emulateMedia BEFORE navigation -- the house pattern `reduced-motion-
  // indefinite.spec.ts` uses, and load-bearing here specifically: Sheet's
  // `flyParams` is a `$derived.by` that branches on `prefersReducedMotion()`,
  // a plain `window.matchMedia(...).matches` read with no Svelte reactive
  // source behind it. `$derived` only recomputes when a TRACKED dependency
  // changes, and the only one this closure ever reads is `side` (in the
  // switch after the guard) -- so setting the preference on an
  // already-mounted Sheet cannot invalidate an already-computed `flyParams`;
  // an earlier version of this test did exactly that (emulate, then reuse
  // the still-open-from-before component) and it is a different, narrower
  // question from the one this test asks. Only a fresh mount is guaranteed
  // to observe the preference, so the preference has to be set before
  // `gotoHydrated` creates the page Sheet mounts into.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHydrated(page, '/components/sheet');

  // The `reducedMotion` fixture option has silently failed to reach the page
  // in this repo before (see the comment atop reduced-motion-indefinite.spec.ts) --
  // probe the real media query before trusting anything downstream of it.
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true
  );

  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  const samplesPromise = sampleTranslateXSeries(page);
  await step(
    page,
    'With the preference already set, the same open now only fades in place.',
    async () => {
      await trigger.click();
    }
  );
  await expect(panel).toBeVisible();
  const reading = summarizeMotion(await samplesPromise);
  expect(
    reading.peak,
    `reduced motion should never travel -- it only fades in place ` +
      `(measured: ${JSON.stringify(reading)})`
  ).toBeLessThan(MOTION_NOISE_FLOOR_PX);
  await highlight(panel);
  await beat(page, 700);
});

test('A portalled dropdown inside a <sui-*> element lands in its shadow root, not document.body', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // `/wc-form-demo.html` rather than `gotoHydrated(page, '/')`: this is a
  // self-contained static page with one inline module and no imports of its
  // own, so it cannot race a rebuilt, hashed SvelteKit entry chunk the way `/`
  // can -- see the comment atop `boot()` in tests/portal-shadow-styling.spec.ts,
  // whose pattern this mirrors. It also carries no `data-hydrated` marker for
  // gotoHydrated to ever resolve against, since it is not a SvelteKit route.
  await step(page, 'Load the built custom elements onto the static harness page.', async () => {
    await page.goto('/wc-form-demo.html');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-menu') !== 'undefined', null, {
      timeout: 30_000
    });
  });

  await page.evaluate(() => {
    document.body.innerHTML = '<div id="wrap" style="padding:140px"></div>';
    const host = document.createElement('sui-menu');
    host.innerHTML = '<button slot="trigger">Row actions</button>';
    Object.assign(host, {
      items: [
        { label: 'Rename', value: 'rename' },
        { label: 'Delete', value: 'delete' }
      ],
      usePortal: true
    });
    document.getElementById('wrap')?.append(host);
  });
  await page.waitForTimeout(400);

  await step(page, 'A real click opens the dropdown -- never a synthesised event.', async () => {
    // Two selectors, `.first()`: without interactiveTrigger the real click
    // target is the shadow root's own trigger wrapper, but the slotted light-DOM
    // button is what a viewer sees -- same pairing portal-shadow-styling.spec.ts
    // already uses for this exact mount shape.
    await page.locator('sui-menu .menu-trigger, sui-menu button[slot="trigger"]').first().click();
  });

  const dropdown = page.locator('sui-menu .menu-dropdown');
  await expect(dropdown).toBeVisible();

  const placement = await dropdown.evaluate((node) => {
    const host = document.querySelector('sui-menu');
    const root = host?.shadowRoot ?? null;
    const computed = getComputedStyle(node);
    return {
      inShadowRoot: root !== null && node.getRootNode() === root,
      onBody: node.parentElement === document.body,
      background: computed.backgroundColor,
      borderTopWidth: computed.borderTopWidth,
      boxShadow: computed.boxShadow
    };
  });

  expect(placement.onBody, 'panel was relocated into the light DOM').toBe(false);
  expect(
    placement.inShadowRoot,
    'panel left the root that holds its stylesheet -- exactly the defect this fix closes'
  ).toBe(true);
  // Only properties the component's own scoped stylesheet sets -- the panel
  // also carries inline position styles that would look "correct" even
  // completely unstyled, so those would prove nothing here.
  expect(placement.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(placement.borderTopWidth).toBe('1px');
  expect(placement.boxShadow).not.toBe('none');
  expect(errors).toEqual([]);

  await highlight(dropdown);
  await caption(
    page,
    'Styled, positioned, and inside the element that owns it -- not plain text at the bottom of the page.'
  );
  await beat(page, 1_000);
});
