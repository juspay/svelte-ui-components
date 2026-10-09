import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { fixtureBaseURL } from './support/fixture-server';

const fixedTime = new Date('2026-10-04T00:00:00Z');
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: fixedTime });
});

const mountWidget = async (
  page: import('@playwright/test').Page,
  seconds: number,
  offset: number
) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?history=true`);
  await page.addScriptTag({
    path: process.env.HITL_WC_BUNDLE ?? 'dist-wc/index.js',
    type: 'module'
  });
  await page.waitForFunction(() => Boolean(customElements.get('sui-hitl')));
  await page.evaluate(
    ({ seconds, offset }) => {
      const result = document.createElement('p');
      result.dataset.pw = 'wc-deadline-events';
      result.textContent = '0:none';
      const element = document.createElement('sui-hitl');
      element.setAttribute('confirmation-id', 'wc-deadline');
      element.setAttribute('title', 'Approve the local fixture');
      element.setAttribute('countdown-seconds', String(seconds));
      element.setAttribute('expires-at', String(Date.now() + offset));
      element.setAttribute('test-id', 'wc-deadline-card');
      let count = 0;
      element.addEventListener('confirm', (event) => {
        count++;
        result.textContent = `${count}:${(event as CustomEvent).detail.action}`;
      });
      document.body.append(result, element);
    },
    { seconds, offset }
  );
  await expect(page.getByTestId('wc-deadline-card-confirm')).toBeVisible();
};

test('web component honors the absolute expires-at attribute once', async ({ page }) => {
  await mountWidget(page, 30, 5000);
  await page.clock.fastForward(5100);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('1:auto-approved');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('1:auto-approved');
});

test('web component zero countdown retains manual-only approval', async ({ page }) => {
  await mountWidget(page, 0, -1000);
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('0:none');
});

test('web component honors an extended expires-at attribute while pending', async ({ page }) => {
  await mountWidget(page, 30, 5000);
  await page.clock.fastForward(1000);
  await page.evaluate(() => {
    document.querySelector('sui-hitl')?.setAttribute('expires-at', String(Date.now() + 20000));
  });
  await page.clock.fastForward(5100);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('0:none');
  await page.clock.fastForward(15000);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('1:auto-approved');
});

test('web component honors a shortened expiresAt property once', async ({ page }) => {
  await mountWidget(page, 30, 20000);
  await page.clock.fastForward(1000);
  await page.evaluate(() => {
    const element = document.querySelector('sui-hitl') as HTMLElement & { expiresAt: number };
    element.expiresAt = Date.now() + 2000;
  });
  await page.clock.fastForward(2100);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('1:auto-approved');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('wc-deadline-events')).toHaveText('1:auto-approved');
});
