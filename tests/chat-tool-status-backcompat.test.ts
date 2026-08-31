import { expect, test } from '@playwright/test';

test.describe('Chat tool-status backward compatibility', () => {
  test('overriding the old --chat-tool-status-* variables still themes the internal chip', async ({
    page
  }) => {
    await page.goto('/components/chat');

    const chip = page.getByTestId('chat-backcompat-demo').locator('.thinking-indicator-chip');
    await chip.scrollIntoViewIfNeeded();
    // Purely so the video recording actually samples a frame in the scrolled state --
    // the scroll itself is instant and the assertions below are near-instant too, so
    // without this the screencast can close before capturing it (verified: the DOM-level
    // scroll is correct with or without this wait, checked via getBoundingClientRect).
    await page.waitForTimeout(500);
    await expect(chip).toBeVisible();

    const backgroundColor = await chip.evaluate((el) => getComputedStyle(el).backgroundColor);
    const borderColor = await chip.evaluate((el) => getComputedStyle(el).borderColor);

    // rgb(20, 30, 200) and rgb(255, 200, 0) as set via --chat-tool-status-background/-border
    // on the demo's wrapping element -- the OLD variable names, not the chip's own.
    expect(backgroundColor).toBe('rgb(20, 30, 200)');
    expect(borderColor).toBe('rgb(255, 200, 0)');
  });
});
