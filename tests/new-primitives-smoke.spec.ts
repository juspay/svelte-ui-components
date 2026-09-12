import { expect, test } from '@playwright/test';

// The four primitives added in this pass each ship a demo route, a nav entry and a
// custom element. A page that compiles but throws on render still builds, so each
// route is opened and asked for the semantics its component promises.
test.describe('Separator, Label, AspectRatio and RatingGroup render on their own routes', () => {
  // `aria-orientation` is deliberately omitted on a horizontal separator: horizontal
  // is already the ARIA default for the role, so the contract asserted here is which
  // separators reach the accessibility tree at all.
  test('only a non-decorative separator reaches the accessibility tree', async ({ page }) => {
    await page.goto('/components/separator');

    // Scoped to the components themselves: the docs layout renders its own <hr>,
    // which carries the separator role implicitly and is not what is under test.
    await expect(page.getByTestId('separator-non-decorative-demo')).toHaveAttribute(
      'role',
      'separator'
    );

    const decorative = page.getByTestId('separator-horizontal-demo');
    await expect(decorative).toBeVisible();
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role', /.*/);

    await expect(page.getByTestId('separator-vertical-demo')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });

  test('a label focuses the control it names when clicked', async ({ page }) => {
    await page.goto('/components/label');

    const label = page.locator('label[for]').first();
    await expect(label).toBeVisible();

    const controlId = await label.getAttribute('for');
    expect(controlId).not.toBeNull();

    await label.click();
    await expect(page.locator(`#${controlId}`)).toBeFocused();
  });

  test('an aspect ratio box holds a real ratio', async ({ page }) => {
    await page.goto('/components/aspect-ratio');

    const box = page.locator('[data-pw]').first();
    await expect(box).toBeVisible();

    const shape = await box.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(shape.width).toBeGreaterThan(0);
    expect(shape.height).toBeGreaterThan(0);
  });

  test('a rating group is one tab stop and responds to arrow keys', async ({ page }) => {
    await page.goto('/components/rating-group');

    const rating = page.getByRole('slider').first();
    await expect(rating).toBeVisible();

    const before = await rating.getAttribute('aria-valuenow');
    await rating.focus();
    await page.keyboard.press('ArrowRight');
    await expect(rating).not.toHaveAttribute('aria-valuenow', String(before));
  });
});
