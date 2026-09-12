import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// `attributes` was missing from the reserved-name list in scripts/wc-parity, and it
// is not a harmless shadow: Svelte's custom-element layer ITERATES `this.attributes`
// while syncing attributes onto props, so the wrapper that declared it threw
// "this.attributes is not iterable" during render and left `<sui-checkbox>` with an
// empty shadow root for every consumer.
//
// The list was originally built by asking a browser for ARIAMixin names and the 114
// `on*` handlers. That is the right method and it simply asked too narrow a question,
// so this asks the whole one: every name on the Element prototype chain, checked
// against every prop every wrapper declares. A hand-maintained list cannot notice the
// name nobody thought of.
//
// It has to run in a real browser, and the cheaper version is not equivalent. Running
// the same sweep under jsdom finds `attributes` and `draggable` but MISSES `inputMode`
// and `spellcheck`, because jsdom does not implement them on its HTMLElement prototype
// at all. A jsdom or static version of this check therefore under-reports while looking
// authoritative — measured, not assumed, by a second party running exactly that
// comparison.
const WC_DIR = join(process.cwd(), 'src/wc/components');

type Declaration = { readonly tag: string; readonly props: readonly string[] };

const declarations = (): Declaration[] =>
  readdirSync(WC_DIR)
    .filter((file) => file.endsWith('.wc.svelte'))
    .flatMap((file) => {
      const source = readFileSync(join(WC_DIR, file), 'utf8');
      const tag = source.match(/tag:\s*'([a-z-]+)'/);
      const block = source.match(/props:\s*\{([\s\S]*?)\n {4}\}/);
      if (tag === null || block === null) {
        return [];
      }
      const props = [...block[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map((match) => match[1]);
      return [{ tag: tag[1], props }];
    });

/**
 * Recorded rather than failed on, the way KNOWN_HOST_EVENT_HANDLER_DECLARATIONS in
 * scripts/wc-parity/prop-parity.test.ts records its set: each of these shadows a real
 * `HTMLElement` accessor, but each was measured WORKING — Svelte's declared setter
 * reflects to the attribute, so the native behaviour survives (`spellcheck` has its own
 * coverage in tests/wc-review-findings.spec.ts). Renaming a public prop is a breaking
 * change and belongs in a major, which is the same conclusion this repo reached for the
 * 27 names it renamed at 4.0.
 *
 * `attributes` is deliberately NOT here. It did not merely shadow an accessor: Svelte's
 * custom-element layer iterates `this.attributes`, so the element threw and rendered
 * nothing. Fixing that is a bug fix, and it could not break a consumer because the
 * element never worked.
 */
const KNOWN_PLATFORM_SHADOWS: readonly string[] = [
  'sui-chat-bubble:draggable',
  'sui-input:inputMode',
  'sui-input:spellcheck'
];

test.describe('custom-element props do not shadow the platform', () => {
  test('no declared prop collides with a name on the Element prototype chain', async ({ page }) => {
    await page.goto('/');

    const platformNames = await page.evaluate(() => {
      const names = new Set<string>();
      let proto: object | null = HTMLElement.prototype;
      while (proto !== null) {
        for (const name of Object.getOwnPropertyNames(proto)) {
          names.add(name);
        }
        proto = Object.getPrototypeOf(proto);
      }
      return [...names];
    });

    // `on*` handlers are recorded separately and deliberately by
    // scripts/wc-parity/prop-parity.test.ts, which lists every existing one and fails
    // on a new one; excluded here so the same fact is not enforced in two places.
    const platform = new Set(platformNames.filter((name) => !name.startsWith('on')));

    const collisions = declarations()
      .flatMap(({ tag, props }) =>
        props.filter((prop) => platform.has(prop)).map((prop) => `${tag}:${prop}`)
      )
      .filter((entry) => !KNOWN_PLATFORM_SHADOWS.includes(entry));

    expect(collisions, 'wrapper props that replace a native accessor').toEqual([]);
  });

  test('sui-checkbox renders, and shows its own checkmark with no host content', async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () => typeof customElements.get('sui-checkbox') !== 'undefined',
      null,
      { timeout: 15_000 }
    );

    const measured = await page.evaluate(async () => {
      const box = document.createElement('sui-checkbox');
      box.setAttribute('text', 'Accept terms');
      box.setAttribute('checked', '');
      document.body.append(box);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const root = box.shadowRoot;
      return {
        rendered: (root?.innerHTML ?? '').length > 0,
        ariaChecked: root?.querySelector('[role="checkbox"]')?.getAttribute('aria-checked') ?? null,
        checkmark: (root?.querySelector('.box .icon')?.innerHTML ?? '').trim().length > 0
      };
    });

    expect(errors).toEqual([]);
    expect(measured.rendered, 'the element renders at all').toBe(true);
    expect(measured.ariaChecked).toBe('true');
    // The reported claim: the wrapper supplies checkedIcon unconditionally, so the
    // component's own `{:else}` checkmark can never render through the element.
    expect(measured.checkmark, "the component's own default checkmark renders").toBe(true);
  });
});
