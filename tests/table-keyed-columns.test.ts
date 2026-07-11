import { expect, test } from '@playwright/test';

test.describe('Table — keyed column model', () => {
  test('keyed table renders identically to its positional twin', async ({ page }) => {
    await page.goto('/components/table');
    const keyed = page.getByTestId('table-keyed-basic');
    const positional = page.getByTestId('table-positional-twin');
    await expect(keyed).toBeVisible();
    await expect(positional).toBeVisible();

    const keyedHeaders = await keyed.getByRole('columnheader').allInnerTexts();
    const positionalHeaders = await positional.getByRole('columnheader').allInnerTexts();
    expect(keyedHeaders).toEqual(positionalHeaders);

    const keyedCells = await keyed.getByRole('cell').allInnerTexts();
    const positionalCells = await positional.getByRole('cell').allInnerTexts();
    expect(keyedCells).toEqual(positionalCells);
  });

  test('sorting behaves identically on keyed and positional twins', async ({ page }) => {
    await page.goto('/components/table');
    const keyed = page.getByTestId('table-keyed-basic');
    const positional = page.getByTestId('table-positional-twin');

    await keyed.getByRole('button', { name: 'Sort by Name' }).click();
    await positional.getByRole('button', { name: 'Sort by Name' }).click();
    expect(await keyed.getByRole('cell').allInnerTexts()).toEqual(
      await positional.getByRole('cell').allInnerTexts()
    );

    // Second click flips to descending on both
    await keyed.getByRole('button', { name: 'Sort by Name' }).click();
    await positional.getByRole('button', { name: 'Sort by Name' }).click();
    expect(await keyed.getByRole('cell').allInnerTexts()).toEqual(
      await positional.getByRole('cell').allInnerTexts()
    );
  });

  test('per-column sortable: false suppresses that column sort button only', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.getByTestId('table-keyed-features');
    await expect(features).toBeVisible();
    await expect(features.getByRole('button', { name: 'Sort by Name' })).toBeVisible();
    await expect(features.getByRole('button', { name: 'Sort by Department' })).toHaveCount(0);
    await expect(features.getByRole('button', { name: 'Sort by Status' })).toBeVisible();
  });

  test('column-scoped custom cell snippet renders per row with the keyed row', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.getByTestId('table-keyed-features');
    // The Status column renders a Pill per row via the column's cell snippet
    await expect(features.getByTestId('keyed-status-active')).toBeVisible();
    await expect(features.getByTestId('keyed-status-pending')).toBeVisible();
    await expect(features.getByTestId('keyed-status-inactive')).toBeVisible();
  });

  test('missing row keys render as empty cells, not "undefined"', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.getByTestId('table-keyed-features');
    const thirdRowCells = await features
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .nth(2)
      .getByRole('cell')
      .allInnerTexts();
    expect(thirdRowCells[0]).toBe('Carol White');
    expect(thirdRowCells[1]).toBe('');
  });

  test('column testId is emitted as data-pw on the header cell', async ({ page }) => {
    await page.goto('/components/table');
    const features = page.getByTestId('table-keyed-features');
    await expect(features.getByTestId('keyed-header-name')).toHaveCount(1);
    await expect(features.getByTestId('keyed-header-name')).toContainText('Name');
  });

  test('positional API is untouched: the basic positional table renders as before', async ({
    page
  }) => {
    await page.goto('/components/table');
    // The pre-existing Basic demo (positional props, no columns/rows)
    const basicHeaders = page.getByRole('table').first().getByRole('columnheader');
    await expect(basicHeaders).toHaveCount(3);
    await expect(
      page.getByRole('table').first().getByRole('rowgroup').last().getByRole('row')
    ).toHaveCount(3);
  });
});
