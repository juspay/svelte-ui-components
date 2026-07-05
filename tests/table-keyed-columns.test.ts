import { expect, test } from '@playwright/test';

test.describe('Table — keyed column model', () => {
  test('keyed table renders identically to its positional twin', async ({ page }) => {
    await page.goto('/components/table');
    const keyed = page.locator('[data-pw="table-keyed-basic"]');
    const positional = page.locator('[data-pw="table-positional-twin"]');
    await expect(keyed).toBeVisible();
    await expect(positional).toBeVisible();

    const keyedHeaders = await keyed.locator('th').allInnerTexts();
    const positionalHeaders = await positional.locator('th').allInnerTexts();
    expect(keyedHeaders).toEqual(positionalHeaders);

    const keyedCells = await keyed.locator('td').allInnerTexts();
    const positionalCells = await positional.locator('td').allInnerTexts();
    expect(keyedCells).toEqual(positionalCells);
  });

  test('sorting behaves identically on keyed and positional twins', async ({ page }) => {
    await page.goto('/components/table');
    const keyed = page.locator('[data-pw="table-keyed-basic"]');
    const positional = page.locator('[data-pw="table-positional-twin"]');

    await keyed.getByRole('button', { name: 'Sort by Name' }).click();
    await positional.getByRole('button', { name: 'Sort by Name' }).click();
    expect(await keyed.locator('td').allInnerTexts()).toEqual(
      await positional.locator('td').allInnerTexts()
    );

    // Second click flips to descending on both
    await keyed.getByRole('button', { name: 'Sort by Name' }).click();
    await positional.getByRole('button', { name: 'Sort by Name' }).click();
    expect(await keyed.locator('td').allInnerTexts()).toEqual(
      await positional.locator('td').allInnerTexts()
    );
  });

  test('per-column sortable: false suppresses that column sort button only', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.locator('[data-pw="table-keyed-features"]');
    await expect(features).toBeVisible();
    await expect(features.getByRole('button', { name: 'Sort by Name' })).toBeVisible();
    await expect(features.getByRole('button', { name: 'Sort by Department' })).toHaveCount(0);
    await expect(features.getByRole('button', { name: 'Sort by Status' })).toBeVisible();
  });

  test('column-scoped custom cell snippet renders per row with the keyed row', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.locator('[data-pw="table-keyed-features"]');
    // The Status column renders a Pill per row via the column's cell snippet
    await expect(features.locator('td .pill-success')).toHaveCount(1);
    await expect(features.locator('td .pill-warning')).toHaveCount(1);
    await expect(features.locator('td .pill-error')).toHaveCount(1);
  });

  test('missing row keys render as empty cells, not "undefined"', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.locator('[data-pw="table-keyed-features"]');
    const thirdRowCells = await features.locator('tbody tr').nth(2).locator('td').allInnerTexts();
    expect(thirdRowCells[0]).toBe('Carol White');
    expect(thirdRowCells[1]).toBe('');
  });

  test('column testId is emitted as data-pw on the header cell', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.locator('[data-pw="table-keyed-features"]');
    await expect(features.locator('th[data-pw="keyed-header-name"]')).toHaveCount(1);
    await expect(features.locator('th[data-pw="keyed-header-name"]')).toContainText('Name');
  });

  test('positional API is untouched: the basic positional table renders as before', async ({
    page
  }) => {
    await page.goto('/components/table');
    // The pre-existing Basic demo (positional props, no columns/rows)
    const basicHeaders = page.locator('table').first().locator('th');
    await expect(basicHeaders).toHaveCount(3);
    await expect(page.locator('table').first().locator('tbody tr')).toHaveCount(3);
  });
});
