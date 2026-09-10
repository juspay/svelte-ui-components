import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Closes #414 items 2-4. The Breeze DS dropdown sheet specs an error state
// (red border + hint), a trigger clear button that resets the selection
// without opening the menu, and a pressed tint on the trigger and options.
// Select had none of the three. Item 1 (sizes) was closed separately as a
// documented class recipe, since the variables were already themeable.
test.describe('Select — error state (#414 item 2)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/select');
  });

  test('renders the error border on the trigger', async ({ page }) => {
    const trigger = page.getByTestId('select-invalid').locator('.select-trigger');
    await expect(trigger).toHaveCSS('border-color', 'rgb(220, 38, 38)');
  });

  test('keeps the error border while the field is focused', async ({ page }) => {
    // The failure this guards: focus styling overriding the error colour, so
    // the field stops reading as invalid exactly when the user is in it.
    const trigger = page.getByTestId('select-invalid-plain').locator('.select-trigger');

    await trigger.focus();

    await expect(trigger).toHaveCSS('border-color', 'rgb(220, 38, 38)');
  });

  test('announces the message through an alert region', async ({ page }) => {
    const message = page.getByTestId('select-invalid-error-message');
    await expect(message).toHaveText('Pick a fruit to continue');
    await expect(message).toHaveRole('alert');
  });

  test('wires the message to the combobox with aria-describedby', async ({ page }) => {
    // Without this the message is visible but unannounced -- present for a
    // sighted user and absent for a screen-reader one.
    const trigger = page.getByTestId('select-invalid').locator('.select-trigger');
    const describedBy = await trigger.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();

    const message = page.getByTestId('select-invalid-error-message');
    await expect(message).toHaveAttribute('id', String(describedBy));
  });

  test('marks the combobox aria-invalid', async ({ page }) => {
    const trigger = page.getByTestId('select-invalid').locator('.select-trigger');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
  });

  test('renders no message region when only error is set', async ({ page }) => {
    const trigger = page.getByTestId('select-invalid-plain').locator('.select-trigger');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('select-invalid-plain-error-message')).toHaveCount(0);
  });

  test('a select with no error prop keeps its normal border', async ({ page }) => {
    // Back-compat: passes before the change and must keep passing.
    const trigger = page.getByTestId('select-clearable').locator('.select-trigger');
    await expect(trigger).not.toHaveCSS('border-color', 'rgb(220, 38, 38)');
    await expect(trigger).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Select — trigger clear button (#414 item 3)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/select');
  });

  test('clears the selection', async ({ page }) => {
    const select = page.getByTestId('select-clearable');
    await expect(select.locator('.select-value')).toHaveText('Apple');

    await page.getByTestId('select-clearable-clear').click();

    await expect(select.locator('.select-placeholder')).toBeVisible();
  });

  test('does NOT open the menu', async ({ page }) => {
    // The entire point of a trigger-level clear. The click lands on a child of
    // the trigger, whose own handler toggles the menu, so without an explicit
    // stopPropagation this clears and then immediately opens.
    const select = page.getByTestId('select-clearable');

    await page.getByTestId('select-clearable-clear').click();

    await expect(select.locator('.select-dropdown')).toHaveCount(0);
  });

  for (const key of ['Enter', 'Space']) {
    test(`keyboard ${key} clears without opening the menu`, async ({ page }) => {
      const select = page.getByTestId('select-clearable');
      await page.getByTestId('select-clearable-clear').focus();
      await page.keyboard.press(key);
      await expect(select.locator('.select-placeholder')).toBeVisible();
      await expect(select.locator('.select-dropdown')).toHaveCount(0);
    });
  }

  test('keeps the clear button outside the combobox role', async ({ page }) => {
    const clear = page.getByTestId('select-clearable-clear');
    expect(await clear.evaluate((el) => el.closest('[role="combobox"]') === null)).toBe(true);
  });

  test('returns keyboard focus to the trigger after clearing', async ({ page }) => {
    await page.getByTestId('select-clearable-clear').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('select-clearable').locator('.select-trigger')).toBeFocused();
  });

  test('supports an explicit focus outline token on clear', async ({ page }) => {
    const clear = page.getByTestId('select-clearable-clear');
    await clear.evaluate((el) =>
      el.style.setProperty('--select-clear-focus-outline', '3px solid rgb(10, 20, 30)')
    );
    await clear.focus();
    await expect(clear).toHaveCSS('outline-width', '3px');
  });

  test('fires onclear', async ({ page }) => {
    await page.getByTestId('select-clearable-clear').click();
    await expect(page.getByTestId('select-clear-count')).toHaveText('clears: 1');
  });

  test('disappears once the selection is empty', async ({ page }) => {
    await page.getByTestId('select-clearable-clear').click();
    await expect(page.getByTestId('select-clearable-clear')).toHaveCount(0);
  });

  test('is absent when nothing is selected to begin with', async ({ page }) => {
    await expect(page.getByTestId('select-clearable-empty-clear')).toHaveCount(0);
  });

  test('carries an accessible name', async ({ page }) => {
    const clear = page.getByTestId('select-clearable-clear');
    await expect(clear).toHaveRole('button');
    await expect(clear).toHaveAccessibleName('Clear selection');
  });

  test('is absent on a select that did not ask for it', async ({ page }) => {
    // Back-compat: clearable is opt-in.
    await expect(page.getByTestId('select-invalid-clear')).toHaveCount(0);
  });
});

test.describe('Select — pressed state (#414 item 4)', () => {
  // hover() rather than mouse.move(boundingBox centre) throughout: boundingBox
  // coordinates are not viewport coordinates, so once a demo page grows tall
  // enough to push a fixture below the fold, a raw move presses outside the
  // viewport and silently hits nothing. That failure reads as a CSS bug, which
  // is how it wasted time once already. hover() scrolls into view first, so
  // these stay correct no matter where the fixture sits on the page.
  test('the trigger tints while the pointer is down', async ({ page }) => {
    await gotoHydrated(page, '/components/select');
    const trigger = page.getByTestId('select-clearable').locator('.select-trigger');

    await trigger.hover();
    await page.mouse.down();

    expect(await trigger.evaluate((el) => el.matches(':active'))).toBe(true);
    await expect(trigger).toHaveCSS('background-color', 'rgb(237, 237, 237)');
    await page.mouse.up();
  });

  test('the trigger returns to its normal background on release', async ({ page }) => {
    await gotoHydrated(page, '/components/select');
    const trigger = page.getByTestId('select-clearable').locator('.select-trigger');

    await trigger.hover();
    await page.mouse.down();
    await page.mouse.up();

    await expect(trigger).not.toHaveCSS('background-color', 'rgb(237, 237, 237)');
  });

  test('an option tints while the pointer is down', async ({ page }) => {
    await gotoHydrated(page, '/components/select');
    const select = page.getByTestId('select-clearable');

    await select.locator('.select-trigger').click();
    const option = select.locator('.select-option').first();
    await expect(option).toBeVisible();

    // hover() rather than mouse.move(boundingBox centre): this option sits
    // below the fold, and boundingBox coordinates are not viewport
    // coordinates, so a raw move presses outside the viewport and lands on
    // nothing. hover() scrolls it into view first.
    await option.hover();
    await page.mouse.down();

    // Assert the press actually landed before reading the colour: a press
    // that missed and a colour that is wrong are different bugs, and without
    // this the test cannot tell them apart -- which is exactly how the
    // off-viewport miss above first read as a CSS failure.
    expect(await option.evaluate((el) => el.matches(':active'))).toBe(true);
    // This first option is both hovered AND selected at the moment it is
    // pressed, so the assertion proves the pressed rule outranks the hover and
    // selected rules rather than losing to either. A press on an already-
    // selected row still has to confirm the tap landed.
    await expect(option).toHaveCSS('background-color', 'rgb(237, 237, 237)');
    await page.mouse.up();
  });
});
