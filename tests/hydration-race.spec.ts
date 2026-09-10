import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * Regression coverage for the suite's own intermittent failures.
 *
 * Specs navigated and interacted immediately. Every demo page is
 * server-rendered, so a trigger is present, visible and clickable before its
 * handler exists, and Playwright has no actionability check for "a listener is
 * attached" -- so a click arriving before hydration was delivered to inert
 * markup and silently lost. The assertion after it then failed as a timeout
 * naming the missing element rather than the real cause. It surfaced only under
 * load: a full run at the default worker count failed 8 of 713, a run of the
 * same commit at `--workers=2` failed 0, and the failures moved between tests
 * from run to run.
 *
 * Delaying the module scripts turns that window into a certainty, so these two
 * cases pin the race deterministically instead of waiting for a bad day.
 */

const delayScripts = async (page: Parameters<typeof gotoHydrated>[0]): Promise<void> => {
  await page.route('**/*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });
};

test.describe('demo pages are only driven once they are interactive', () => {
  test('a click before hydration is lost, which is what made the suite flaky', async ({ page }) => {
    await delayScripts(page);
    await page.goto('/components/menu', { waitUntil: 'commit' });

    const menu = page.locator('[data-pw="menu-default-demo"]');
    const trigger = menu.locator('.menu-trigger');

    // Passes every actionability check Playwright makes, while inert.
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(menu.locator('.menu-dropdown')).toHaveCount(0);
  });

  test('the same click through gotoHydrated opens the menu', async ({ page }) => {
    await delayScripts(page);
    await gotoHydrated(page, '/components/menu');

    const menu = page.locator('[data-pw="menu-default-demo"]');
    await menu.locator('.menu-trigger').click();

    await expect(menu.locator('.menu-dropdown')).toBeVisible();
  });
});
