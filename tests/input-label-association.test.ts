import { expect, test } from '@playwright/test';

test.describe('Input — the <label> actually names the field', () => {
  // Regression guard: the label was emitted as <label for={name}> while the
  // field carried only name={name} and never an id. `for` resolves against an
  // id, never a name, so the association could not complete for ANY caller, no
  // matter what they passed. Every such field read as unlabelled to assistive
  // tech and was unreachable via getByLabel.
  //
  // Note on locators: testId lands on the <input>/<textarea> itself (data-pw),
  // not on a wrapper — so getByTestId here IS the field.
  test('a field with label + name is reachable by its visible label text', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-datatype-time');
    await expect(field).toBeVisible();

    const id = await field.getAttribute('id');
    expect(id, 'the field must carry an id for a label to reference').toBeTruthy();

    // The label must point at that exact id.
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toHaveText('Schedule time');

    // And the accessible-name path must resolve — this is what assistive tech,
    // and getByLabel, actually follow.
    await expect(page.getByLabel('Schedule time')).toHaveAttribute(
      'data-pw',
      'input-datatype-time'
    );
  });

  test('clicking the label focuses the field it names', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-datatype-time');
    const id = await field.getAttribute('id');
    await page.locator(`label[for="${id}"]`).click();

    // Label activation only moves focus when for/id genuinely resolves.
    await expect(field).toBeFocused();
  });
});
