import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  readComponentProps,
  readCustomElementDeclaration,
  wrappedComponentPath
} from '../scripts/wc-parity/prop-parity';

/**
 * Phase 1 of the event-casing migration gave 56 components a second spelling for
 * each grandfathered event prop, both wired to the same handler. It stopped at
 * the Svelte layer. A custom element only forwards what `customElement.props`
 * declares, so every corrected spelling was unreachable from a web component --
 * `<sui-toggle onClick={fn}>` set an expando the component never read.
 *
 * The unit ratchet in scripts/wc-parity proves the wrapper *source* declares
 * both. This proves the built element honours them: that both spellings are real
 * accessors, that each one actually reaches the component, and that declaring
 * them together did not break the one that already worked.
 *
 * That last point is the reason this file exists rather than a line in the
 * ratchet. No wrapper had ever declared both spellings of the same event before,
 * and Svelte derives an observed attribute by lowercasing the prop name, so
 * `onclick` and `onClick` resolve to the same attribute and `$$g_p` returns
 * whichever key `Object.keys` yields first. Reasoning says that is harmless for
 * function props, which cannot come from an attribute anyway. Measuring it is
 * cheap, and the last time this library reasoned about a custom-element prop
 * instead of measuring it -- `children` -- the reasoning was wrong.
 */

const WC_DIR = join(process.cwd(), 'src/wc/components');

const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-status') !== 'undefined', null, {
    timeout: 15_000
  });
};

type CasingPair = { readonly tag: string; readonly spellings: readonly string[] };

/**
 * Event props a component accepts under two spellings that differ only by case.
 *
 * Derived from the components rather than from the ratchet's `missing` list on
 * purpose: `missing` empties out the moment the declarations land, which would
 * leave this test asserting nothing. The pairs survive, so the browser keeps
 * being asked the question after the fix.
 *
 * Direction is deliberately not inferred here. It is not always "camelCase is
 * the correct one": DESIGN_PRINCIPLES keeps Svelte's lowercase spelling for a
 * native DOM event forwarded as-is, so Input's `onFocus(event: FocusEvent)`
 * corrects *to* `onfocus` while Toggle's `onclick(checked: boolean)` corrects to
 * `onClick`. Both spellings have to work either way, which is all this asks.
 */
const casingPairs = (): readonly CasingPair[] => {
  const pairs: CasingPair[] = [];
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
        pairs.push({ tag, spellings });
      }
    }
  }
  return pairs;
};

const PAIRS = casingPairs();

test.describe('custom elements accept both spellings of every aliased event prop', () => {
  test('both spellings are real accessors on the built element', async ({ page }) => {
    await loadBundle(page);

    expect(PAIRS.length, 'no aliased event pairs found -- the fixture is broken').toBeGreaterThan(
      100
    );

    const gaps = await page.evaluate((pairs) => {
      const missing: string[] = [];
      for (const { tag, spellings } of pairs) {
        if (typeof customElements.get(tag) !== 'function') {
          missing.push(`${tag}: element never defined`);
          continue;
        }
        const element = document.createElement(tag);
        for (const prop of spellings) {
          // Stops at HTMLElement.prototype so a native handler accessor
          // (onclick, onfocus and friends all live there) is never mistaken for
          // a declared prop. Only a setter the generated class owns counts.
          let found = false;
          let proto: object | null = Object.getPrototypeOf(element);
          while (proto !== null && proto !== HTMLElement.prototype) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
            if (typeof descriptor?.set === 'function') {
              found = true;
              break;
            }
            proto = Object.getPrototypeOf(proto);
          }
          if (!found) {
            missing.push(`${tag}.${prop}`);
          }
        }
      }
      return missing;
    }, PAIRS);

    expect(
      gaps,
      `spellings accepted by the component but not by the element: ${gaps.join(', ')}`
    ).toEqual([]);
  });

  test('the corrected spelling reaches the component through the element', async ({ page }) => {
    await loadBundle(page);

    // sui-toggle corrects onclick -> onClick, and its handler is observable:
    // clicking the shadow checkbox calls it with the new checked state.
    const calls = await page.evaluate(async () => {
      const element = document.createElement('sui-toggle');
      const seen: boolean[] = [];
      Reflect.set(element, 'onClick', (checked: boolean) => seen.push(checked));
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.click();
      return seen;
    });

    expect(calls, 'onClick never fired -- the corrected spelling is unreachable').toEqual([true]);
  });

  test('the legacy spelling still reaches the component', async ({ page }) => {
    await loadBundle(page);

    // The regression guard for declaring both. If adding onClick had cost the
    // element its onclick, this is where it would show.
    const calls = await page.evaluate(async () => {
      const element = document.createElement('sui-toggle');
      const seen: boolean[] = [];
      Reflect.set(element, 'onclick', (checked: boolean) => seen.push(checked));
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.click();
      return seen;
    });

    expect(calls, 'onclick stopped firing once onClick was declared alongside it').toEqual([true]);
  });

  test('the corrected spelling wins when both are set', async ({ page }) => {
    await loadBundle(page);

    // Matches the component's own precedence, `$derived(onClick ?? onclickLegacy)`.
    // A web-component consumer setting both must get the same answer a Svelte
    // consumer passing both would get, or the two entry points disagree.
    const winner = await page.evaluate(async () => {
      const element = document.createElement('sui-toggle');
      const seen: string[] = [];
      Reflect.set(element, 'onclick', () => seen.push('legacy'));
      Reflect.set(element, 'onClick', () => seen.push('corrected'));
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.click();
      return seen;
    });

    expect(winner, 'the element disagrees with the component about which spelling wins').toEqual([
      'corrected'
    ]);
  });

  test('a native-event prop corrected to lowercase reaches the component', async ({ page }) => {
    await loadBundle(page);

    // The other direction. sui-input forwards real DOM events, so its correct
    // spelling is Svelte's lowercase one: onFocus is the legacy name and onfocus
    // is the target. Declaring `onfocus` also shadows the host's own handler
    // accessor, which is exactly why it is worth watching in a browser.
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

test.describe('a declared prop whose name is also a native handler', () => {
  test('the declared prop wins over the host accessor it shadows', async ({ page }) => {
    await loadBundle(page);

    // Raised by a reviewer about `ontoggle`: several of these prop names are
    // real GlobalEventHandlers properties on HTMLElement.prototype, so an
    // assignment might reach the browser's accessor rather than the component's
    // -- the `children` hazard again, where declaring a host name cost the host
    // its own behaviour.
    //
    // Measured on sui-toggle rather than sui-accordion. `onclick` is native in
    // exactly the same way `ontoggle` is, and Toggle renders its control
    // unconditionally, whereas Accordion's trigger lives behind `{#if trigger}`
    // and needs a snippet prop -- an element with no trigger has nothing to
    // click, which makes the observation about the fixture rather than the
    // library. The mechanism under test is identical.
    const result = await page.evaluate(async () => {
      const nativeNames = ['onclick', 'ontoggle', 'onchange', 'onclose'].filter(
        (name) => name in HTMLElement.prototype
      );

      const fired: string[] = [];
      const legacy = document.createElement('sui-toggle');
      Reflect.set(legacy, 'onclick', () => fired.push('legacy'));
      document.body.append(legacy);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      legacy.shadowRoot?.querySelector('input')?.click();

      const corrected = document.createElement('sui-toggle');
      Reflect.set(corrected, 'onClick', () => fired.push('corrected'));
      document.body.append(corrected);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      corrected.shadowRoot?.querySelector('input')?.click();

      return { nativeNames, fired };
    });

    // The premise, confirmed rather than assumed: these names really are taken
    // on the host, so the shadowing is happening and is not hypothetical.
    expect(result.nativeNames, 'none of these are native, so the test proves nothing').toContain(
      'onclick'
    );
    expect(result.nativeNames).toContain('ontoggle');

    // And the declaration wins anyway, in both spellings.
    expect(result.fired, 'a native handler name swallowed the declared prop').toEqual([
      'legacy',
      'corrected'
    ]);
  });
});

test.describe('declaring a native handler name does not take the DOM path with it', () => {
  test('addEventListener still works on an element that declares the same name', async ({
    page
  }) => {
    await loadBundle(page);

    // Review on #512 held that declaring `onclick`/`onfocus`/`oninput` shadows
    // the native GlobalEventHandlers accessor, and so changes web-component
    // behaviour. The shadowing is real and measured in the test above. What
    // matters for a consumer is whether it costs them the DOM, and it does not:
    // the declaration replaces one property, not the event system. This asserts
    // the escape hatch actually exists rather than assuming it does, because
    // "use addEventListener instead" is the whole mitigation.
    const seen = await page.evaluate(async () => {
      const order: string[] = [];

      const element = document.createElement('sui-toggle');
      element.addEventListener('click', () => order.push('addEventListener'));
      Reflect.set(element, 'onClick', () => order.push('declared-prop'));
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      element.shadowRoot?.querySelector('input')?.click();

      return order;
    });

    // Both run. The listener is not displaced by the prop, and the prop is not
    // displaced by the listener.
    expect(seen, 'declaring the prop cost the element its DOM event').toContain('addEventListener');
    expect(seen).toContain('declared-prop');
  });

  test('the shared observed attribute resolves to the legacy spelling', async ({ page }) => {
    await loadBundle(page);

    // The other half of that review: `onclick` and `onClick` both lowercase to
    // the `onclick` attribute, so Svelte's `$$g_p` returns whichever key
    // `Object.keys` yields first, and the finding called that undocumented
    // key-enumeration behaviour to rely on. It is -- for the attribute path,
    // which is inert here because a function cannot be written as an HTML
    // attribute. Property assignment is unaffected: each declared key gets its
    // own accessor, which is why precedence holds in the tests above.
    //
    // Pinned by driving the attribute rather than by counting it. An earlier
    // version asserted only that `onclick` appears twice in observedAttributes,
    // while the comment claimed it would catch a reordering -- which it would
    // not have, since both entries are the same string. Review caught the gap.
    // Setting the attribute and reading both properties back shows which key
    // actually won, so a reordering of the declarations fails here.
    const resolved = await page.evaluate(async () => {
      const constructor = customElements.get('sui-toggle');
      const observed =
        typeof constructor === 'function' ? Reflect.get(constructor, 'observedAttributes') : [];
      const list: string[] = Array.isArray(observed) ? observed : [];

      const element = document.createElement('sui-toggle');
      document.body.append(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      // `type: 'Object'` runs the attribute through JSON.parse, so a parseable
      // marker lands on whichever prop the attribute resolved to.
      element.setAttribute('onclick', '{"marker":true}');
      await new Promise((resolve) => requestAnimationFrame(resolve));

      return {
        onclickCount: list.filter((name) => name === 'onclick').length,
        legacyGotIt: JSON.stringify(Reflect.get(element, 'onclick')),
        correctedGotIt: JSON.stringify(Reflect.get(element, 'onClick'))
      };
    });

    // Both declarations really do claim the same attribute -- the premise the
    // finding rests on, confirmed rather than taken on trust.
    expect(resolved.onclickCount, 'the two spellings no longer share an attribute').toBe(2);

    // And the legacy key is the one it resolves to, because it is declared
    // first. This is the assertion a reordering would break.
    expect(resolved.legacyGotIt, 'the attribute stopped resolving to the legacy spelling').toBe(
      '{"marker":true}'
    );
  });
});
