import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import {
  readComponentProps,
  readCustomElementDeclaration,
  wrappedComponentPath
} from '../scripts/wc-parity/prop-parity';

/**
 * 4.0.0 leaves one spelling per event, and this is where that is checked
 * against the built elements rather than the source.
 *
 * In 3.x this file asserted the opposite: every aliased event prop had two
 * working spellings on the element, and the lowercase one won when both were
 * set. Those cases are gone with the aliases. What survives is the half that
 * was never about aliases at all — that a declared prop whose name collides
 * with a native `GlobalEventHandlers` accessor (`onclick`, `onfocus`,
 * `ontoggle`) still reaches the component and still leaves `addEventListener`
 * working. That hazard is a property of the lowercase rule itself, so it
 * outlives the migration and is the reason this file is rewritten rather than
 * deleted.
 */

const WC_DIR = join(process.cwd(), 'src/wc/components');

const loadBundle = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-status') !== 'undefined', null, {
    timeout: 15_000
  });
};

/** Event props a component accepts under two spellings differing only by case. */
const casingPairs = (): readonly string[] => {
  const pairs: string[] = [];
  for (const wrapper of readdirSync(WC_DIR)
    .filter((file) => file.endsWith('.wc.svelte'))
    .sort()) {
    const source = readFileSync(join(WC_DIR, wrapper), 'utf8');
    const { tag } = readCustomElementDeclaration(source);
    const componentPath = wrappedComponentPath(source);
    if (tag === null || componentPath === null) {
      continue;
    }
    const grouped = new Map<string, string[]>();
    for (const name of readComponentProps(readFileSync(componentPath, 'utf8')).names) {
      if (!name.startsWith('on')) {
        continue;
      }
      const key = name.toLowerCase();
      grouped.set(key, [...(grouped.get(key) ?? []), name]);
    }
    for (const spellings of grouped.values()) {
      if (spellings.length > 1) {
        pairs.push(`${tag}: ${spellings.join(' / ')}`);
      }
    }
  }
  return pairs;
};

test.describe('one spelling per event', () => {
  test('no component still declares two spellings of the same event', async () => {
    // The 3.x state this release ends: 191 props declared twice, differing only
    // by case. Reading it from the components rather than from a list means a
    // reintroduced alias fails here even if nobody updates a fixture.
    expect(
      casingPairs(),
      'these components declare two spellings of one event, which 4.0.0 removed'
    ).toEqual([]);
  });
});

test.describe('a declared prop whose name is also a native handler', () => {
  test('the declared prop wins over the host accessor it shadows', async ({ page }) => {
    await loadBundle(page);

    // Several of these prop names are real GlobalEventHandlers properties on
    // HTMLElement.prototype, so an assignment might reach the browser's
    // accessor rather than the component's. Measured on sui-toggle because
    // `onclick` is native in exactly the same way `ontoggle` is, and Toggle
    // renders its control unconditionally.
    const result = await page.evaluate(async () => {
      const nativeNames = ['onclick', 'ontoggle', 'onchange', 'onclose'].filter(
        (name) => name in HTMLElement.prototype
      );

      const fired: string[] = [];
      const element = document.createElement('sui-toggle');
      Reflect.set(element, 'onclick', () => fired.push('declared'));
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.click();

      return { nativeNames, fired };
    });

    // The premise, confirmed rather than assumed: these names really are taken
    // on the host, so the shadowing is happening and is not hypothetical.
    expect(result.nativeNames, 'none of these are native, so the test proves nothing').toContain(
      'onclick'
    );
    expect(result.nativeNames).toContain('ontoggle');

    expect(result.fired, 'a native handler name swallowed the declared prop').toEqual(['declared']);
  });

  test('a native-event prop reaches the component through its lowercase name', async ({ page }) => {
    await loadBundle(page);

    // sui-input forwards real DOM events; `onfocus` is its prop and also
    // shadows the host's own handler accessor.
    const fired = await page.evaluate(async () => {
      const element = document.createElement('sui-input');
      let count = 0;
      Reflect.set(element, 'onfocus', () => {
        count += 1;
      });
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.dispatchEvent(new FocusEvent('focus'));
      return count;
    });

    expect(fired, 'onfocus never reached sui-input').toBeGreaterThan(0);
  });
});

test.describe('declaring a native handler name does not take the DOM path with it', () => {
  test('addEventListener still works on an element that declares the same name', async ({
    page
  }) => {
    await loadBundle(page);

    // The shadowing is real and measured above. What matters for a consumer is
    // whether it costs them the DOM, and it does not: the declaration replaces
    // one property, not the event system. "Use addEventListener instead" is the
    // whole mitigation, so the escape hatch is asserted rather than assumed.
    const seen = await page.evaluate(async () => {
      const order: string[] = [];

      const element = document.createElement('sui-toggle');
      element.addEventListener('click', () => order.push('addEventListener'));
      Reflect.set(element, 'onclick', () => order.push('declared-prop'));
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.click();

      return order;
    });

    expect(seen, 'declaring the prop cost the element its DOM event').toContain('addEventListener');
    expect(seen).toContain('declared-prop');
  });

  test('the observed attribute for a declared handler name is claimed once', async ({ page }) => {
    await loadBundle(page);

    // In 3.x `onclick` and `onClick` both lowercased to the same observed
    // attribute, and which one won came down to key order. With one spelling
    // left there is exactly one claim on it, which is the state that made the
    // ambiguity go away rather than merely hiding it.
    const count = await page.evaluate(() => {
      const constructor = customElements.get('sui-toggle');
      const observed =
        typeof constructor === 'function' ? Reflect.get(constructor, 'observedAttributes') : [];
      const list: string[] = Array.isArray(observed) ? observed : [];
      return list.filter((name) => name === 'onclick').length;
    });

    expect(count, 'the attribute is claimed by more than one declaration again').toBe(1);
  });
});
