import { expect, test } from '@playwright/test';

test.describe('Input — validation messages reach the accessibility tree', () => {
  // Regression guard: the error text was rendered as a plain <div class="error-message"> with
  // no id, no role and nothing tying it to the field. It was drawn on screen and completely
  // absent from the accessibility tree — a screen-reader user submitted, heard nothing, and was
  // left on a form that had not moved. Nothing visual catches this: the message looks correct.
  test('an invalid field is marked invalid and points at its message', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-announced-error');
    await expect(field).toBeVisible();

    await expect(field).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await field.getAttribute('aria-describedby');
    expect(describedBy, 'an invalid field must reference its message').toBeTruthy();

    // aria-describedby is a SPACE-SEPARATED id list, not a single id — a field can be described
    // by its error and its helper text at once. Resolve the first reference.
    const [errorId] = String(describedBy).split(/\s+/).filter(Boolean);
    await expect(page.locator(`[id="${errorId}"]`)).toHaveText('Enter a valid email address');
  });

  test('the message is a live region so it is spoken when it appears', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-announced-error');
    const describedBy = await field.getAttribute('aria-describedby');
    const [errorId] = String(describedBy).split(/\s+/).filter(Boolean);

    await expect(page.locator(`[id="${errorId}"]`)).toHaveAttribute('role', 'alert');
  });

  test('helper text is associated with the field even when it is valid', async ({ page }) => {
    await page.goto('/components/input');

    // infoMessage is guidance a screen-reader user needs BEFORE they trip an error, so it must
    // be referenced whether or not the field is currently invalid.
    const field = page.getByTestId('input-helper-only');
    const describedBy = await field.getAttribute('aria-describedby');
    expect(describedBy, 'helper text must be referenced by the field').toBeTruthy();
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Shown to your teammates.');

    // Valid field: described, but not marked invalid.
    await expect(field).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('error and helper text are both referenced, error first', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-announced-error');
    const describedBy = (await field.getAttribute('aria-describedby')) ?? '';
    const ids = describedBy.split(/\s+/).filter(Boolean);

    // Reading order matters: assistive technology announces the references in the order listed,
    // and the failure should come before the advice.
    expect(ids).toHaveLength(2);
    await expect(page.locator(`[id="${ids[0]}"]`)).toHaveText('Enter a valid email address');
    await expect(page.locator(`[id="${ids[1]}"]`)).toHaveText(
      'Use your company address, not a personal one.'
    );
  });

  test('an actionInput field in error state is not marked invalid, matching its hidden styling', async ({
    page
  }) => {
    await page.goto('/components/input');
    // actionInput hides the error border, the message and the label. If aria-invalid stayed on,
    // a screen reader would announce an error the field gives no other sign of.
    const field = page.getByTestId('input-action-error');
    await expect(field).toBeVisible();
    await expect(field).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(field).not.toHaveAttribute('aria-describedby', /.*/);
  });

  test('a valid field with no helper text is not marked invalid and describes nothing', async ({
    page
  }) => {
    await page.goto('/components/input');

    // Negative side of the contract: the attributes must be ABSENT when there is no error,
    // otherwise every field on every form announces itself as invalid.
    // /.*/ matches ANY value including the empty string, so these reject a present-but-empty
    // attribute too. Asserting `not.toHaveAttribute('aria-invalid', 'true')` would instead pass
    // on aria-invalid="false", which is a value the field must not carry at all.
    const healthy = page.getByTestId('input-datatype-time');
    await expect(healthy).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(healthy).not.toHaveAttribute('aria-describedby', /.*/);
  });
});

test.describe('ChipInput — the draft field can be named', () => {
  // ChipInput renders no visible label of its own, so before `ariaLabel` existed there was no
  // way for a caller to name it: the caption beside it read on screen and the control reached
  // the accessibility tree unnamed.
  test('ariaLabel names the draft field', async ({ page }) => {
    await page.goto('/components/chip-input');

    await expect(page.getByTestId('chip-input-tags-add')).toHaveAttribute(
      'aria-label',
      'Product tags'
    );
    await expect(page.getByLabel('Product tags')).toHaveAttribute('data-pw', 'chip-input-tags-add');
  });

  test('an unnamed ChipInput emits no empty aria-label', async ({ page }) => {
    await page.goto('/components/chip-input');

    // An empty aria-label is worse than none — it names the control the empty string, which
    // suppresses every other naming path an assistive technology would have fallen back to.
    await expect(page.getByTestId('chip-input-accent-add')).not.toHaveAttribute('aria-label', /.*/);
  });
});
