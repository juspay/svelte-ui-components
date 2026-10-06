import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// CheckListItem renders its visible label as a sibling of <Checkbox>, not inside it, and passes the
// box `text=""` -- so the `role="checkbox"` node that assistive technology reads had no name, on
// every item, while the row looked perfectly labelled on screen. The fix names the box from the very
// label the row shows (a plain `text`, or whatever a `checkboxLabel` snippet renders), so the name a
// reader announces and the text a speech-input user can see are the same words.
//
// Names are asserted as computed accessible names, never as attribute presence: an
// `aria-labelledby` that points at an id which is not in the DOM is a non-null attribute and an
// unnamed control.
const ITEMS = [
  { name: 'Set up project', checked: 'false' },
  { name: 'Install dependencies', checked: 'true' },
  { name: 'Write tests', checked: 'false' }
] as const;
const DISABLED_NAME = 'Required business details Required';

const items = (page: Page) => page.locator('.demo-row > .container');

test.describe('CheckListItem — accessible name', () => {
  test('every checkbox is named by its own visible label', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    for (const { name, checked } of ITEMS) {
      const box = page.getByRole('checkbox', { name, exact: true });
      await expect(box, `no checkbox is named "${name}"`).toHaveCount(1);
      await expect(box).toHaveAccessibleName(name);
      await expect(box).toHaveAttribute('aria-checked', checked);
    }
  });

  test('a snippet label names the checkbox with everything it shows', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    // The label here is `Required business details <strong>Required</strong>`. Naming the box from
    // `text` alone would drop "Required", the one word on screen that is not in the plain string.
    const box = page.getByTestId('check-list-item-disabled-checkbox-box');
    await expect(box).toHaveAccessibleName(DISABLED_NAME);
    await expect(box).toHaveAttribute('aria-disabled', 'true');
    await expect(box).toHaveAttribute('tabindex', '-1');
  });

  test('no checkbox on the page is left unnamed', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    const boxes = page.locator('[role="checkbox"]');
    const count = await boxes.count();
    expect(count, 'no checkboxes on the page to sweep').toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = boxes.nth(index);
      const markup = (await box.evaluate((element) => element.outerHTML)).slice(0, 120);
      await expect(box, `unnamed checkbox: ${markup}`).not.toHaveAccessibleName('');
    }
  });

  test('each item exposes exactly one usable selection control', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    await expect(items(page)).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      const item = items(page).nth(index);
      await expect(item.getByRole('checkbox')).toHaveCount(1);
      // The native input is a form mirror: out of the accessibility tree, out of the Tab order and
      // unreachable by pointer. Naming the box must not change that.
      const mirror = item.locator('input[type="checkbox"]');
      await expect(mirror).toHaveCount(1);
      await expect(mirror).toHaveAttribute('aria-hidden', 'true');
      await expect(mirror).toHaveAttribute('tabindex', '-1');
    }
  });

  test('Tab visits the named boxes in order and skips the disabled one', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    await page.getByRole('checkbox', { name: ITEMS[0].name, exact: true }).focus();
    await expect(page.getByRole('checkbox', { name: ITEMS[0].name, exact: true })).toBeFocused();

    for (const { name } of ITEMS.slice(1)) {
      await page.keyboard.press('Tab');
      const focused = page.getByRole('checkbox', { name, exact: true });
      await expect(focused, `Tab did not land on "${name}"`).toBeFocused();
    }

    // The fourth item is disabled (tabindex -1), so the next stop is not a checkbox of this list.
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('check-list-item-disabled-checkbox-box')).not.toBeFocused();
    await expect(page.locator('.demo-row [role="checkbox"]:focus')).toHaveCount(0);
  });

  test('Space and Enter toggle the focused box and report the new value', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    const box = page.getByRole('checkbox', { name: 'Set up project', exact: true });
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(box).toHaveAccessibleName('Set up project');
    await page.keyboard.press('Enter');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
  });

  test('the disabled item ignores pointer and keyboard activation', async ({ page }) => {
    await gotoHydrated(page, '/components/check-list-item');

    const box = page.getByTestId('check-list-item-disabled-checkbox-box');
    await box.click({ force: true });
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('check-list-item-disabled-checkbox-native-input')).toBeDisabled();
  });

  test('activating an item inside a form neither submits nor contributes a field', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/check-list-item');

    // The demo has no form, so wrap the real, hydrated rows in one: the DOM nodes move, the
    // component instances (and their delegated handlers) are untouched.
    await page.evaluate(() => {
      const row = document.querySelector('.demo-row');
      if (row === null) {
        throw new Error('demo row missing');
      }
      const form = document.createElement('form');
      form.id = 'wrapped-checklist-form';
      const probe = window as Window & { __submits?: number };
      probe.__submits = 0;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        probe.__submits = (probe.__submits ?? 0) + 1;
      });
      row.before(form);
      form.append(row);
    });

    const box = page.getByRole('checkbox', { name: 'Write tests', exact: true });
    await box.focus();
    await page.keyboard.press('Enter');
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');

    const outcome = await page.evaluate(() => {
      const form = document.querySelector<HTMLFormElement>('#wrapped-checklist-form');
      return {
        submits: (window as Window & { __submits?: number }).__submits,
        fields: form === null ? null : [...new FormData(form)]
      };
    });
    expect(outcome).toEqual({ submits: 0, fields: [] });
  });

  test('Chromium reports the same names in its own accessibility tree', async ({
    page,
    browserName
  }) => {
    test.skip(browserName !== 'chromium', 'CDP accessibility tree is Chromium-only');
    await gotoHydrated(page, '/components/check-list-item');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const checkboxes = nodes
      .filter((node) => node.role?.value === 'checkbox' && node.ignored !== true)
      .map((node) => String(node.name?.value ?? ''));
    expect(checkboxes).toEqual([...ITEMS.map((item) => item.name), DISABLED_NAME]);
  });
});
