import { expect, test } from '@playwright/test';

test.describe('Select — leftIcon inlines SVG so currentColor themes it', () => {
  // An <img> renders its source as an isolated document: currentColor inside it
  // resolves against that document's own root, not against the trigger, so it
  // paints UA black regardless of the surrounding theme. Inlining the SVG into
  // the component's own DOM is what lets the icon inherit the trigger's colour.
  //
  // The non-SVG case needs no test here: Img only inlines when isSvgSource()
  // matches a .svg path or a data:image/svg+xml URI, and falls back to <img> if
  // the fetched markup fails to parse. Both predate this change.
  test('renders the leading icon as an inline <svg> that inherits the trigger colour', async ({
    page
  }) => {
    await page.goto('/components/select');

    const icon = page.getByTestId('select-left-icon');
    await expect(icon).toBeVisible();

    // The element itself is an <svg>, not an <img>.
    await expect
      .poll(async () => icon.evaluate((element) => element.tagName.toLowerCase()))
      .toBe('svg');

    // The fetched markup was parsed into that host, not left empty.
    await expect.poll(async () => icon.locator('circle').count()).toBeGreaterThan(0);

    // currentColor resolved against the trigger, so the stroke matches the
    // trigger's computed text colour rather than the UA default black.
    const triggerColor = await icon.evaluate((element) => {
      const trigger = element.closest('.select-trigger') ?? element.parentElement;
      return trigger === null ? '' : getComputedStyle(trigger).color;
    });
    const strokeColor = await icon
      .locator('circle')
      .first()
      .evaluate((element) => getComputedStyle(element).stroke);

    // The demo row sets an explicit colour, so "inherited the trigger's colour"
    // and "fell back to the UA default" are distinguishable — without that, both
    // would read as black and the assertion could not fail.
    expect(triggerColor).toBe('rgb(37, 99, 235)');
    expect(strokeColor).toBe(triggerColor);
  });
});
