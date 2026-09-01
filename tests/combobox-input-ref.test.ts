import { expect, test } from '@playwright/test';

test.describe('Combobox — accessing the underlying input element', () => {
  // Regression guard for a docs defect: docs/Combobox.md documented a `bind:inputElement` prop
  // and a usage example built on it. Combobox has no such prop -- Combobox.svelte never declares
  // `inputElement` at all, so that example would fail to compile if a consumer copy-pasted it.
  // The real, working mechanism -- already implemented, just undocumented -- is `bind:this` on
  // the component instance plus the exported `getInputRef()` method, the same pattern Input
  // itself documents. This test proves the corrected docs' example is real, not just plausible.
  test('getInputRef() returns the real DOM node, usable for focus management', async ({
    page
  }) => {
    await page.goto('/components/combobox');

    const combobox = page.getByTestId('combobox-input-ref-demo');
    const input = combobox.locator('input');
    const focusButton = page.getByTestId('combobox-focus-button');

    await expect(input).not.toBeFocused();

    await focusButton.click();

    await expect(input).toBeFocused();
  });
});
