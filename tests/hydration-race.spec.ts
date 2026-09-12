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

/**
 * Holds every module script until the test releases it, rather than delaying
 * them by a fixed 2000ms.
 *
 * The fixed delay was a bet that the click below would land inside the window,
 * and on a loaded machine it lost: hydration completed first, the menu opened,
 * and `toHaveCount(0)` failed -- the test that exists to prove the race is
 * real became the suite's own most reliable flake. A hold the test controls
 * cannot expire early, so the case is pinned rather than probable.
 */
const holdScripts = async (
  page: Parameters<typeof gotoHydrated>[0]
): Promise<{ release: () => void }> => {
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/*.js', async (route) => {
    await held;
    await route.continue();
  });
  return { release };
};

/**
 * A bounded delay is still right for the second case: it only has to prove that
 * `gotoHydrated` waits, and a delay that runs long makes that case pass more
 * firmly rather than less. Only the first case is falsified by the delay
 * expiring early.
 */
const delayScripts = async (page: Parameters<typeof gotoHydrated>[0]): Promise<void> => {
  await page.route('**/*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });
};

test.describe('demo pages are only driven once they are interactive', () => {
  test('a click before hydration is lost, which is what made the suite flaky', async ({ page }) => {
    const { release } = await holdScripts(page);
    try {
      await page.goto('/components/menu', { waitUntil: 'commit' });

      const menu = page.locator('[data-pw="menu-default-demo"]');
      const trigger = menu.locator('.menu-trigger');

      // Passes every actionability check Playwright makes, while inert. The
      // scripts are still held at this point, so this is a fact about the page
      // rather than a race the machine's load decides.
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(menu.locator('.menu-dropdown')).toHaveCount(0);
    } finally {
      // Let the held requests finish so teardown does not wait on them.
      release();
    }
  });

  test('the same click through gotoHydrated opens the menu', async ({ page }) => {
    await delayScripts(page);
    await gotoHydrated(page, '/components/menu');

    const menu = page.locator('[data-pw="menu-default-demo"]');
    await menu.locator('.menu-trigger').click();

    await expect(menu.locator('.menu-dropdown')).toBeVisible();
  });
});
