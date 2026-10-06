import { expect, test } from '@playwright/test';
import { componentNav } from '../src/routes/components/_nav';
import { gotoHydrated } from './support/hydrated';

// Every example page used to ship an empty <title>, so browser tabs, history
// entries and assistive technology could not tell the pages apart. The title is
// derived from the nav inventory, so these loops walk that same inventory: a demo
// added to `_nav.ts` is covered here without anyone remembering to add a case.
const routes = componentNav.flatMap((group) => group.items);
const expectedTitle = (name: string): string => `${name} — Svelte UI`;
// A loop over the whole inventory grows with it: routes other groups add are walked
// too, so the budget follows the route count instead of a figure that fits today's 101.
const MS_PER_ROUTE = 5_000;
const loopBudget = routes.length * MS_PER_ROUTE;

test.describe('document titles', () => {
  test('literal spot checks match the documented format', async ({ page }) => {
    await gotoHydrated(page, '/components/select');
    await expect(page).toHaveTitle('Select — Svelte UI');
    await gotoHydrated(page, '/components/chat-compositions');
    await expect(page).toHaveTitle('Chat compositions — Svelte UI');
  });

  test('the server-rendered HTML of every example carries its title', async ({ request }) => {
    const wrong: string[] = [];
    for (const route of routes) {
      const response = await request.get(`/components/${route.slug}`);
      const html = await response.text();
      const title = /<title[^>]*>([^<]*)<\/title>/.exec(html)?.[1] ?? null;
      if (title !== expectedTitle(route.name)) {
        wrong.push(`${route.slug}: ${JSON.stringify(title)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  test('a direct load of every example ends with its title after hydration', async ({ page }) => {
    test.setTimeout(loopBudget);
    const wrong: string[] = [];
    for (const route of routes) {
      await gotoHydrated(page, `/components/${route.slug}`);
      const title = await page.title();
      if (title !== expectedTitle(route.name)) {
        wrong.push(`${route.slug}: ${JSON.stringify(title)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  test('client-side navigation updates the title for every example, and history restores it', async ({
    page
  }) => {
    test.setTimeout(loopBudget);
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, `/components/${routes[0].slug}`);
    await expect(page).toHaveTitle(expectedTitle(routes[0].name));

    const nav = page.locator('aside nav');
    const wrong: string[] = [];
    for (const route of routes.slice(1)) {
      // WebKit limits history.pushState to 100 calls per ten seconds. Keep
      // genuine client navigation and every route/history assertion, paced
      // within that platform limit rather than retrying an aborted sequence.
      await page.waitForTimeout(200);
      // Real SvelteKit navigation: the layout stays mounted, so only a reactive
      // title can change here.
      await nav.getByRole('link', { name: route.name, exact: true }).click();
      await page.waitForURL(`**/components/${route.slug}`, { waitUntil: 'domcontentloaded' });
      await expect
        .poll(() => page.title(), {
          message: `title after navigating to ${route.slug}`,
          timeout: 2_000
        })
        .toBe(expectedTitle(route.name))
        .catch(() => {
          wrong.push(route.slug);
        });
    }
    expect(wrong).toEqual([]);

    const last = routes[routes.length - 1];
    const beforeLast = routes[routes.length - 2];
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(expectedTitle(beforeLast.name));
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(expectedTitle(last.name));
  });
});
