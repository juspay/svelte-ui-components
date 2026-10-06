import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { blockExternalFonts } from './support/offline-fonts';
import { measurePairedContrast } from './support/pixel-contrast';

/**
 * The `Get Started` example on the Button page pairs `variant="brand"` (white
 * label, transparent chassis) with a consumer gradient. The gradient it shipped
 * ran from #ff7a45, which is only 2.59:1 against white, so the label measured
 * about 3.2:1 where it sat and the worse colours were one resize away.
 *
 * Contrast is measured from rendered pixels (see support/pixel-contrast.ts), in
 * every state a pointer or keyboard can put the button in, in both themes. The
 * gradient is consumer styling, so the fix lives in the example and its docs
 * recipe; the Button component and its other variants are untouched.
 */
const AA_NORMAL_TEXT = 4.5;

// 14px/500 strokes are about 1.3 CSS px wide. At 3x there are fully covered
// pixels inside them; at 1x there are almost none and every pixel is a blend.
test.use({ deviceScaleFactor: 3 });

// Colours are what is measured; a slow or unreachable font host must not decide the result.
test.beforeEach(async ({ page }) => {
  await blockExternalFonts(page);
});

const brandButton = (page: Page): Locator => page.getByTestId('button-brand-gradient');
const brandLabel = (page: Page): Locator => brandButton(page).locator('.button-text');

const chooseTheme = async (page: Page, theme: 'light' | 'dark'): Promise<void> => {
  await page
    .getByRole('button', { name: theme === 'dark' ? 'Dark theme' : 'Light theme', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  // The pointer is parked on the theme switcher; move it off so "rest" is rest.
  await page.mouse.move(2, 2);
};

const focusByKeyboard = async (page: Page): Promise<void> => {
  // A real Tab from the control before it, so :focus-visible matches the way it
  // does for a keyboard user rather than for a script calling focus().
  await page.getByRole('button', { name: 'Book a Demo' }).focus();
  await page.keyboard.press('Tab');
  await expect(brandButton(page)).toBeFocused();
  expect(await brandButton(page).evaluate((node) => node.matches(':focus-visible'))).toBe(true);
};

const expectLegible = async (page: Page): Promise<void> => {
  const measured = await measurePairedContrast(brandLabel(page));

  // The label really is painted white, and the sample is not a handful of pixels.
  expect(measured.foregroundReference).toEqual([255, 255, 255]);
  expect(measured.interiorPixels).toBeGreaterThan(200);
  // Still a gradient behind the label, not a flat fill that passes by being boring.
  expect(measured.backdropSpread).toBeGreaterThan(12);

  expect(measured.interiorMin).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  expect(measured.interiorP5).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  // Every colour behind the label box, not just under the glyph strokes.
  expect(measured.boxMin).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Button brand gradient, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await gotoHydrated(page, '/components/button');
      await chooseTheme(page, theme);
      await brandButton(page).scrollIntoViewIfNeeded();
    });

    test('label contrast at rest', async ({ page }) => {
      await expectLegible(page);
    });

    test('label contrast on hover', async ({ page }) => {
      await brandButton(page).hover();
      // The hover rule moves the button; assert it really is in the hover state.
      await expect
        .poll(() => brandButton(page).evaluate((node) => getComputedStyle(node).transform))
        .not.toBe('none');
      await expectLegible(page);
    });

    test('label contrast while pressed', async ({ page }) => {
      await brandButton(page).hover();
      await page.mouse.down();
      try {
        await expect(brandButton(page)).toHaveCSS('background-image', /linear-gradient/);
        await expectLegible(page);
      } finally {
        await page.mouse.up();
      }
    });

    test('label contrast with keyboard focus', async ({ page }) => {
      await focusByKeyboard(page);
      await expectLegible(page);
    });

    test('label contrast with keyboard focus and hover together', async ({ page }) => {
      await focusByKeyboard(page);
      await brandButton(page).hover();
      await expectLegible(page);
    });
  });
}

test.describe('Button brand gradient, the measurement itself', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/button');
    await brandButton(page).scrollIntoViewIfNeeded();
  });

  // A check that cannot fail proves nothing. Put the recipe this example shipped
  // back on the live button and the same measurement has to call it out, so the
  // passes above are the gradient's doing and not the probe's blind spot.
  test('flags the original #ff7a45 gradient as below 4.5:1', async ({ page }) => {
    await brandButton(page).evaluate((node) => {
      const container = node.closest<HTMLElement>('.button-container');
      const legacy = 'linear-gradient(135deg, #ff7a45, #8f41fc)';
      container?.style.setProperty('--button-background', legacy);
      container?.style.setProperty('--button-hover-color', legacy);
    });

    const measured = await measurePairedContrast(brandLabel(page));

    expect(measured.foregroundReference).toEqual([255, 255, 255]);
    expect(measured.interiorP5).toBeLessThan(AA_NORMAL_TEXT);
    expect(measured.boxMin).toBeLessThan(AA_NORMAL_TEXT);
    // The audit reported about 3.22:1; the measurement should land near it.
    expect(measured.interiorP5).toBeGreaterThan(2.9);
    expect(measured.interiorP5).toBeLessThan(3.6);
  });

  test('keeps the intentional orange-to-violet gradient', async ({ page }) => {
    const backgroundImage = await brandButton(page).evaluate(
      (node) => getComputedStyle(node).backgroundImage
    );
    expect(backgroundImage).toMatch(/^linear-gradient\(/);
    // #c2410c and #8f41fc, in the form getComputedStyle reports them.
    expect(backgroundImage).toContain('rgb(194, 65, 12)');
    expect(backgroundImage).toContain('rgb(143, 65, 252)');
  });

  test('other variants keep their own treatment', async ({ page }) => {
    const style = (name: string) =>
      page
        .locator('.btn-demos .demo-row', { has: page.getByRole('button', { name: 'Primary' }) })
        .first()
        .getByRole('button', { name, exact: true })
        .evaluate((node) => {
          const computed = getComputedStyle(node);
          return { color: computed.color, backgroundColor: computed.backgroundColor };
        });

    expect(await style('Primary')).toEqual({
      color: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(58, 69, 80)'
    });
    expect(await style('Destructive')).toEqual({
      color: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(231, 0, 11)'
    });
    expect((await style('Secondary')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect((await style('Ghost')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  test('is still an ordinary button: a click and both activation keys fire', async ({ page }) => {
    const activations = await brandButton(page).evaluate((node) => {
      const log: string[] = [];
      node.addEventListener('click', (event) => {
        // A keyboard-initiated click reports detail 0; a pointer click reports 1 or more.
        log.push(event instanceof MouseEvent && event.detail === 0 ? 'key' : 'pointer');
      });
      Object.assign(window, { __brandActivations: log });
      return log.length;
    });
    expect(activations).toBe(0);
    const recorded = () =>
      page.evaluate(
        () => (window as unknown as { __brandActivations: string[] }).__brandActivations
      );

    await brandButton(page).click();
    expect(await recorded()).toEqual(['pointer']);

    await brandButton(page).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    expect(await recorded()).toEqual(['pointer', 'key', 'key']);
  });

  test('is exposed to assistive technology as a button named by its label', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Get Started', exact: true })).toHaveCount(1);
    await expect(brandButton(page)).toBeEnabled();
  });
});
