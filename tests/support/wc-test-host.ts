import type { Page } from '@playwright/test';

export const wcTestHostPath = '/__wc-test-host.html';

/** A same-origin document whose only bundle is the one the caller chooses to load. */
export async function gotoWcTestHost(page: Page): Promise<void> {
  await page.route(
    (url) => url.pathname === wcTestHostPath,
    (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="en"><meta charset="utf-8"><title>Custom element test host</title><body></body></html>'
      }),
    { times: 1 }
  );
  await page.goto(wcTestHostPath);
}
