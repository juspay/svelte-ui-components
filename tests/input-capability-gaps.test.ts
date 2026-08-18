import { expect, test } from '@playwright/test';

// Four capabilities Input could not express, each blocking a real consumer that was
// forced to hand-roll a native element instead. The last test in this file is the
// one that matters most: it proves the additions changed nothing for fields that
// do not opt in.
test.describe('Input — dataType passthrough, spellcheck, readonly, paste', () => {
  test('dataType renders a native time input', async ({ page }) => {
    await page.goto('/components/input');

    // Input renders <input type={dataType}>, so widening the union was the only
    // thing needed — the rendering already supported it.
    const field = page.getByTestId('input-datatype-time');
    await expect(field).toHaveAttribute('type', 'time');
    await expect(field).toHaveValue('09:30');
  });

  test('spellcheck={false} reaches the textarea', async ({ page }) => {
    await page.goto('/components/input');

    await expect(page.getByTestId('input-spellcheck-off')).toHaveAttribute('spellcheck', 'false');
  });

  test('readonly keeps the field focusable and selectable but not editable', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-readonly');
    await expect(field).toHaveAttribute('readonly', '');

    // The distinction from `disable` is the whole point: a disabled element cannot
    // take focus, which would break a select-all-to-copy affordance.
    await field.focus();
    await expect(field).toBeFocused();

    const before = await field.inputValue();
    await field.press('x');
    await expect(field).toHaveValue(before);
  });

  test('onPaste fires on a non-tel field', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-paste-textarea');
    await field.focus();

    // Previously the consumer callback was only invoked from inside the tel-specific
    // branch, so a textarea consumer could not observe a paste at all.
    await field.evaluate((node) => {
      const transfer = new DataTransfer();
      transfer.setData('text/plain', 'pasted');
      node.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true }));
    });

    await expect(page.locator('[data-pw="input-paste-count"]')).toHaveText('paste events seen: 1');
  });

  test('fields that do not opt in are unchanged', async ({ page }) => {
    await page.goto('/components/input');

    // Regression guard for every existing consumer: no spellcheck attribute is
    // emitted when the prop is not passed, and no readonly attribute either.
    const basic = page.locator('.input-container input[type="text"]').first();
    await expect(basic).not.toHaveAttribute('spellcheck', /.*/);
    await expect(basic).not.toHaveAttribute('readonly', /.*/);
    await expect(basic).toBeEditable();
  });
});
