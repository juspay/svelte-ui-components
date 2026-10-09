import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

async function mountTable(page: Page, caption?: string) {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-table')));
  await page.evaluate((name) => {
    const before = document.createElement('button');
    before.id = 'before-caption-table';
    before.textContent = 'Before test table';
    const host = document.createElement('sui-table');
    host.id = 'caption-table';
    host.style.cssText = 'display:block;width:240px;--table-container-height:150px';
    Object.assign(host, {
      tableHeaders: ['Plan', 'Billing', 'Channels', 'Owners', 'Revenue', 'Active'],
      tableData: Array.from({ length: 20 }, (_, i) => [
        `Growthplan${i + 1}`,
        'Monthly',
        'WebDirect',
        'Alice',
        '128400',
        'Yes'
      ]),
      isTableScrollable: true,
      ...(typeof name === 'string' ? { caption: name } : {})
    });
    const after = document.createElement('button');
    after.id = 'after-caption-table';
    after.textContent = 'After test table';
    document.querySelector('main')?.prepend(before, host, after);
  }, caption);
  const host = page.locator('#caption-table');
  await expect(host.locator('tbody tr')).toHaveCount(20);
  return host;
}

async function tabSequence(page: Page, backward = false) {
  await page.locator(backward ? '#after-caption-table' : '#before-caption-table').click();
  const stops: Array<{ tag: string; classes: string }> = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(backward ? 'Shift+Tab' : 'Tab');
    const active = await page.evaluate(() => {
      let node = document.activeElement;
      while (node?.shadowRoot?.activeElement) {
        node = node.shadowRoot.activeElement;
      }
      return { id: node?.id, tag: node?.tagName ?? '', classes: node?.getAttribute('class') ?? '' };
    });
    if (active.id === (backward ? 'before-caption-table' : 'after-caption-table')) {
      return stops;
    }
    stops.push({ tag: active.tag, classes: active.classes });
  }
  throw new Error('Real Tab never reached the opposite table-boundary control');
}

async function tabToScrollOwner(
  page: Page,
  wrapper: Locator,
  allowDescendant: boolean,
  backward = false
) {
  await page.locator(backward ? '#after-caption-table' : '#before-caption-table').click();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press(backward ? 'Shift+Tab' : 'Tab');
    const reached = await wrapper.evaluate((node, descendants) => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
      }
      return active === node || (descendants && active !== null && node.contains(active));
    }, allowDescendant);
    if (reached) {
      return;
    }
  }
  throw new Error('Real Tab did not reach the existing scroll owner or its operative descendant');
}

async function holdToScroll(page: Page, wrapper: Locator, axis: 'left' | 'top') {
  const { offset, range } = await wrapper.evaluate(
    (node, direction) =>
      direction === 'left'
        ? { offset: node.scrollLeft, range: node.scrollWidth - node.clientWidth }
        : { offset: node.scrollTop, range: node.scrollHeight - node.clientHeight },
    axis
  );
  // Native Tab may reveal a column at the far edge. Move toward available content,
  // rather than treating an already reached boundary as a keyboard failure.
  const backward = offset > range / 2;
  const key =
    axis === 'left' ? (backward ? 'ArrowLeft' : 'ArrowRight') : backward ? 'ArrowUp' : 'ArrowDown';
  await page.keyboard.down(key);
  try {
    await expect
      .poll(() =>
        wrapper
          .evaluate(
            (node, direction) => (direction === 'left' ? node.scrollLeft : node.scrollTop),
            axis
          )
          .then((value) => Math.abs(value - offset))
      )
      .toBeGreaterThan(1);
  } finally {
    await page.keyboard.up(key);
  }
}

test('the two original recipes name actual wrappers and retain native table descendants', async ({
  page
}) => {
  await gotoHydrated(page, '/components/table');
  for (const [id, caption, header, vertical] of [
    ['table-builtin-cells', 'Subscription plan details', 'Plan', false],
    ['table-sticky-header', 'Employee scores by department', 'Name', true]
  ] as const) {
    const host = page.getByTestId(id);
    if (vertical) {
      await expect(host).toHaveAccessibleName(caption);
    } else {
      await expect(host).not.toHaveAttribute('role');
      await expect(host).not.toHaveAttribute('aria-label');
    }
    await expect(host.locator('.table-scroll')).toHaveAccessibleName(caption);
    await expect(host.getByRole('table', { name: caption })).toBeVisible();
    await expect(
      host.getByRole('columnheader', { name: `${header} Sort by ${header}`, exact: true })
    ).toBeVisible();
    await expect(host.locator('caption')).toHaveClass(/sr-only/);
    await expect(host).not.toHaveAttribute('tabindex');
    await expect(host.locator('.table-scroll')).not.toHaveAttribute('tabindex');
  }
});

test('built WC updates localized caption on both groups and preserves empty/default semantics', async ({
  page
}) => {
  const host = await mountTable(page);
  const outer = host.locator('.table-container');
  const inner = host.locator('.table-scroll');
  await expect(outer).not.toHaveAttribute('role');
  await expect(inner).not.toHaveAttribute('role');
  const caption = 'Plans "<review>" & totals';
  await host.evaluate((node, name) => Reflect.set(node, 'caption', name), caption);
  await expect(outer).toHaveAccessibleName(caption);
  await expect(inner).toHaveAccessibleName(caption);
  await expect(host.getByRole('table', { name: caption })).toBeVisible();
  await expect(host.locator('review, script, [onmouseover]')).toHaveCount(0);
  await host.evaluate((node) => node.setAttribute('caption', 'Comparatif des abonnements'));
  await expect(outer).toHaveAccessibleName('Comparatif des abonnements');
  await expect(inner).toHaveAccessibleName('Comparatif des abonnements');
  await host.evaluate((node) => node.removeAttribute('caption'));
  await expect(outer).not.toHaveAttribute('role');
  await expect(inner).not.toHaveAttribute('aria-label');
  await host.evaluate((node) => Reflect.set(node, 'caption', 'Explicitly restored context'));
  await expect(inner).toHaveAccessibleName('Explicitly restored context');
  await host.evaluate((node) => Reflect.set(node, 'caption', ''));
  await expect(outer).not.toHaveAttribute('role');
  await expect(inner).not.toHaveAttribute('aria-label');
  await expect(host.locator('caption')).toHaveCount(0);
});

test('caption keeps native Tab policy through nested overflow, real scrolling and fit resize', async ({
  page,
  browserName
}) => {
  const host = await mountTable(page);
  const outer = host.locator('.table-container');
  const inner = host.locator('.table-scroll');
  await expect.poll(() => inner.evaluate((n) => n.scrollWidth - n.clientWidth)).toBeGreaterThan(20);
  await expect
    .poll(() => outer.evaluate((n) => n.scrollHeight - n.clientHeight))
    .toBeGreaterThan(20);
  const rawOverflowStops = await tabSequence(page);
  const rawOverflowReverseStops = await tabSequence(page, true);
  await host.evaluate((node) => Reflect.set(node, 'caption', 'Subscription plan details'));
  await expect(inner).toHaveAccessibleName('Subscription plan details');
  expect(await tabSequence(page)).toEqual(rawOverflowStops);
  expect(await tabSequence(page, true)).toEqual(rawOverflowReverseStops);
  // Firefox's automatic scroll DIV stop is the precise native arrival gap.
  // Other engines use the already operative descendants; neither receives new tab stops.
  await tabToScrollOwner(page, inner, browserName !== 'firefox');
  await holdToScroll(page, inner, 'left');
  await tabToScrollOwner(page, outer, browserName !== 'firefox');
  await holdToScroll(page, outer, 'top');
  await tabToScrollOwner(page, inner, browserName !== 'firefox', true);
  await holdToScroll(page, inner, 'left');
  await tabToScrollOwner(page, outer, browserName !== 'firefox', true);
  await holdToScroll(page, outer, 'top');
  await host.evaluate((node) => {
    node.style.width = '800px';
    Reflect.set(node, 'isTableScrollable', false);
    Reflect.set(node, 'caption', '');
  });
  await expect.poll(() => inner.evaluate((n) => n.scrollWidth <= n.clientWidth)).toBe(true);
  await expect.poll(() => outer.evaluate((n) => n.scrollHeight <= n.clientHeight)).toBe(true);
  const rawFitStops = await tabSequence(page);
  await host.evaluate((node) => Reflect.set(node, 'caption', 'Subscription plan details'));
  await expect(outer).not.toHaveAttribute('role');
  await expect(inner).toHaveAccessibleName('Subscription plan details');
  await expect(host.getByRole('table', { name: 'Subscription plan details' })).toBeVisible();
  expect(await tabSequence(page)).toEqual(rawFitStops);
});

test('named nested groups preserve author mobile table, row and cell roles', async ({ page }) => {
  const host = await mountTable(page, 'Subscription plan details');
  await host.evaluate((node) => Reflect.set(node, 'mobileCardLayout', true));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    host.getByRole('group', { name: 'Subscription plan details', exact: true })
  ).toHaveCount(2);
  const table = host.getByRole('table', { name: 'Subscription plan details' });
  await expect(table).toHaveAttribute('role', 'table');
  await expect(table.locator('tbody tr').first()).toHaveAttribute('role', 'row');
  await expect(table.getByRole('cell', { name: 'Growthplan1', exact: true })).toBeVisible();
  await expect(host.locator('.table-container, .table-scroll')).toHaveCount(2);
});

test('configured vertical tables name only an actual overflow owner as content and height resize', async ({
  page,
  browserName
}) => {
  const host = await mountTable(page, 'Subscription plan details');
  const outer = host.locator('.table-container');
  const inner = host.locator('.table-scroll');
  await host.evaluate((node) => {
    const allRows = Reflect.get(node, 'tableData') as string[][];
    Reflect.set(node, 'tableData', allRows.slice(0, 1));
    node.style.setProperty('--table-container-height', '200px');
  });
  await expect.poll(() => outer.evaluate((n) => n.scrollHeight <= n.clientHeight)).toBe(true);
  await expect(outer).not.toHaveAttribute('role');
  await expect(outer).not.toHaveAttribute('aria-label');
  await expect(inner).toHaveAccessibleName('Subscription plan details');
  await tabToScrollOwner(page, inner, browserName !== 'firefox');
  await holdToScroll(page, inner, 'left');
  await host.evaluate((node) => node.style.setProperty('--table-container-height', '50px'));
  await expect.poll(() => outer.evaluate((n) => n.scrollHeight > n.clientHeight)).toBe(true);
  await expect(outer).toHaveAccessibleName('Subscription plan details');
  await host.evaluate((node) => node.setAttribute('caption', 'Tableau des abonnements'));
  await expect(outer).toHaveAccessibleName('Tableau des abonnements');
  await expect(inner).toHaveAccessibleName('Tableau des abonnements');
  await host.evaluate((node) => node.style.setProperty('--table-container-height', '200px'));
  await expect(outer).not.toHaveAttribute('role');
  await expect(inner).toHaveAccessibleName('Tableau des abonnements');
  await expect(host.getByRole('table', { name: 'Tableau des abonnements' })).toBeVisible();
});
