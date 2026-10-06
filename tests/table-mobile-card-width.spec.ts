import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * Below 640px `mobileCardLayout` turns every table part into `display: block` with
 * `width: 100%`, and gives each row a border and padding to draw it as a card.
 * Under the default content-box sizing that is 100% PLUS 26px: each card was wider
 * than its table and its right edge, border included, ran past the column. It went
 * unseen for as long as the example app's fixed sidebar kept the main column wider
 * than a phone and a CSS shim hid the sidebar in the one test that looked.
 */
test.describe('Table mobileCardLayout, card width', () => {
  test('every card fits inside its table and the screen at phone widths', async ({ page }) => {
    for (const width of [390, 360, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await gotoHydrated(page, '/components/table');

      const table = page.getByTestId('table-mobile-cards').locator('table');
      await table.scrollIntoViewIfNeeded();
      const frame = await table.boundingBox();
      expect(frame, `${width}px: table is laid out`).not.toBeNull();

      const rows = table.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThan(1);
      for (let index = 0; index < (await rows.count()); index++) {
        const card = await rows.nth(index).boundingBox();
        expect(card, `${width}px: card ${index} is laid out`).not.toBeNull();
        expect(card?.x ?? -1, `${width}px: card ${index} left edge`).toBeGreaterThanOrEqual(
          (frame?.x ?? 0) - 0.5
        );
        expect(
          (card?.x ?? 0) + (card?.width ?? 0),
          `${width}px: card ${index} right edge stays inside the table`
        ).toBeLessThanOrEqual((frame?.x ?? 0) + (frame?.width ?? 0) + 0.5);
        expect((card?.x ?? 0) + (card?.width ?? 0)).toBeLessThanOrEqual(width);
      }
    }
  });

  test('above the breakpoint it is an ordinary table again', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/components/table');
    const table = page.getByTestId('table-mobile-cards').locator('table');
    await expect(table).toHaveCSS('display', 'table');
    await expect(table.locator('tbody tr').first()).toHaveCSS('display', 'table-row');
  });
});
