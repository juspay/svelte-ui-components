import { expect, test } from '@playwright/test';

// WAI-ARIA combobox-with-listbox-popup pattern. Three real gaps were fixed alongside this
// spec: Tab escaped the dialog entirely despite aria-modal="true" (now trapped on the
// input, the only real tab stop), the menu never returned focus to whatever opened it,
// and the input carried none of the combobox role/aria-controls/aria-activedescendant
// wiring the pattern requires. Every test below exercises one of those three, plus the
// pre-existing filtering and roving-highlight behaviour.
test.describe('CommandMenu keyboard interaction (WAI-ARIA combobox pattern)', () => {
  test('opening focuses the input, and Tab/Shift+Tab stay trapped inside the dialog', async ({
    page
  }) => {
    await page.goto('/components/command-menu');

    await page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' }).click();
    const input = page.getByTestId('command-menu-demo-input');
    await expect(input).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
  });

  test('Escape closes the menu and returns focus to the button that opened it', async ({
    page
  }) => {
    await page.goto('/components/command-menu');

    const openButton = page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' });
    await openButton.click();
    await expect(page.getByTestId('command-menu-demo-input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('command-menu-demo-input')).toBeHidden();
    await expect(openButton).toBeFocused();
  });

  test('ArrowDown/ArrowUp move the highlight without wrapping past either end', async ({
    page
  }) => {
    await page.goto('/components/command-menu');
    await page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' }).click();

    const newFile = page.getByTestId('command-menu-demo-item-new-file');
    const openFile = page.getByTestId('command-menu-demo-item-open-file');
    const settings = page.getByTestId('command-menu-demo-item-settings');

    await expect(newFile).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowDown');
    await expect(openFile).toHaveAttribute('aria-selected', 'true');
    await expect(newFile).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('ArrowUp');
    await expect(newFile).toHaveAttribute('aria-selected', 'true');

    // No wraparound past the top: one more ArrowUp from the first item is a no-op.
    await page.keyboard.press('ArrowUp');
    await expect(newFile).toHaveAttribute('aria-selected', 'true');

    // Walk to the last item (New File, Open File, Save, Search, Replace, Settings)
    // and confirm no wraparound past the bottom either.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await expect(settings).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(settings).toHaveAttribute('aria-selected', 'true');
  });

  test('Enter selects the highlighted item, closes the menu, and returns focus to the opener', async ({
    page
  }) => {
    await page.goto('/components/command-menu');

    const openButton = page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' });
    await openButton.click();

    const activations: string[] = [];
    page.on('dialog', async (dialog) => {
      activations.push(dialog.message());
      await dialog.dismiss();
    });

    await page.keyboard.press('Enter');
    await expect.poll(() => activations.length).toBe(1);
    expect(activations).toEqual(['Command: New File']);
    await expect(page.getByTestId('command-menu-demo-input')).toBeHidden();
    await expect(openButton).toBeFocused();
  });

  test('the input carries the combobox contract, wired to a real listbox and a real active option', async ({
    page
  }) => {
    await page.goto('/components/command-menu');
    await page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' }).click();

    const input = page.getByTestId('command-menu-demo-input');
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');

    const controls = await input.getAttribute('aria-controls');
    expect(controls, 'the input must reference the listbox it drives').toBeTruthy();
    await expect(page.getByRole('listbox')).toHaveAttribute('id', String(controls));

    const activeDescendant = await input.getAttribute('aria-activedescendant');
    expect(activeDescendant, 'the input must point at the highlighted option').toBeTruthy();
    const activeOption = page.getByTestId('command-menu-demo-item-new-file');
    await expect(activeOption).toHaveAttribute('id', String(activeDescendant));
    await expect(activeOption).toHaveAttribute('role', 'option');
    await expect(activeOption).toHaveAttribute('aria-selected', 'true');
  });

  test('typing filters the list and resets the highlight to the first match', async ({ page }) => {
    await page.goto('/components/command-menu');
    await page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' }).click();

    const input = page.getByTestId('command-menu-demo-input');
    await input.fill('sav');

    const save = page.getByTestId('command-menu-demo-item-save');
    await expect(save).toBeVisible();
    await expect(page.getByTestId('command-menu-demo-item-new-file')).toBeHidden();
    await expect(save).toHaveAttribute('aria-selected', 'true');

    const activeDescendant = await input.getAttribute('aria-activedescendant');
    await expect(save).toHaveAttribute('id', String(activeDescendant));
  });

  test('the overlay exposes a modal dialog with an accessible name', async ({ page }) => {
    await page.goto('/components/command-menu');
    await page.getByRole('button', { name: 'Open Command Menu (Ctrl+K)' }).click();

    const dialog = page.getByRole('dialog', { name: 'Command menu' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
