import { expect, test } from '@playwright/test';

// Covers the Toolbar content-row geometry tokens (--toolbar-content-width/-height/
// -max-width/-margin): defaults must reproduce the previous rendering exactly, and
// an instance overriding them must resolve to the overridden values.
test.describe('Toolbar content-row geometry tokens', () => {
  test('defaults leave an unconfigured toolbar content row unchanged', async ({ page }) => {
    await page.goto('/components/toolbar');

    const content = page.getByTestId('toolbar-root-content');
    await expect(content).toBeVisible();

    const style = await content.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight
      };
    });

    expect(style.maxWidth).toBe('none');
    expect(style.marginLeft).toBe('0px');
    expect(style.marginRight).toBe('0px');
  });

  test('an instance can clamp and center its content row via tokens', async ({ page }) => {
    await page.goto('/components/toolbar');

    const content = page.getByTestId('toolbar-content-tokens-content');
    await expect(content).toBeVisible();

    const style = await content.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        height: computed.height,
        maxWidth: computed.maxWidth,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight
      };
    });

    expect(style.height).toBe('64px');
    expect(style.maxWidth).toBe('320px');

    // margin: 0 auto centers the row — both sides get an equal, non-zero share
    // of the leftover space once the row is narrower than its 100%-wide parent.
    expect(Number.parseFloat(style.marginLeft)).toBeGreaterThan(0);
    expect(style.marginLeft).toBe(style.marginRight);
  });
});
