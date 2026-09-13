import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight, step } from './support/narrate.js';

/**
 * Four behaviours from this PR that a still frame cannot prove and a
 * sub-two-second clip cannot even attempt:
 *
 *  - A `<sui-card>` footer is now reachable from plain light-DOM markup
 *    (`$host().querySelector('[slot="footer"]')` gates its very existence),
 *    and the guard has two halves -- content projects when slotted, and no
 *    empty footer band renders when it is not. A screenshot of one card shows
 *    a footer; it cannot show the *absence* of one on a second card, which is
 *    the half of the guard most likely to regress silently.
 *  - Six components relocate a portalled node with `getRootNode()` instead of
 *    always `document.body`, so it never leaves the shadow root that scopes
 *    its CSS and its inherited `--token`s. "Is it styled" is a computed-style
 *    fact a screenshot only shows by accident (a border can look right while
 *    every property behind it fell back to nothing); this asserts the values
 *    directly.
 *  - `theme-dark.css` is a 778-line, brand-new file. Proving it means
 *    watching the *switch* operate and a real, busy page repaint coherently
 *    across independent surfaces -- a single swatch under-sells a whole
 *    theme, and a static "before/after" pair cannot show the mechanism a
 *    reviewer would actually operate.
 *  - ThemeSwitcher's own transitions now honour `prefers-reduced-motion`.
 *    That guard only has meaning as a comparison between the animated and
 *    non-animated cases, and both need to actually run on screen.
 *
 * No route under src/routes/components/ mounts the real `<sui-*>` custom
 * element build (they all render the plain Svelte components), so the first
 * two walkthroughs below build their own demo DOM against the static
 * `/wc-form-demo.html` host page and dist-wc/index.js, exactly as
 * tests/portal-shadow-styling.spec.ts already does -- no new demo routes or
 * static pages are added here.
 */

type Placement = {
  readonly found: boolean;
  readonly inShadowRoot: boolean;
  readonly onBody: boolean;
  readonly background: string;
  readonly boxShadow: string;
  readonly position: string;
};

type ComputedColors = {
  readonly background: string;
  readonly color: string;
};

/**
 * Loads the built custom elements against the static form-demo page.
 *
 * The static page, not `/`, for the reason tests/portal-shadow-styling.spec.ts
 * documents: the SvelteKit shell's entry chunk is a hashed dynamic import
 * that throws "Failed to fetch dynamically imported module" on any rebuild
 * between navigation and assertion, which would fail a walkthrough whose own
 * assertions all passed. The static page has one inline module and nothing
 * else that can throw. dist-wc/index.js registers every `<sui-*>` tag in one
 * bundle, so waiting on any single tag proves the rest are ready too.
 */
const bootCustomElements = async (page: Page, tag: string): Promise<void> => {
  await page.goto('/wc-form-demo.html');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction((t) => typeof customElements.get(t) !== 'undefined', tag, {
    timeout: 30_000
  });
};

/** Mounts one `<sui-*>` host with `props` assigned, plus optional light-DOM content. */
const mountHost = async (
  page: Page,
  spec: { readonly tag: string; readonly props: Record<string, unknown>; readonly html?: string }
): Promise<void> => {
  await page.evaluate(({ tag, props, html }) => {
    document.body.innerHTML =
      '<style>sui-tooltip { --tooltip-background: rgb(7, 90, 210); }</style>' +
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

/** Finds `selector` wherever it ended up and reports both its root and whether the component's own rules still reach it. */
const placementOf = async (page: Page, tag: string, selector: string): Promise<Placement> => {
  return page.evaluate(
    ({ tag: hostTag, selector: sel }) => {
      const host = document.querySelector(hostTag);
      const root = host?.shadowRoot ?? null;
      const node = root?.querySelector(sel) ?? document.body.querySelector(sel);
      if (node === null || typeof node === 'undefined') {
        return {
          found: false,
          inShadowRoot: false,
          onBody: false,
          background: '',
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
        boxShadow: computed.boxShadow,
        position: computed.position
      };
    },
    { tag, selector }
  );
};

/** Computed background/text colour of the first match, for the dark-theme repaint proof. */
const computedColorsOf = (page: Page, selector: string): Promise<ComputedColors> =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const computed = getComputedStyle(el);
      return { background: computed.backgroundColor, color: computed.color };
    });

const channelToLinear = (channel255: number): number => {
  const channel = channel255 / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (rgb: string): number => {
  const match = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(rgb);
  if (match === null) {
    return 0;
  }
  const [, r, g, b] = match;
  return (
    0.2126 * channelToLinear(Number(r)) +
    0.7152 * channelToLinear(Number(g)) +
    0.0722 * channelToLinear(Number(b))
  );
};

/** WCAG contrast ratio between two computed `rgb()`/`rgba()` colour strings. */
const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Computed `transition-duration` split into its per-property entries.
 *
 * The CSS shorthand lists one duration per transitioned property, so an
 * element transitioning two properties (e.g. `.icon`'s opacity and
 * transform) computes to `"0.3s, 0.3s"`, not `"0.3s"`. Returning every entry
 * -- rather than the raw string -- lets a caller assert the actual
 * requirement (every transitioned property honours the duration) instead of
 * an exact string that breaks the moment a second property is added.
 */
const transitionDurationsOf = (target: Locator): Promise<string[]> =>
  target.evaluate((el) =>
    getComputedStyle(el)
      .transitionDuration.split(',')
      .map((entry) => entry.trim())
  );

test.describe('sui-card: the guarded footer slot', () => {
  test('projects real light-DOM content when slotted, renders no footer at all when not, and fills its container', async ({
    page
  }) => {
    await bootCustomElements(page, 'sui-card');

    await page.evaluate(() => {
      document.body.innerHTML =
        '<div id="wrap" style="display:flex; gap:24px; padding:24px; align-items:flex-start;">' +
        '<div id="col-with-footer" style="width:280px;"></div>' +
        '<div id="col-without-footer" style="width:280px;"></div>' +
        '</div>';

      const withFooter = document.createElement('sui-card');
      withFooter.id = 'card-with-footer';
      // Assigned and appended BEFORE the host connects: Card.wc.svelte reads
      // $host().querySelector('[slot="footer"]') at render time, which runs on
      // connection, so the child has to already be there.
      const footerChild = document.createElement('div');
      footerChild.setAttribute('slot', 'footer');
      footerChild.textContent = 'Renewed nightly';
      withFooter.append(footerChild);
      Object.assign(withFooter, { cardTitle: 'Pro plan' });
      document.getElementById('col-with-footer')?.append(withFooter);

      const withoutFooter = document.createElement('sui-card');
      withoutFooter.id = 'card-without-footer';
      Object.assign(withoutFooter, { cardTitle: 'Free plan' });
      document.getElementById('col-without-footer')?.append(withoutFooter);
    });
    await page.waitForTimeout(400);

    const proof = await page.evaluate(() => {
      const withFooter = document.getElementById('card-with-footer');
      const withFooterShadow = withFooter instanceof Element ? withFooter.shadowRoot : null;
      const slotEl = withFooterShadow?.querySelector('slot[name="footer"]') ?? null;
      const assignedNodes = slotEl instanceof HTMLSlotElement ? slotEl.assignedNodes() : [];
      const assignedText = assignedNodes.map((node) => node.textContent ?? '').join('');

      const withoutFooter = document.getElementById('card-without-footer');
      const withoutFooterShadow =
        withoutFooter instanceof Element ? withoutFooter.shadowRoot : null;
      const bareFooterEl = withoutFooterShadow?.querySelector('.card-footer') ?? null;

      const wrapper = withFooter?.parentElement ?? null;
      return {
        footerElementExists: withFooterShadow?.querySelector('.card-footer') !== null,
        assignedCount: assignedNodes.length,
        assignedText,
        bareHasFooterElement: bareFooterEl !== null,
        withFooterWidth:
          withFooter instanceof Element ? withFooter.getBoundingClientRect().width : 0,
        wrapperWidth: wrapper instanceof Element ? wrapper.getBoundingClientRect().width : 0
      };
    });

    await step(
      page,
      'A footer child, slotted before the card connects, projects into the shadow tree -- structurally, not just visually.',
      async () => {
        await highlight(page.locator('#card-with-footer .card-footer'));
      }
    );
    expect(proof.footerElementExists, 'the guarded .card-footer wrapper never rendered').toBe(true);
    expect(proof.assignedCount, 'nothing was actually assigned to <slot name="footer">').toBe(1);
    expect(proof.assignedText, 'the projected node did not carry the light-DOM text').toContain(
      'Renewed nightly'
    );

    await step(
      page,
      'A second card with nothing slotted renders no footer element at all -- the guard, not an empty box.',
      async () => {
        await highlight(page.locator('#card-without-footer'));
      }
    );
    expect(
      proof.bareHasFooterElement,
      'an unguarded footer rendered even though nothing was slotted'
    ).toBe(false);

    await step(
      page,
      "The new :host default makes the card a block box, so it fills its container's width.",
      async () => {
        await highlight(page.locator('#card-with-footer'));
      }
    );
    expect(proof.wrapperWidth, 'the comparison container never got a real width').toBeGreaterThan(
      0
    );
    expect(
      Math.abs(proof.withFooterWidth - proof.wrapperWidth),
      'a custom element still defaulting to display:inline would not fill its container'
    ).toBeLessThan(2);
  });
});

test.describe('portalled panels stay inside the shadow root that styles them', () => {
  test('sui-select, sui-tooltip and sui-tool-call-log relocate within their own root, never to document.body', async ({
    page
  }) => {
    await bootCustomElements(page, 'sui-select');

    await mountHost(page, {
      tag: 'sui-select',
      props: {
        items: [
          { id: 'a', label: 'Apple' },
          { id: 'b', label: 'Banana' }
        ],
        usePortal: true
      }
    });
    await step(
      page,
      'Opening the dropdown relocates it -- watch where it actually lands.',
      async () => {
        await page.locator('sui-select .select-trigger').click();
      }
    );
    await highlight(page.locator('sui-select .select-dropdown'));
    const selectPlacement = await placementOf(page, 'sui-select', '.select-dropdown');
    expect(selectPlacement.found, 'the dropdown never opened').toBe(true);
    expect(selectPlacement.onBody, 'panel was relocated into the light DOM').toBe(false);
    expect(selectPlacement.inShadowRoot, 'panel left the root that holds its stylesheet').toBe(
      true
    );
    expect(selectPlacement.background, 'the panel rendered with no background at all').not.toBe(
      'rgba(0, 0, 0, 0)'
    );
    expect(selectPlacement.boxShadow, 'the panel rendered with no shadow at all').not.toBe('none');

    await mountHost(page, {
      tag: 'sui-tooltip',
      html: '<button>Save</button>',
      props: { text: 'Save document', usePortal: true }
    });
    await step(
      page,
      "A token set on the host still reaches the bubble, because the bubble never left the host's shadow tree.",
      async () => {
        await page.locator('sui-tooltip button').hover();
        await beat(page, 300);
      }
    );
    await highlight(page.locator('sui-tooltip [role="tooltip"]'));
    const tooltipPlacement = await placementOf(page, 'sui-tooltip', '[role="tooltip"]');
    expect(tooltipPlacement.found, 'no tooltip bubble was created').toBe(true);
    expect(tooltipPlacement.inShadowRoot, 'bubble left the scope its tokens inherit from').toBe(
      true
    );
    expect(
      tooltipPlacement.background,
      "the host's --tooltip-background never reached the relocated bubble"
    ).toBe('rgb(7, 90, 210)');

    await mountHost(page, {
      tag: 'sui-tool-call-log',
      props: {
        chips: [{ label: 'Read', meta: 'Select.svelte', detail: 'Read 1200 lines' }],
        usePortal: false
      }
    });
    await step(
      page,
      'usePortal={false} is a real opt-out: the popover stays exactly where it rendered.',
      async () => {
        await page.locator('sui-tool-call-log .chip').click();
      }
    );
    const optedOut = await placementOf(page, 'sui-tool-call-log', '.chip-popover');
    const leftInPlace = await page.evaluate(() => {
      const node = document
        .querySelector('sui-tool-call-log')
        ?.shadowRoot?.querySelector('.chip-popover');
      return node?.closest('.chip-wrap') !== null && typeof node !== 'undefined';
    });
    expect(optedOut.found, 'the popover never opened').toBe(true);
    // position:fixed is the baseline in both portal modes -- opting out changes
    // only which ancestors can clip the popover, never how it is placed.
    expect(optedOut.position, 'the opt-out changed placement, not just the escape hatch').toBe(
      'fixed'
    );
    expect(leftInPlace, 'the opt-out did not keep the popover where it was rendered').toBe(true);
  });
});

test.describe('the dark theme repaints real, busy pages from one switch', () => {
  test('flipping ThemeSwitcher recolours Table, then holds across client-side navigation to Select and Input', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    // Pin the starting state rather than assume it: a headless browser's own
    // prefers-color-scheme default is not this test's business either way.
    await page.getByRole('button', { name: 'Light theme' }).click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
    const lightHeader = await computedColorsOf(page, '.table-header');
    expect(lightHeader.background, 'the header should still be on its light default').not.toBe(
      'rgb(30, 30, 46)'
    );

    await step(
      page,
      'Flipping the switch repaints every surface on the page from one control.',
      async () => {
        await page.getByRole('button', { name: 'Dark theme' }).click();
      }
    );
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    await highlight(page.locator('.table-header').first());

    const darkHeader = await computedColorsOf(page, '.table-header');
    const darkCell = await computedColorsOf(page, '.table-content');
    expect(darkHeader.background, 'the header never repainted to its dark token').toBe(
      'rgb(30, 30, 46)'
    );
    expect(darkCell.background, 'the cell never repainted to its dark token').toBe(
      'rgb(26, 26, 38)'
    );
    expect(
      contrastRatio(darkHeader.color, darkHeader.background),
      'header text fails WCAG contrast on the new dark surface'
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(darkCell.color, darkCell.background),
      'cell text fails WCAG contrast on the new dark surface'
    ).toBeGreaterThanOrEqual(4.5);

    await step(
      page,
      'Still dark, navigating to Select keeps the theme -- one switch, not one per page.',
      async () => {
        await page.getByRole('link', { name: 'Select', exact: true }).click();
      }
    );
    await page.waitForURL('**/components/select');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    await highlight(page.locator('.select-trigger').first());
    const selectTrigger = await computedColorsOf(page, '.select-trigger');
    expect(selectTrigger.background, 'the trigger never repainted to its dark token').toBe(
      'rgb(30, 30, 46)'
    );
    expect(
      contrastRatio(selectTrigger.color, selectTrigger.background),
      'trigger text fails WCAG contrast on the new dark surface'
    ).toBeGreaterThanOrEqual(4.5);

    await step(page, 'And Input -- the same switch, a third, unrelated surface.', async () => {
      await page.getByRole('link', { name: 'Input', exact: true }).click();
    });
    await page.waitForURL('**/components/input');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    const inputField = '[data-pw="input-announced-error"]';
    await highlight(page.locator(inputField));
    const input = await computedColorsOf(page, inputField);
    expect(input.background, 'the field never repainted to its dark token').toBe('rgb(30, 30, 46)');
    expect(
      contrastRatio(input.color, input.background),
      'input text fails WCAG contrast on the new dark surface'
    ).toBeGreaterThanOrEqual(4.5);
  });
});

test.describe("ThemeSwitcher's own motion honours prefers-reduced-motion", () => {
  test('the toggle crossfade and the segment indicator slide, then both snap instantly under reduce', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/theme-switcher');

    const toggleRow = page.locator('.demo-row > div').filter({ hasText: 'Two-option toggle:' });
    const toggleButton = toggleRow.getByRole('button', { name: 'Switch theme' });
    const toggleIcon = toggleRow.locator('.icon').first();

    const segmentRow = page
      .locator('.demo-row > div')
      .filter({ hasText: 'Default (segment mode):' });
    const lightSegment = segmentRow.getByRole('button', { name: 'Light theme' });
    const darkSegment = segmentRow.getByRole('button', { name: 'Dark theme' });
    const indicator = segmentRow.locator('.segment-indicator');

    await step(
      page,
      'No reduced-motion preference: the toggle icon crossfades and the segment indicator slides.',
      async () => {
        await toggleButton.click();
        await beat(page);
        await toggleButton.click();
        await lightSegment.click();
        await beat(page);
        await darkSegment.click();
      }
    );

    const toggleIconAnimated = await transitionDurationsOf(toggleIcon);
    expect(
      toggleIconAnimated.every((duration) => duration === '0.3s'),
      `every transitioned property on the icon should animate by default, got "${toggleIconAnimated.join(', ')}"`
    ).toBe(true);
    const indicatorAnimated = await transitionDurationsOf(indicator);
    expect(
      indicatorAnimated.every((duration) => duration === '0.3s'),
      `every transitioned property on the segment indicator should animate by default, got "${indicatorAnimated.join(', ')}"`
    ).toBe(true);
    await expect(
      darkSegment,
      'the pressed segment must expose its state to more than pixels'
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(lightSegment).toHaveAttribute('aria-pressed', 'false');

    await caption(page, 'Now emulating prefers-reduced-motion: reduce.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Guards against a silently no-op emulation, which would make every
    // "transition: 0s" assertion below pass for the wrong reason.
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true
    );

    await step(
      page,
      'The identical clicks now land instantly -- no crossfade, no slide, same end state.',
      async () => {
        await toggleButton.click();
        await beat(page);
        await lightSegment.click();
        await beat(page);
        await darkSegment.click();
      }
    );

    const toggleIconReduced = await transitionDurationsOf(toggleIcon);
    expect(
      toggleIconReduced.every((duration) => duration === '0s'),
      `every transitioned property on the icon should snap instantly under reduced motion, got "${toggleIconReduced.join(', ')}"`
    ).toBe(true);
    const indicatorReduced = await transitionDurationsOf(indicator);
    expect(
      indicatorReduced.every((duration) => duration === '0s'),
      `every transitioned property on the segment indicator should snap instantly under reduced motion, got "${indicatorReduced.join(', ')}"`
    ).toBe(true);
    await expect(
      darkSegment,
      'the end state must still be correct with motion off'
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
