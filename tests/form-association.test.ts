import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * Checkbox, Toggle and Select gained `name`/`value` so they participate in a
 * surrounding <form>'s native submission (FormData) instead of every consumer
 * hand-mirroring a hidden input. See docs/Checkbox.md, docs/Toggle.md and
 * docs/Select.md.
 *
 * PHASE 1 finding, preserved as a regression guard: Checkbox genuinely
 * suppressed the native `change` event before this change (proven against the
 * pre-fix code — see the task report for the failing run). The box
 * (role="checkbox") is the only element a user can reach; the real
 * `<input type="checkbox">` is aria-hidden, tabindex="-1" and
 * pointer-events: none, and its `checked` was only ever flipped by a Svelte
 * property write, which the browser does not treat as a change. Toggle's
 * input was always genuinely native and clickable, so it never had this bug —
 * proven below alongside the fix.
 */
test.describe('Checkbox — native change event', () => {
  test('clicking the visible box now dispatches a native change event that bubbles to a form', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');

    await page.evaluate(() => {
      (window as unknown as { __changeCount: number }).__changeCount = 0;
      document.addEventListener('change', () => {
        (window as unknown as { __changeCount: number }).__changeCount += 1;
      });
    });

    const checkbox = page.getByTestId('checkbox-default');
    await checkbox.click();

    const box = checkbox.getByRole('checkbox');
    await expect(box).toHaveAttribute('aria-checked', 'true');

    const changeCount = await page.evaluate(
      () => (window as unknown as { __changeCount: number }).__changeCount
    );
    expect(changeCount).toBe(1);
  });

  test('a controlled checkbox whose parent declines the click does not dispatch change', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');

    await page.evaluate(() => {
      (window as unknown as { __changeCount: number }).__changeCount = 0;
      document.addEventListener('change', () => {
        (window as unknown as { __changeCount: number }).__changeCount += 1;
      });
    });

    // checkbox-controlled-declines: the parent never flips `checked`, so the
    // native input's checkedness never actually changes.
    const checkbox = page.getByTestId('checkbox-controlled-declines');
    await checkbox.click();

    const changeCount = await page.evaluate(
      () => (window as unknown as { __changeCount: number }).__changeCount
    );
    expect(changeCount).toBe(0);
  });
});

test.describe('Toggle — native change event', () => {
  test('clicking the switch dispatches a native change event that bubbles to a form', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/toggle');

    await page.evaluate(() => {
      (window as unknown as { __changeCount: number }).__changeCount = 0;
      document.addEventListener('change', () => {
        (window as unknown as { __changeCount: number }).__changeCount += 1;
      });
    });

    const toggle = page.getByTestId('toggle-alias');
    await toggle.click();

    const changeCount = await page.evaluate(
      () => (window as unknown as { __changeCount: number }).__changeCount
    );
    expect(changeCount).toBe(1);
  });
});

/**
 * Each component's own demo page carries a "Native form submission" section:
 * a real <form> with a submit button and a readout of the resulting FormData.
 * Those sections are documentation first -- a consumer reading the Checkbox
 * demo sees exactly how `name`/`value` behave -- and this suite drives them,
 * rather than a test-only fixture route that would ship to the docs site.
 */
const submittedEntries = async (
  page: import('@playwright/test').Page,
  submitId: string,
  resultId: string
): Promise<readonly (readonly string[])[]> => {
  await page.getByTestId(submitId).click();
  const text = await page.getByTestId(resultId).innerText();
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('expected FormData entries to serialize as an array');
  }
  return parsed;
};

const hasName = (entries: readonly (readonly string[])[], name: string): boolean =>
  entries.some((entry) => Array.isArray(entry) && entry[0] === name);

test.describe('Checkbox — FormData participation', () => {
  test('an unchecked checkbox is absent from FormData; a checked one submits its value', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');
    const entries = await submittedEntries(page, 'checkbox-form-submit', 'checkbox-form-result');

    // `agree` starts unchecked -> absent entirely, not present with an empty value.
    expect(hasName(entries, 'agree')).toBe(false);
    expect(entries).toContainEqual(['subscribe', 'yes']);
  });

  test('checking a checkbox makes it appear in FormData with the native "on" default', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');
    await page.getByTestId('checkbox-form-agree').click();
    const entries = await submittedEntries(page, 'checkbox-form-submit', 'checkbox-form-result');
    expect(entries).toContainEqual(['agree', 'on']);
  });

  test('unchecking a checked checkbox removes it from FormData', async ({ page }) => {
    await gotoHydrated(page, '/components/checkbox');
    await page.getByTestId('checkbox-form-subscribe').click();
    const entries = await submittedEntries(page, 'checkbox-form-submit', 'checkbox-form-result');
    expect(hasName(entries, 'subscribe')).toBe(false);
  });
});

test.describe('Toggle — FormData participation', () => {
  test('a toggled Toggle submits under its name; an off Toggle is absent', async ({ page }) => {
    await gotoHydrated(page, '/components/toggle');

    expect(
      hasName(
        await submittedEntries(page, 'toggle-form-submit', 'toggle-form-result'),
        'notifications'
      )
    ).toBe(false);

    // Toggle's `.container` is `display: flex` and stretches to the form's full
    // width, so a click at the container's bounding-box centre can land past the
    // switch. Click the visible switch, the same target a user reaches for.
    await page.getByTestId('toggle-form-notifications').locator('label.switch').click();
    const entries = await submittedEntries(page, 'toggle-form-submit', 'toggle-form-result');
    expect(entries).toContainEqual(['notifications', 'on']);
  });
});

test.describe('Select — FormData participation', () => {
  test('single-select Select submits its one selected id under name', async ({ page }) => {
    await gotoHydrated(page, '/components/select');
    const entries = await submittedEntries(page, 'select-form-submit', 'select-form-result');
    expect(entries.filter((entry) => entry[0] === 'fruit')).toEqual([['fruit', 'apple']]);
  });

  test('multiple-select Select submits one FormData entry per selected id under the same name', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/select');
    const entries = await submittedEntries(page, 'select-form-submit', 'select-form-result');
    expect(entries.filter((entry) => entry[0] === 'colors')).toEqual([
      ['colors', 'red'],
      ['colors', 'blue']
    ]);
  });

  test('deselecting all options in multiple-select Select removes it from FormData', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/select');

    const select = page.getByTestId('select-form-multiple');
    await select.click();
    await page.getByRole('option', { name: 'Red' }).click();
    await page.getByRole('option', { name: 'Blue' }).click();
    // Escape only closes the panel while focus sits in the trigger/search/panel
    // (pre-existing Select behaviour); focus is on the just-clicked option here,
    // so close it the way handleClickOutside expects.
    await page.getByRole('heading', { name: 'Select', exact: true }).click();

    const entries = await submittedEntries(page, 'select-form-submit', 'select-form-result');
    expect(hasName(entries, 'colors')).toBe(false);
  });

  test('deselecting then reselecting an option in multiple-select Select still submits it', async ({
    page
  }) => {
    // Regression guard for the `{#each value as id (id)}` hidden inputs: a
    // key leaving and re-entering `value` must produce a correct FormData
    // entry for it, not a stale or duplicated one.
    await gotoHydrated(page, '/components/select');

    const select = page.getByTestId('select-form-multiple');
    await select.click();
    await page.getByRole('option', { name: 'Red' }).click();
    await page.getByRole('heading', { name: 'Select', exact: true }).click();

    let entries = await submittedEntries(page, 'select-form-submit', 'select-form-result');
    expect(entries.filter((entry) => entry[0] === 'colors')).toEqual([['colors', 'blue']]);

    await select.click();
    await page.getByRole('option', { name: 'Red' }).click();
    await page.getByRole('heading', { name: 'Select', exact: true }).click();

    entries = await submittedEntries(page, 'select-form-submit', 'select-form-result');
    expect(entries.filter((entry) => entry[0] === 'colors')).toEqual([
      ['colors', 'blue'],
      ['colors', 'red']
    ]);
  });
});
