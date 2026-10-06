import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import {
  distance,
  expectMs,
  expectSheetIntroProgress,
  observeSheetEntrance,
  parseTranslate,
  summarizeFrames
} from '../support/motion-observers.js';
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
 *  - Sheet's tokenized slide and its reduced-motion fallback: a single frame
 *    cannot show that the panel travels the documented 60px (not the retired
 *    400px) or that reduced motion removes the travel -- that takes the
 *    transition's own keyframes, read from the panel's first frame, in motion
 *    and then with the preference on. Filmed as separate tests, including one
 *    that flips the preference on a Sheet that is already mounted.
 *  - A portalled panel landing inside a shadow root instead of `document.body`:
 *    the defect was "renders as unstyled text at the bottom of the page", so
 *    the fix is a panel that looks and sits like every other dropdown in the
 *    library the instant it opens.
 *
 * Every test still asserts for real -- see the note atop narrate.ts. The
 * pacing exists so a human watching the recording can register the same
 * thing the assertions check.
 */

const DEFAULT_SHEET_TRAVEL_PX = 60;
const DEFAULT_SHEET_DURATION_MS = 300;
// Sheet clamps its transition to 0.001ms under reduced motion: instant, but still a
// real transition so Svelte raises its intro/outro events.
const REDUCED_SHEET_CLAMP_MS = 0.001;

/** Sets prefers-reduced-motion and proves the emulation actually reached the page. */
const setReducedMotion = async (page: Page, reduced: boolean): Promise<void> => {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  expect(
    await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    'the reduced-motion emulation must actually reach the page'
  ).toBe(reduced);
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

test('Sheet without a reduced-motion preference slides the panel in 60px from the right', async ({
  page
}) => {
  await gotoHydrated(page, '/components/sheet');
  await setReducedMotion(page, false);

  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  // Installed and held, not awaited, before the click that mounts the panel: the
  // transition starts the instant the node exists, so the observer has to already
  // be waiting for it to read the entrance from its real first frame.
  const entranceWatch = observeSheetEntrance(page);
  await step(
    page,
    'With no motion preference, opening slides the panel in from the right by the 60px token distance.',
    async () => {
      await trigger.click();
    }
  );
  await expect(panel).toBeVisible();
  const entrance = await entranceWatch;

  // The documented default: --sheet-panel-transition-distance -> --distance-overlay
  // -> 60px, over --motion-duration -> 300ms. The retired entry was a literal 400px.
  expect(
    parseTranslate(entrance.startTransform),
    `the panel must start ${DEFAULT_SHEET_TRAVEL_PX}px from its edge (measured: ${JSON.stringify(entrance.startTransform)})`
  ).toEqual({ x: DEFAULT_SHEET_TRAVEL_PX, y: 0 });
  expect(entrance.run, 'the intro transition was never seen running').not.toBeNull();
  expect(parseTranslate(entrance.run?.firstTransform ?? null)).toEqual({
    x: DEFAULT_SHEET_TRAVEL_PX,
    y: 0
  });
  expect(distance(parseTranslate(entrance.run?.lastTransform ?? null))).toBe(0);
  expectMs(entrance.run?.durationMs ?? Number.NaN, DEFAULT_SHEET_DURATION_MS);

  // And what the eye sees: the eased animation ran to its end, never rendered
  // beyond the token distance, and landed on zero -- not a flash. No frame count or
  // time-in-motion is asserted: the engine drops frames on a loaded machine.
  expectSheetIntroProgress(entrance);
  expect(entrance.run?.keyframeCount ?? 0).toBeGreaterThan(2);
  const frames = summarizeFrames(entrance.frames);
  expect(
    frames.peak,
    `never beyond the token distance (measured: ${JSON.stringify(frames)})`
  ).toBeLessThanOrEqual(DEFAULT_SHEET_TRAVEL_PX + 0.5);
  expect(frames.final, 'it must settle at zero').toBeLessThan(0.5);
  await highlight(panel);
  await beat(page, 700);
});

test('Sheet takes --sheet-panel-transition-distance and -duration from the theme', async ({
  page
}) => {
  await gotoHydrated(page, '/components/sheet');
  await setReducedMotion(page, false);
  await page.addStyleTag({
    content:
      ':root { --sheet-panel-transition-distance: 200px; --sheet-panel-transition-duration: 900ms; }'
  });

  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  const entranceWatch = observeSheetEntrance(page, { windowMs: 1_300 });
  await step(
    page,
    'Themed to travel 200px over 900ms: the same Sheet, a much longer slide.',
    async () => {
      await trigger.click();
    }
  );
  await expect(panel).toBeVisible();
  const entrance = await entranceWatch;

  expect(parseTranslate(entrance.startTransform)).toEqual({ x: 200, y: 0 });
  expectMs(entrance.run?.durationMs ?? Number.NaN, 900);
  expect(distance(parseTranslate(entrance.run?.lastTransform ?? null))).toBe(0);
  // The themed distance and duration are the animation's own keyframes and timing
  // (above); a sampled frame can only add a ceiling.
  expectSheetIntroProgress(entrance);
  const frames = summarizeFrames(entrance.frames);
  expect(frames.peak).toBeLessThanOrEqual(200.5);
  expect(frames.final).toBeLessThan(0.5);
  await highlight(panel);
  await beat(page, 700);
});

test('Sheet with prefers-reduced-motion already set before it mounts only fades in place', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHydrated(page, '/components/sheet');
  // The `reducedMotion` fixture option has silently failed to reach the page in
  // this repo before (see the comment atop reduced-motion-indefinite.spec.ts) --
  // probe the real media query before trusting anything downstream of it.
  await setReducedMotion(page, true);
  // A theme asking for 300px / 1.5s must not be able to revive the travel.
  await page.addStyleTag({
    content:
      ':root { --sheet-panel-transition-distance: 300px; --sheet-panel-transition-duration: 1500ms; }'
  });

  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  const entranceWatch = observeSheetEntrance(page, { windowMs: 900 });
  await step(
    page,
    'With the preference already set, the same open now only fades in place.',
    async () => {
      await trigger.click();
    }
  );
  await expect(panel).toBeVisible();
  const entrance = await entranceWatch;

  expect(entrance.startTransform, 'the engine exposed the reduced-motion intro').not.toBeNull();
  expect(
    distance(parseTranslate(entrance.startTransform)),
    `reduced motion should never travel -- it only fades in place (measured: ${JSON.stringify(entrance.startTransform)})`
  ).toBe(0);
  if (entrance.run !== null) {
    expect(entrance.run.durationMs).toBeLessThanOrEqual(REDUCED_SHEET_CLAMP_MS + 0.0005);
  }
  expect(summarizeFrames(entrance.frames).peak).toBeLessThan(0.5);
  await highlight(panel);
  await beat(page, 700);
});

test('A Sheet that is already mounted picks up a change in the motion preference', async ({
  page
}) => {
  await gotoHydrated(page, '/components/sheet');
  const trigger = page.getByTestId('sheet-right-trigger');
  const panel = page.getByRole('dialog');

  // One page load, one mounted Sheet, three opens: only the preference changes.
  await setReducedMotion(page, false);
  const normalWatch = observeSheetEntrance(page);
  // Opened from the keyboard with the trigger focused: Safari does not focus a
  // button on a pointer click, so a click would leave nothing for the Sheet to give
  // focus back to, and the focus-return assertion below would test the browser
  // rather than the component.
  await trigger.focus();
  await step(page, 'Motion allowed: it slides 60px.', async () => {
    await trigger.press('Enter');
  });
  await expect(panel).toBeVisible();
  const normal = await normalWatch;
  expect(parseTranslate(normal.startTransform)).toEqual({ x: DEFAULT_SHEET_TRAVEL_PX, y: 0 });
  await highlight(panel, 500);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet-panel')).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await caption(page, 'Reduced motion is switched on while the Sheet stays mounted.');
  await setReducedMotion(page, true);
  const reducedWatch = observeSheetEntrance(page);
  await trigger.click();
  await expect(panel).toBeVisible();
  const reduced = await reducedWatch;
  expect(reduced.startTransform, 'the engine exposed the reduced-motion intro').not.toBeNull();
  expect(distance(parseTranslate(reduced.startTransform)), 'no travel once reduced').toBe(0);
  expect(summarizeFrames(reduced.frames).peak).toBeLessThan(0.5);
  await highlight(panel, 500);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet-panel')).toHaveCount(0);

  await caption(page, 'And switched back off: the travel returns without a reload.');
  await setReducedMotion(page, false);
  const restoredWatch = observeSheetEntrance(page);
  await trigger.click();
  await expect(panel).toBeVisible();
  const restored = await restoredWatch;
  expect(parseTranslate(restored.startTransform)).toEqual({ x: DEFAULT_SHEET_TRAVEL_PX, y: 0 });
  expect(summarizeFrames(restored.frames).final).toBeLessThan(0.5);
  await highlight(panel, 500);
  await beat(page, 500);
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
