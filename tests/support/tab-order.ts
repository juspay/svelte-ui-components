import { test, type Locator, type Page } from '@playwright/test';

/**
 * Focuses the closest preceding tab stop in document order, so a single REAL Tab
 * press reaches `target` if, and only if, the browser treats it as a tab stop.
 *
 * `locator.focus()` cannot answer that question: it focuses anything with a
 * tabindex, and for a scroller WebKit never makes keyboard-focusable on its own
 * the call would succeed while Tab still skips the element.
 *
 * Resolves false when nothing precedes the target.
 */
export const focusTabStopBefore = (target: Locator): Promise<boolean> =>
  target.evaluate((el) => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'summary',
      '[tabindex]'
    ].join(',');
    const before = [...document.querySelectorAll(selector)].filter((candidate) => {
      if (
        candidate === el ||
        !(candidate.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
      ) {
        return false;
      }
      const tabindex = candidate.getAttribute('tabindex');
      if (tabindex !== null && Number(tabindex) < 0) {
        return false;
      }
      if (candidate.closest('[inert]') !== null) {
        return false;
      }
      const style = getComputedStyle(candidate);
      if (style.visibility === 'hidden' || style.display === 'none') {
        return false;
      }
      const box = candidate.getBoundingClientRect();
      return box.width > 0 || box.height > 0;
    });
    const previous = before.at(-1);
    if (!(previous instanceof HTMLElement || previous instanceof SVGElement)) {
      return false;
    }
    previous.focus();
    return true;
  });

/**
 * Presses Tab until `target` holds focus. Resolves with how many presses it took,
 * or null if it was not reached within `maxPresses`.
 */
export const tabUntilFocused = async (
  page: Page,
  target: Locator,
  maxPresses = 3
): Promise<number | null> => {
  for (let presses = 1; presses <= maxPresses; presses++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((el) => el === document.activeElement)) {
      return presses;
    }
  }
  return null;
};

/**
 * Presses `key` on the focused scroller until its horizontal scroll position moves
 * past `from`, and resolves with the new position (or the last one read, if it
 * never moved within the timeout).
 *
 * Two engine behaviours make a bare "press once and read" unreliable, neither of
 * which is about the page under test:
 *
 *  - WebKit applies a keyboard scroll to a scroller only once the focus change has
 *    been committed to its scrolling tree: a key sent in the same few milliseconds
 *    as the Tab that focused it is dropped. Measured against this app's docs blocks:
 *    6 of 6 presses dropped at 0 ms after focus, 0 of 6 at 100 ms. So it retries.
 *  - After a Tab that jumps a long way down a page (the nearest preceding tab stop
 *    can be thousands of pixels above a docs block), Firefox sometimes leaves the
 *    newly focused element off-screen, and then sends the arrow keys to the
 *    document. A plain static page with one input, 5000px of text and a focusable
 *    overflowing `pre` does the same in Firefox (2 of 12 Tab presses left the block
 *    unscrolled-to, 5 of 12 arrow sequences did nothing), so it is the engine, not
 *    the app. A person would see the page not follow focus and scroll to it, so the
 *    block is brought into view first; if keys are still ignored after 2s it is
 *    re-focused once, and the test is annotated so the fallback is never silent.
 *
 * Whether the scroller is a Tab stop at all, the defect these tests exist for, is
 * asserted strictly by `tabUntilFocused`, not here.
 */
export const scrollByKey = async (
  page: Page,
  target: Locator,
  from: number,
  key = 'ArrowRight',
  timeoutMs = 8_000
): Promise<number> => {
  await target.scrollIntoViewIfNeeded();
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  let refocused = false;
  let position = from;
  while (Date.now() < deadline) {
    // WebKit's native overflow scroll requires keydown to survive a frame.
    // The paired native-control timing cases preserve the zero-duration result.
    await page.keyboard.press(key, { delay: 50 });
    await page.waitForTimeout(150);
    position = await target.evaluate((el) => el.scrollLeft);
    if (position > from) {
      return position;
    }
    if (!refocused && Date.now() - startedAt > 2_000) {
      refocused = true;
      test.info().annotations.push({
        type: 'arrow-key refocus',
        description: `${key} did not scroll the focused block for 2s; re-focused it once`
      });
      await target.evaluate((el) => {
        el.blur();
        el.focus();
      });
    }
  }
  return position;
};
