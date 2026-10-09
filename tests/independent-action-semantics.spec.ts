import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

for (const theme of ['light', 'dark'] as const) {
  test.describe(`independent actions, ${theme}`, () => {
    test.use({ colorScheme: theme });

    test('static nested ListItems do not advertise unusable buttons', async ({ page }) => {
      await gotoHydrated(page, '/components/list-item');
      const example = page.getByTestId('list-item-fit-stack-nested');
      await expect(example).toBeVisible();
      await expect(example.getByRole('button')).toHaveCount(0);
      await expect(example).toContainText('Inherits');
      await expect(example).toContainText('Reset');
    });

    test('a named dialog has no interactive ancestor and still dismisses by Escape', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/modal');
      const trigger = page.getByRole('button', { name: 'Open Modal', exact: true });
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('alertdialog', { name: 'Confirm Action' });
      await expect(dialog).toBeVisible();
      expect(
        await dialog.evaluate((el) => el.parentElement?.closest('[role="button"],button') !== null)
      ).toBe(false);
      await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });

    test('StatCard action and checkbox are separate native accessibility targets', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/stat-card');
      const card = page.getByTestId('clickable-checkbox-card');
      const action = card.getByRole('button');
      const box = card.getByRole('checkbox', { name: 'Live data' });
      await expect(action).not.toHaveAccessibleName('');
      expect(
        await box.evaluate((el) => el.parentElement?.closest('[role="button"],button') !== null)
      ).toBe(false);
      await action.focus();
      await page.keyboard.press('Tab');
      await expect(box).toBeFocused();
      await page.keyboard.press('Space');
      await expect(page.getByTestId('card-click-count')).toHaveText('0');
      await action.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await expect(page.getByTestId('card-click-count')).toHaveText('2');
      const bounds = await card.getByTestId('clickable-checkbox-card-value').boundingBox();
      if (!bounds) {
        throw new Error('Card value must have a pointer target');
      }
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await expect(page.getByTestId('card-click-count')).toHaveText('3');
    });

    test('custom video playback uses a sibling native action with operative keyboard control', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/media-player');
      await page.mouse.move(0, 0);
      const player = page.getByTestId('media-player-video-demo');
      const video = player.locator('video');
      const action = player.locator('button.media-surface-action');
      await expect(video).not.toHaveAttribute('role');
      // The demo autoplays. Establish real playback before testing the toggle,
      // instead of assuming its arrival state is paused after hydration.
      await video.evaluate(async (el: HTMLVideoElement) => {
        el.muted = true;
        await el.play();
      });
      await expect(video).toHaveJSProperty('paused', false);
      await action.focus();
      await page.keyboard.press('Enter');
      await expect(video).toHaveJSProperty('paused', true);
      await expect(action).toHaveAccessibleName('Play video');
      await page.keyboard.press('Space');
      await expect(video).toHaveJSProperty('paused', false);
      await expect(action).toHaveAccessibleName('Pause video');
      await page.keyboard.press('Tab');
      await expect(player.locator('.center-control button')).toBeFocused();
      await expect(player.locator('.center-control button')).toBeVisible();
      await expect(
        page.getByTestId('media-player-native-controls-demo').locator('.media-surface-action')
      ).toHaveCount(0);
    });
  });
}

test('custom-element card action remains independent and fires once per activation', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-stat-card')));
  await page.evaluate(() => {
    const card = document.createElement('sui-stat-card');
    card.setAttribute('data-pw', 'independent-wc-card');
    card.setAttribute('title', 'Revenue');
    card.setAttribute('value', '42');
    Reflect.set(card, 'checkbox', { text: 'Live data' });
    Reflect.set(card, 'onclick', () => {
      const target = document.getElementById('wc-card-count');
      if (target) {
        target.textContent = String(Number(target.textContent) + 1);
      }
    });
    const count = document.createElement('output');
    count.id = 'wc-card-count';
    count.textContent = '0';
    const headerCount = document.createElement('output');
    headerCount.id = 'wc-header-count';
    headerCount.textContent = '0';
    const headerAction = document.createElement('button');
    headerAction.setAttribute('slot', 'header-right');
    headerAction.textContent = 'Header action';
    headerAction.addEventListener('click', () => {
      headerCount.textContent = String(Number(headerCount.textContent) + 1);
    });
    card.append(headerAction);
    document.body.append(card, count, headerCount);
  });
  const card = page.getByTestId('independent-wc-card');
  const action = card.locator('button.statcard-action');
  const box = card.getByRole('checkbox', { name: 'Live data' });
  await expect(action).toHaveAccessibleName('Revenue 42');
  expect(
    await box.evaluate((el) => el.parentElement?.closest('[role="button"],button') !== null)
  ).toBe(false);
  await box.click();
  await expect(page.locator('#wc-card-count')).toHaveText('0');
  await card.getByRole('button', { name: 'Header action' }).click();
  await expect(page.locator('#wc-header-count')).toHaveText('1');
  await expect(page.locator('#wc-card-count')).toHaveText('0');
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#wc-card-count')).toHaveText('1');
  await page.keyboard.press('Space');
  await expect(page.locator('#wc-card-count')).toHaveText('2');
  await action.click();
  await expect(page.locator('#wc-card-count')).toHaveText('3');
});

test('generic custom-element overlay retains Enter and Space activation', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-modal')));
  await page.evaluate(() => {
    const modal = document.createElement('sui-modal');
    modal.setAttribute('data-pw', 'generic-wc-overlay');
    modal.setAttribute('overlay-aria-label', 'Dismiss preview');
    Reflect.set(modal, 'enableTransition', false);
    Reflect.set(modal, 'debounceTime', 0);
    Reflect.set(modal, 'ondismiss', () => {
      const target = document.getElementById('wc-overlay-count');
      if (target) {
        target.textContent = String(Number(target.textContent) + 1);
      }
    });
    const count = document.createElement('output');
    count.id = 'wc-overlay-count';
    count.textContent = '0';
    document.body.append(modal, count);
  });
  const overlay = page
    .getByTestId('generic-wc-overlay')
    .getByRole('button', { name: 'Dismiss preview' });
  await overlay.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#wc-overlay-count')).toHaveText('1');
  await page.keyboard.press('Space');
  await expect(page.locator('#wc-overlay-count')).toHaveText('2');
});
