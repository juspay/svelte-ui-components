import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

test.beforeEach(async ({ page }) => {
  await page.goto(`${fixtureBaseURL}/form-association/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
});

test('the fixture route is absent from the published docs app', async ({ request }) => {
  // The request fixture retains the docs baseURL; only page navigation above
  // uses the separate fixture server. A fixture leaked into build/ fails here.
  const response = await request.get('/form-association/');
  expect(response.status()).toBe(404);
});

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
    const checkbox = page.getByTestId('fa-agree');
    await checkbox.click();

    const box = checkbox.getByRole('checkbox');
    await expect(box).toHaveAttribute('aria-checked', 'true');

    await expect(page.getByTestId('fa-changes')).toHaveText('1');
  });

  test('a controlled checkbox whose parent declines the click does not dispatch change', async ({
    page
  }) => {
    // fa-declined: the parent never flips `checked`, so the
    // native input's checkedness never actually changes.
    const checkbox = page.getByTestId('fa-declined');
    await checkbox.click();

    await expect(page.getByTestId('fa-changes')).toHaveText('0');
  });
});

test.describe('Toggle — native change event', () => {
  test('clicking the switch dispatches a native change event that bubbles to a form', async ({
    page
  }) => {
    const toggle = page.getByTestId('fa-notifications').locator('label.switch');
    await toggle.click();

    await expect(page.getByTestId('fa-changes')).toHaveText('1');
  });
});

/**
 * The isolated fixture owns the form, its submit button and FormData readout.
 * No demo-page layout or selectors participate in this contract suite.
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
    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');

    // `agree` starts unchecked -> absent entirely, not present with an empty value.
    expect(hasName(entries, 'agree')).toBe(false);
    expect(entries).toContainEqual(['subscribe', 'yes']);
  });

  test('checking a checkbox makes it appear in FormData with the native "on" default', async ({
    page
  }) => {
    await page.getByTestId('fa-agree').click();
    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(entries).toContainEqual(['agree', 'on']);
  });

  test('unchecking a checked checkbox removes it from FormData', async ({ page }) => {
    await page.getByTestId('fa-subscribe').click();
    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(hasName(entries, 'subscribe')).toBe(false);
  });
});

test.describe('Toggle — FormData participation', () => {
  test('a toggled Toggle submits under its name; an off Toggle is absent', async ({ page }) => {
    expect(hasName(await submittedEntries(page, 'fa-submit', 'fa-result'), 'notifications')).toBe(
      false
    );

    // Toggle's `.container` is `display: flex` and stretches to the form's full
    // width, so a click at the container's bounding-box centre can land past the
    // switch. Click the visible switch, the same target a user reaches for.
    await page.getByTestId('fa-notifications').locator('label.switch').click();
    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(entries).toContainEqual(['notifications', 'on']);
  });
});

test.describe('Select — FormData participation', () => {
  test('single-select Select submits its one selected id under name', async ({ page }) => {
    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(entries.filter((entry) => entry[0] === 'fruit')).toEqual([['fruit', 'apple']]);
  });

  test('multiple-select Select submits one FormData entry per selected id under the same name', async ({
    page
  }) => {
    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(entries.filter((entry) => entry[0] === 'colors')).toEqual([
      ['colors', 'red'],
      ['colors', 'blue']
    ]);
  });

  test('deselecting all options in multiple-select Select removes it from FormData', async ({
    page
  }) => {
    const select = page.getByTestId('fa-colors');
    await select.click();
    await page.getByRole('option', { name: 'Red' }).click();
    await page.getByRole('option', { name: 'Blue' }).click();
    // Escape only closes the panel while focus sits in the trigger/search/panel
    // (pre-existing Select behaviour); focus is on the just-clicked option here,
    // so close it the way handleClickOutside expects.
    await page.getByRole('heading', { name: 'Form association', exact: true }).click();

    const entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(hasName(entries, 'colors')).toBe(false);
  });

  test('deselecting then reselecting an option in multiple-select Select still submits it', async ({
    page
  }) => {
    // Regression guard for the `{#each value as id (id)}` hidden inputs: a
    // key leaving and re-entering `value` must produce a correct FormData
    // entry for it, not a stale or duplicated one.

    const select = page.getByTestId('fa-colors');
    await select.click();
    await page.getByRole('option', { name: 'Red' }).click();
    await page.getByRole('heading', { name: 'Form association', exact: true }).click();

    let entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(entries.filter((entry) => entry[0] === 'colors')).toEqual([['colors', 'blue']]);

    await select.click();
    await page.getByRole('option', { name: 'Red' }).click();
    await page.getByRole('heading', { name: 'Form association', exact: true }).click();

    entries = await submittedEntries(page, 'fa-submit', 'fa-result');
    expect(entries.filter((entry) => entry[0] === 'colors')).toEqual([
      ['colors', 'blue'],
      ['colors', 'red']
    ]);
  });
});
