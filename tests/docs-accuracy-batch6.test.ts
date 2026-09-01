import { expect, test } from '@playwright/test';

// Regression guards for docs/*.md accuracy fixes to ProportionBar through SpeechToText
// (batch 6 of the library-wide documentation audit). Each test proves a prop the docs
// now claim actually behaves as documented, on the real component -- not just that the
// markdown table has a new row.

test.describe('SankeyChart — radius and maxHeight (previously undocumented props)', () => {
  test('radius sets node corner rounding and maxHeight caps the rendered height', async ({
    page
  }) => {
    await page.goto('/components/sankey-chart');

    const chart = page.getByTestId('sankey-radius-demo');
    await expect(chart).toBeVisible();

    const svg = chart.locator('svg');
    const heightAttr = await svg.getAttribute('height');
    // Without this, a missing attribute would make Number(null) === 0 and the cap
    // assertion below would pass vacuously.
    expect(heightAttr).not.toBeNull();
    expect(Number(heightAttr)).toBeLessThanOrEqual(180);

    const firstNode = chart.locator('.sankey-node').first();
    await expect(firstNode).toHaveAttribute('rx', '0');
    await expect(firstNode).toHaveAttribute('ry', '0');
  });
});

test.describe('Select — showSelectAll and usePortal (previously undocumented props)', () => {
  test('showSelectAll toggles every listed option and shows an indeterminate state for a partial selection', async ({
    page
  }) => {
    await page.goto('/components/select');

    const select = page.getByTestId('select-all-demo');
    await select.locator('.select-trigger').click();

    const selectAllRow = page.getByTestId('select-all-demo-select-all');
    await expect(selectAllRow).toBeVisible();

    // Pick one option directly -- select-all should now read indeterminate (some, not all).
    await page.getByTestId('select-all-demo-apple').click();
    const indicator = page.getByTestId('select-all-demo-select-all-indicator');
    await expect(indicator).toHaveClass(/indeterminate/);

    // Click select-all: every option becomes selected.
    await selectAllRow.click();
    await expect(
      page.getByText('Selected IDs: apple, banana, cherry, date, elderberry, fig, grape')
    ).toBeVisible();

    // Click again: fully deselects.
    await selectAllRow.click();
    await expect(page.locator('.demo-info', { hasText: 'Selected IDs:' })).not.toBeVisible();
  });

  test('usePortal renders the dropdown panel as a child of document.body, not the select container', async ({
    page
  }) => {
    await page.goto('/components/select');

    const select = page.getByTestId('select-portal-demo');
    await select.locator('.select-trigger').click();

    const dropdown = page.locator('.select-dropdown.select-dropdown-portal');
    await expect(dropdown).toBeVisible();

    const parentIsBody = await dropdown.evaluate((el) => el.parentElement === document.body);
    expect(parentIsBody).toBe(true);
  });
});

test.describe('Sheet — dismissOnOutsideClick (previously undocumented prop)', () => {
  test('dismissOnOutsideClick={true} with showOverlay={false} still closes on an outside click', async ({
    page
  }) => {
    await page.goto('/components/sheet');

    await page.getByRole('button', { name: 'Open account menu' }).click();
    const panel = page.getByTestId('sheet-anchored-panel');
    await expect(panel).toBeVisible();

    // Click well outside the anchored panel.
    await page.mouse.click(20, 20);
    await expect(panel).not.toBeVisible();
  });

  test('dismissOnOutsideClick={false} with showOverlay={true} ignores an outside click but still closes on Escape', async ({
    page
  }) => {
    await page.goto('/components/sheet');

    await page.getByRole('button', { name: 'Open blocking sheet' }).click();
    const panel = page.getByTestId('sheet-blocking-panel');
    await expect(panel).toBeVisible();

    // Clicking the overlay backdrop must NOT close it.
    await page.mouse.click(20, 20);
    await expect(panel).toBeVisible();

    // Escape still works regardless of dismissOnOutsideClick.
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
  });
});
