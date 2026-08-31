import { expect, test } from '@playwright/test';

// Covers GAP L20: per-chip test ids (so a migrated app's specs keep a working locator per chip,
// per delete control, and for the add/draft field) and opt-in in-place editing (activate a chip,
// Enter commits, Escape cancels, delete stays available throughout).
//
// Per-chip ids are derived through Pill's own `testId` prop, which Pill itself always suffixes
// with "-dismiss" for its built-in dismiss button (see src/lib/Pill/Pill.svelte). ChipInput passes
// `${testId}-item-${index}` as that base, so:
//   - the chip itself:      `${testId}-item-${index}`        (exact match for the app's spec shape)
//   - its dismiss control:  `${testId}-item-${index}-dismiss` (Pill's fixed suffix -- the closest
//                            reachable id to the app's `${testId}-delete-${index}` shape without
//                            editing Pill, which is out of scope for this component)
//   - the draft/add field:  `${testId}-add`                   (exact match)
test.describe('ChipInput — per-chip test ids', () => {
  test('every chip, its delete control, and the add field carry a derived id', async ({ page }) => {
    await page.goto('/components/chip-input');

    // "Product tags" demo: values = ['sale', 'featured'], editable not set.
    const chipZero = page.getByTestId('chip-input-tags-item-0');
    const chipOne = page.getByTestId('chip-input-tags-item-1');
    await expect(chipZero).toBeVisible();
    await expect(chipZero).toContainText('sale');
    await expect(chipOne).toBeVisible();
    await expect(chipOne).toContainText('featured');

    await expect(page.getByTestId('chip-input-tags-item-0-dismiss')).toBeVisible();
    await expect(page.getByTestId('chip-input-tags-item-1-dismiss')).toBeVisible();

    await expect(page.getByTestId('chip-input-tags-add')).toBeVisible();
  });

  test('deleting a chip by its derived id removes only that value', async ({ page }) => {
    await page.goto('/components/chip-input');

    await page.getByTestId('chip-input-tags-item-0-dismiss').click();

    await expect(page.getByTestId('chip-input-tags-item-0')).toContainText('featured');
    await expect(page.getByTestId('chip-input-tags-item-1')).toHaveCount(0);
    await expect(page.locator('.demo-row', { hasText: 'Product tags' })).toContainText(
      'Values: featured'
    );
  });
});

test.describe('ChipInput — editable (opt-in in-place editing)', () => {
  test('default: clicking a chip does nothing when `editable` is not set', async ({ page }) => {
    await page.goto('/components/chip-input');

    const chip = page.getByTestId('chip-input-tags-item-0');
    await expect(chip).toContainText('sale');

    await chip.click();

    // No edit field appeared, and the chip is unchanged -- delete remains the only affordance.
    await expect(page.getByTestId('chip-input-tags-item-0-edit')).toHaveCount(0);
    await expect(chip).toContainText('sale');
    await expect(page.getByTestId('chip-input-tags-item-0-dismiss')).toBeVisible();
  });

  test('Enter commits an edit back into values and fires onedit', async ({ page }) => {
    await page.goto('/components/chip-input');

    const chip = page.getByTestId('chip-input-editable-item-0');
    await expect(chip).toContainText('sale');
    await chip.click();

    const editField = page.getByTestId('chip-input-editable-item-0-edit');
    await expect(editField).toBeVisible();
    await expect(editField).toHaveValue('sale');

    await editField.fill('clearance-sale');
    await editField.press('Enter');

    // The edit field is gone, the chip re-renders as a Pill with the new text at the same slot.
    await expect(editField).toHaveCount(0);
    await expect(page.getByTestId('chip-input-editable-item-0')).toContainText('clearance-sale');
    await expect(page.getByTestId('chip-input-editable-log')).toContainText(
      'sale → clearance-sale'
    );
  });

  test('blurring the edit field also commits', async ({ page }) => {
    await page.goto('/components/chip-input');

    const chip = page.getByTestId('chip-input-editable-item-1');
    await expect(chip).toContainText('featured');
    await chip.click();

    const editField = page.getByTestId('chip-input-editable-item-1-edit');
    await editField.fill('best-seller');
    await editField.blur();

    await expect(editField).toHaveCount(0);
    await expect(page.getByTestId('chip-input-editable-item-1')).toContainText('best-seller');
    await expect(page.getByTestId('chip-input-editable-log')).toContainText(
      'featured → best-seller'
    );
  });

  test('Escape cancels and restores the original value without firing onedit', async ({ page }) => {
    await page.goto('/components/chip-input');

    const chip = page.getByTestId('chip-input-editable-item-2');
    await expect(chip).toContainText('clearance');
    await chip.click();

    const editField = page.getByTestId('chip-input-editable-item-2-edit');
    await editField.fill('typo-value');
    await editField.press('Escape');

    // Reverted, not committed: the original chip text is back and no edit was logged for it.
    await expect(editField).toHaveCount(0);
    await expect(page.getByTestId('chip-input-editable-item-2')).toContainText('clearance');
    await expect(page.getByTestId('chip-input-editable-log')).not.toContainText('typo-value');
  });

  test('the delete control still works while `editable` is on, on a chip not being edited', async ({
    page
  }) => {
    await page.goto('/components/chip-input');

    // Demo state is `sale, featured, clearance` (see +page.svelte); index 2 is the LAST chip, so
    // dismissing it collapses the list to two entries rather than shifting another value into
    // slot 2 -- assert the slot is gone outright, not that it merely stopped containing the old
    // text (a zero-match locator makes `not.toContainText` fail with "element(s) not found").
    await expect(page.getByTestId('chip-input-editable-item-2')).toContainText('clearance');

    await page.getByTestId('chip-input-editable-item-2-dismiss').click();

    await expect(page.getByTestId('chip-input-editable-item-2')).toHaveCount(0);
    // The two chips that weren't touched keep their text, and delete didn't open an edit field.
    await expect(page.getByTestId('chip-input-editable-item-0')).toContainText('sale');
    await expect(page.getByTestId('chip-input-editable-item-1')).toContainText('featured');
    await expect(page.getByTestId('chip-input-editable-item-0-edit')).toHaveCount(0);
    await expect(page.getByTestId('chip-input-editable-item-1-edit')).toHaveCount(0);
  });
});
