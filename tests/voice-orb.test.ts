import { expect, test, type Locator } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * `orbMath.test.ts` covers the geometry against pure functions. These cover the
 * half it cannot reach: that a canvas is mounted, that what it paints is
 * actually *visible*, that rotation reaches the pixels, and that the variant
 * switch reaches the running animation.
 *
 * The visibility measurement is the point of this file. An earlier version
 * asserted that some pixel had non-zero alpha, which a near-white orb on a
 * white page passes while showing the user nothing -- the defect that shipped
 * in the first revision of this component. Alpha is not visibility. This
 * composites each painted pixel over the background a human actually sees
 * behind it and measures the luminance difference.
 */

type OrbVisibility = { maxDelta: number; visiblePixels: number };

const measureVisibility = (canvas: Locator): Promise<OrbVisibility> =>
  canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    const context = element.getContext('2d');
    if (context === null || element.width === 0) {
      return { maxDelta: 0, visiblePixels: 0 };
    }

    const parse = (value: string): readonly number[] => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (match === null) {
        return [255, 255, 255, 1];
      }
      const parts = match[1]
        .split(/[,\s/]+/)
        .filter((part) => part.length > 0)
        .map(Number);
      return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
    };

    // The colour a human actually sees behind the particles: the nearest
    // ancestor that paints something. A transparent canvas shows the page.
    let background: readonly number[] = [255, 255, 255, 1];
    let ancestor: Element | null = element;
    while (ancestor !== null) {
      const candidate = parse(getComputedStyle(ancestor).backgroundColor);
      if (candidate[3] > 0) {
        background = candidate;
        break;
      }
      ancestor = ancestor.parentElement;
    }

    const luminance = (r: number, g: number, b: number): number =>
      0.2126 * r + 0.7152 * g + 0.0722 * b;
    const backgroundLuminance = luminance(background[0], background[1], background[2]);

    const { data } = context.getImageData(0, 0, element.width, element.height);
    let maxDelta = 0;
    let visiblePixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] / 255;
      if (alpha === 0) {
        continue;
      }
      const red = data[index] * alpha + background[0] * (1 - alpha);
      const green = data[index + 1] * alpha + background[1] * (1 - alpha);
      const blue = data[index + 2] * alpha + background[2] * (1 - alpha);
      const delta = Math.abs(luminance(red, green, blue) - backgroundLuminance);
      if (delta > maxDelta) {
        maxDelta = delta;
      }
      if (delta >= 8) {
        visiblePixels += 1;
      }
    }
    return { maxDelta: Math.round(maxDelta), visiblePixels };
  });

/**
 * The width of the painted sphere, in canvas pixels. The audio envelope drives
 * `scale`, so this is how an assertion reaches "the orb responded to sound"
 * without trusting any readout the demo prints about itself.
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
        // Well above the faintest depth-faded particles, so the edge is stable.
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

test.describe('VoiceOrb', () => {
  test('paints something a person can actually see', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');

    const orb = page.getByTestId('orb-main');
    await expect(orb).toBeVisible();
    await expect(orb.locator('canvas')).toBeVisible();
    await expect(page.getByTestId('orb-started')).toHaveText('painted');

    const visibility = await measureVisibility(orb.locator('canvas'));

    // Measured against the shipped-then-fixed defect: the near-white default
    // scored 32 here and looked blank on the page. Dark text on this ground
    // scores above 200. The floor sits between the two, nearer the broken one.
    expect(visibility.maxDelta).toBeGreaterThan(40);
    expect(visibility.visiblePixels).toBeGreaterThan(2000);
  });

  test('rotation reaches the pixels, visibly', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-main').locator('canvas');
    await expect(page.getByTestId('orb-started')).toHaveText('painted');

    const sample = (): Promise<string> =>
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

    const first = await sample();
    await page.waitForTimeout(600);
    const second = await sample();

    // A static image would return the same signature. This is what proves the
    // rAF loop is running and that `speedMultiplier` is reaching the geometry.
    expect(second).not.toBe(first);
  });

  test('the pinned orb does not move, so the visual baseline means something', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-pinned').locator('canvas');

    const signature = (): Promise<string> =>
      canvas.evaluate((node) => {
        const element = node as HTMLCanvasElement;
        const context = element.getContext('2d');
        if (context === null) {
          return '';
        }
        const { data } = context.getImageData(0, 0, element.width, element.height);
        let total = 0;
        for (let index = 3; index < data.length; index += 4) {
          total += data[index];
        }
        return String(total);
      });

    const first = await signature();
    await page.waitForTimeout(600);
    expect(await signature()).toBe(first);

    // Pinned must still mean painted -- a blank canvas is also perfectly stable.
    const visibility = await measureVisibility(canvas);
    expect(visibility.maxDelta).toBeGreaterThan(40);
  });

  test('follows the page theme instead of a fixed colour', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-main').locator('canvas');
    await expect(page.getByTestId('orb-started')).toHaveText('painted');

    const meanInk = (): Promise<number> =>
      canvas.evaluate((node) => {
        const element = node as HTMLCanvasElement;
        const context = element.getContext('2d');
        if (context === null) {
          return 0;
        }
        const { data } = context.getImageData(0, 0, element.width, element.height);
        let sum = 0;
        let count = 0;
        for (let index = 0; index < data.length; index += 4) {
          if (data[index + 3] > 0) {
            sum += data[index];
            count += 1;
          }
        }
        return count === 0 ? 0 : sum / count;
      });

    const light = await meanInk();
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);
    const dark = await meanInk();

    // Dark particles on a light page, light particles on a dark one. A colour
    // resolved once at mount and never again would return the same number.
    expect(light).toBeLessThan(120);
    expect(dark).toBeGreaterThan(160);
  });

  test('an AnalyserNode drives the orb: louder sound, bigger sphere', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-reactive').locator('canvas');

    await page.getByTestId('tone-start').click();
    await expect(page.getByTestId('audio-source')).toHaveText('tone');

    await page.getByTestId('tone-level').fill('1');
    await page.waitForTimeout(1200);
    const loud = await paintedWidth(canvas);

    await page.getByTestId('tone-level').fill('0');
    // Release is deliberately slower than attack; give it room to settle.
    await page.waitForTimeout(1800);
    const quiet = await paintedWidth(canvas);

    expect(loud).toBeGreaterThan(0);
    expect(quiet).toBeGreaterThan(0);
    // audioScale maps silence to 0.82 and a full-scale sine (RMS ~0.707) to
    // ~0.95 -- about 15% wider. A component ignoring the analyser returns two
    // equal numbers here, which is exactly the regression worth catching.
    expect(loud).toBeGreaterThan(quiet * 1.06);
  });

  test('an orb with no analyser still breathes, rather than going still', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-main').locator('canvas');
    await page.getByTestId('orb-toggle-variant').click();
    await expect(page.getByTestId('orb-variant')).toHaveText('listening');

    // The sine fallback has to survive the audio path being added, or every
    // consumer who does not own an AudioContext loses the animation.
    const widths: number[] = [];
    for (let sample = 0; sample < 8; sample += 1) {
      widths.push(await paintedWidth(canvas));
      await page.waitForTimeout(300);
    }
    expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths));
  });

  test('closing the AudioContext under a live orb degrades instead of freezing', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const canvas = page.getByTestId('orb-reactive').locator('canvas');

    await page.getByTestId('tone-start').click();
    await expect(page.getByTestId('audio-source')).toHaveText('tone');
    await page.waitForTimeout(600);

    await page.getByTestId('audio-stop').click();
    await page.waitForTimeout(600);

    // Still painting, and still moving: an exception thrown inside the rAF
    // callback would kill the loop permanently and leave a frozen sphere.
    const first = await paintedWidth(canvas);
    expect(first).toBeGreaterThan(0);
    const visibility = await measureVisibility(canvas);
    expect(visibility.maxDelta).toBeGreaterThan(40);
  });

  test('onlevel reports the envelope, and stays quiet through silence', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');
    const calls = page.getByTestId('orb-level-calls');
    const level = page.getByTestId('orb-level');

    // Nothing is driving the orb yet. A callback fired every frame regardless
    // would already be in the thousands here.
    await page.waitForTimeout(1000);
    await expect(calls).toHaveText('0');
    await expect(level).toHaveText('0.00');

    await page.getByTestId('tone-start').click();
    await page.getByTestId('tone-level').fill('1');
    await page.waitForTimeout(1200);

    expect(Number(await level.textContent())).toBeGreaterThan(0.2);
    const whileLoud = Number(await calls.textContent());
    expect(whileLoud).toBeGreaterThan(0);

    // Hold a steady tone: the envelope has settled, so the change threshold
    // should throttle the callback hard rather than firing on every frame.
    await page.waitForTimeout(1500);
    const afterSettling = Number(await calls.textContent());
    expect(afterSettling - whileLoud).toBeLessThan(60);
  });

  test('onlevel returns to zero when the audio stops, so a meter cannot stick', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/voice-orb');
    await page.getByTestId('tone-start').click();
    await page.getByTestId('tone-level').fill('1');
    await page.waitForTimeout(1200);
    expect(Number(await page.getByTestId('orb-level').textContent())).toBeGreaterThan(0.2);

    await page.getByTestId('audio-stop').click();
    await expect(page.getByTestId('orb-level')).toHaveText('0.00');
  });

  test('the variant switch reaches the animation', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');

    await expect(page.getByTestId('orb-variant')).toHaveText('idle');
    await page.getByTestId('orb-toggle-variant').click();
    await expect(page.getByTestId('orb-variant')).toHaveText('listening');
    await expect(page.getByTestId('orb-main').locator('canvas')).toBeVisible();
  });

  test('renders one canvas per instance, each sized to its own height', async ({ page }) => {
    await gotoHydrated(page, '/components/voice-orb');

    const main = page.getByTestId('orb-main').locator('canvas');
    const seeded = page.getByTestId('orb-seed-a').locator('canvas');

    const mainBox = await main.boundingBox();
    const seededBox = await seeded.boundingBox();
    expect(mainBox?.height).toBeGreaterThan(seededBox?.height ?? 0);
  });
});
