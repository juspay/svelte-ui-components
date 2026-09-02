import { expect, test } from '@playwright/test';

// The four form custom elements (sui-chip-input, sui-color-picker, sui-combobox,
// sui-split-input) had no browser-level coverage: the build emitting a tag string is not
// evidence that the element registers, that a kebab-case attribute reaches the prop, or that
// a callback arrives with its declared contract.
//
// dist-wc is a self-contained bundle rather than a route of the demo site, so it is injected
// into a same-origin page instead of being navigated to. `pnpm run build` (the webServer
// command in playwright.config.ts) runs build:wc, so the file exists whenever these run.
const TAGS = ['sui-chip-input', 'sui-color-picker', 'sui-combobox', 'sui-split-input'] as const;

const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    (tags) => tags.every((tag) => typeof customElements.get(tag) !== 'undefined'),
    TAGS as unknown as string[],
    { timeout: 15_000 }
  );
};

test.describe('web-component wrappers', () => {
  test('all four tags register as custom elements', async ({ page }) => {
    await loadBundle(page);
    const defined = await page.evaluate(
      (tags) => tags.map((tag) => [tag, typeof customElements.get(tag) !== 'undefined']),
      TAGS as unknown as string[]
    );
    expect(defined).toEqual(TAGS.map((tag) => [tag, true]));
  });

  test('kebab-case attributes reach the underlying prop', async ({ page }) => {
    await loadBundle(page);
    const measured = await page.evaluate(async () => {
      const chip = document.createElement('sui-chip-input');
      chip.setAttribute('aria-label', 'Test customer emails');
      const split = document.createElement('sui-split-input');
      split.setAttribute('length', '6');
      document.body.append(chip, split);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const deep = (root: ShadowRoot | Element, selector: string): Element | null => {
        const direct = root.querySelector(selector);
        if (direct) {
          return direct;
        }
        for (const child of root.querySelectorAll('*')) {
          if (child.shadowRoot) {
            const found = deep(child.shadowRoot, selector);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };
      return {
        chipName: deep(chip.shadowRoot as ShadowRoot, 'input')?.getAttribute('aria-label') ?? null,
        splitInputs: split.shadowRoot?.querySelectorAll('input').length ?? 0
      };
    });
    expect(measured.chipName).toBe('Test customer emails');
    expect(measured.splitInputs).toBe(6);
  });

  // A property whose name begins with `on` is a DOM event-handler name, so it would be
  // reasonable to assume Svelte's custom-element layer leaves it to the browser and the
  // callback never reaches the component. It does not: a declared prop gets a real accessor,
  // and the callback arrives with the component's own contract. Asserting the ARGUMENT is
  // what distinguishes the two -- a DOM listener would be handed an Event.
  test('callback props named on* are forwarded as callbacks, not DOM event listeners', async ({
    page
  }) => {
    await loadBundle(page);
    const received = await page.evaluate(async () => {
      const chip = document.createElement('sui-chip-input') as HTMLElement & {
        onadd?: (value: string) => void;
      };
      document.body.append(chip);
      await new Promise((resolve) => setTimeout(resolve, 300));
      let arg: unknown = '(never called)';
      chip.onadd = (value: unknown) => {
        arg = value instanceof Event ? `Event(${value.type})` : value;
      };
      const input = chip.shadowRoot?.querySelector('input');
      if (input) {
        input.focus();
        input.value = 'alpha';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 120));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      return arg;
    });
    expect(received).toBe('alpha');
  });

  // ChipInput reassigns `values` when a chip is added. Spreading it one-way left the host
  // element's property frozen at whatever the consumer last set, so a consumer reading
  // element.values back saw stale state while the component's own view had moved on.
  test('bindable props propagate back to the host element', async ({ page }) => {
    await loadBundle(page);
    const result = await page.evaluate(async () => {
      const chip = document.createElement('sui-chip-input') as HTMLElement & { values?: string[] };
      document.body.append(chip);
      await new Promise((resolve) => setTimeout(resolve, 300));
      chip.values = ['seed'];
      await new Promise((resolve) => setTimeout(resolve, 250));
      const afterSet = JSON.stringify(chip.values);
      const input = chip.shadowRoot?.querySelector('input');
      if (input) {
        input.focus();
        input.value = 'beta';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 120));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      return { afterSet, afterAdd: JSON.stringify(chip.values) };
    });
    expect(result.afterSet).toBe(JSON.stringify(['seed']));
    expect(result.afterAdd).toBe(JSON.stringify(['seed', 'beta']));
  });

  // docs/Combobox.md states the snippet props are set as properties. That is only true if they
  // are declared in customElement.props -- an undeclared name gets no accessor, so the
  // assignment lands on the DOM node and never reaches the component.
  test('every documented Combobox snippet prop has an accessor', async ({ page }) => {
    await loadBundle(page);
    const missing = await page.evaluate(async () => {
      const combobox = document.createElement('sui-combobox');
      document.body.append(combobox);
      await new Promise((resolve) => setTimeout(resolve, 250));
      const hasAccessor = (name: string): boolean => {
        let proto: object | null = Object.getPrototypeOf(combobox);
        while (proto) {
          if (Object.getOwnPropertyDescriptor(proto, name)) {
            return true;
          }
          proto = Object.getPrototypeOf(proto);
        }
        return false;
      };
      return [
        'itemSnippet',
        'emptySnippet',
        'inputPrefix',
        'inputSuffix',
        'dropdownHeader',
        'dropdownFooter',
        'pillSnippet',
        'actionIcon'
      ].filter((name) => !hasAccessor(name));
    });
    expect(missing).toEqual([]);
  });
});

test.describe('web-component wrappers — props added after the first cut', () => {
  test('sui-chip-input exposes editable as an attribute and onedit as a property', async ({
    page
  }) => {
    await loadBundle(page);
    await page.evaluate(() => {
      const chip = document.createElement('sui-chip-input') as HTMLElement & {
        values: string[];
        onedit: (value: string, previousValue: string) => void;
      };
      chip.setAttribute('test-id', 'wc-edit');
      chip.setAttribute('editable', '');
      chip.values = ['sale'];
      (window as Window & { __edits?: [string, string][] }).__edits = [];
      chip.onedit = (value, previousValue) => {
        (window as Window & { __edits?: [string, string][] }).__edits?.push([value, previousValue]);
      };
      document.body.append(chip);
    });

    // Without the prop declared, clicking a chip is inert: no edit field ever renders.
    await page.locator('sui-chip-input [data-pw="wc-edit-item-0"]').click();
    const editField = page.locator('sui-chip-input [data-pw="wc-edit-item-0-edit"]');
    await expect(editField).toBeVisible();
    await editField.fill('clearance');
    await editField.press('Enter');

    await expect
      .poll(() => page.evaluate(() => (window as Window & { __edits?: unknown }).__edits))
      .toEqual([['clearance', 'sale']]);
  });

  test('sui-status renders statusText as the tag named by status-text-tag', async ({ page }) => {
    await loadBundle(page);
    await page.evaluate(() => {
      const status = document.createElement('sui-status');
      status.setAttribute('status-text', 'Order confirmed');
      status.setAttribute('status-description', 'Thanks for shopping');
      status.setAttribute('status-text-tag', 'h2');
      document.body.append(status);
    });
    const heading = page.locator('sui-status h2.status-text');
    await expect(heading).toHaveText('Order confirmed');
    await expect(heading).not.toHaveClass(/status-text-default/);
  });
});
