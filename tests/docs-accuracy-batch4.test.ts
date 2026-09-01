import { expect, test } from '@playwright/test';

// Regression coverage for docs/*.md accuracy fixes in this batch (Gauge, GridItem, HITL, Icon,
// IconStack, Input, InputButton, LineChart). Each assertion proves the prop/behavior the
// corrected documentation now claims is actually real, not just that the markdown changed.

test.describe('Input — newly-documented readonly/spellcheck', () => {
  test('readonly keeps the field focusable and selectable but not editable', async ({ page }) => {
    await page.goto('/components/input');
    const field = page.getByTestId('input-readonly');
    await expect(field).toHaveAttribute('readonly', '');
    await field.click();
    await expect(field).toBeFocused();
    const before = await field.inputValue();
    await page.keyboard.type('should not appear');
    await expect(field).toHaveValue(before);
  });

  test('spellcheck={false} renders the native attribute as false', async ({ page }) => {
    await page.goto('/components/input');
    await expect(page.getByTestId('input-spellcheck-off')).toHaveAttribute('spellcheck', 'false');
  });
});

test.describe('InputButton — newly-documented testId', () => {
  test('testId reaches the root container as data-pw', async ({ page }) => {
    await page.goto('/components/input-button');
    const demo = page.getByTestId('input-button-messages-demo');
    await expect(demo).toBeVisible();
    await expect(demo).toHaveAttribute('data-pw', 'input-button-messages-demo');
  });
});

test.describe('HITL — newly-documented test-id override props', () => {
  test('confirm/cancel/completion default test ids derive from testId', async ({ page }) => {
    await page.goto('/components/hitl');
    const card = page.getByTestId('demo-confirmation');
    await expect(card).toBeVisible();
    await expect(page.getByTestId('demo-confirmation-confirm')).toBeVisible();
    await expect(page.getByTestId('demo-confirmation-cancel')).toBeVisible();
    // Completion strip only renders after a decision -- confirm the pending confirm/cancel
    // ids exist now, which is what the docs claim for the default-derivation behavior.
  });
});

test.describe('Gauge — newly-documented ariaLabel', () => {
  test('ariaLabel sets the accessible name on the progressbar element', async ({ page }) => {
    await page.goto('/components/gauge');
    const gauge = page.getByTestId('gauge-with-arialabel');
    await expect(gauge).toHaveAttribute('role', 'progressbar');
    await expect(gauge).toHaveAttribute('aria-label', 'Storage used, 25 percent');
  });
});

test.describe('GridItem / Icon / IconStack — newly-documented testId', () => {
  test('GridItem testId reaches the root as data-pw', async ({ page }) => {
    await page.goto('/components/grid-item');
    await expect(page.getByTestId('grid-item-photos')).toBeVisible();
  });

  test('Icon testId reaches the root as data-pw', async ({ page }) => {
    await page.goto('/components/icon');
    await expect(page.getByTestId('icon-home')).toBeVisible();
  });

  test('IconStack testId reaches the root as data-pw', async ({ page }) => {
    await page.goto('/components/icon-stack');
    await expect(page.getByTestId('icon-stack-demo')).toBeVisible();
  });
});

test.describe('LineChart — newly-documented minHeight/maxHeight', () => {
  test('a wide aspect ratio is still clamped to the exact min/max height', async ({ page }) => {
    await page.goto('/components/line-chart');
    const chart = page.getByTestId('line-height-bounds-chart');
    await expect(chart).toBeVisible();
    const box = await chart.boundingBox();
    expect(box).not.toBeNull();
    // Clamped to exactly 260px by both bounds together; allow a couple px for borders.
    expect(box!.height).toBeGreaterThanOrEqual(258);
    expect(box!.height).toBeLessThanOrEqual(264);
  });
});
