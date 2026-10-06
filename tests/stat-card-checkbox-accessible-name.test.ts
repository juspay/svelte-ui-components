import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// StatCard's header checkbox is a CheckListItem, and CheckListItem left its box unnamed, so all
// three demo cards exposed a bare `role="checkbox"` next to text that did not name it. The name now
// comes from `checkbox.text`, the label the card shows beside the box.
//
// Naming alone is not the contract. On an interactive card (`onclick` set) the box lives inside a
// `role="button"` root, so the same fix has to leave "toggle the box" and "run the card action" as
// two separate gestures, for the keyboard as much as for the pointer.
const CARDS = [
  { testId: 'with-checkbox', name: 'With returns' },
  { testId: 'headerless-card', name: 'Include returns' },
  { testId: 'clickable-checkbox-card', name: 'Live data' }
] as const;

test.describe('StatCard — header checkbox accessible name', () => {
  test('each card checkbox is named by its checkbox text', async ({ page }) => {
    await gotoHydrated(page, '/components/stat-card');

    for (const { testId, name } of CARDS) {
      const box = page.getByTestId(testId).getByRole('checkbox');
      await expect(box, `${testId} must expose exactly one checkbox`).toHaveCount(1);
      await expect(box).toHaveAccessibleName(name);
      await expect(box).toHaveAttribute('aria-checked', 'false');
    }
  });

  test('a card whose header has no title still names its checkbox', async ({ page }) => {
    await gotoHydrated(page, '/components/stat-card');

    const card = page.getByTestId('headerless-card');
    await expect(card.getByTestId('headerless-card-title')).toHaveCount(0);
    await expect(card.getByRole('checkbox')).toHaveAccessibleName('Include returns');
  });

  test('no checkbox on the page is left unnamed', async ({ page }) => {
    await gotoHydrated(page, '/components/stat-card');

    const boxes = page.locator('[role="checkbox"]');
    const count = await boxes.count();
    expect(count, 'no checkboxes on the page to sweep').toBeGreaterThanOrEqual(CARDS.length);
    for (let index = 0; index < count; index += 1) {
      const box = boxes.nth(index);
      const markup = (await box.evaluate((element) => element.outerHTML)).slice(0, 120);
      await expect(box, `unnamed checkbox: ${markup}`).not.toHaveAccessibleName('');
    }
  });

  test('the native form mirror stays hidden, so each card has one usable control', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/stat-card');

    for (const { testId } of CARDS) {
      const mirror = page.getByTestId(testId).locator('input[type="checkbox"]');
      await expect(mirror).toHaveCount(1);
      await expect(mirror).toHaveAttribute('aria-hidden', 'true');
      await expect(mirror).toHaveAttribute('tabindex', '-1');
    }
  });

  test('keyboard toggling the box never runs the card action', async ({ page }) => {
    await gotoHydrated(page, '/components/stat-card');

    const card = page.getByTestId('clickable-checkbox-card');
    const clicks = page.getByTestId('card-click-count');
    const box = card.getByRole('checkbox', { name: 'Live data' });

    // Tab order inside an interactive card: the card itself, then its checkbox.
    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(box).toBeFocused();

    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(clicks).toHaveText('0');
    await page.keyboard.press('Enter');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(clicks).toHaveText('0');

    // The card action is still one keypress away on the card itself.
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(clicks).toHaveText('1');
    await page.keyboard.press('Space');
    await expect(clicks).toHaveText('2');
  });

  test('pointer toggling the box never runs the card action', async ({ page }) => {
    await gotoHydrated(page, '/components/stat-card');

    const card = page.getByTestId('clickable-checkbox-card');
    const clicks = page.getByTestId('card-click-count');
    const box = card.getByRole('checkbox', { name: 'Live data' });

    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(clicks).toHaveText('0');
    await card.getByTestId('clickable-checkbox-card-value').click();
    await expect(clicks).toHaveText('1');
  });

  test('Chromium reports the same names in its own accessibility tree', async ({
    page,
    browserName
  }) => {
    test.skip(browserName !== 'chromium', 'CDP accessibility tree is Chromium-only');
    await gotoHydrated(page, '/components/stat-card');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const names = nodes
      .filter((node) => node.role?.value === 'checkbox' && node.ignored !== true)
      .map((node) => String(node.name?.value ?? ''));
    for (const { name } of CARDS) {
      expect(names, `Chromium AX tree has no checkbox named "${name}"`).toContain(name);
    }
    expect(names.filter((name) => name === '')).toEqual([]);
  });
});

const loadWebComponents = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() =>
    Boolean(customElements.get('sui-stat-card') && customElements.get('sui-check-list-item'))
  );
};

test.describe('web components — selection control names', () => {
  test('<sui-check-list-item> names its box from text and from a slotted label', async ({
    page
  }) => {
    await loadWebComponents(page);
    await page.evaluate(() => {
      const plain = document.createElement('sui-check-list-item');
      plain.setAttribute('data-pw', 'wc-item-plain');
      plain.setAttribute('text', 'Task 1');
      const slotted = document.createElement('sui-check-list-item');
      slotted.setAttribute('data-pw', 'wc-item-slotted');
      slotted.setAttribute('text', 'Task 2');
      slotted.innerHTML = '<span slot="checkbox-label">Custom <b>label</b></span>';
      const disabled = document.createElement('sui-check-list-item');
      disabled.setAttribute('data-pw', 'wc-item-disabled');
      disabled.setAttribute('text', 'Locked task');
      disabled.setAttribute('disabled', '');
      document.body.append(plain, slotted, disabled);
    });

    const plain = page.getByTestId('wc-item-plain').getByRole('checkbox');
    await expect(plain).toHaveCount(1);
    await expect(plain).toHaveAccessibleName('Task 1');

    // Visible label is the slotted content, so that is what names the box.
    const slotted = page.getByTestId('wc-item-slotted').getByRole('checkbox');
    await expect(slotted).toHaveAccessibleName('Custom label');

    const disabled = page.getByTestId('wc-item-disabled').getByRole('checkbox');
    await expect(disabled).toHaveAccessibleName('Locked task');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');

    await plain.focus();
    await page.keyboard.press('Space');
    await expect(plain).toHaveAttribute('aria-checked', 'true');
    await expect(plain).toHaveAccessibleName('Task 1');
  });

  test('<sui-stat-card> names its header checkbox and keeps the card action separate', async ({
    page
  }) => {
    await loadWebComponents(page);
    await page.evaluate(() => {
      const probe = window as Window & { __cardClicks?: number; __checkboxEvents?: boolean[] };
      probe.__cardClicks = 0;
      probe.__checkboxEvents = [];
      const card = document.createElement('sui-stat-card');
      card.setAttribute('data-pw', 'wc-card');
      card.setAttribute('value', '68.4%');
      Reflect.set(card, 'checkbox', { text: 'Live data', checked: false });
      Reflect.set(card, 'onclick', () => {
        probe.__cardClicks = (probe.__cardClicks ?? 0) + 1;
      });
      card.addEventListener('checkboxchange', (event) => {
        if (event instanceof CustomEvent) {
          probe.__checkboxEvents?.push(Boolean(event.detail));
        }
      });
      document.body.append(card);
    });

    const box = page.getByTestId('wc-card').getByRole('checkbox');
    await expect(box).toHaveCount(1);
    await expect(box).toHaveAccessibleName('Live data');

    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'true');
    const outcome = await page.evaluate(() => {
      const probe = window as Window & { __cardClicks?: number; __checkboxEvents?: boolean[] };
      return { clicks: probe.__cardClicks, events: probe.__checkboxEvents };
    });
    expect(outcome).toEqual({ clicks: 0, events: [true] });
  });
});
