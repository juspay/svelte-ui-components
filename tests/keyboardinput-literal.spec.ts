import { expect, test } from '@playwright/test';

// Covers #527: KeyboardInput's KEY_SYMBOLS table substitutes 'space' -> ␣
// and 'tab' -> ⇥ unconditionally, with no way to render the word itself.
// TARA (a real consumer, migrating onto this library) hand-rolled a plain
// <kbd>/<span> for a "Hold SPACE" caption specifically to avoid that
// substitution mid-sentence. `literal` closes the gap: when true, every key
// renders exactly as given and the KEY_SYMBOLS lookup is bypassed entirely.
test.describe('KeyboardInput literal opt-out', () => {
  test('default behaviour substitutes recognised key names with their glyph', async ({ page }) => {
    await page.goto('/components/keyboard-input');

    // Regression guard: today's substituting behaviour is unchanged when
    // `literal` is not passed at all.
    const substituted = page.getByTestId('keyboard-input-substituted-space');
    await expect(substituted.locator('.key')).toHaveText('␣');
    await expect(substituted.locator('.key')).not.toHaveText('Space');
  });

  test('literal renders the word itself instead of the substituted glyph', async ({ page }) => {
    await page.goto('/components/keyboard-input');

    const literalSpace = page.getByTestId('keyboard-input-literal-space');
    await expect(literalSpace.locator('.key')).toHaveText('Space');
    await expect(literalSpace.locator('.key')).not.toHaveText('␣');

    const literalTab = page.getByTestId('keyboard-input-literal-tab');
    await expect(literalTab.locator('.key')).toHaveText('Tab');
    await expect(literalTab.locator('.key')).not.toHaveText('⇥');
  });
});
