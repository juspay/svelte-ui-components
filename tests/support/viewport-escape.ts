import type { Page } from '@playwright/test';

/**
 * An element that is painted past the left or right edge of the viewport with no
 * ancestor to account for it: nothing clips it and nothing scrolls it.
 */
export type EscapedElement = {
  /** `tag.class[data-pw] "text"`, enough to find it in the page. */
  description: string;
  left: number;
  right: number;
};

/**
 * Finds content the viewport edge is the only thing cutting off.
 *
 * `document.scrollWidth` cannot see these. A box inside an ancestor with
 * `contain: layout` (or `overflow: clip`, or a transform) adds nothing to the
 * document's scrollable width, so the page reports "no horizontal overflow" while
 * a button is half off-screen and cannot be scrolled to. HITL's third demo did
 * exactly that on a phone: its Confirm button read "Confi".
 *
 * An element passes when any ancestor between it and the document has a
 * non-`visible` horizontal `overflow` that the element's box actually crosses --
 * a scroll region lets the reader get to it, and a component that clips its own
 * contents (a carousel's off-stage slides) has decided that on purpose. What fails
 * is the case where no such ancestor exists, because then nothing but the edge of
 * the screen is hiding it.
 *
 * Hidden, zero-size and fixed-position elements are skipped: the closed drawer is
 * `visibility: hidden`, and fixed layers are positioned against the viewport.
 */
export const findEscapedElements = (page: Page): Promise<EscapedElement[]> =>
  page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const describe = (el: Element): string => {
      const classes =
        typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2) : [];
      const hook = el.getAttribute('data-pw');
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
      return (
        el.tagName.toLowerCase() +
        (classes.length > 0 ? `.${classes.join('.')}` : '') +
        (hook === null ? '' : `[${hook}]`) +
        (text.length > 0 ? ` "${text}"` : '')
      );
    };
    const clippedByAncestor = (el: Element, box: DOMRect): boolean => {
      for (let node = el.parentElement; node !== null; node = node.parentElement) {
        if (node === document.documentElement) {
          return false;
        }
        if (getComputedStyle(node).overflowX === 'visible') {
          continue;
        }
        const bounds = node.getBoundingClientRect();
        if (box.right > bounds.right + 1 || box.left < bounds.left - 1) {
          return true;
        }
      }
      return false;
    };

    const escaped: EscapedElement[] = [];
    for (const el of document.body.querySelectorAll('*')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) {
        continue;
      }
      if (!(box.right > viewport + 1 || box.left < -1)) {
        continue;
      }
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.position === 'fixed') {
        continue;
      }
      if (clippedByAncestor(el, box)) {
        continue;
      }
      escaped.push({
        description: describe(el),
        left: Math.round(box.left),
        right: Math.round(box.right)
      });
    }
    return escaped;
  });
