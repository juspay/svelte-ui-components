import { expect, test } from '@playwright/test';

// Covers the Status `statusTextTag` prop: statusText can render as a real
// heading (h1..h6) instead of the default div, so an app whose design system
// wires typography to semantic tags can size/colour it and it joins the
// document outline — while an existing consumer that never passes the prop
// keeps rendering a plain div, unchanged.
test.describe('Status statusTextTag', () => {
  test('defaults to a div when statusTextTag is not provided', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-default-icon');
    const statusText = host.locator('.status-text');
    await expect(statusText).toBeVisible();

    const tagName = await statusText.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('div');
  });

  test('renders as the requested heading tag when statusTextTag is set', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-heading-tag');
    const statusText = host.locator('.status-text');
    await expect(statusText).toBeVisible();
    await expect(statusText).toHaveText('Order Confirmed');

    const tagName = await statusText.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('h2');
  });
});
