import { expect, test, type Page } from '@playwright/test';
import { componentNav } from '../src/routes/components/_nav';
import { gotoHydrated } from './support/hydrated';
import { focusTabStopBefore, scrollByKey, tabUntilFocused } from './support/tab-order';

// A documentation code block that is wider than its column scrolls inside its own
// box. Chromium and Firefox make such a scroller keyboard-focusable on their own;
// WebKit does not, so a keyboard user there could neither reach nor scroll the
// code. The docs renderer now makes a block a labelled, focusable region exactly
// while it overflows, and leaves it out of the Tab order while it fits.
//
// `scrollable` below is measured by actually scrolling the box, not by comparing
// scrollWidth to clientWidth, so it is independent of the predicate the app uses.
const BLOCKS = '.markdown-body pre, .markdown-body .docs-table-scroll';
const slugs = componentNav.flatMap((group) => group.items.map((item) => item.slug));
// Walking the whole inventory grows with it, so the budget follows the route count.
const loopBudget = slugs.length * 5_000;

// Pages whose docs had overflowing code blocks at 1280px when this was reported.
const PAGES_WITH_WIDE_CODE = [
  'card',
  'stepper',
  'tabs',
  'select',
  'split-input',
  'table',
  'bar-chart',
  'sankey-chart',
  'context-menu',
  'icon',
  'markdown-text'
];

type Block = {
  index: number;
  tag: string;
  scrollable: boolean;
  tabindex: string | null;
  role: string | null;
  label: string | null;
  heading: string | null;
};

const inspectBlocks = (page: Page): Promise<Block[]> =>
  page.evaluate((selector) => {
    const headings = [...document.querySelectorAll('.markdown-body :is(h1,h2,h3,h4,h5,h6)')];
    return [...document.querySelectorAll(selector)].map((el, index) => {
      const heading = headings
        .filter((h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
        .at(-1);
      const before = el.scrollLeft;
      el.scrollLeft = 99_999;
      const scrollable = el.scrollLeft > 0;
      el.scrollLeft = before;
      return {
        index,
        tag: el.tagName.toLowerCase(),
        scrollable,
        tabindex: el.getAttribute('tabindex'),
        role: el.getAttribute('role'),
        label: el.getAttribute('aria-label'),
        heading: heading?.textContent?.trim() ?? null
      };
    });
  }, BLOCKS);

/** What a keyboard user needs of a block that scrolls, and nothing of one that does not. */
const expectAccessMatchesOverflow = (blocks: Block[], where: string): void => {
  for (const block of blocks) {
    const id = `${where} block #${block.index} <${block.tag}>`;
    if (block.scrollable) {
      expect(block.tabindex, `${id} tabindex`).toBe('0');
      expect(block.role, `${id} role`).toBe('region');
      expect(block.label?.trim().length ?? 0, `${id} aria-label`).toBeGreaterThan(0);
      if (block.heading !== null) {
        expect(block.label, `${id} names its section`).toContain(block.heading);
      }
    } else {
      expect(block.tabindex, `${id} fits, so no tabindex`).toBeNull();
      expect(block.role, `${id} fits, so no role`).toBeNull();
      expect(block.label, `${id} fits, so no aria-label`).toBeNull();
    }
  }
  const labels = blocks.filter((b) => b.scrollable).map((b) => b.label);
  expect(new Set(labels).size, `${where}: region labels are unique`).toBe(labels.length);
};

/**
 * One block's access attributes beside the overflow they should follow. `inspectBlocks`
 * reads both in a single page task, so the pair is a consistent snapshot of one instant.
 */
const accessOf = (block: Block | null) => ({
  scrollable: block?.scrollable,
  tabindex: block?.tabindex,
  role: block?.role,
  named: (block?.label?.trim().length ?? 0) > 0
});

const ACCESSIBLE = { scrollable: true, tabindex: '0', role: 'region', named: true };
const PLAIN = { scrollable: false, tabindex: null, role: null, named: false };

/**
 * Waits for the page's access attributes to catch up with its layout, then checks
 * them.
 *
 * The app answers a layout change from a ResizeObserver and a frame callback, so
 * for a moment after the browser has laid the page out the attributes still describe
 * the old layout. Measuring overflow and then asserting the attributes in the next
 * statement therefore tests the scheduler, not the contract; the contract is that
 * they converge. A page that never converges fails here after the timeout.
 */
const settledBlocks = async (page: Page, where: string): Promise<Block[]> => {
  let blocks: Block[] = [];
  await expect(async () => {
    blocks = await inspectBlocks(page);
    expectAccessMatchesOverflow(blocks, where);
  }).toPass({ timeout: 10_000 });
  return blocks;
};

test.describe('documentation code blocks, keyboard access', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`authored radio group semantics survive overflow and resize (${theme})`, async ({
      page
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: 220, height: 640 });
      await gotoHydrated(page, '/components/choicebox');
      const group = page.getByRole('radiogroup', { name: 'Shipping speed', exact: true });
      await expect(group).toHaveCount(1);
      await expect(group).toHaveAttribute('data-scroll-region', '');
      await expect(group).toHaveAttribute('tabindex', '0');
      expect(await group.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
        true
      );
      await focusTabStopBefore(group);
      await page.keyboard.press('Tab');
      await expect(group).toBeFocused();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(group).toHaveCount(1);
      await expect(group).toHaveAttribute('role', 'radiogroup');
      await expect(group).toHaveAttribute('aria-label', 'Shipping speed');
      await expect(group).not.toHaveAttribute('data-scroll-region', /.*/);
      await expect(group).not.toHaveAttribute('tabindex', /.*/);
    });
  }
  test('every overflowing block is a named, focusable region (and only those)', async ({
    page
  }) => {
    test.setTimeout(PAGES_WITH_WIDE_CODE.length * 15_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    let overflowing = 0;
    for (const slug of PAGES_WITH_WIDE_CODE) {
      await gotoHydrated(page, `/components/${slug}`);
      const blocks = await settledBlocks(page, slug);
      overflowing += blocks.filter((b) => b.scrollable).length;
    }
    // Guards against the loop passing because nothing overflowed.
    expect(overflowing).toBeGreaterThanOrEqual(PAGES_WITH_WIDE_CODE.length);
  });

  test('Tab reaches each overflowing block and the arrow keys scroll it', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    let reached = 0;
    for (const slug of PAGES_WITH_WIDE_CODE) {
      await gotoHydrated(page, `/components/${slug}`);
      const blocks = await settledBlocks(page, slug);
      for (const block of blocks.filter((b) => b.scrollable)) {
        const target = page.locator(BLOCKS).nth(block.index);
        await target.scrollIntoViewIfNeeded();
        expect(
          await focusTabStopBefore(target),
          `${slug}#${block.index}: a tab stop precedes it`
        ).toBe(true);
        const presses = await tabUntilFocused(page, target);
        expect(presses, `${slug}#${block.index} (${block.label}) reached by Tab`).not.toBeNull();

        expect(
          await target.evaluate((el) => el.matches(':focus-visible')),
          `${slug}#${block.index} shows :focus-visible after keyboard focus`
        ).toBe(true);
        const ring = await target.evaluate((el) => {
          const style = getComputedStyle(el);
          return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
        });
        expect(ring.style, `${slug}#${block.index} outline style`).not.toBe('none');
        expect(ring.width, `${slug}#${block.index} outline width`).toBeGreaterThan(0);

        const start = await target.evaluate((el) => el.scrollLeft);
        expect(
          await scrollByKey(page, target, start),
          `${slug}#${block.index} scrolls right on ArrowRight`
        ).toBeGreaterThan(start);
        await page.keyboard.press('Home');
        await page.keyboard.press('ArrowLeft');
        reached++;
      }
    }
    expect(reached).toBeGreaterThanOrEqual(PAGES_WITH_WIDE_CODE.length);
  });

  test('a block that fits is not a Tab stop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/components/button');
    const blocks = await settledBlocks(page, 'button');
    const fitting = blocks.filter((b) => !b.scrollable);
    expect(fitting.length).toBeGreaterThan(0);
    for (const block of fitting.slice(0, 4)) {
      const target = page.locator(BLOCKS).nth(block.index);
      await target.scrollIntoViewIfNeeded();
      if (await focusTabStopBefore(target)) {
        expect(
          await tabUntilFocused(page, target, 1),
          `block #${block.index} must be skipped by Tab`
        ).toBeNull();
      }
    }
  });

  test('access follows the viewport width, both ways', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/components/card');
    const wide = await settledBlocks(page, 'card@1280');
    const wideCount = wide.filter((b) => b.scrollable).length;

    await page.setViewportSize({ width: 390, height: 844 });
    const phone = await settledBlocks(page, 'card@390');
    expect(phone.filter((b) => b.scrollable).length).toBeGreaterThan(wideCount);

    await page.setViewportSize({ width: 320, height: 640 });
    await settledBlocks(page, 'card@320');

    await page.setViewportSize({ width: 1280, height: 800 });
    const back = await settledBlocks(page, 'card@1280 again');
    expect(back.map((b) => b.tabindex)).toEqual(wide.map((b) => b.tabindex));
  });

  test('access follows font-size and content changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/components/button');
    const blocks = await settledBlocks(page, 'button');
    const short = blocks.find((b) => b.tag === 'pre' && !b.scrollable);
    expect(short).toBeDefined();
    const index = short?.index ?? 0;
    const stateOf = async () => accessOf((await inspectBlocks(page))[index] ?? null);

    // Each poll below waits on the attributes themselves. Polling only the measured
    // overflow and reading the attributes afterwards raced the app's own update.

    // Bigger type widens the code without changing the box that holds it.
    const style = await page.addStyleTag({
      content: '.markdown-body pre code { font-size: 64px !important; }'
    });
    await expect.poll(stateOf).toEqual(ACCESSIBLE);

    await style.evaluate((node) => node.parentNode?.removeChild(node));
    await expect.poll(stateOf).toEqual(PLAIN);

    // New content, with no resize at all.
    await page
      .locator(BLOCKS)
      .nth(index)
      .evaluate((pre) => {
        pre.setAttribute('data-original-text', pre.textContent ?? '');
        pre.append(document.createTextNode(`\n${'x'.repeat(400)}`));
      });
    await expect.poll(stateOf).toEqual(ACCESSIBLE);

    await page
      .locator(BLOCKS)
      .nth(index)
      .evaluate((pre) => {
        pre.textContent = pre.getAttribute('data-original-text');
      });
    await expect.poll(stateOf).toEqual(PLAIN);
  });

  test('a wide prop table scrolls in a labelled region and keeps its table semantics', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHydrated(page, '/components/select');
    const blocks = await settledBlocks(page, 'select@390');
    const tables = blocks.filter((b) => b.tag === 'div');
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some((b) => b.scrollable)).toBe(true);
    for (const wrapper of tables.filter((b) => b.scrollable)) {
      expect(wrapper.label?.toLowerCase()).toContain('table');
    }
    await expect(page.locator('.markdown-body table').first()).toBeAttached();
    await expect(page.locator('.markdown-body').getByRole('table').first()).toBeVisible();
    await expect(page.locator('.markdown-body').getByRole('columnheader').first()).toBeVisible();
  });

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 }
  ]) {
    test(`on every example at ${viewport.width}px, access matches overflow and the page does not scroll sideways`, async ({
      page
    }) => {
      test.setTimeout(loopBudget);
      await page.setViewportSize(viewport);
      for (const slug of slugs) {
        await gotoHydrated(page, `/components/${slug}`);
        await settledBlocks(page, `${slug}@${viewport.width}`);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          preOverflow: [...document.querySelectorAll('.markdown-body pre')].map(
            (pre) => getComputedStyle(pre).overflowX
          )
        }));
        expect(overflow.scrollWidth, `${slug}: document scrollWidth`).toBeLessThanOrEqual(
          overflow.clientWidth
        );
        // Blocks scroll; none was clipped to make the page fit.
        for (const value of overflow.preOverflow) {
          expect(value).toBe('auto');
        }
      }
    });
  }
});
