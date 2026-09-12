import { expect, test, type Page } from '@playwright/test';

/**
 * TDD coverage for wc-defaults-batch-2.
 *
 * A snippet declared statically inside a `.wc.svelte` wrapper (e.g.
 * `{#snippet someIcon()}<slot name="some-icon"></slot>{/snippet}`) is ALWAYS a
 * function, so the wrapped Svelte component's own `{#if typeof someIcon ===
 * 'function'} ... {:else}<default/>{/if}` branch always takes the true branch —
 * the component's own default content can never render through the custom
 * element, even when the host supplies nothing. The fix moves the default into
 * the slot's fallback content, which the platform renders only when the host
 * assigns no light-DOM node to that slot.
 *
 * Two directions are measured per element:
 *  - "no host content": nothing is assigned to the slot. Svelte's `slot()`
 *    runtime helper calls the fallback DIRECTLY when `$slots[name]` is not
 *    `true` — no `<slot>` element is created at all in this branch — so the
 *    signal here is the fallback's OWN rendered markup (an `svg`, a label
 *    span, the default paginator, ...), never the presence of a `<slot>`.
 *  - "host content": a light-DOM child is assigned `slot="..."` BEFORE the
 *    element is connected (so Svelte's `$slots` capture, taken at connection
 *    time, sees it). A genuine `<slot>` element is created in this branch, and
 *    `HTMLSlotElement.assignedNodes()` is the platform's own answer to "which
 *    content is actually showing".
 */

const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-table') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('sui-table restores its own defaults', () => {
  type SuiTableElement = HTMLElement & {
    tableHeaders: string[];
    tableData: Record<string, string>[];
    pagination: { pageSize: number };
  };

  const TABLE_DATA = [
    { Name: 'Alice', Age: '30' },
    { Name: 'Bob', Age: '25' },
    { Name: 'Carol', Age: '40' },
    { Name: 'Dave', Age: '22' },
    { Name: 'Eve', Age: '35' }
  ];

  test('sort icons: no host content shows the table default asc/desc glyphs', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(
      async ({ headers, data }) => {
        const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            if (predicate()) {
              return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          return predicate();
        };

        const el = document.createElement('sui-table') as SuiTableElement;
        const q = (selector: string): Element | null => {
          const root = el.shadowRoot;
          return root === null ? null : root.querySelector(selector);
        };

        el.tableHeaders = headers;
        el.tableData = data;
        document.body.append(el);

        await waitUntil(() => q('.sort-button .button-el') !== null);
        const sortButton = q('.sort-button .button-el');
        if (sortButton === null) {
          return { ascSvg: false, descSvg: false };
        }

        (sortButton as HTMLElement).click();
        await waitUntil(() => q('.sort-icon-asc svg') !== null);
        const ascSvg = q('.sort-icon-asc svg') !== null;

        (sortButton as HTMLElement).click();
        await waitUntil(() => q('.sort-icon-desc svg') !== null);
        const descSvg = q('.sort-icon-desc svg') !== null;

        return { ascSvg, descSvg };
      },
      { headers: ['Name', 'Age'], data: TABLE_DATA }
    );

    expect(result.ascSvg, "the component's own sort-ascending glyph renders").toBe(true);
    expect(result.descSvg, "the component's own sort-descending glyph renders").toBe(true);
  });

  test('sort icons: host content renders instead of the table default', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(
      async ({ headers, data }) => {
        const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            if (predicate()) {
              return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          return predicate();
        };

        const el = document.createElement('sui-table') as SuiTableElement;
        const q = (selector: string): Element | null => {
          const root = el.shadowRoot;
          return root === null ? null : root.querySelector(selector);
        };

        el.tableHeaders = headers;
        el.tableData = data;

        const ascMarker = document.createElement('span');
        ascMarker.setAttribute('slot', 'sort-asc-icon');
        ascMarker.textContent = 'CUSTOM-ASC';
        el.append(ascMarker);
        const descMarker = document.createElement('span');
        descMarker.setAttribute('slot', 'sort-desc-icon');
        descMarker.textContent = 'CUSTOM-DESC';
        el.append(descMarker);

        document.body.append(el);

        await waitUntil(() => q('.sort-button .button-el') !== null);
        const sortButton = q('.sort-button .button-el');
        if (sortButton === null) {
          return { ascAssigned: '', descAssigned: '' };
        }

        (sortButton as HTMLElement).click();
        await waitUntil(() => q('slot[name="sort-asc-icon"]') !== null);
        const ascAssigned = ((): string => {
          const node = q('slot[name="sort-asc-icon"]');
          return node instanceof HTMLSlotElement
            ? node
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '';
        })();

        (sortButton as HTMLElement).click();
        await waitUntil(() => q('slot[name="sort-desc-icon"]') !== null);
        const descAssigned = ((): string => {
          const node = q('slot[name="sort-desc-icon"]');
          return node instanceof HTMLSlotElement
            ? node
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '';
        })();

        return { ascAssigned, descAssigned };
      },
      { headers: ['Name', 'Age'], data: TABLE_DATA }
    );

    expect(result.ascAssigned).toBe('CUSTOM-ASC');
    expect(result.descAssigned).toBe('CUSTOM-DESC');
  });

  // The paginator default is NOT restored: see the comment in Table.wc.svelte. Gating
  // the snippet on assigned content fixed the default direction and broke the override
  // one, and its default is a whole Pagination subtree rather than an icon, so it is
  // recorded as unfinished rather than shipped half working.
});

test.describe('sui-tabs restores its own defaults', () => {
  type SuiTabsElement = HTMLElement & { items: string[] };

  const MANY_ITEMS = [
    'Overview',
    'Details',
    'Settings',
    'History',
    'Notes',
    'Extra',
    'More',
    'Even More',
    'Last One'
  ];

  test('no host content shows the tabs default scroll chevrons and tab body', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(
      async ({ items }) => {
        const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            if (predicate()) {
              return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          return predicate();
        };

        const el = document.createElement('sui-tabs') as SuiTabsElement;
        const q = (selector: string): Element | null => {
          const root = el.shadowRoot;
          return root === null ? null : root.querySelector(selector);
        };

        el.style.display = 'block';
        el.style.width = '160px';
        el.items = items;
        document.body.append(el);

        await waitUntil(() => q('.tabs-item-label') !== null);
        const labelNode = q('.tabs-item-label');
        const tabBodyPresent = labelNode !== null && labelNode.textContent === 'Overview';

        await waitUntil(() => q('.tabs-arrow-end svg') !== null);
        const endArrowSvg = q('.tabs-arrow-end svg') !== null;

        const bar = q('.tabs-bar');
        if (bar instanceof HTMLElement) {
          bar.scrollLeft = 50;
          bar.dispatchEvent(new Event('scroll'));
        }
        await waitUntil(() => q('.tabs-arrow-start svg') !== null);
        const startArrowSvg = q('.tabs-arrow-start svg') !== null;

        return { tabBodyPresent, endArrowSvg, startArrowSvg };
      },
      { items: MANY_ITEMS }
    );

    expect(result.tabBodyPresent, "the component's own default tab body renders").toBe(true);
    expect(result.endArrowSvg, "the component's own end scroll chevron renders").toBe(true);
    expect(result.startArrowSvg, "the component's own start scroll chevron renders").toBe(true);
  });

  test('host content renders instead of the tabs default scroll chevrons and tab body', async ({
    page
  }) => {
    await loadBundle(page);

    const result = await page.evaluate(
      async ({ items }) => {
        const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            if (predicate()) {
              return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          return predicate();
        };

        const el = document.createElement('sui-tabs') as SuiTabsElement;
        const q = (selector: string): Element | null => {
          const root = el.shadowRoot;
          return root === null ? null : root.querySelector(selector);
        };

        el.style.display = 'block';
        el.style.width = '160px';
        el.items = items;

        const leftMarker = document.createElement('span');
        leftMarker.setAttribute('slot', 'scroll-left-icon');
        leftMarker.textContent = 'CUSTOM-LEFT';
        el.append(leftMarker);
        const rightMarker = document.createElement('span');
        rightMarker.setAttribute('slot', 'scroll-right-icon');
        rightMarker.textContent = 'CUSTOM-RIGHT';
        el.append(rightMarker);
        const tabMarker = document.createElement('span');
        tabMarker.setAttribute('slot', 'tab');
        tabMarker.textContent = 'CUSTOM-TAB';
        el.append(tabMarker);

        document.body.append(el);

        await waitUntil(() => q('slot[name="tab"]') !== null);
        const tabSlot = q('slot[name="tab"]');
        const tabAssigned =
          tabSlot instanceof HTMLSlotElement
            ? tabSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '';

        await waitUntil(() => q('slot[name="scroll-right-icon"]') !== null);
        const rightSlot = q('slot[name="scroll-right-icon"]');
        const rightAssigned =
          rightSlot instanceof HTMLSlotElement
            ? rightSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '';

        const bar = q('.tabs-bar');
        if (bar instanceof HTMLElement) {
          bar.scrollLeft = 50;
          bar.dispatchEvent(new Event('scroll'));
        }
        await waitUntil(() => q('slot[name="scroll-left-icon"]') !== null);
        const leftSlot = q('slot[name="scroll-left-icon"]');
        const leftAssigned =
          leftSlot instanceof HTMLSlotElement
            ? leftSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '';

        return { tabAssigned, rightAssigned, leftAssigned };
      },
      { items: MANY_ITEMS }
    );

    expect(result.tabAssigned).toBe('CUSTOM-TAB');
    expect(result.rightAssigned).toBe('CUSTOM-RIGHT');
    expect(result.leftAssigned).toBe('CUSTOM-LEFT');
  });
});

test.describe('sui-calendar restores its own defaults', () => {
  test('no host content shows the calendar default chevrons', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-calendar');
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      document.body.append(el);

      await waitUntil(() => q('.nav-prev svg') !== null);
      return {
        prevSvg: q('.nav-prev svg') !== null,
        nextSvg: q('.nav-next svg') !== null
      };
    });

    expect(result.prevSvg, "the component's own previous-month chevron renders").toBe(true);
    expect(result.nextSvg, "the component's own next-month chevron renders").toBe(true);
  });

  test('host content renders instead of the calendar default chevrons', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-calendar');
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      const prevMarker = document.createElement('span');
      prevMarker.setAttribute('slot', 'previous-month-icon');
      prevMarker.textContent = 'CUSTOM-PREV';
      el.append(prevMarker);
      const nextMarker = document.createElement('span');
      nextMarker.setAttribute('slot', 'next-month-icon');
      nextMarker.textContent = 'CUSTOM-NEXT';
      el.append(nextMarker);

      document.body.append(el);

      await waitUntil(() => q('slot[name="previous-month-icon"]') !== null);
      const prevSlot = q('slot[name="previous-month-icon"]');
      const nextSlot = q('slot[name="next-month-icon"]');
      return {
        prevAssigned:
          prevSlot instanceof HTMLSlotElement
            ? prevSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '',
        nextAssigned:
          nextSlot instanceof HTMLSlotElement
            ? nextSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : ''
      };
    });

    expect(result.prevAssigned).toBe('CUSTOM-PREV');
    expect(result.nextAssigned).toBe('CUSTOM-NEXT');
  });
});

test.describe('sui-scroller restores its own defaults', () => {
  test('no host content shows the scroller default arrows', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-scroller');
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      el.style.display = 'block';
      el.style.width = '160px';
      for (let index = 0; index < 10; index += 1) {
        const item = document.createElement('div');
        item.style.width = '100px';
        item.style.flex = '0 0 auto';
        item.textContent = `Item ${index}`;
        el.append(item);
      }
      document.body.append(el);

      await waitUntil(() => q('.arrow-next .arrow-icon svg') !== null);
      const nextSvg = q('.arrow-next .arrow-icon svg') !== null;

      const container = q('.scroll-container');
      if (container instanceof HTMLElement) {
        container.scrollLeft = container.scrollWidth;
        container.dispatchEvent(new Event('scroll'));
      }
      await waitUntil(() => q('.arrow-prev .arrow-icon svg') !== null);
      const prevSvg = q('.arrow-prev .arrow-icon svg') !== null;

      return { nextSvg, prevSvg };
    });

    expect(result.nextSvg, "the component's own next arrow renders").toBe(true);
    expect(result.prevSvg, "the component's own previous arrow renders").toBe(true);
  });

  test('host content renders instead of the scroller default arrows', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-scroller');
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      el.style.display = 'block';
      el.style.width = '160px';
      for (let index = 0; index < 10; index += 1) {
        const item = document.createElement('div');
        item.style.width = '100px';
        item.style.flex = '0 0 auto';
        item.textContent = `Item ${index}`;
        el.append(item);
      }
      const nextMarker = document.createElement('span');
      nextMarker.setAttribute('slot', 'arrow-next');
      nextMarker.textContent = 'CUSTOM-NEXT';
      el.append(nextMarker);
      const prevMarker = document.createElement('span');
      prevMarker.setAttribute('slot', 'arrow-previous');
      prevMarker.textContent = 'CUSTOM-PREV';
      el.append(prevMarker);

      document.body.append(el);

      await waitUntil(() => q('slot[name="arrow-next"]') !== null);
      const nextSlot = q('slot[name="arrow-next"]');
      const nextAssigned =
        nextSlot instanceof HTMLSlotElement
          ? nextSlot
              .assignedNodes()
              .map((n) => n.textContent ?? '')
              .join('')
          : '';

      const container = q('.scroll-container');
      if (container instanceof HTMLElement) {
        container.scrollLeft = container.scrollWidth;
        container.dispatchEvent(new Event('scroll'));
      }
      await waitUntil(() => q('slot[name="arrow-previous"]') !== null);
      const prevSlot = q('slot[name="arrow-previous"]');
      const prevAssigned =
        prevSlot instanceof HTMLSlotElement
          ? prevSlot
              .assignedNodes()
              .map((n) => n.textContent ?? '')
              .join('')
          : '';

      return { nextAssigned, prevAssigned };
    });

    expect(result.nextAssigned).toBe('CUSTOM-NEXT');
    expect(result.prevAssigned).toBe('CUSTOM-PREV');
  });
});

test.describe('sui-banner and sui-pill restore their own dismiss icon', () => {
  test('no host content shows the default dismiss glyph', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const banner = document.createElement('sui-banner');
      banner.setAttribute('text', 'Some banner text');
      banner.setAttribute('dismissible', '');
      document.body.append(banner);

      const pill = document.createElement('sui-pill');
      pill.setAttribute('text', 'Some pill');
      pill.setAttribute('dismissible', '');
      document.body.append(pill);

      const qBanner = (selector: string): Element | null => {
        const root = banner.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };
      const qPill = (selector: string): Element | null => {
        const root = pill.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      await waitUntil(() => qBanner('.banner-dismiss svg') !== null);
      await waitUntil(() => qPill('.pill-dismiss svg') !== null);

      return {
        bannerSvg: qBanner('.banner-dismiss svg') !== null,
        pillSvg: qPill('.pill-dismiss svg') !== null
      };
    });

    expect(result.bannerSvg, "the banner's own dismiss glyph renders").toBe(true);
    expect(result.pillSvg, "the pill's own dismiss glyph renders").toBe(true);
  });

  test('host content renders instead of the default dismiss glyph', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const banner = document.createElement('sui-banner');
      banner.setAttribute('text', 'Some banner text');
      banner.setAttribute('dismissible', '');
      const bannerMarker = document.createElement('span');
      bannerMarker.setAttribute('slot', 'dismiss-icon');
      bannerMarker.textContent = 'CUSTOM-BANNER-DISMISS';
      banner.append(bannerMarker);
      document.body.append(banner);

      const pill = document.createElement('sui-pill');
      pill.setAttribute('text', 'Some pill');
      pill.setAttribute('dismissible', '');
      const pillMarker = document.createElement('span');
      pillMarker.setAttribute('slot', 'dismiss-icon');
      pillMarker.textContent = 'CUSTOM-PILL-DISMISS';
      pill.append(pillMarker);
      document.body.append(pill);

      const qBanner = (selector: string): Element | null => {
        const root = banner.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };
      const qPill = (selector: string): Element | null => {
        const root = pill.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      await waitUntil(() => qBanner('slot[name="dismiss-icon"]') !== null);
      await waitUntil(() => qPill('slot[name="dismiss-icon"]') !== null);

      const bannerSlot = qBanner('slot[name="dismiss-icon"]');
      const pillSlot = qPill('slot[name="dismiss-icon"]');

      return {
        bannerAssigned:
          bannerSlot instanceof HTMLSlotElement
            ? bannerSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '',
        pillAssigned:
          pillSlot instanceof HTMLSlotElement
            ? pillSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : ''
      };
    });

    expect(result.bannerAssigned).toBe('CUSTOM-BANNER-DISMISS');
    expect(result.pillAssigned).toBe('CUSTOM-PILL-DISMISS');
  });
});

test.describe('sui-book restores its own defaults', () => {
  type SuiBookElement = HTMLElement & { pages: unknown[] };

  test('no host content shows the book default chevrons', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-book') as SuiBookElement;
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      el.pages = [];
      document.body.append(el);

      await waitUntil(() => q('.nav-prev svg') !== null);
      return {
        prevSvg: q('.nav-prev svg') !== null,
        nextSvg: q('.nav-next svg') !== null
      };
    });

    expect(result.prevSvg, "the component's own previous-page chevron renders").toBe(true);
    expect(result.nextSvg, "the component's own next-page chevron renders").toBe(true);
  });

  test('host content renders instead of the book default chevrons', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-book') as SuiBookElement;
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      el.pages = [];
      const prevMarker = document.createElement('span');
      prevMarker.setAttribute('slot', 'previous-icon');
      prevMarker.textContent = 'CUSTOM-PREV';
      el.append(prevMarker);
      const nextMarker = document.createElement('span');
      nextMarker.setAttribute('slot', 'next-icon');
      nextMarker.textContent = 'CUSTOM-NEXT';
      el.append(nextMarker);

      document.body.append(el);

      await waitUntil(() => q('slot[name="previous-icon"]') !== null);
      const prevSlot = q('slot[name="previous-icon"]');
      const nextSlot = q('slot[name="next-icon"]');
      return {
        prevAssigned:
          prevSlot instanceof HTMLSlotElement
            ? prevSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : '',
        nextAssigned:
          nextSlot instanceof HTMLSlotElement
            ? nextSlot
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : ''
      };
    });

    expect(result.prevAssigned).toBe('CUSTOM-PREV');
    expect(result.nextAssigned).toBe('CUSTOM-NEXT');
  });
});

test.describe('sui-browser restores its own default lock icon', () => {
  test('no host content shows the browser default lock glyph', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-browser');
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      document.body.append(el);

      await waitUntil(() => q('.lock-icon svg') !== null);
      return { lockSvg: q('.lock-icon svg') !== null };
    });

    expect(result.lockSvg, "the component's own lock glyph renders").toBe(true);
  });

  test('host content renders instead of the browser default lock glyph', async ({ page }) => {
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const waitUntil = async (predicate: () => boolean, timeout = 4000): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (predicate()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return predicate();
      };

      const el = document.createElement('sui-browser');
      const q = (selector: string): Element | null => {
        const root = el.shadowRoot;
        return root === null ? null : root.querySelector(selector);
      };

      const marker = document.createElement('span');
      marker.setAttribute('slot', 'lock-icon');
      marker.textContent = 'CUSTOM-LOCK';
      el.append(marker);
      document.body.append(el);

      await waitUntil(() => q('slot[name="lock-icon"]') !== null);
      const slotNode = q('slot[name="lock-icon"]');
      return {
        assigned:
          slotNode instanceof HTMLSlotElement
            ? slotNode
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
            : ''
      };
    });

    expect(result.assigned).toBe('CUSTOM-LOCK');
  });
});
