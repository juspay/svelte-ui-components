import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// maxLength defaults to 1000 and was rendered unconditionally, so migrating an unbounded
// native textarea onto Input silently capped it at 1000 characters.
test.describe('Input — maxLength={null}', () => {
  test('omits the native maxlength attribute entirely', async ({ page }) => {
    await gotoHydrated(page, '/components/input');

    await expect(page.getByTestId('input-unbounded')).not.toHaveAttribute('maxlength', /.*/);
  });

  test('accepts input past the former 1000-character default', async ({ page }) => {
    await gotoHydrated(page, '/components/input');

    const field = page.getByTestId('input-unbounded');
    await field.fill('x'.repeat(1200));
    await expect(field).toHaveJSProperty('value', 'x'.repeat(1200));
  });

  test('fields that leave maxLength alone still cap at 1000', async ({ page }) => {
    await gotoHydrated(page, '/components/input');

    // Regression guard: null must be opt-in, never the new default.
    await expect(page.getByTestId('input-paste-textarea')).toHaveAttribute('maxlength', '1000');
  });
});
