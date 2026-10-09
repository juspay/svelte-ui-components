import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { measurePairedContrast } from './support/pixel-contrast';

// This fixture is production-built by vite.config.fixtures.ts. A dev-only
// rendering cannot detect a consumer compiler lowering light-dark() into
// private variables that the consumer's inherited theme never initializes.
for (const theme of ['light', 'dark'] as const) {
  test(`compiled label plates retain ${theme} defaults and consumer overrides`, async ({
    page
  }) => {
    await page.goto(`${fixtureBaseURL}/chart-label-plate/`);
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value;
      element.style.colorScheme = value;
    }, theme);
    const plate = page.locator('.chart-label-backdrop');
    const label = page.locator('.sample-label');
    await expect(plate).toBeVisible();
    const expected = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)';
    await expect(plate).toHaveCSS('fill', expected);

    const assertPaintedContrast = async () => {
      const result = await measurePairedContrast(label);
      expect(result.interiorPixels).toBeGreaterThan(10);
      expect(result.interiorMin).toBeGreaterThanOrEqual(4.5);
      expect(result.interiorP5).toBeGreaterThanOrEqual(4.5);
      expect(result.boxMin).toBeGreaterThanOrEqual(4.5);
    };
    await assertPaintedContrast();

    const override = theme === 'light' ? '#fef3c7' : '#0f172a';
    const expectedOverride = theme === 'light' ? 'rgb(254, 243, 199)' : 'rgb(15, 23, 42)';
    await page.locator('svg').evaluate((element, value) => {
      element.style.setProperty('--chart-label-background', value);
    }, override);
    await expect(plate).toHaveCSS('fill', expectedOverride);
    await assertPaintedContrast();
  });
}
