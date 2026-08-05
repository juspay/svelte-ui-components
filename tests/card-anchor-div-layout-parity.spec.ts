import { expect, test } from '@playwright/test';

// The anchor-rendering PR swaps Card's root between <div> and <a> via
// svelte:element, but .card had no explicit `display`, so its layout
// depended on each tag's browser default: block for <div>, inline for <a>.
// An inline box ignores width/height/min-width/max-width/margin entirely,
// so --card-width/--card-height silently stopped applying to anchor-mode
// cards, and the anchor also picked up the browser's default underline.
// The fix pins `display: block` and `text-decoration: none` explicitly on
// .card so both render paths compute the same box regardless of tag.
//
// These specs assert that directly against the "Anchor / Div Layout
// Parity" demo section: two cards with identical sizing overrides and
// identical content, one div-rendered and one anchor-rendered (href set),
// must produce pixel-identical bounding boxes.
test.describe('Card anchor/div layout parity', () => {
  test('an anchor-rendered card has the same bounding box as an identical div-rendered card', async ({
    page
  }) => {
    await page.goto('/components/card');
    const divBox = await page.getByTestId('parity-div-card').boundingBox();
    const anchorBox = await page.getByTestId('parity-anchor-card').boundingBox();

    expect(divBox).not.toBeNull();
    expect(anchorBox).not.toBeNull();
    expect(anchorBox?.width).toBe(divBox?.width);
    expect(anchorBox?.height).toBe(divBox?.height);
  });

  test('the anchor-rendered card computes display:block, not the browser default inline', async ({
    page
  }) => {
    await page.goto('/components/card');
    const display = await page
      .getByTestId('parity-anchor-card')
      .evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('block');
  });

  test('the anchor-rendered card has no underline (text-decoration reset)', async ({ page }) => {
    await page.goto('/components/card');
    const textDecorationLine = await page
      .getByTestId('parity-anchor-card')
      .evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(textDecorationLine).toBe('none');
  });
});
