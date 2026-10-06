import { expect, test, type Page } from '@playwright/test';
import { componentNav } from '../src/routes/components/_nav';
import { gotoHydrated } from './support/hydrated';
import { focusTabStopBefore, scrollByKey, tabUntilFocused } from './support/tab-order';
import { findEscapedElements } from './support/viewport-escape';

// The example app's sidebar used to be a fixed 260px column at every width. At a
// 390px phone that left ~130px of main area, crushed every padded example and made
// the document scroll sideways (Select: 566px wide). The shell now collapses its
// navigation into a drawer below 1024px.
//
// Nothing here injects CSS to hide the sidebar: the old tests worked around the
// shell with a `display: none` shim, which proves nothing about the shell itself.
//
// Each theme runs the same checks because the shell is themed through --doc-*
// tokens and a dark-only regression (invisible menu button, scrim) is otherwise
// invisible to a light-only run.
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const NARROW = { width: 320, height: 640 };

const MENU_NAME = 'Navigation menu';
const CLOSE_NAME = 'Close navigation menu';

const routes = componentNav.flatMap((group) => group.items);
// Walking the whole inventory grows with it, so the budget follows the route count.
const loopBudget = routes.length * 5_000;

const documentOverflow = (page: Page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));

/** True when focus is on the page body or inside the element matching `selector`. */
const focusIsWithinOrLeft = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const active = document.activeElement;
    return active === null || active === document.body || active.closest(sel) !== null;
  }, selector);

for (const theme of ['light', 'dark'] as const) {
  test.describe(`app shell, ${theme} theme`, () => {
    test.use({ colorScheme: theme });

    test('desktop keeps the persistent sidebar and shows no menu button', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await gotoHydrated(page, '/components/select');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      const sidebar = page.getByTestId('app-sidebar');
      await expect(sidebar).toBeVisible();
      expect((await sidebar.boundingBox())?.width).toBe(260);
      expect((await page.locator('main').boundingBox())?.width).toBe(900);
      await expect(page.getByRole('button', { name: MENU_NAME, exact: true })).toBeHidden();
      // The drawer's own close button is phone-only; left visible it crowds the
      // header and pushes the theme switcher past the sidebar's edge.
      await expect(page.getByRole('button', { name: CLOSE_NAME, exact: true })).toBeHidden();
      const sidebarOverflow = await sidebar.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      }));
      expect(sidebarOverflow.scrollWidth).toBeLessThanOrEqual(sidebarOverflow.clientWidth);
      const switcher = await sidebar.getByRole('button', { name: 'Dark theme' }).boundingBox();
      const sidebarBox = await sidebar.boundingBox();
      expect((switcher?.x ?? 0) + (switcher?.width ?? 0)).toBeLessThanOrEqual(
        (sidebarBox?.x ?? 0) + (sidebarBox?.width ?? 0)
      );
      await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);
      await expect(sidebar.getByRole('link', { name: 'Select', exact: true })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    test('a phone gives the content the full width and puts navigation behind a menu button', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      for (const slug of ['card', 'select']) {
        await gotoHydrated(page, `/components/${slug}`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const menu = page.getByRole('button', { name: MENU_NAME, exact: true });
        await expect(menu).toBeVisible();
        const menuBox = await menu.boundingBox();
        expect(menuBox?.width).toBeGreaterThanOrEqual(44);
        expect(menuBox?.height).toBeGreaterThanOrEqual(44);
        await expect(page.getByTestId('app-sidebar')).toBeHidden();

        const main = await page.locator('main').boundingBox();
        expect(main?.width).toBe(PHONE.width);
        const { scrollWidth, clientWidth } = await documentOverflow(page);
        expect(scrollWidth, `${slug}: document scrollWidth`).toBeLessThanOrEqual(clientWidth);
      }
    });

    test('the first Tab stop on a phone is the menu button, not a hidden sidebar link', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/button');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: MENU_NAME, exact: true })).toBeFocused();
    });

    test('the drawer opens, takes focus, makes the page inert, and Escape returns focus', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');

      const menu = page.getByRole('button', { name: MENU_NAME, exact: true });
      const controlled = await menu.getAttribute('aria-controls');
      expect(controlled).not.toBeNull();
      const sidebar = page.locator(`#${controlled}`);
      await expect(sidebar).toHaveJSProperty('tagName', 'ASIDE');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');

      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(sidebar).toBeVisible();
      await expect(page.getByRole('button', { name: CLOSE_NAME, exact: true })).toBeFocused();
      await expect(page.locator('main')).toHaveAttribute('inert', '');
      await expect(page.getByTestId('app-topbar')).toHaveAttribute('inert', '');

      await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(sidebar).toBeHidden();
      await expect(menu).toBeFocused();
      await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);
    });

    test('keyboard Tab stays inside the open drawer and never reaches the inert page', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');

      await page.getByRole('button', { name: MENU_NAME, exact: true }).click();
      await expect(page.getByRole('button', { name: CLOSE_NAME, exact: true })).toBeFocused();

      const seen = new Set<string>();
      for (let press = 0; press < 12; press++) {
        await page.keyboard.press('Tab');
        expect(
          await focusIsWithinOrLeft(page, '[data-pw="app-sidebar"]'),
          `Tab press ${press + 1}`
        ).toBe(true);
        seen.add(
          await page.evaluate(
            () =>
              document.activeElement?.getAttribute('aria-label') ??
              document.activeElement?.textContent?.trim() ??
              ''
          )
        );
      }
      // It really walked the drawer's controls rather than idling on one.
      expect(seen.size).toBeGreaterThan(3);

      for (let press = 0; press < 6; press++) {
        await page.keyboard.press('Shift+Tab');
        expect(
          await focusIsWithinOrLeft(page, '[data-pw="app-sidebar"]'),
          `Shift+Tab press ${press + 1}`
        ).toBe(true);
      }
    });

    test('choosing a link navigates, closes the drawer, and titles the page', async ({ page }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');
      const menu = page.getByRole('button', { name: MENU_NAME, exact: true });

      await menu.click();
      await page
        .getByTestId('app-sidebar')
        .getByRole('link', { name: 'Button', exact: true })
        .click();
      await page.waitForURL('**/components/button');
      await expect(page).toHaveTitle('Button — Svelte UI');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByTestId('app-sidebar')).toBeHidden();
      await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);
      const { scrollWidth, clientWidth } = await documentOverflow(page);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test('the scrim closes the drawer and returns focus to the menu button', async ({ page }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');
      const menu = page.getByRole('button', { name: MENU_NAME, exact: true });

      await menu.click();
      await expect(page.getByTestId('app-sidebar')).toBeVisible();
      // The drawer is 320px wide on a 390px phone, so x=380 is the scrim.
      await page.mouse.click(380, 400);
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByTestId('app-sidebar')).toBeHidden();
      await expect(menu).toBeFocused();
    });

    test('the theme switcher inside the drawer still works', async ({ page }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');
      await page.getByRole('button', { name: MENU_NAME, exact: true }).click();
      const other = theme === 'light' ? 'Dark theme' : 'Light theme';
      await page.getByTestId('app-sidebar').getByRole('button', { name: other }).click();
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        theme === 'light' ? 'dark' : 'light'
      );
    });

    test('resizing across the breakpoint resets the drawer in both directions', async ({
      page
    }) => {
      // Two breakpoint crossings and a drawer open on each side: ~25 round trips,
      // which does not fit the 30s default when the machine is busy.
      test.setTimeout(90_000);
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');
      const menu = page.getByRole('button', { name: MENU_NAME, exact: true });
      const sidebar = page.getByTestId('app-sidebar');

      await menu.click();
      await expect(sidebar).toBeVisible();
      await expect(page.locator('main')).toHaveAttribute('inert', '');

      await page.setViewportSize(DESKTOP);
      await expect(sidebar).toBeVisible();
      expect((await sidebar.boundingBox())?.width).toBe(260);
      await expect(menu).toBeHidden();
      await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);
      await expect(page.getByTestId('app-topbar')).not.toHaveAttribute('inert', /.*/);
      expect((await page.locator('main').boundingBox())?.width).toBe(900);

      await page.setViewportSize(PHONE);
      await expect(sidebar).toBeHidden();
      await expect(menu).toBeVisible();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);

      await menu.click();
      await expect(sidebar).toBeVisible();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
    });

    test('a 320px phone still has a usable drawer and no document overflow', async ({ page }) => {
      await page.setViewportSize(NARROW);
      await gotoHydrated(page, '/components/card');
      const { scrollWidth, clientWidth } = await documentOverflow(page);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      const menu = page.getByRole('button', { name: MENU_NAME, exact: true });
      await menu.click();
      const sidebar = page.getByTestId('app-sidebar');
      await expect(sidebar).toBeVisible();
      // The drawer slides in; measure it once it has stopped, not mid-slide.
      await expect.poll(async () => (await sidebar.boundingBox())?.x).toBe(0);
      // Everything in the drawer header fits inside the drawer, not past its edge.
      const drawer = await sidebar.boundingBox();
      for (const control of [
        page.getByRole('button', { name: CLOSE_NAME, exact: true }),
        sidebar.getByRole('button', { name: 'Dark theme' }),
        sidebar.getByRole('textbox')
      ]) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
          (drawer?.x ?? 0) + (drawer?.width ?? 0) + 0.5
        );
      }
      await page.keyboard.press('Escape');
      await expect(menu).toBeFocused();
    });

    test('a fixed-width example scrolls in its own labelled, keyboard-reachable region on a phone', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/stepper');
      const rows = page.locator('.demo-row[data-scroll-region]');
      await expect(rows.first()).toBeVisible();
      expect(await rows.count()).toBeGreaterThan(0);

      const first = rows.first();
      await expect(first).toHaveAttribute('role', 'region');
      await expect(first).toHaveAttribute('tabindex', '0');
      await expect(first).toHaveAttribute('aria-label', /^Example: .+/);
      expect(await first.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
      const { scrollWidth, clientWidth } = await documentOverflow(page);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      await first.scrollIntoViewIfNeeded();
      expect(await focusTabStopBefore(first)).toBe(true);
      expect(await tabUntilFocused(page, first)).not.toBeNull();
      const start = await first.evaluate((el) => el.scrollLeft);
      expect(await scrollByKey(page, first, start)).toBeGreaterThan(start);
    });

    test('an example row is only a scroll region while it overflows, and never at desktop width', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/stepper');
      await expect(page.locator('.demo-row[data-scroll-region]').first()).toBeVisible();
      // Rows that fit stay ordinary rows: no role, no Tab stop, `overflow` untouched.
      const fitting = await page.evaluate(() =>
        [...document.querySelectorAll('.demo-row')]
          .filter((row) => !row.hasAttribute('data-scroll-region'))
          .map((row) => ({
            tabindex: row.getAttribute('tabindex'),
            role: row.getAttribute('role'),
            overflowX: getComputedStyle(row).overflowX
          }))
      );
      for (const row of fitting) {
        expect(row).toEqual({ tabindex: null, role: null, overflowX: 'visible' });
      }

      await page.setViewportSize(DESKTOP);
      await expect(page.locator('.demo-row[data-scroll-region]')).toHaveCount(0);
      const atDesktop = await page.evaluate(() =>
        [...document.querySelectorAll('.demo-row')].map((row) => getComputedStyle(row).overflowX)
      );
      expect(atDesktop.every((value) => value === 'visible')).toBe(true);

      await page.setViewportSize(PHONE);
      await expect(page.locator('.demo-row[data-scroll-region]').first()).toBeVisible();
    });

    test('long documentation code scrolls inside its own block, not the document', async ({
      page
    }) => {
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/select');
      const overflowing = await page.evaluate(() =>
        [...document.querySelectorAll('.markdown-body pre')]
          .filter((pre) => pre.scrollWidth > pre.clientWidth)
          .map((pre) => ({
            scrollWidth: pre.scrollWidth,
            width: pre.getBoundingClientRect().width,
            overflowX: getComputedStyle(pre).overflowX
          }))
      );
      expect(overflowing.length).toBeGreaterThan(0);
      for (const block of overflowing) {
        expect(block.overflowX).toBe('auto');
        expect(block.width).toBeLessThanOrEqual(PHONE.width);
      }
      const { scrollWidth, clientWidth } = await documentOverflow(page);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test('the escape detector sees content that document.scrollWidth cannot', async ({ page }) => {
      // The sweep below is only as good as this predicate, so prove it on a page
      // where the answer is known: the same 120px box 40px past the right edge,
      // once in a layout-contained wrapper (what HITL's card is) and once in a
      // scrolling wrapper (what a labelled scroll region is).
      await page.setViewportSize(PHONE);
      await gotoHydrated(page, '/components/button');
      const addProbe = (wrapperStyle: string, id: string) =>
        page.evaluate(
          ([style, probeId]) => {
            const wrapper = document.createElement('div');
            wrapper.id = probeId;
            wrapper.style.cssText = style;
            const inner = document.createElement('button');
            inner.textContent = 'Past the edge';
            inner.style.cssText = 'display:block;margin-left:310px;width:120px;height:40px;';
            wrapper.append(inner);
            document.querySelector('main')?.prepend(wrapper);
          },
          [wrapperStyle, id]
        );

      expect(await findEscapedElements(page), 'a clean page reports nothing').toEqual([]);

      await addProbe('contain: layout;', 'probe-contained');
      const { scrollWidth, clientWidth } = await documentOverflow(page);
      expect(
        scrollWidth,
        'layout containment hides the overflow from the document, which is the blind spot'
      ).toBeLessThanOrEqual(clientWidth);
      const found = await findEscapedElements(page);
      expect(found.map((item) => item.description)).toEqual([
        expect.stringContaining('Past the edge')
      ]);
      expect(found[0]?.right).toBeGreaterThan(PHONE.width);
      await page.evaluate(() => document.getElementById('probe-contained')?.remove());

      await addProbe('overflow-x: auto;', 'probe-scrolling');
      expect(await findEscapedElements(page), 'a scrolling ancestor accounts for it').toEqual([]);
    });

    for (const viewport of [PHONE, NARROW]) {
      test(`no example overflows the document or leaves content past the edge at ${viewport.width}px`, async ({
        page
      }) => {
        test.setTimeout(loopBudget);
        await page.setViewportSize(viewport);
        const offenders: string[] = [];
        for (const route of routes) {
          await gotoHydrated(page, `/components/${route.slug}`);
          const { scrollWidth, clientWidth } = await documentOverflow(page);
          if (scrollWidth > clientWidth) {
            offenders.push(`${route.slug}: document ${scrollWidth} > ${clientWidth}`);
          }
          // Not implied by the check above: contained content does not widen the
          // document, so a button can be cut off by the screen with scrollWidth intact.
          for (const escaped of await findEscapedElements(page)) {
            offenders.push(
              `${route.slug}: ${escaped.description} spans ${escaped.left}..${escaped.right}`
            );
          }
        }
        expect(offenders).toEqual([]);
      });
    }
  });
}
