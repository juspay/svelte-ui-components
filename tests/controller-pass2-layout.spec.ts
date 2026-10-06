import { expect, test } from '@playwright/test';
import { gotoHydrated, waitForIntendedFonts } from './support/hydrated';
import { clippedControls } from './support/clipped-controls';

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 767, 768, 800, 820, 1024, 1280]) {
    test(`wide examples fit their main column (${theme}, ${width}px)`, async ({
      page
    }, testInfo) => {
      await page.addInitScript((theme) => localStorage.setItem('theme-preference', theme), theme);
      await page.setViewportSize({ width, height: 900 });
      const records = [];
      for (const route of ['card', 'stepper', 'table', 'media-player']) {
        await gotoHydrated(page, `/components/${route}`);
        await waitForIntendedFonts(page);
        const geometry = await page.evaluate(() => ({
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          main: document.querySelector('main')!.getBoundingClientRect().toJSON(),
          escapedControls: [
            ...document.querySelectorAll<HTMLElement>(
              'main button, main input, main [role="combobox"]'
            )
          ]
            .filter((el) => {
              const box = el.getBoundingClientRect();
              if (box.width === 0 || box.right <= innerWidth + 1) {
                return false;
              }
              for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
                if (getComputedStyle(ancestor).overflowX === 'auto') {
                  return false;
                }
              }
              return true;
            })
            .map((el) => ({
              name: el.getAttribute('aria-label') ?? el.textContent,
              rect: el.getBoundingClientRect().toJSON()
            }))
        }));
        const clips = await page.evaluate(clippedControls);
        expect(clips, `${route} controls must fit their clipping ancestors`).toEqual([]);
        expect(geometry.documentWidth, `${route} document geometry`).toBeLessThanOrEqual(width + 1);
        expect(geometry.main.right, `${route} main geometry`).toBeLessThanOrEqual(width + 1);
        expect(
          geometry.escapedControls,
          `${route} controls need an accessible local scroll route`
        ).toEqual([]);
        if (route === 'table' && width < 640) {
          const sort = page
            .locator('.table-mobile-cards')
            .getByRole('button', { name: 'Sort by Name', exact: true })
            .first();
          const heading = sort.locator('xpath=ancestor::th');
          await expect(sort).toBeVisible();
          await sort.click();
          await expect(heading).toHaveAttribute('aria-sort', 'ascending');
          await sort.focus();
          await page.keyboard.press('Space');
          await expect(heading).toHaveAttribute('aria-sort', 'descending');
        }
        records.push({ route, ...geometry });
        const regions = page.locator('main .demo-row[data-scroll-region]');
        for (let index = 0; index < (await regions.count()); index++) {
          const region = regions.nth(index);
          await expect(region).toHaveAttribute('tabindex', '0');
          expect(await region.getAttribute('aria-label')).toBeTruthy();
          await region.focus();
          await expect(region).toBeFocused();
          const start = await region.evaluate((el) => el.scrollLeft);
          await page.keyboard.press('ArrowRight', { delay: 50 });
          await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(start);
        }
      }
      await testInfo.attach('main-document-geometry.json', {
        body: JSON.stringify(records),
        contentType: 'application/json'
      });
    });
  }
}

test('sidebar transitions across the actual compact breakpoint preserve drawer dismissal and focus return', async ({
  page
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await gotoHydrated(page, '/components/card');
  await expect(page.getByRole('button', { name: 'Navigation menu', exact: true })).toBeHidden();
  for (const width of [1023, 800, 767, 390, 820]) {
    await page.setViewportSize({ width, height: 900 });
    const open = page.getByRole('button', { name: 'Navigation menu', exact: true });
    await expect(open).toBeVisible();
    await open.focus();
    await page.keyboard.press('Enter');
    const close = page.getByRole('button', { name: 'Close navigation menu', exact: true });
    await expect(close).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(open).toBeFocused();
    await open.click();
    await close.click();
    await expect(open).toBeFocused();
    await open.click();
    await page.locator('aside nav').getByRole('link', { name: 'Stepper', exact: true }).click();
    await expect(page).toHaveURL(/\/components\/stepper$/);
    await expect(close).toBeHidden();
  }
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator('aside')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Navigation menu', exact: true })).toBeHidden();
});
