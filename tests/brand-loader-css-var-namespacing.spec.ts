import { expect, test } from '@playwright/test';

// BrandLoader's .loader element used to read --loader-width/--loader-height
// directly. Loader.svelte independently reads the exact same two variable
// names with a completely different default (20px vs 100vw/100vh) -- a
// consumer setting either name in a scope containing both components would
// silently resize both. The fix adds --brand-loader-width/--brand-loader-height
// as the namespaced, collision-free override point: var(--brand-loader-width,
// var(--loader-width, 100vw)). These specs prove all three links of that
// fallback chain with fixed pixel values, so no viewport/scrollbar-dependent
// measurement is involved.
test.describe('BrandLoader CSS variable namespacing', () => {
  test('the legacy --loader-width/--loader-height names still size the loader (backward compatibility)', async ({
    page
  }) => {
    await page.goto('/components/brand-loader');

    const loaderBox = page.getByTestId('brand-loader-legacy-demo').locator('.loader');
    const box = await loaderBox.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBe(320);
    expect(box?.height).toBe(180);
  });

  test('the namespaced --brand-loader-width/--brand-loader-height names size the loader', async ({
    page
  }) => {
    await page.goto('/components/brand-loader');

    const loaderBox = page.getByTestId('brand-loader-namespaced-demo').locator('.loader');
    const box = await loaderBox.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBe(320);
    expect(box?.height).toBe(180);
  });

  test('the namespaced variable wins when both the legacy and namespaced names are set', async ({
    page
  }) => {
    await page.goto('/components/brand-loader');

    const loaderBox = page.getByTestId('brand-loader-precedence-demo').locator('.loader');
    const box = await loaderBox.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBe(240);
    expect(box?.height).toBe(140);
  });
});
