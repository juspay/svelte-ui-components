import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Six components relocated a node with `document.body.appendChild`.
 *
 * Svelte scopes a custom element's CSS to its shadow root, so a node moved into
 * the light DOM keeps its `svelte-*` scoping class and loses every rule behind
 * it. Inside a `<sui-*>` element the portalled node therefore rendered unstyled:
 * measured in Chromium on `sui-select`, the dropdown's `position` fell back to
 * `static`, its background to transparent, and its border, shadow and z-index to
 * none — a list of bare option text dropped at the end of `<body>`.
 *
 * Each site now resolves its destination from the node's own root instead, so
 * the node never leaves the tree that holds its stylesheet. That is a no-op in
 * the light DOM (`getRootNode()` is the document, the target is still
 * `document.body`) and the whole fix inside a shadow root.
 *
 * Three things worth recording about how this is measured:
 *
 *  - Every panel is opened with a REAL Playwright click or hover, never a
 *    synthesised `dispatchEvent`. Svelte 5 delegates `onclick` to the root, and
 *    the first version of this file dispatched a composed MouseEvent that the
 *    delegated handler never ran: `sui-tool-call-log`'s chip stayed
 *    `aria-expanded="false"` and the popover was reported missing rather than
 *    misplaced. Same lesson as wc-popover-outside-click.spec.ts.
 *  - "Is it styled" is measured only on properties the component's own scoped
 *    stylesheet sets. Every one of these panels also carries an inline `style`
 *    holding its placement, so `left`/`top` would read correct on a completely
 *    unstyled node and prove nothing.
 *  - The two Tooltip sites build their bubble imperatively with every rule
 *    inline, so a computed-style check there is vacuous by construction — the
 *    bubble looks right on `document.body` too. What it loses is the
 *    `--tooltip-*` custom properties those inline rules read, which inherit from
 *    the shadow host and not from `<body>`. So those two set a token on the host
 *    and assert the bubble resolved it.
 *
 * ChartTooltip shares the same helper and is not exercised here: the five
 * charts that pass `portal` have no custom element yet, so there is no
 * way to put one inside a shadow root from a browser. `chart-behaviors.spec.ts`
 * covers its unchanged light-DOM path.
 */

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/**
 * Loads the built custom elements and waits for `tag` to be registered.
 *
 * The host page is the STATIC demo page, not `/`. Every test here blanks the
 * body immediately, so the SvelteKit app shell is pure scaffolding — and it is
 * scaffolding that fails loudly: its entry chunk is a hashed dynamic import, so
 * any rebuild between the navigation and the assertion turns into
 * "Failed to fetch dynamically imported module: /_app/immutable/entry/start.*.js"
 * on `pageerror`, failing a test whose component assertions all passed.
 * `/wc-form-demo.html` is a self-contained file with one inline module and no
 * imports of its own, so the only script that can throw is the one under test.
 */
const boot = async (page: Page, tag: string): Promise<string[]> => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/wc-form-demo.html');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction((t) => typeof customElements.get(t) !== 'undefined', tag, {
    timeout: 30_000
  });
  return errors;
};

/** Mounts one `<sui-*>` host with `props` assigned, plus optional light-DOM content. */
const mount = async (
  page: Page,
  spec: { readonly tag: string; readonly props: Record<string, unknown>; readonly html?: string }
): Promise<void> => {
  await page.evaluate(({ tag, props, html }) => {
    document.body.innerHTML =
      '<style>sui-tooltip, sui-attachment-chip-row { --tooltip-background: rgb(7, 90, 210); }</style>' +
      '<div id="wrap" style="padding:80px"></div>';
    const host = document.createElement(tag);
    if (typeof html === 'string') {
      host.innerHTML = html;
    }
    Object.assign(host, props);
    document.getElementById('wrap')?.append(host);
  }, spec);
  await page.waitForTimeout(400);
};

type Placement = {
  readonly found: boolean;
  readonly inShadowRoot: boolean;
  readonly onBody: boolean;
  readonly background: string;
  readonly borderTopWidth: string;
  readonly boxShadow: string;
  readonly position: string;
};

/**
 * Finds `selector` wherever it ended up — inside the host's shadow root, or
 * relocated into `<body>` — and reports both where it is and whether the
 * component's own rules still reach it.
 */
const placementOf = async (page: Page, tag: string, selector: string): Promise<Placement> => {
  return page.evaluate(
    ({ tag, selector }) => {
      const host = document.querySelector(tag);
      const root = host?.shadowRoot ?? null;
      const node = root?.querySelector(selector) ?? document.body.querySelector(selector);
      if (node === null || typeof node === 'undefined') {
        return {
          found: false,
          inShadowRoot: false,
          onBody: false,
          background: '',
          borderTopWidth: '',
          boxShadow: '',
          position: ''
        };
      }
      const computed = getComputedStyle(node);
      return {
        found: true,
        inShadowRoot: node.getRootNode() === root,
        onBody: node.parentElement === document.body,
        background: computed.backgroundColor,
        borderTopWidth: computed.borderTopWidth,
        boxShadow: computed.boxShadow,
        position: computed.position
      };
    },
    { tag, selector }
  );
};

/** The three rules that come only from the component's own scoped stylesheet. */
const expectScopedRulesApply = (placement: Placement): void => {
  expect(placement.background).not.toBe(TRANSPARENT);
  expect(placement.borderTopWidth).toBe('1px');
  expect(placement.boxShadow).not.toBe('none');
};

test.describe('a portalled node never leaves the root that holds its stylesheet', () => {
  test('sui-select: the dropdown panel stays in the shadow root and keeps its rules', async ({
    page
  }) => {
    const errors = await boot(page, 'sui-select');
    await mount(page, {
      tag: 'sui-select',
      props: {
        items: [
          { id: 'a', label: 'Apple' },
          { id: 'b', label: 'Banana' }
        ],
        usePortal: true
      }
    });

    await page.locator('sui-select .select-trigger').click();
    const panel = await placementOf(page, 'sui-select', '.select-dropdown');

    expect(panel.found, 'the dropdown never opened').toBe(true);
    expect(panel.onBody, 'panel was relocated into the light DOM').toBe(false);
    expect(panel.inShadowRoot, 'panel left the root that holds its stylesheet').toBe(true);
    expectScopedRulesApply(panel);
    expect(errors).toEqual([]);
  });

  test('sui-menu: the dropdown panel stays in the shadow root and keeps its rules', async ({
    page
  }) => {
    const errors = await boot(page, 'sui-menu');
    await mount(page, {
      tag: 'sui-menu',
      html: '<button slot="trigger">Open</button>',
      props: {
        items: [
          { label: 'Rename', value: 'rename' },
          { label: 'Delete', value: 'delete' }
        ],
        usePortal: true
      }
    });

    await page.locator('sui-menu .menu-trigger, sui-menu button[slot="trigger"]').first().click();
    const panel = await placementOf(page, 'sui-menu', '.menu-dropdown');

    expect(panel.found, 'the dropdown never opened').toBe(true);
    expect(panel.onBody, 'panel was relocated into the light DOM').toBe(false);
    expect(panel.inShadowRoot, 'panel left the root that holds its stylesheet').toBe(true);
    expectScopedRulesApply(panel);
    expect(errors).toEqual([]);
  });

  test('sui-modal: the overlay stays in the shadow root and keeps its rules', async ({ page }) => {
    const errors = await boot(page, 'sui-modal');
    await mount(page, { tag: 'sui-modal', html: '<p>Body copy</p>', props: { usePortal: true } });

    const overlay = await placementOf(page, 'sui-modal', '.modal');

    expect(overlay.found, 'the overlay never rendered').toBe(true);
    expect(overlay.onBody, 'overlay was relocated into the light DOM').toBe(false);
    expect(overlay.inShadowRoot, 'overlay left the root that holds its stylesheet').toBe(true);
    // `.modal` carries no inline style beyond an optional backdrop-filter custom
    // property, so this really is the stylesheet talking.
    expect(overlay.position).toBe('fixed');
    expect(errors).toEqual([]);
  });

  test('sui-tool-call-log: the detail popover stays in the shadow root and keeps its rules', async ({
    page
  }) => {
    const errors = await boot(page, 'sui-tool-call-log');
    await mount(page, {
      tag: 'sui-tool-call-log',
      props: { chips: [{ label: 'Read', meta: 'Select.svelte', detail: 'Read 1200 lines' }] }
    });

    await page.locator('sui-tool-call-log .chip').click();
    const popover = await placementOf(page, 'sui-tool-call-log', '.chip-popover');

    expect(popover.found, 'the popover never opened').toBe(true);
    expect(popover.onBody, 'popover was relocated into the light DOM').toBe(false);
    expect(popover.inShadowRoot, 'popover left the root that holds its stylesheet').toBe(true);
    expectScopedRulesApply(popover);
    expect(errors).toEqual([]);
  });

  test('sui-tool-call-log: usePortal={false} is a real opt-out, not a silently ignored flag', async ({
    page
  }) => {
    const errors = await boot(page, 'sui-tool-call-log');
    await mount(page, {
      tag: 'sui-tool-call-log',
      props: { chips: [{ label: 'Read', detail: 'Read 1200 lines' }], usePortal: false }
    });

    await page.locator('sui-tool-call-log .chip').click();
    const popover = await placementOf(page, 'sui-tool-call-log', '.chip-popover');
    const leftInPlace = await page.evaluate(() => {
      const node = document
        .querySelector('sui-tool-call-log')
        ?.shadowRoot?.querySelector('.chip-popover');
      return node?.closest('.chip-wrap') !== null && typeof node !== 'undefined';
    });

    expect(popover.found, 'the popover never opened').toBe(true);
    expect(leftInPlace, 'the opt-out did not keep the popover where it was rendered').toBe(true);
    // Placement is identical either way (the popover is `position: fixed` in
    // both modes), so opting out must cost the clipping escape and nothing else.
    expect(popover.position).toBe('fixed');
    expectScopedRulesApply(popover);
    expect(errors).toEqual([]);
  });

  test('sui-tooltip: the portalled bubble still resolves the host’s tooltip tokens', async ({
    page
  }) => {
    const errors = await boot(page, 'sui-tooltip');
    await mount(page, {
      tag: 'sui-tooltip',
      html: '<button>Save</button>',
      props: { text: 'Save document', usePortal: true }
    });

    await page.locator('sui-tooltip button').hover();
    await page.waitForTimeout(300);
    const bubble = await placementOf(page, 'sui-tooltip', '[role="tooltip"]');

    expect(bubble.found, 'no tooltip bubble was created').toBe(true);
    expect(bubble.onBody, 'bubble was relocated into the light DOM').toBe(false);
    expect(bubble.inShadowRoot, 'bubble left the scope its tokens inherit from').toBe(true);
    // The host's --tooltip-background, not the #333333 literal the inline rule
    // falls back to once the bubble is outside the host's inheritance chain.
    expect(bubble.background).toBe('rgb(7, 90, 210)');
    expect(errors).toEqual([]);
  });

  test('use:tooltip action (sui-attachment-chip-row): bubble keeps its tokens and its IDREF', async ({
    page
  }) => {
    const errors = await boot(page, 'sui-attachment-chip-row');
    await mount(page, {
      tag: 'sui-attachment-chip-row',
      props: { files: [{ id: 'f1', filename: 'quarterly-report.pdf' }] }
    });

    await page.locator('sui-attachment-chip-row .file-name').hover();
    await page.waitForTimeout(300);
    const bubble = await placementOf(page, 'sui-attachment-chip-row', '[role="tooltip"]');
    // An IDREF does not cross a shadow boundary, so the association the ARIA
    // tooltip pattern requires only exists while the bubble shares the
    // trigger's root.
    const idrefResolves = await page.evaluate(() => {
      const root = document.querySelector('sui-attachment-chip-row')?.shadowRoot ?? null;
      const describedby = root?.querySelector('.file-name')?.getAttribute('aria-describedby') ?? '';
      return describedby.length > 0 && root?.getElementById(describedby) !== null;
    });

    expect(bubble.found, 'no tooltip bubble was created').toBe(true);
    expect(bubble.onBody, 'bubble was relocated into the light DOM').toBe(false);
    expect(bubble.inShadowRoot, 'bubble left the scope its tokens inherit from').toBe(true);
    expect(bubble.background).toBe('rgb(7, 90, 210)');
    expect(idrefResolves, 'aria-describedby no longer resolves').toBe(true);
    expect(errors).toEqual([]);
  });
});
