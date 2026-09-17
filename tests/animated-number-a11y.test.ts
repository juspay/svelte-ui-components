import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * Every column keeps all ten glyphs in the DOM so a roll has something to move
 * through, and those are real text nodes. `aria-hidden` on the glyph stack keeps
 * them out of the accessibility tree, but selection and find-in-page read the
 * text layer rather than that tree, so the value is carried separately by a
 * visually-hidden `.animated-number-plain` node -- clipped rather than
 * `display: none`, because the point is to stay IN the text layer.
 *
 * Staying in the text layer is exactly what put it in the accessibility tree
 * too. The component claimed that sitting inside the `role="img"` root was
 * enough, on the reading that `img` has presentational children -- ARIA does say
 * user agents SHOULD treat them that way, and Chromium does not. Measured inside
 * one counter: `image "99"`, `StaticText "99"` and `InlineTextBox "99"`, so a
 * screen reader met the number twice, and for an adopter like Badge -- whose
 * root is a `status` live region -- twice on every change.
 *
 * This asserts the shape that claim was always meant to describe: exactly one
 * named node inside the component, and it is the image. A DOM-level check could
 * not say this. `role="img"` and `aria-hidden` are both present either way; what
 * changed is what the browser's own accessibility tree does with them, so the
 * assertion has to come from that tree.
 *
 * Chromium-only: the tree is read over CDP, which WebKit and Firefox do not
 * expose. The behaviour under test is a DOM contract, not an engine quirk.
 */

const ROUTE = '/components/animated-number';

test.describe('AnimatedNumber accessibility tree', () => {
  test('exposes its value exactly once, as the image, not also as text', async ({
    page,
    browserName
  }) => {
    test.skip(browserName !== 'chromium', 'the accessibility tree is read over CDP');

    await gotoHydrated(page, ROUTE);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    await cdp.send('DOM.enable');

    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '[data-pw="counter"]'
    });
    expect(nodeId).toBeTruthy();
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');

    const byId = new Map(nodes.map((entry) => [entry.nodeId, entry]));
    const counter = nodes.find((entry) => entry.backendDOMNodeId === node.backendNodeId);
    expect(counter).toBeTruthy();

    // Walks up rather than down: the tree is flat here, and a node's ancestry is
    // the only thing that says whether it belongs to this component or to some
    // other odometer on the same demo page.
    const insideCounter = (entry: (typeof nodes)[number]): boolean => {
      let current: (typeof nodes)[number] | null = entry;
      for (let depth = 0; depth < 40 && current; depth += 1) {
        if (current.nodeId === counter?.nodeId) {
          return true;
        }
        current = current.parentId ? (byId.get(current.parentId) ?? null) : null;
      }
      return false;
    };

    const named = nodes
      .filter((entry) => !entry.ignored && entry.name?.value && insideCounter(entry))
      .map((entry) => `${entry.role?.value}"${entry.name?.value}"`);

    // Before the fix this read:
    //   ['image"99"', 'StaticText"99"', 'InlineTextBox"99"']
    expect(named).toEqual(['image"99"']);
  });

  test('still yields the number when selected and copied, at rest and mid-roll', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);

    const selectionOf = (): Promise<string> =>
      page.evaluate(() => {
        const element = document.querySelector('[data-pw="counter"]');
        if (element === null) {
          return 'COUNTER NOT FOUND';
        }
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        const text = selection?.toString() ?? '';
        selection?.removeAllRanges();
        return text;
      });

    // The guarantee the hidden node exists for, and the reason it cannot simply
    // be deleted to keep the accessibility tree clean: without it a selection
    // sweeps up every glyph a column is holding.
    expect((await selectionOf()).trim()).toBe('99');

    await page.evaluate(() =>
      document
        .querySelector('[data-pw="counter"]')
        ?.setAttribute('style', '--animated-number-digit-transition-duration: 4s')
    );
    await page.getByRole('button', { name: '+7', exact: true }).click();
    await page.waitForTimeout(900);

    const displayed = await page.evaluate(
      () =>
        [...document.querySelectorAll('[data-pw="counter"] .animated-number-digit-glyph')].filter(
          (glyph) => getComputedStyle(glyph).display !== 'none'
        ).length
    );
    // Mid-roll every column has revealed all ten of its glyphs.
    expect(displayed).toBeGreaterThan(10);
    expect((await selectionOf()).trim()).toBe('106');
  });
});
