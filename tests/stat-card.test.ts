import { expect, test } from '@playwright/test';

// Covers the extended StatCard: backward-compatible single value, multi-row layout
// with dividers + per-row deltas, the breakdown grid, a header that renders without
// a title, the onCheckboxChange callback, and the guard that keeps checkbox
// interaction from firing an interactive card's click action.
test.describe('StatCard', () => {
  test('renders a basic single value (backward compatible)', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('basic-positive');
    await expect(card).toBeVisible();
    await expect(card.getByTestId('basic-positive-value')).toHaveText('8,610');
  });

  test('multi-row card renders a row and a divider per metric', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('multi-row');
    await expect(card.getByTestId(/^checkout-row-\d+$/)).toHaveCount(3);
    await expect(card.getByTestId(/^multi-row-row-divider-\d+$/)).toHaveCount(2);
    await expect(card.getByTestId(/^multi-row-delta-\d+$/)).toHaveCount(3);
  });

  test('horizontal rows lay the sections side by side', async ({ page }) => {
    await page.goto('/components/stat-card');

    const rowsContainer = page.getByTestId('horizontal-rows-rows');
    await expect(rowsContainer).toHaveClass(/statcard-rows-horizontal/);
    await expect(rowsContainer).toHaveCSS('flex-direction', 'row');

    // Sections sit side by side: every row shares the same vertical top.
    const tops = await page
      .getByTestId('horizontal-rows')
      .getByTestId(/^checkout-row-\d+$/)
      .evaluateAll((rows) => rows.map((row) => Math.round(row.getBoundingClientRect().top)));
    expect(tops.length).toBe(3);
    expect(new Set(tops).size).toBe(1);
  });

  test('breakdown grid renders one item per breakdown entry', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('with-breakdown');
    await expect(card.getByTestId(/^with-breakdown-breakdown-item-\d+-\d+$/)).toHaveCount(3);
  });

  test('renders the header even when no title is set', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('headerless-card');
    await expect(card.getByTestId('headerless-card-header')).toHaveCount(1);
    await expect(card.getByTestId('headerless-card-title')).toHaveCount(0);
    await expect(card.getByRole('checkbox')).toBeVisible();
  });

  test('checkbox toggle fires onCheckboxChange', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('with-checkbox');
    await expect(card.getByTestId('with-checkbox-value')).toHaveText('₹10.9Cr');
    await card.getByRole('checkbox').click();
    await expect(card.getByTestId('with-checkbox-value')).toHaveText('₹12.4Cr');
  });

  test('toggling the checkbox does not trigger the card action', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('clickable-checkbox-card');
    const clickCount = page.getByTestId('card-click-count');
    await expect(clickCount).toHaveText('0');

    // Checkbox toggles without firing the card's onclick.
    await card.getByRole('checkbox').click();
    await expect(card.getByRole('checkbox')).toHaveClass(/checked/);
    await expect(clickCount).toHaveText('0');

    // Clicking the card body still fires the action.
    await card.getByTestId('clickable-checkbox-card-value').click();
    await expect(clickCount).toHaveText('1');
  });

  test('renders the subtitle below metric rows', async ({ page }) => {
    await page.goto('/components/stat-card');

    // Regression: the subtitle block previously lived inside the no-rows {:else}
    // branch, so a card given both `rows` and `subtitle` silently dropped the
    // subtitle (e.g. the "Today vs Yesterday" comparison label).
    const card = page.getByTestId('rows-with-subtitle');
    await expect(card.getByTestId(/^checkout-row-\d+$/)).toHaveCount(3);
    await expect(card.getByTestId('rows-with-subtitle-subtitle')).toHaveText('Today vs Yesterday');
  });

  test('still renders the subtitle for a single-value card', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('with-subtitle');
    await expect(card.getByTestId(/^checkout-row-\d+$/)).toHaveCount(0);
    await expect(card.getByTestId('with-subtitle-subtitle')).toHaveText('vs last 30 days');
  });

  test('multi-row card renders a per-row subtitle independent of the card-level subtitle', async ({
    page
  }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('per-row-subtitle');
    await expect(card.getByTestId('per-row-subtitle-subtitle-0')).toHaveText('Today vs Yesterday');
    await expect(card.getByTestId('per-row-subtitle-subtitle-1')).toHaveText(
      'This Week vs Last Week'
    );
  });

  test('additionalContent stays inline by default, alongside the value', async ({ page }) => {
    await page.goto('/components/stat-card');

    // Regression: a real consumer (identity page) pairs `value: '--'` with a short
    // unit suffix like additionalContent: '%' and expects it beside the value, not
    // on its own line — the default must not force a break.
    const card = page.getByTestId('inline-additional');
    const value = card.getByTestId('inline-additional-value-0');
    const additionalContent = card.locator('.statcard-row-additional');

    await expect(additionalContent).toHaveText('%');

    const valueBox = await value.boundingBox();
    const additionalContentBox = await additionalContent.boundingBox();
    if (valueBox === null || additionalContentBox === null) {
      throw new Error('Expected both elements to have a bounding box');
    }

    // Same-line baseline alignment keeps the two within a few pixels of each
    // other — a forced break would push additionalContent well below the value.
    expect(additionalContentBox.y - valueBox.y).toBeLessThan(valueBox.height / 2);
  });

  test('additionalContentBreak forces additionalContent onto its own line', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('wide-additional');
    const value = card.getByTestId('wide-additional-value-0');
    const additionalContent = card.locator('.statcard-row-additional');

    await expect(additionalContent).toHaveText('short');

    const valueBox = await value.boundingBox();
    const additionalContentBox = await additionalContent.boundingBox();
    if (valueBox === null || additionalContentBox === null) {
      throw new Error('Expected both elements to have a bounding box');
    }

    // A genuine line break puts the additional-content row well below the value
    // row's top edge — same-line baseline alignment would keep the two within a
    // few pixels of each other.
    expect(additionalContentBox.y - valueBox.y).toBeGreaterThan(valueBox.height / 2);
  });

  test('valueVariant tints a row value for success and warning states', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('value-tint');
    const successValue = card.getByTestId('value-tint-value-0');
    const warningValue = card.getByTestId('value-tint-value-1');

    await expect(successValue).toHaveCSS('color', 'rgb(22, 163, 74)');
    await expect(warningValue).toHaveCSS('color', 'rgb(245, 158, 11)');
  });

  test('row-level value typography override applies to that row and not its sibling', async ({
    page
  }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('value-typography');
    const primaryValue = card.getByTestId('value-typography-value-0');
    const secondaryValue = card.getByTestId('value-typography-value-1');
    const untouchedValue = card.getByTestId('value-typography-value-2');

    // Row-level override applies to the row that sets it...
    await expect(primaryValue).toHaveCSS('font-size', '20px');
    await expect(primaryValue).toHaveCSS('font-weight', '700');

    // ...and a second row can carry a different override independently.
    await expect(secondaryValue).toHaveCSS('font-size', '30px');
    await expect(secondaryValue).toHaveCSS('font-weight', '600');

    // An unset sibling row is byte-identical to today's shared card-level default
    // (--statcard-value-font-size: 24px / --statcard-value-font-weight: 600).
    await expect(untouchedValue).toHaveCSS('font-size', '24px');
    await expect(untouchedValue).toHaveCSS('font-weight', '600');
  });

  test('row-level heading typography override applies independently of the value override', async ({
    page
  }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('value-typography');
    const primaryHeading = card.locator(
      "[data-pw='value-typography-primary-row'] .statcard-row-heading"
    );
    const untouchedHeading = card.locator(
      "[data-pw='value-typography-default-row'] .statcard-row-heading"
    );

    await expect(primaryHeading).toHaveCSS('font-size', '18px');

    // Unset row keeps the shared row-heading default (--statcard-row-heading-font-size: 12px).
    await expect(untouchedHeading).toHaveCSS('font-size', '12px');
  });

  test('a single-value (non-rows) card is unaffected by the row-scoped value variables', async ({
    page
  }) => {
    await page.goto('/components/stat-card');

    // Regression guard: --statcard-row-value-font-size/-font-weight are scoped to
    // .statcard-row-value-line so they must never reach the plain value/delta row.
    const card = page.getByTestId('basic-positive');
    const value = card.getByTestId('basic-positive-value');

    await expect(value).toHaveCSS('font-size', '24px');
    await expect(value).toHaveCSS('font-weight', '600');
  });

  test('row order overrides rearrange one row to title -> subtitle -> value', async ({ page }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('row-order');
    const headingWrap = card.locator(
      "[data-pw='row-order-reordered-row'] .statcard-row-heading-wrap"
    );
    const valueLine = card.locator("[data-pw='row-order-reordered-row'] .statcard-row-value-line");
    const subtitle = card.getByTestId('row-order-subtitle-0');

    // The demo sets --statcard-row-subtitle-order/-value-line-order, leaving
    // heading at its default 0 — mechanism-level proof of the override.
    await expect(headingWrap).toHaveCSS('order', '0');
    await expect(subtitle).toHaveCSS('order', '1');
    await expect(valueLine).toHaveCSS('order', '2');

    // Visual proof: the row renders title, then subtitle, then value — not
    // today's default heading -> value -> subtitle stacking.
    const headingBox = await headingWrap.boundingBox();
    const subtitleBox = await subtitle.boundingBox();
    const valueLineBox = await valueLine.boundingBox();
    if (headingBox === null || subtitleBox === null || valueLineBox === null) {
      throw new Error('Expected all three row sub-elements to have a bounding box');
    }
    expect(headingBox.y).toBeLessThan(subtitleBox.y);
    expect(subtitleBox.y).toBeLessThan(valueLineBox.y);
  });

  test('omitting the row order overrides preserves the default heading -> value -> subtitle order', async ({
    page
  }) => {
    await page.goto('/components/stat-card');

    const card = page.getByTestId('row-order');
    const headingWrap = card.locator(
      "[data-pw='row-order-default-row'] .statcard-row-heading-wrap"
    );
    const valueLine = card.locator("[data-pw='row-order-default-row'] .statcard-row-value-line");
    const subtitle = card.getByTestId('row-order-subtitle-1');

    // No override set on this row — every hook stays at its literal fallback of 0.
    await expect(headingWrap).toHaveCSS('order', '0');
    await expect(valueLine).toHaveCSS('order', '0');
    await expect(subtitle).toHaveCSS('order', '0');

    // With every order tied at 0, the browser falls back to markup order —
    // today's heading -> value line -> subtitle stacking, unchanged.
    const headingBox = await headingWrap.boundingBox();
    const valueLineBox = await valueLine.boundingBox();
    const subtitleBox = await subtitle.boundingBox();
    if (headingBox === null || valueLineBox === null || subtitleBox === null) {
      throw new Error('Expected all three row sub-elements to have a bounding box');
    }
    expect(headingBox.y).toBeLessThan(valueLineBox.y);
    expect(valueLineBox.y).toBeLessThan(subtitleBox.y);
  });
});
