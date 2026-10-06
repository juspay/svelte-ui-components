import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Modal built its debouncer once, from whatever `debounceTime` was on the first render, so a
// delay changed while the modal was open was ignored: after 700ms -> 20ms, two overlay clicks
// 100ms apart still produced one callback. The delay is now read when each dismissal arrives,
// while the debouncer keeps the time it last fired.
//
// Date.now() drives the debouncer, so the route tests run on a controlled clock: the spacing
// between clicks is exactly what `clock.runFor` advances, not whatever a loaded machine happens
// to take between two real clicks.
const EPOCH = new Date('2026-10-03T00:00:00Z');

const openWithControlledClock = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/components/modal');
  await page.clock.install({ time: EPOCH });
  await page.clock.pauseAt(new Date(EPOCH.valueOf() + 10_000));
  await page.getByTestId('open-debounce-modal').click();
  await expect(page.getByRole('dialog', { name: 'Adjustable debounceTime' })).toBeVisible();
  await expect(page.getByTestId('debounce-count')).toHaveText('overlay callbacks: 0');
};

const clickOverlay = (page: Page): Promise<void> =>
  page.getByTestId('debounce-modal').click({ position: { x: 10, y: 10 } });

const expectCallbacks = (page: Page, count: number): Promise<void> =>
  expect(page.getByTestId('debounce-count')).toHaveText(`overlay callbacks: ${count}`);

const setDelay = async (page: Page, ms: 20 | 700 | 5000): Promise<void> => {
  await page.getByTestId(`debounce-set-${ms}`).click();
  await expect(page.getByTestId('debounce-current')).toHaveText(`debounceTime: ${ms}ms`);
};

test.describe('Modal debounceTime is reactive', () => {
  test('lowering 700ms to 20ms on the open modal lets clicks 100ms apart both fire', async ({
    page
  }) => {
    await openWithControlledClock(page);
    await setDelay(page, 20);

    await clickOverlay(page);
    await expectCallbacks(page, 1);
    await page.clock.runFor(100);
    await clickOverlay(page);
    await expectCallbacks(page, 2);
  });

  test('the shipped 700ms window still suppresses a click 100ms after the last one', async ({
    page
  }) => {
    await openWithControlledClock(page);
    await expect(page.getByTestId('debounce-current')).toHaveText('debounceTime: 700ms');

    await clickOverlay(page);
    await expectCallbacks(page, 1);
    await page.clock.runFor(100);
    await clickOverlay(page);
    await expectCallbacks(page, 1);

    await page.clock.runFor(700);
    await clickOverlay(page);
    await expectCallbacks(page, 2);
  });

  test('raising the delay applies to the next click and keeps when the last one fired', async ({
    page
  }) => {
    await openWithControlledClock(page);
    await setDelay(page, 20);

    await clickOverlay(page);
    await page.clock.runFor(100);
    await clickOverlay(page);
    await expectCallbacks(page, 2);

    // 100ms after the last callback, under a 20ms window the next click would fire. Under the
    // raised 5000ms window it must not, and a debouncer rebuilt by the change would have
    // forgotten the callback above and let it through.
    await setDelay(page, 5000);
    await page.clock.runFor(100);
    await clickOverlay(page);
    await expectCallbacks(page, 2);

    await page.clock.runFor(5000);
    await clickOverlay(page);
    await expectCallbacks(page, 3);
  });

  test('overlay click and Escape share one history, so Escape inside the window is dropped', async ({
    page
  }) => {
    await openWithControlledClock(page);

    await clickOverlay(page);
    await expectCallbacks(page, 1);

    await page.clock.runFor(100);
    await page.keyboard.press('Escape');
    await expectCallbacks(page, 1);

    await page.clock.runFor(700);
    await page.keyboard.press('Escape');
    await expectCallbacks(page, 2);

    // Same window, other direction: an Escape that just fired also guards the overlay.
    await page.clock.runFor(100);
    await clickOverlay(page);
    await expectCallbacks(page, 2);
  });

  test('the Close button still unmounts the open modal cleanly after a delay change', async ({
    page
  }) => {
    await openWithControlledClock(page);
    await setDelay(page, 20);
    await clickOverlay(page);
    await page.getByTestId('debounce-close').click();
    await page.clock.runFor(1000);
    await expect(page.getByRole('dialog', { name: 'Adjustable debounceTime' })).toBeHidden();
  });
});

// <sui-modal> forwards debounceTime to the same Modal, so the property assigned after mount has
// to reach it too. Real time here: the starting window is 60s, far wider than any plausible
// stall between two clicks, so the two clicks cannot land outside it by accident.
test.describe('sui-modal debounceTime is reactive', () => {
  const mountWc = async (page: Page): Promise<void> => {
    await page.goto('/wc-form-demo.html');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-modal') !== 'undefined', null, {
      timeout: 30_000
    });
    await page.evaluate(() => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('data-pw', 'wc-debounce-modal');
      modal.dataset.overlayClicks = '0';
      Reflect.set(modal, 'debounceTime', 60_000);
      // onoverlayclick is presence-gated (scripts/wc-parity/presence-gated-callbacks.ts): the
      // overlay is only dismissible, and the same-named event only dispatched, once a callback
      // is assigned.
      Reflect.set(modal, 'onoverlayclick', () => null);
      modal.addEventListener('overlayclick', () => {
        modal.dataset.overlayClicks = String(Number(modal.dataset.overlayClicks) + 1);
      });
      const body = document.createElement('p');
      body.textContent = 'Body copy';
      modal.append(body);
      document.body.append(modal);
    });
    await expect(page.getByTestId('wc-debounce-modal').locator('.modal-content')).toBeVisible();
  };

  const clicks = (page: Page, count: number): Promise<void> =>
    expect(page.getByTestId('wc-debounce-modal')).toHaveAttribute(
      'data-overlay-clicks',
      String(count)
    );

  const clickWcOverlay = (page: Page): Promise<void> =>
    page
      .getByTestId('wc-debounce-modal')
      .locator('.modal')
      .click({ position: { x: 10, y: 10 } });

  test('a debounceTime lowered after mount lets a later overlay click through', async ({
    page
  }) => {
    await mountWc(page);

    await clickWcOverlay(page);
    await clicks(page, 1);

    // Still inside the 60s window: suppressed.
    await page.waitForTimeout(100);
    await clickWcOverlay(page);
    await clicks(page, 1);

    await page.evaluate(() => {
      Reflect.set(document.querySelector('sui-modal') as HTMLElement, 'debounceTime', 20);
    });
    await page.waitForTimeout(100);
    await clickWcOverlay(page);
    await clicks(page, 2);
  });

  test('a debounceTime raised after mount keeps the last-fired time', async ({ page }) => {
    await mountWc(page);
    await page.evaluate(() => {
      Reflect.set(document.querySelector('sui-modal') as HTMLElement, 'debounceTime', 20);
    });

    await clickWcOverlay(page);
    await clicks(page, 1);
    await page.waitForTimeout(100);
    await clickWcOverlay(page);
    await clicks(page, 2);

    await page.evaluate(() => {
      Reflect.set(document.querySelector('sui-modal') as HTMLElement, 'debounceTime', 60_000);
    });
    await page.waitForTimeout(100);
    await clickWcOverlay(page);
    await clicks(page, 2);
  });
});
