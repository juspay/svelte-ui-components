import { expect, test, type Locator } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * `VoiceOrb` runs a continuous rAF rotation/breathing loop and, before this,
 * never consulted `prefers-reduced-motion` at all -- unlike nine other
 * components in this library. Being canvas-drawn, no CSS media query can
 * reach it; the check has to happen in `draw` itself, which `orbMath.test.ts`
 * cannot exercise (jsdom has no `getContext('2d')`). These fill that gap.
 *
 * The design split under test: idle rotation and the no-analyser sine
 * breathing are decorative and stop under the preference. A real `analyser`
 * driving `listening` is left alone -- it reports what the microphone is
 * doing right now, which is state, not decoration -- so the third test below
 * is the deliberate control proving that path is untouched. See
 * docs/VoiceOrb.md's Accessibility section.
 *
 * `page.emulateMedia()` rather than `test.use({ reducedMotion: 'reduce' })`:
 * the latter does not reach `matchMedia` under this repo's Playwright config
 * (see tests/typewriter-text-reduced-motion.test.ts, verified there both
 * ways before it settled on `emulateMedia`).
 */

const paintedWidth = (canvas: Locator): Promise<number> =>
  canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    const context = element.getContext('2d');
    if (context === null || element.width === 0) {
      return 0;
    }
    const { data } = context.getImageData(0, 0, element.width, element.height);
    let left = element.width;
    let right = 0;
    for (let y = 0; y < element.height; y += 1) {
      for (let x = 0; x < element.width; x += 1) {
        if (data[(y * element.width + x) * 4 + 3] > 40) {
          if (x < left) {
            left = x;
          }
          if (x > right) {
            right = x;
          }
        }
      }
    }
    return right > left ? right - left : 0;
  });

/** A cheap per-pixel-alpha signature. Unlike `paintedWidth`, this also moves
 *  under pure rotation (which redistributes depth-faded pixels without
 *  necessarily changing the painted silhouette's left/right extent). */
const alphaSignature = (canvas: Locator): Promise<string> =>
  canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    const context = element.getContext('2d');
    if (context === null) {
      return '';
    }
    const { data } = context.getImageData(0, 0, element.width, element.height);
    let total = 0;
    for (let index = 3; index < data.length; index += 4) {
      total += data[index] * (index % 7);
    }
    return String(total);
  });

test.describe('VoiceOrb reduced motion', () => {
  test('freezes idle rotation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/voice-orb');

    const emulationActive = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    expect(emulationActive).toBe(true);

    const canvas = page.getByTestId('orb-main').locator('canvas');
    await expect(page.getByTestId('orb-started')).toHaveText('painted');

    const first = await alphaSignature(canvas);
    await page.waitForTimeout(600);
    const second = await alphaSignature(canvas);

    // Without the fix this is the same assertion `rotation reaches the
    // pixels, visibly` (tests/voice-orb.test.ts) makes with the opposite
    // expectation -- there, motion is unrestricted and the signature must
    // change; here it must not.
    expect(second).toBe(first);
  });

  test('freezes the sine-wave listening breathing when there is no analyser', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/voice-orb');

    const canvas = page.getByTestId('orb-main').locator('canvas');
    await page.getByTestId('orb-toggle-variant').click();
    await expect(page.getByTestId('orb-variant')).toHaveText('listening');

    const widths: number[] = [];
    for (let sample = 0; sample < 8; sample += 1) {
      widths.push(await paintedWidth(canvas));
      await page.waitForTimeout(300);
    }

    // The un-emulated counterpart of this exact scenario is `an orb with no
    // analyser still breathes, rather than going still` in
    // tests/voice-orb.test.ts, which asserts max > min. Here it must be flat.
    expect(Math.max(...widths)).toBe(Math.min(...widths));
  });

  test('does not silence audio-driven motion, since that is state rather than decoration', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-reactive').locator('canvas');

    await page.getByTestId('tone-start').click();
    await expect(page.getByTestId('audio-source')).toHaveText('tone');

    await page.getByTestId('tone-level').fill('1');
    await page.waitForTimeout(1200);
    const loud = await paintedWidth(canvas);

    await page.getByTestId('tone-level').fill('0');
    await page.waitForTimeout(1800);
    const quiet = await paintedWidth(canvas);

    expect(loud).toBeGreaterThan(0);
    expect(quiet).toBeGreaterThan(0);
    // Same bound as the un-emulated `an AnalyserNode drives the orb` test in
    // tests/voice-orb.test.ts -- reduced motion changing this number would
    // mean the analyser path got caught by the same freeze as the decorative
    // one, taking away the only feedback a caller gave the user that the app
    // is listening.
    expect(loud).toBeGreaterThan(quiet * 1.06);
  });
});
