import { expect, test } from '@playwright/test';

// Issue #522: Toolbar's built-in back control was callback-only (onbackclick),
// with no way to make it a real link. Consumers who needed href-based back navigation had to
// replace the whole control via `leftContent` just to get an `<a href>`, losing the library's
// own back-button markup, tokens and accessible-name handling in the process. `backHref` closes
// that gap by rendering the built-in control as a real anchor when set.
test.describe('Toolbar backHref', () => {
  test('an unconfigured toolbar keeps rendering the back control as a <button>, not a link', async ({
    page
  }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-root').locator('.back');
    expect(await back.evaluate((element) => element.tagName.toLowerCase())).toBe('button');
    expect(await back.getAttribute('href')).toBeNull();
  });

  test('backHref renders the back control as a real <a> carrying the given href', async ({
    page
  }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-back-href').locator('.back');
    expect(await back.evaluate((element) => element.tagName.toLowerCase())).toBe('a');
    await expect(back).toHaveAttribute('href', '#toolbar-back-href-demo');
    // The accessible name and icon contract are unchanged by the tag swap.
    await expect(back).toHaveAttribute('aria-label', 'Back');
    await expect(back.locator('svg')).toHaveCount(1);
  });

  test('onbackclick still fires as the anchor click handler when backHref is set', async ({
    page
  }) => {
    await page.goto('/components/toolbar');

    const clicks = page.getByTestId('toolbar-back-href-clicks');
    await expect(clicks).toHaveText('0');

    await page.getByTestId('toolbar-back-href').locator('.back').click();

    await expect(clicks).toHaveText('1');
  });

  test('the anchor activates from the keyboard like the default button did', async ({ page }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-back-href').locator('.back');
    await back.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('toolbar-back-href-clicks')).toHaveText('1');
  });

  test('Space also activates the anchor, which a native <a> would not do on its own', async ({
    page
  }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-back-href').locator('.back');
    await back.focus();
    await page.keyboard.press('Space');

    await expect(page.getByTestId('toolbar-back-href-clicks')).toHaveText('1');
  });

  test('leftContent still takes precedence over backHref, same as it does over the default button', async ({
    page
  }) => {
    await page.goto('/components/toolbar');

    const root = page.getByTestId('toolbar-left-content-precedence');
    await expect(root.getByTestId('toolbar-left-content-marker')).toBeVisible();
    await expect(root.locator('.back')).toHaveCount(0);
  });
});
