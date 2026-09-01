import { expect, test } from '@playwright/test';

// Regression coverage for docs/*.md accuracy fixes: proves each newly-documented (or
// previously-undocumented-but-real) prop/CSS variable actually does what its doc entry
// now claims. Components in this batch confirmed already accurate and left untouched:
// LoadingDots, LottiePlayer, MarkdownText, MediaPlayer, Pagination, Phone, Progress.

test.describe('Loader — testId prop (was undocumented)', () => {
  test('testId renders as data-pw on the root element', async ({ page }) => {
    await page.goto('/components/loader');
    await expect(page.getByTestId('loader-demo')).toBeVisible();
  });
});

test.describe('MediaUpload — CSS Variables table (was prose-only)', () => {
  test('themed instance reflects every overridden variable', async ({ page }) => {
    await page.goto('/components/media-upload');

    const label = page.getByTestId('media-upload-themed-demo').locator('.label');
    await expect(label).toHaveCSS('color', 'rgb(20, 90, 200)');

    const dropTile = page.getByTestId('media-upload-themed-demo').locator('.drop-tile');
    await expect(dropTile).toHaveCSS('background-color', 'rgb(255, 244, 214)');
    await expect(dropTile).toHaveCSS('height', '90px');
    await expect(dropTile).toHaveCSS('width', '90px');
    await expect(dropTile).toHaveCSS('border-radius', '2px');
  });
});

test.describe('Menu — --menu-item-selected-* (was undocumented)', () => {
  test('the selected item uses the themed selected colors', async ({ page }) => {
    await page.goto('/components/menu');

    await page.getByTestId('menu-selected-demo').locator('button').click();
    // .menu-item:hover (specificity 0,2,0) beats .menu-item-selected (0,1,0), so if the
    // mouse is left sitting over the newly-opened item after the click, the hover color
    // wins over the selected color this test is actually verifying -- move away first.
    await page.mouse.move(0, 0);
    // background-color is set on .menu-item-selected itself, not the inner .menu-item-label
    // text span -- background-color doesn't inherit to children the way color does, so
    // asserting on the span (via getByText) would only ever see its own transparent default.
    const selectedItem = page.locator('.menu-item-selected', { hasText: 'Oldest first' });
    await expect(selectedItem).toBeVisible();
    // Menu auto-focuses the selected item on open, and .menu-item:focus (specificity 0,2,0)
    // also beats .menu-item-selected (0,1,0) -- blur it to see the selected styling this
    // variable actually controls, the same way it's visible once a user tabs elsewhere.
    await selectedItem.evaluate((el) => (el as HTMLElement).blur());
    await expect(selectedItem).toHaveCSS('background-color', 'rgb(220, 235, 255)');
    await expect(selectedItem.getByText('Oldest first')).toHaveCSS('color', 'rgb(10, 60, 160)');
  });
});

test.describe('Modal — disabled footer button CSS variables (was undocumented)', () => {
  test('disabled primary/secondary buttons reflect their themed disabled variables', async ({
    page
  }) => {
    await page.goto('/components/modal');

    await page.getByTestId('open-disabled-footer-modal').click();
    const primary = page.getByTestId('disabled-footer-primary');
    const secondary = page.getByTestId('disabled-footer-secondary');
    await expect(primary).toBeVisible();
    await expect(primary).toBeDisabled();
    await expect(secondary).toBeDisabled();

    await expect(primary).toHaveCSS('background-color', 'rgb(210, 210, 214)');
    await expect(primary).toHaveCSS('color', 'rgb(120, 120, 128)');
    await expect(secondary).toHaveCSS('opacity', '0.15');
  });
});

test.describe('PieChart — --chart-legend-* and --chart-empty-* (was undocumented)', () => {
  test('legend rows reflect the themed legend variables', async ({ page }) => {
    await page.goto('/components/pie-chart');

    const legendLabel = page.getByTestId('pie-legend-themed').locator('.legend-label').first();
    await expect(legendLabel).toBeVisible();
    await expect(legendLabel).toHaveCSS('color', 'rgb(150, 30, 30)');
    await expect(legendLabel).toHaveCSS('font-size', '15px');
  });

  test('the empty state reflects the themed empty-state variables', async ({ page }) => {
    await page.goto('/components/pie-chart');

    const empty = page.getByTestId('pie-all-zero').locator('.chart-empty');
    await expect(empty).toBeVisible();
    await expect(empty).toHaveCSS('color', 'rgb(150, 30, 30)');
    await expect(empty).toHaveCSS('padding', '60px 24px');
  });
});

test.describe('Pill — --pill-text-white-space (was undocumented)', () => {
  test('the wrap-themed pill allows its text to wrap', async ({ page }) => {
    await page.goto('/components/pill');

    const pill = page.getByTestId('pill-wrap-demo');
    await expect(pill).toBeVisible();
    const text = pill.locator('span').filter({ hasText: 'Wrapping pill text demo' }).first();
    await expect(text).toHaveCSS('white-space', 'normal');
  });
});
