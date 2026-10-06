import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// ISSUE-012. Every example on the Menu page used to render a Button inside Menu's default
// trigger wrapper (`role="button" tabindex="0"`). That is two focusable elements for one
// action: Tab landed on the wrapper, then again on the Button nested inside it, and the
// accessibility tree exposed a button inside a button, both named "Actions Menu". These
// specs press real Tab/Shift+Tab and read the browser's own accessibility tree -- counting
// attributes alone passes for a wrapper that merely gained a label.

type ButtonDemo = { readonly testId: string; readonly name: string };

const BUTTON_DEMOS: readonly ButtonDemo[] = [
  { testId: 'menu-default-demo', name: 'Actions Menu' },
  { testId: 'menu-bottom-right-demo', name: 'Bottom-right' },
  { testId: 'menu-auto-roomy-demo', name: 'Auto (roomy)' },
  { testId: 'menu-transform-svg', name: 'Transformed icon' },
  { testId: 'menu-auto-corner-demo', name: 'Auto (corner)' },
  { testId: 'menu-inflow-demo', name: 'In-flow' },
  { testId: 'menu-portal-demo', name: 'Portaled' },
  { testId: 'menu-selected-demo', name: 'Sort (themed selection)' },
  { testId: 'menu-interactive-trigger', name: 'Sort' }
];

const WRAPPER_OWNED = { testId: 'menu-wrapper-owned-demo', name: 'More options' } as const;

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Gives Tab somewhere to go after the last trigger on the page. Firefox leaves
 * `document.activeElement` on the final focusable element when Tab hands focus to the browser's
 * own UI, so without a control after it the last trigger would read as "focus never left".
 */
const appendTrailingControl = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const trailing = document.createElement('button');
    trailing.type = 'button';
    trailing.textContent = 'Trailing control';
    document.body.append(trailing);
  });

/** True when the element that currently has focus sits inside `container`. */
const focusIsInside = (page: Page, container: Locator): Promise<boolean> =>
  container.evaluate((root) => root.contains(document.activeElement));

test.describe('Menu page — every trigger is one Tab stop', () => {
  test('each trigger exposes exactly one focusable element, and it is the named control', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/menu');

    const stops = await page.evaluate(
      ({ focusable, ids }) =>
        ids.map((id) => {
          const container = document.querySelector(`[data-pw="${id}"]`);
          const wrapper = container?.querySelector('.menu-trigger') ?? null;
          const own =
            wrapper instanceof HTMLElement &&
            wrapper.getAttribute('role') === 'button' &&
            wrapper.tabIndex >= 0
              ? 1
              : 0;
          const inner = wrapper === null ? 0 : wrapper.querySelectorAll(focusable).length;
          return { id, found: container !== null, own, inner };
        }),
      {
        focusable: FOCUSABLE,
        ids: [...BUTTON_DEMOS.map((demo) => demo.testId), WRAPPER_OWNED.testId]
      }
    );

    // A control that measured nothing must not read as a pass.
    expect(stops.filter((stop) => stop.found)).toHaveLength(BUTTON_DEMOS.length + 1);
    for (const stop of stops) {
      expect(stop.own + stop.inner, `${stop.id} should contribute one focusable element`).toBe(1);
    }
  });

  for (const demo of BUTTON_DEMOS) {
    test(`${demo.testId}: real Tab and Shift+Tab pass through the trigger once`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/menu');
      await appendTrailingControl(page);

      const container = page.getByTestId(demo.testId);
      const trigger = container.locator('button').first();
      await expect(trigger).toHaveAccessibleName(demo.name);

      await trigger.focus();
      await expect(trigger).toBeFocused();

      // Forward: the trigger is the only stop, so Tab leaves the whole container.
      await page.keyboard.press('Tab');
      expect(await focusIsInside(page, container), 'Tab stayed inside the menu trigger').toBe(
        false
      );

      // Back: Shift+Tab returns to the trigger itself, never to a hidden second stop.
      await page.keyboard.press('Shift+Tab');
      await expect(trigger).toBeFocused();

      // Backward past it: nothing else in this container is focusable on the way out.
      await page.keyboard.press('Shift+Tab');
      expect(await focusIsInside(page, container), 'Shift+Tab stopped on a second element').toBe(
        false
      );

      await page.keyboard.press('Tab');
      await expect(trigger).toBeFocused();
    });

    test(`${demo.testId}: the accessibility tree holds one named button, not a button in a button`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/menu');

      const snapshot = await page.getByTestId(demo.testId).ariaSnapshot();
      expect(snapshot.trim()).toBe(`- button "${demo.name}"`);

      const trigger = page.getByTestId(demo.testId).locator('button').first();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // The wrapper carries neither a role nor a tab stop of its own.
      const wrapper = page.getByTestId(demo.testId).locator('.menu-trigger');
      await expect(wrapper).not.toHaveAttribute('role', /.*/);
      await expect(wrapper).not.toHaveAttribute('tabindex', /.*/);
    });
  }

  test('the wrapper-owned trigger stays a single named stop for non-interactive content', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/menu');
    await appendTrailingControl(page);

    const container = page.getByTestId(WRAPPER_OWNED.testId);
    const trigger = container.locator('.menu-trigger');
    await expect(trigger).toHaveAttribute('role', 'button');
    await expect(trigger).toHaveAttribute('tabindex', '0');
    await expect(trigger).toHaveAccessibleName(WRAPPER_OWNED.name);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect((await container.ariaSnapshot()).trim()).toBe(`- button "${WRAPPER_OWNED.name}"`);

    await trigger.focus();
    await page.keyboard.press('Tab');
    expect(await focusIsInside(page, container)).toBe(false);
    await page.keyboard.press('Shift+Tab');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    expect(await focusIsInside(page, container)).toBe(false);
  });
});

test.describe('Menu page — activation, state and focus return', () => {
  for (const demo of [BUTTON_DEMOS[0], BUTTON_DEMOS[6]]) {
    test(`${demo.testId}: Enter opens exactly once and Escape returns focus to the Button`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/menu');

      const container = page.getByTestId(demo.testId);
      const trigger = container.locator('button').first();
      await trigger.focus();
      await page.keyboard.press('Enter');

      await expect(page.locator('[role="menu"]')).toHaveCount(1);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // Focus moves into the menu, onto the first item.
      await expect(page.getByRole('menuitem').first()).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('[role="menu"]')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }

  test('Space opens once, ArrowDown walks the items and Tab dismisses the menu', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/menu');

    const container = page.getByTestId('menu-default-demo');
    const trigger = container.locator('button').first();
    await trigger.focus();
    await page.keyboard.press('Space');

    await expect(page.locator('[role="menu"]')).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const items = page.getByRole('menuitem');
    await expect(items.first()).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(items.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(items.first()).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[role="menu"]')).toHaveCount(0);
  });

  test('ArrowDown and ArrowUp on the Button open the menu at the first and last item', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/menu');

    const container = page.getByTestId('menu-bottom-right-demo');
    const trigger = container.locator('button').first();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('menuitem').last()).toBeFocused();
  });

  test('a pointer click opens exactly once and a second click closes it', async ({ page }) => {
    await gotoHydrated(page, '/components/menu');

    const container = page.getByTestId('menu-default-demo');
    const trigger = container.locator('button').first();
    await trigger.click();
    await expect(page.locator('[role="menu"]')).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[role="menu"]')).toHaveCount(0);
  });

  test('an outside click dismisses the menu and selecting an item returns focus to the Button', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/menu');
    page.on('dialog', (dialog) => void dialog.dismiss());

    const container = page.getByTestId('menu-default-demo');
    const trigger = container.locator('button').first();
    await trigger.click();
    await expect(page.locator('[role="menu"]')).toHaveCount(1);
    await page.getByRole('heading', { name: 'Menu', exact: true }).click();
    await expect(page.locator('[role="menu"]')).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="menu"]')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('the wrapper-owned trigger opens once from Enter, Space, ArrowDown and a click', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/menu');

    const container = page.getByTestId(WRAPPER_OWNED.testId);
    const trigger = container.locator('.menu-trigger');

    for (const key of ['Enter', 'Space', 'ArrowDown']) {
      await trigger.focus();
      await page.keyboard.press(key);
      await expect(page.locator('[role="menu"]'), `${key} should open one menu`).toHaveCount(1);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="menu"]')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }

    await trigger.click();
    await expect(page.locator('[role="menu"]')).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Menu page — the page scan that found the defect', () => {
  test('no menu trigger nests an interactive control inside another', async ({ page }) => {
    await gotoHydrated(page, '/components/menu');

    const nested = await page.evaluate((focusable) => {
      return [...document.querySelectorAll('.menu-trigger')]
        .map((wrapper) => ({
          owner: wrapper.closest('[data-pw]')?.getAttribute('data-pw') ?? null,
          wrapperInteractive: wrapper.hasAttribute('role') || wrapper.hasAttribute('tabindex'),
          inner: wrapper.querySelectorAll(focusable).length
        }))
        .filter((entry) => entry.wrapperInteractive && entry.inner > 0);
    }, FOCUSABLE);

    expect(nested).toEqual([]);
  });
});
