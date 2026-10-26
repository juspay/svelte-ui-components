import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fixtureBaseURL } from './support/fixture-server';
const url = process.env.BZ7222_NATIVE_FIXTURE_URL ?? fixtureBaseURL + '/sheet-reversal-focus/';
for (const mode of ['inner', 'covered', 'close', 'unmount']) {
  test('retained reopen guard: ' + mode, async ({ page }, info) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Retained Sheet' })).toBeVisible();
    await page.evaluate((next) => Reflect.get(window, 'sheetReversalFixture').reverse(next), mode);
    if (mode === 'inner') {
      await expect(page.locator('[data-pw="reversal-input"]')).toBeFocused();
      const state = await page.evaluate(() => Reflect.get(window, 'sheetReversalFixture').read());
      expect(state.selection).toEqual([1, 5]);
      expect(state.draft).toBe('Retained owner draft');
    } else if (mode === 'covered') {
      await expect(page.getByRole('button', { name: 'Newer layer control' })).toBeFocused();
    } else {
      await expect(page.locator('[data-pw="reversal-sheet-panel"]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeFocused();
    }
    const result = await page.evaluate(() => Reflect.get(window, 'sheetReversalFixture').read());
    writeFileSync(info.outputPath('result.json'), JSON.stringify({ mode, result }, null, 2) + '\n');
    await page.screenshot({ path: info.outputPath('final.png') });
  });
}
