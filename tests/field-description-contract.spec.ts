import { expect, test } from '@playwright/test';

/**
 * `Input` linked its messages to its field and nothing else did. Across
 * Select, Combobox, ChipInput, SplitInput, Slider, Radio, Checkbox, Toggle,
 * Choicebox, ColorPicker and FileInput there was not one `aria-describedby` and
 * not one `aria-invalid`.
 *
 * These assertions read the **accessibility tree**, not the attributes. That
 * distinction is the point of the task: `aria-describedby="x-error"` pointing at
 * an element that is not rendered satisfies any DOM assertion and resolves to
 * nothing in a real screen reader, so a test that only checks the attribute
 * would pass on exactly the bug this is meant to prevent.
 */

/** The description a real accessibility client would compute for a control. */
const describedText = async (
  page: import('@playwright/test').Page,
  testId: string
): Promise<string | null> =>
  page.getByTestId(`${testId}-box`).evaluate((el) => {
    const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (ids.length === 0) {
      return null;
    }
    const root = el.getRootNode() as Document | ShadowRoot;
    const resolved = ids.map((id) => root.getElementById(id)?.textContent?.trim() ?? null);
    // A missing id resolves to null, which is what a reader announces: nothing.
    return resolved.some((text) => text === null) ? '__DANGLING__' : resolved.join(' ');
  });

test.describe('a control is described by the text that explains it', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/checkbox');
  });

  test('error and helper text both reach the accessibility tree, in reading order', async ({
    page
  }) => {
    const described = await describedText(page, 'checkbox-described');
    expect(described).toBe('You must accept the terms to continue. We only email about outages.');
    await expect(page.getByTestId('checkbox-described-box')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  test('helper text alone describes the control without marking it invalid', async ({ page }) => {
    expect(await describedText(page, 'checkbox-info-only')).toBe('About one a month.');
    // The most common way to get this wrong: a control that always says invalid.
    await expect(page.getByTestId('checkbox-info-only-box')).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  test('a control with no message references nothing at all', async ({ page }) => {
    // Not "references an empty string" and not "references a missing id".
    expect(await describedText(page, 'checkbox-undescribed')).toBeNull();
    await expect(page.getByTestId('checkbox-undescribed-box')).not.toHaveAttribute(
      'aria-describedby',
      /.*/
    );
  });

  test('no control on the page points at an id that does not exist', async ({ page }) => {
    for (const id of ['checkbox-described', 'checkbox-info-only', 'checkbox-undescribed']) {
      expect(await describedText(page, id), `${id} has a dangling reference`).not.toBe(
        '__DANGLING__'
      );
    }
  });

  test('two controls on one page get distinct ids', async ({ page }) => {
    const ids = await page
      .locator('[data-pw="field-contract"] [role="checkbox"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-describedby')).filter(Boolean));
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  test('the error element is an alert, so it is announced when it appears', async ({ page }) => {
    await expect(page.getByTestId('checkbox-described-error-message')).toHaveAttribute(
      'role',
      'alert'
    );
  });
});
