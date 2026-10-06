import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import {
  distance,
  expectSheetIntroProgress,
  observeSheetEntrance,
  parseTranslate,
  summarizeFrames
} from './support/motion-observers';
import type { Offset, SheetEntrance } from './support/motion-observers';

/**
 * Sheet motion, proved from the animation the engine is actually running.
 *
 * The panel's transition is `tokenizedFly`: it keeps the side's direction but
 * resizes the magnitude from `--sheet-panel-transition-distance` ->
 * `--distance-overlay` -> a 60px fallback (it used to be a literal 400px), and reads
 * its duration from `--sheet-panel-transition-duration` -> `--motion-duration` ->
 * 300ms. Under `prefers-reduced-motion: reduce` the travel is zero and the
 * duration is clamped to effectively instant, whatever the tokens resolve to; the
 * preference is read from a reactive source, so an already-mounted Sheet picks up a
 * change the next time it opens.
 *
 * Each test holds an observer installed BEFORE the click that mounts the panel, so
 * the starting point is the panel's real first frame, and reads the transition's
 * own first/last keyframe and duration -- the documented contract, identical in
 * every engine -- instead of inferring it from a handful of frames.
 */

const DEFAULT_TRAVEL_PX = 60;
const DEFAULT_DURATION_MS = 300;
// Sheet clamps to 0.001ms under reduced motion: instant, but still a real
// transition so Svelte raises its intro/outro events.
const REDUCED_CLAMP_MS = 0.001;

const setReducedMotion = async (page: Page, reduce: boolean): Promise<void> => {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    reduce
  );
};

const expectOffset = (actual: string | null, expected: Offset): void => {
  expect(actual, 'the engine exposed no animation on the panel').not.toBeNull();
  expect(parseTranslate(actual)).toEqual(expected);
};

/**
 * Opens a sheet via `open` while an entrance observer is already waiting, and
 * returns what it saw. The observer promise is created first and awaited last.
 */
const openObserved = async (
  page: Page,
  open: () => Promise<void>,
  windowMs = 700
): Promise<SheetEntrance> => {
  const entrance = observeSheetEntrance(page, { windowMs });
  await open();
  return entrance;
};

const rightTrigger = (page: Page): Locator => page.getByTestId('sheet-right-trigger');

const closeAndAwaitRemoval = async (page: Page): Promise<void> => {
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet-panel')).toHaveCount(0);
};

test.describe('Sheet motion (normal preference)', () => {
  test('a right sheet slides in over 300ms from the 60px token position and settles at zero', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    await setReducedMotion(page, false);

    const entrance = await openObserved(page, () => rightTrigger(page).click());

    expectOffset(entrance.startTransform, { x: DEFAULT_TRAVEL_PX, y: 0 });
    expect(entrance.run, 'the intro animation was never seen running').not.toBeNull();
    expectOffset(entrance.run?.firstTransform ?? null, { x: DEFAULT_TRAVEL_PX, y: 0 });
    expect(distance(parseTranslate(entrance.run?.lastTransform ?? null))).toBe(0);
    expect(entrance.run?.durationMs).toBeCloseTo(DEFAULT_DURATION_MS, 3);

    // Not a flash: the engine ran the eased 300ms animation to its end (more than a
    // from/to pair of keyframes), and it never rendered beyond the 60px token (the
    // retired entry was 400px). Nothing here counts frames or milliseconds spent
    // moving -- that varies with machine load, not with behaviour.
    expectSheetIntroProgress(entrance);
    expect(entrance.run?.keyframeCount ?? 0).toBeGreaterThan(2);
    const frames = summarizeFrames(entrance.frames);
    expect(frames.peak).toBeLessThanOrEqual(DEFAULT_TRAVEL_PX + 0.5);
    expect(frames.final).toBeLessThan(0.5);
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  for (const side of [
    {
      name: 'left',
      open: (page: Page) => page.getByRole('button', { name: 'Open left', exact: true }).click(),
      from: { x: -DEFAULT_TRAVEL_PX, y: 0 }
    },
    {
      name: 'top',
      open: (page: Page) => page.getByTestId('sheet-top-trigger').click(),
      from: { x: 0, y: -DEFAULT_TRAVEL_PX }
    },
    {
      name: 'bottom',
      open: (page: Page) => page.getByTestId('sheet-bottom-trigger').click(),
      from: { x: 0, y: DEFAULT_TRAVEL_PX }
    }
  ] as const) {
    test(`a ${side.name} sheet enters from its own edge by the same 60px`, async ({ page }) => {
      await gotoHydrated(page, '/components/sheet');
      await setReducedMotion(page, false);

      const entrance = await openObserved(page, () => side.open(page));

      expectOffset(entrance.startTransform, side.from);
      expectOffset(entrance.run?.firstTransform ?? null, side.from);
      expect(distance(parseTranslate(entrance.run?.lastTransform ?? null))).toBe(0);
      expectSheetIntroProgress(entrance);
      const frames = summarizeFrames(entrance.frames);
      expect(frames.peak).toBeLessThanOrEqual(DEFAULT_TRAVEL_PX + 0.5);
      expect(frames.final).toBeLessThan(0.5);
    });
  }

  test('--sheet-panel-transition-distance and --sheet-panel-transition-duration retune the slide', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    await setReducedMotion(page, false);
    await page.addStyleTag({
      content:
        ':root { --sheet-panel-transition-distance: 200px; --sheet-panel-transition-duration: 900ms; }'
    });

    const entrance = await openObserved(page, () => rightTrigger(page).click(), 1_300);

    expectOffset(entrance.startTransform, { x: 200, y: 0 });
    expectOffset(entrance.run?.firstTransform ?? null, { x: 200, y: 0 });
    expect(entrance.run?.durationMs).toBeCloseTo(900, 3);
    expect(distance(parseTranslate(entrance.run?.lastTransform ?? null))).toBe(0);
    // The larger distance and the longer duration are the animation's own keyframes
    // and timing above; a sampled frame can only add the ceiling, because how many
    // frames land early in a 900ms slide is a matter of machine load.
    expectSheetIntroProgress(entrance);
    const frames = summarizeFrames(entrance.frames);
    expect(frames.peak).toBeLessThanOrEqual(200.5);
    expect(frames.final).toBeLessThan(0.5);
  });

  test('the shared --distance-overlay and --motion-duration tiers apply when no sheet token is set, and the sheet token wins over them', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    await setReducedMotion(page, false);
    await page.addStyleTag({
      content: ':root { --distance-overlay: 120px; --motion-duration: 450ms; }'
    });

    const shared = await openObserved(page, () => rightTrigger(page).click(), 900);
    expectOffset(shared.startTransform, { x: 120, y: 0 });
    expect(shared.run?.durationMs).toBeCloseTo(450, 3);
    await closeAndAwaitRemoval(page);

    await page.addStyleTag({
      content:
        ':root { --sheet-panel-transition-distance: 80px; --sheet-panel-transition-duration: 200ms; }'
    });
    const own = await openObserved(page, () => rightTrigger(page).click());
    expectOffset(own.startTransform, { x: 80, y: 0 });
    expect(own.run?.durationMs).toBeCloseTo(200, 3);
  });
});

test.describe('Sheet motion (reduced motion)', () => {
  test('reduced motion removes the travel and clamps the duration, still opening the sheet', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    await setReducedMotion(page, true);

    const entrance = await openObserved(page, () => rightTrigger(page).click());

    expectOffset(entrance.startTransform, { x: 0, y: 0 });
    // The intro may already be over by the first frame (it is 0.001ms long); if it
    // was seen, it must have no travel and no real duration.
    if (entrance.run !== null) {
      expect(distance(parseTranslate(entrance.run.firstTransform))).toBe(0);
      expect(distance(parseTranslate(entrance.run.lastTransform))).toBe(0);
      expect(entrance.run.durationMs).toBeLessThanOrEqual(REDUCED_CLAMP_MS + 0.0005);
    }
    expect(summarizeFrames(entrance.frames).peak).toBeLessThan(0.5);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
  });

  test('a consumer distance or duration token cannot revive travel under reduced motion', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    await setReducedMotion(page, true);
    await page.addStyleTag({
      content:
        ':root { --sheet-panel-transition-distance: 300px; --sheet-panel-transition-duration: 1500ms; }'
    });

    const entrance = await openObserved(page, () => rightTrigger(page).click(), 900);

    expectOffset(entrance.startTransform, { x: 0, y: 0 });
    expect(summarizeFrames(entrance.frames).peak).toBeLessThan(0.5);
    if (entrance.run !== null) {
      expect(entrance.run.durationMs).toBeLessThanOrEqual(REDUCED_CLAMP_MS + 0.0005);
    }
  });
});

test.describe('Sheet motion (preference changes on a mounted sheet)', () => {
  test('the same mounted Sheet loses its travel when reduced motion is turned on and gets it back when it is turned off', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    const trigger = rightTrigger(page);

    await setReducedMotion(page, false);
    const before = await openObserved(page, () => trigger.click());
    expectOffset(before.startTransform, { x: DEFAULT_TRAVEL_PX, y: 0 });
    await closeAndAwaitRemoval(page);

    // No reload, no remount of the Sheet: only the preference changes.
    await setReducedMotion(page, true);
    const during = await openObserved(page, () => trigger.click());
    expectOffset(during.startTransform, { x: 0, y: 0 });
    expect(summarizeFrames(during.frames).peak).toBeLessThan(0.5);
    await closeAndAwaitRemoval(page);

    await setReducedMotion(page, false);
    const after = await openObserved(page, () => trigger.click());
    expectOffset(after.startTransform, { x: DEFAULT_TRAVEL_PX, y: 0 });
    expect(summarizeFrames(after.frames).final).toBeLessThan(0.5);
  });
});

test.describe('Sheet focus and cleanup around the transition', () => {
  for (const mode of [
    { name: 'normal motion', reduce: false, style: '' },
    { name: 'reduced motion', reduce: true, style: '' },
    {
      name: 'a slow 900ms token',
      reduce: false,
      style: ':root { --sheet-panel-transition-duration: 900ms; }'
    }
  ] as const) {
    test(`focus moves into the panel and returns to the trigger, and the panel is removed (${mode.name})`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/sheet');
      await setReducedMotion(page, mode.reduce);
      if (mode.style !== '') {
        await page.addStyleTag({ content: mode.style });
      }

      const trigger = rightTrigger(page);
      const panel = page.getByRole('dialog');

      // Focus the opener by keyboard first: a pointer click does not focus a button
      // in Safari, and the contract is "back to what had focus".
      await trigger.focus();
      await trigger.press('Enter');
      await expect(panel).toBeVisible();
      await expect(panel, 'focus lands on the panel itself').toBeFocused();
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

      await page.keyboard.press('Escape');
      // Gone from the DOM only once the outro has finished...
      await expect(page.locator('.sheet-panel')).toHaveCount(0);
      // ...and only then does focus go back to the exact opener and the page unlock.
      await expect(trigger).toBeFocused();
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    });
  }

  for (const reduce of [false, true]) {
    test(`onafteropen and onafterclose both fire (${reduce ? 'reduced' : 'normal'} motion)`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/sheet');
      await setReducedMotion(page, reduce);

      await page.getByRole('button', { name: 'Open with lifecycle', exact: true }).click();
      await expect(page.locator('.state-display')).toHaveText('onafteropen fired');

      await page.keyboard.press('Escape');
      await expect(page.locator('.state-display')).toHaveText(
        'onafteropen fired → onafterclose fired'
      );
      await expect(page.locator('.sheet-panel')).toHaveCount(0);
    });
  }
});
