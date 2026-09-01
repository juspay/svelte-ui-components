import { expect, test } from '@playwright/test';

// Regression coverage for documentation fixes in this batch: props/CSS vars that existed
// in code but were undocumented are only worth documenting if they're real -- these tests
// prove the newly-documented behaviors actually work as described, not just that a doc
// table grew a row.

test.describe('Accordion — disabled trigger (previously undocumented)', () => {
  test('a disabled trigger cannot be toggled by click, leaves the tab order, and is marked aria-disabled', async ({
    page
  }) => {
    await page.goto('/components/accordion');

    const content = page.getByTestId('accordion-disabled');
    // The page has several built-in triggers; pick the one wrapping this demo's label rather
    // than matching on the `disabled` class, which would make the class assertion below vacuous.
    const trigger = page.locator('.accordion-trigger', {
      has: page.getByTestId('accordion-disabled-trigger-label')
    });

    await expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await expect(trigger).toHaveAttribute('tabindex', '-1');
    await expect(trigger).toHaveClass(/disabled/);
    await expect(content).not.toHaveClass(/expanded/);

    await trigger.click({ force: true });
    // Still collapsed -- the click must not have toggled `expand`.
    await expect(content).not.toHaveClass(/expanded/);
    await expect(page.getByTestId('accordion-disabled-trigger-label')).toHaveText('Expand');
  });
});
