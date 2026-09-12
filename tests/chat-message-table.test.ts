import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * `MarkdownText` states the rule in its own styles: "`display: block` on a
 * `<table>` is what would make `overflow-x` work on the element itself, but it
 * also strips the table's semantics for assistive technology, so the scroll
 * container is a separate box and the table stays a table."
 *
 * `ChatMessage` renders the same markdown through the same renderer but styled
 * the table instead of the wrapper, so a chat table was `display: block` --
 * scrollable, and no longer a table to a screen reader. That is the defect this
 * covers.
 *
 * The wrapper's focus ring is a legibility change, not a conformance fix: the
 * browser's own `auto 1px` ring was already there, so this was never a WCAG
 * 2.4.7 failure. The rule below replaces it with the 2px treatment the rest of
 * the library uses, because 1px is easy to lose against a message bubble.
 *
 * Chat is where markdown tables overwhelmingly land, so this is the surface that
 * mattered most and the one that had it wrong.
 */
test.describe('ChatMessage wide tables', () => {
  test('the wrapper scrolls and the table keeps its semantics', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    const message = page.getByTestId('chat-message-table');
    const wrapper = message.locator('.markdown-table-wrapper');
    await expect(wrapper).toBeVisible();

    const styles = await wrapper.evaluate((node) => {
      const table = node.querySelector('table');
      return {
        wrapperOverflowX: getComputedStyle(node).overflowX,
        wrapperDisplay: getComputedStyle(node).display,
        tableDisplay: table === null ? 'no-table' : getComputedStyle(table).display,
        tabindex: node.getAttribute('tabindex')
      };
    });

    // The wrapper is the scroll container.
    expect(styles.wrapperOverflowX).toBe('auto');
    expect(styles.wrapperDisplay).toBe('block');
    // And the table is still a table -- this is the assistive-technology half.
    expect(styles.tableDisplay).toBe('table');
    // The renderer makes the wrapper a tab stop so the scroll is reachable.
    expect(styles.tabindex).toBe('0');
  });

  test('the focusable wrapper shows a focus ring', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    const wrapper = page.getByTestId('chat-message-table').locator('.markdown-table-wrapper');
    await wrapper.focus();
    // :focus-visible is a heuristic; a key press while focused settles it in every
    // engine, same as tests/markdown-text-table-scroll.test.ts.
    await page.keyboard.press('ArrowRight');

    const outline = await wrapper.evaluate((node) => {
      const style = getComputedStyle(node);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });

    // Asserting "a ring exists" would pass on the UA default too, so it would
    // not test this rule at all. The 2px solid treatment is what this adds.
    expect(outline.style).toBe('solid');
    expect(outline.width).toBe('2px');
  });
});
