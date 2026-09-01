import { expect, test } from '@playwright/test';

// Toolbar gained no props for the page-header shape — only CSS variables. The component's
// documented position is that presentational structure belongs in a Snippet, so a title with
// a subheading is the consumer's own markup passed through centerContent. These tests pin
// both halves of that contract: the defaults are untouched, and the tokens do the work.
test.describe('Toolbar page-header shape', () => {
  test('an unconfigured toolbar is untouched by any of this', async ({ page }) => {
    await page.goto('/components/toolbar');

    const root = page.getByTestId('toolbar-root');
    await expect(root).toBeVisible();

    // The title is still a div carrying the library's own type.
    const heading = page.getByTestId('toolbar-heading');
    expect(await heading.evaluate((element) => element.tagName.toLowerCase())).toBe('div');
    await expect(heading).toHaveCSS('font-size', '18px');
    await expect(heading).toHaveCSS('font-weight', '400');

    // The back control is a real button carrying an inline icon: no image, no network request,
    // and an accessible name of its own.
    const back = root.locator('.back');
    expect(await back.evaluate((element) => element.tagName.toLowerCase())).toBe('button');
    await expect(back).toHaveAttribute('aria-label', 'Back');
    await expect(back.locator('svg')).toHaveCount(1);
    await expect(back.locator('img')).toHaveCount(0);
    expect(await back.locator('svg path').getAttribute('stroke')).toBe('currentColor');

    // Every new declaration resolves to the value the row already rendered.
    const content = root.locator('.content');
    await expect(content).toHaveCSS('align-items', 'center');
    await expect(content).toHaveCSS('flex-wrap', 'nowrap');
    await expect(content).toHaveCSS('row-gap', '0px');
    await expect(content).toHaveCSS('column-gap', '0px');
    await expect(content).toHaveCSS('min-height', 'auto');
  });

  test('backIcon={null} still renders no icon', async ({ page }) => {
    await page.goto('/components/toolbar');

    const root = page.getByTestId('toolbar-no-back-icon');
    await expect(root).toBeVisible();
    await expect(root.locator('.back')).toHaveCount(0);
  });

  test('a consumer-supplied backIcon still renders as an image', async ({ page }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-custom-back-icon').locator('.back');
    await expect(back.locator('img')).toHaveCount(1);
    await expect(back.locator('svg')).toHaveCount(0);
    // Decorative: the button's aria-label is the name, so the image carries none.
    await expect(back.locator('img')).toHaveAttribute('alt', '');
  });

  test('an empty backLabel falls back to the default accessible name', async ({ page }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-empty-back-label').locator('.back');
    await expect(back).toHaveAttribute('aria-label', 'Back');
  });

  test('the button occupies the same box the div did', async ({ page }) => {
    await page.goto('/components/toolbar');

    // 20px content + 14px/20px padding per side, content-box: 48 wide, 60 tall — the div's box.
    const box = await page.getByTestId('toolbar-root').locator('.back').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.width)).toBe(48);
    expect(Math.round(box!.height)).toBe(60);
  });

  test('the back button activates from the keyboard', async ({ page }) => {
    await page.goto('/components/toolbar');

    const back = page.getByTestId('toolbar-root').locator('.back');
    const activations: string[] = [];
    page.on('dialog', async (dialog) => {
      activations.push(dialog.message());
      await dialog.dismiss();
    });

    await back.focus();
    await expect(back).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect.poll(() => activations.length).toBe(2);
    expect(activations).toEqual(['Back clicked', 'Back clicked']);
  });

  test('tokens turn the fixed bar into an in-flow page header', async ({ page }) => {
    await page.goto('/components/toolbar');

    const header = page.getByTestId('toolbar-page-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS('position', 'relative');
    await expect(header).toHaveCSS('box-shadow', 'none');

    // Top-aligned row, so the back control lands on the title's first line.
    await expect(header.locator('.content')).toHaveCSS('align-items', 'flex-start');

    const [backBox, titleBox] = await Promise.all([
      header.locator('.back').boundingBox(),
      page.getByTestId('toolbar-page-header-heading').boundingBox()
    ]);
    expect(backBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    // The back control's centre sits within the title's own line box, not below it.
    const backCentre = backBox!.y + backBox!.height / 2;
    expect(backCentre).toBeGreaterThan(titleBox!.y - 4);
    expect(backCentre).toBeLessThan(titleBox!.y + titleBox!.height + 4);
  });

  test('the title block keeps the consumer tags, classes and type scale', async ({ page }) => {
    await page.goto('/components/toolbar');

    // Semantic tags the library never sees, because the markup is the consumer's.
    const heading = page.getByTestId('toolbar-page-header-heading');
    const subheading = page.getByTestId('toolbar-page-header-subheading');
    expect(await heading.evaluate((element) => element.tagName.toLowerCase())).toBe('h2');
    expect(await subheading.evaluate((element) => element.tagName.toLowerCase())).toBe('p');

    // Styled by the page's own scoped CSS — no headingClasses prop, no typography variable.
    await expect(heading).toHaveCSS('font-size', '22px');
    await expect(subheading).toHaveCSS('font-size', '13px');

    // Stacked, not side by side.
    const [titleBox, subBox] = await Promise.all([heading.boundingBox(), subheading.boundingBox()]);
    expect(subBox!.y).toBeGreaterThan(titleBox!.y);
  });

  test('the action region absorbs no shrink while the title ellipsizes', async ({ page }) => {
    await page.goto('/components/toolbar');

    const right = page.getByTestId('toolbar-page-header').locator('.right-content');
    await expect(right).toHaveCSS('flex-shrink', '0');

    // The title is the side that yields: it is allowed below its content width.
    const centre = page.getByTestId('toolbar-page-header').locator('.center-content');
    await expect(centre).toHaveCSS('min-width', '0px');
  });
});
