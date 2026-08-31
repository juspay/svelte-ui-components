import { expect, test } from '@playwright/test';

test.describe('Input — leading icon colour', () => {
  test('the leading override does not recolour the trailing icon', async ({ page }) => {
    await page.goto('/components/input');

    const leftIcon = page.getByTestId('input-independent-left-icon');
    const rightIcon = page.getByTestId('input-independent-right-icon');

    await expect(leftIcon).toHaveCSS('color', 'rgb(220, 38, 38)');
    await expect(rightIcon).toHaveCSS('color', 'rgb(37, 99, 235)');
    // The SVG itself inherits `color`; its circle is the painted currentColor node.
    await expect(leftIcon.locator('circle')).toHaveCSS('fill', 'rgb(220, 38, 38)');
    await expect(rightIcon.locator('circle')).toHaveCSS('fill', 'rgb(37, 99, 235)');
  });

  test('the generic token continues to colour both icons when no leading override exists', async ({
    page
  }) => {
    await page.goto('/components/input');

    await expect(page.getByTestId('input-generic-left-icon')).toHaveCSS(
      'color',
      'rgb(37, 99, 235)'
    );
    await expect(page.getByTestId('input-generic-right-icon')).toHaveCSS(
      'color',
      'rgb(37, 99, 235)'
    );
  });
});
