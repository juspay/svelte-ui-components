import { expect, test, type Page } from '@playwright/test';
import { readWrapperParity } from '../scripts/wc-parity/prop-parity';

/**
 * The unit guard proves the wrapper *source* declares every prop. This proves
 * the built bundle actually exposes them: a declared prop becomes a real
 * accessor on the element's prototype, where an undeclared one is just an
 * expando the component never reads. That difference is the whole bug, and it
 * only exists after the compiler has run.
 *
 * dist-wc is a self-contained bundle rather than a route of the demo site, so it
 * is injected into a same-origin page instead of being navigated to.
 * `pnpm run build` (the webServer command) runs build:wc, so the file exists.
 */
const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-status') !== 'undefined', null, {
    timeout: 15_000
  });
};

const parity = readWrapperParity().filter(
  (entry) => entry.tag !== null && entry.declared.length > 0
);

test.describe('built custom elements expose every declared prop', () => {
  test('every declared prop is a real accessor, not an expando', async ({ page }) => {
    await loadBundle(page);

    const wanted = parity.map((entry) => ({ tag: entry.tag, props: entry.declared }));

    const missing = await page.evaluate((elements) => {
      const gaps: string[] = [];
      for (const { tag, props } of elements) {
        if (tag === null || typeof customElements.get(tag) !== 'function') {
          gaps.push(`${tag ?? '(no tag)'}: element never defined`);
          continue;
        }
        const element = document.createElement(tag);
        for (const prop of props) {
          // A declared prop lands as a getter/setter pair on the generated
          // class's prototype. `in` alone would also pass for an inherited
          // HTMLElement property, so the descriptor is what settles it.
          let found = false;
          let proto: object | null = Object.getPrototypeOf(element);
          while (proto !== null && proto !== HTMLElement.prototype) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
            if (descriptor !== null && typeof descriptor?.set === 'function') {
              found = true;
              break;
            }
            proto = Object.getPrototypeOf(proto);
          }
          if (!found) {
            gaps.push(`${tag}.${prop}`);
          }
        }
      }
      return gaps;
    }, wanted);

    expect(
      missing,
      `props declared but not reachable on the element: ${missing.join(', ')}`
    ).toEqual([]);
  });

  test('a newly declared prop reaches the rendered shadow tree', async ({ page }) => {
    await loadBundle(page);

    // testId was declared on Status.svelte but absent from its wrapper, so a
    // web-component consumer could set it and nothing happened. The component
    // renders it as data-pw on its root, which makes the fix observable rather
    // than merely present.
    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'parity-proof';
      element.setAttribute('status-text', 'Payment Successful');
      element.setAttribute('test-id', 'status-proof');
      document.body.append(element);
    });

    // A locator rather than a bare evaluate: Playwright's CSS engine pierces
    // open shadow roots and auto-waits, where querying straight after append
    // races the custom element's first render.
    await expect(page.locator('#parity-proof [data-pw="status-proof"]')).toBeAttached();
    await expect(page.locator('#parity-proof')).toContainText('Payment Successful');
  });

  // `sui-badge` declares a prop named `hidden`, which shadows the accessor
  // HTMLElement defines. Predicting from that alone that `element.hidden = true`
  // would stop hiding it turned out to be WRONG when measured: Svelte's declared
  // setter reflects to the `hidden` attribute, so the native behaviour survives.
  // Kept as a passing test because the prediction was the thing that needed
  // checking, and because a future change to that reflection would break real
  // consumers silently.
  test('a declared prop named hidden still hides the host element', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const element = document.createElement('sui-badge');
      element.id = 'hidden-proof';
      element.setAttribute('label', 'Overdue');
      document.body.append(element);
    });

    await page.locator('#hidden-proof').waitFor();
    await page.evaluate(() => {
      const element = document.querySelector('#hidden-proof');
      if (element instanceof HTMLElement) {
        element.hidden = true;
      }
    });

    await expect(page.locator('#hidden-proof')).toBeHidden();
  });

  test('every wrapper in the directory is registered by the bundle', async ({ page }) => {
    await loadBundle(page);

    // AttachmentChipRow, HITL and TypewriterText had wrappers on disk that
    // src/wc/index.ts never imported, so customElements.define never ran and the
    // tags did not exist for any consumer. Nothing referenced those files, so no
    // build error ever pointed at it.
    const tags = parity.map((entry) => entry.tag);
    const undefinedTags = await page.evaluate(
      (names) =>
        names.filter((name) => name !== null && typeof customElements.get(name) !== 'function'),
      tags
    );

    expect(
      undefinedTags,
      `wrappers exist but are never registered: ${undefinedTags.join(', ')}`
    ).toEqual([]);
  });

  test('light-DOM content is really assigned to a slot, not merely present', async ({ page }) => {
    await loadBundle(page);

    // The earlier version of this test asserted the text of the light-DOM node
    // itself, which is true whether or not the node is ever projected — it
    // passed against a wrapper that rendered no <slot> at all. assignedSlot is
    // the property that distinguishes projected from inert.
    const projection = await page.evaluate(async () => {
      const element = document.createElement('sui-card');
      element.id = 'slot-proof';
      const slotted = document.createElement('span');
      slotted.textContent = 'projected child';
      element.append(slotted);
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 250));
      return {
        assigned: slotted.assignedSlot !== null,
        // The whole reason `children` is now host-reserved: declaring it left
        // element.children undefined, so el.children.length threw.
        nativeChildren: element.children instanceof HTMLCollection,
        childCount: element.children instanceof HTMLCollection ? element.children.length : -1
      };
    });

    expect(projection.assigned, 'light-DOM child was never assigned to a slot').toBe(true);
    expect(projection.nativeChildren, 'element.children is not an HTMLCollection').toBe(true);
    expect(projection.childCount).toBe(1);
  });
});
