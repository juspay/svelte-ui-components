import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-023 -- Firefox reopened a Select that Escape had just closed.
 *
 * Escape in an `<input type="search">` clears it natively, and Firefox does that
 * by dispatching an `input` event synchronously inside the same keydown, before
 * Svelte has flushed the close to the DOM. `handleSearchInput` opened any closed
 * dropdown on input, so the dismissal was undone in the same task: `aria-expanded`
 * stayed true, `onopen` fired straight after `onclose`, and the next trigger click
 * toggled the panel shut with zero options. Chromium clears after the flush and
 * WebKit does not clear at all, which is why only Firefox showed it.
 *
 * Every keystroke here is a real one (`page.keyboard`), delivered through the
 * browser's own input pipeline, so Firefox performs its real native clear. That
 * is the point: a synthetic `dispatchEvent('input')` cannot reproduce it, because
 * the clear and its ordering are the browser's, not the test's. Each spec records
 * `isTrusted` for the input events it sees, and the Firefox one asserts the native
 * clear actually happened, so a pass cannot come from the test never reaching it.
 */

type InputRecord = { inputType: string; value: string; trusted: boolean };

const recordInputEvents = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const store: Array<{ inputType: string; value: string; trusted: boolean }> = [];
    Reflect.set(window, '__inputEvents', store);
    document.addEventListener(
      'input',
      (event) => {
        const target = event.target;
        store.push({
          inputType: event instanceof InputEvent ? event.inputType : '',
          value: target instanceof HTMLInputElement ? target.value : '',
          trusted: event.isTrusted
        });
      },
      true
    );
  });

const takeInputEvents = (page: Page): Promise<InputRecord[]> =>
  page.evaluate(() => {
    const store = Reflect.get(window, '__inputEvents');
    return Array.isArray(store) ? store.splice(0) : [];
  });

const clearWithKeyboard = async (page: Page): Promise<void> => {
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
};

type Variant = {
  readonly name: string;
  readonly testId: string;
  /** Options that are items, excluding any "Select all" row. */
  readonly items: number;
  readonly multiple: boolean;
};

/** In-menu search Selects on the Select page. */
const PAGE_VARIANTS: readonly Variant[] = [
  { name: 'in-flow', testId: 'select-menu-search', items: 8, multiple: false },
  { name: 'portaled', testId: 'select-menu-portal', items: 8, multiple: false },
  { name: 'multiple with select-all', testId: 'select-menu-multi', items: 8, multiple: true }
];

/** The same three variants rendered inside a Modal. */
const MODAL_VARIANTS: readonly Variant[] = [
  { name: 'in-flow', testId: 'select-modal-inflow', items: 8, multiple: false },
  { name: 'portaled', testId: 'select-modal-portal', items: 8, multiple: false },
  { name: 'portaled multiple', testId: 'select-modal-multi', items: 8, multiple: true }
];

const parts = (page: Page, testId: string) => ({
  trigger: page.getByTestId(testId).locator('.select-trigger'),
  search: page.getByTestId(`${testId}-menu-search`),
  // The dropdown is portaled out of the container for `usePortal`, so it is looked
  // up on the page. Only one panel is open at a time in every spec here.
  panel: page.locator('.select-dropdown'),
  items: page.locator('.select-dropdown .select-option:not(.select-all)'),
  empty: page.locator('.select-dropdown .select-empty')
});

/** Real click on the trigger, then Tab into the search box -- the DS keyboard contract. */
const openAndFocusSearch = async (page: Page, testId: string) => {
  const select = parts(page, testId);
  await select.trigger.click();
  await expect(select.panel).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(select.search).toBeFocused();
  return select;
};

/** No results, then recovery -- the sequence from the audit's reproduction. */
const noResultsThenTokyo = async (page: Page, select: ReturnType<typeof parts>) => {
  await page.keyboard.type('not-a-city');
  await expect(select.empty).toHaveText('No results');
  await clearWithKeyboard(page);
  await page.keyboard.type('Tokyo');
  await expect(select.items).toHaveCount(1);
  await expect(select.items).toHaveText('Tokyo');
};

const expectClosedWithFocusOnTrigger = async (select: ReturnType<typeof parts>) => {
  await expect(select.trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(select.panel).toHaveCount(0);
  await expect(select.trigger).toBeFocused();
};

const expectReopensFresh = async (
  select: ReturnType<typeof parts>,
  variant: Pick<Variant, 'items'>
) => {
  await expect(select.trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(select.panel).toBeVisible();
  await expect(select.search).toHaveValue('');
  await expect(select.items).toHaveCount(variant.items);
};

test.describe('Select -- Escape and the native search clear (ISSUE-023)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/select');
  });

  for (const variant of PAGE_VARIANTS) {
    test.describe(variant.name, () => {
      test('no results, Tokyo, Escape closes, the next click opens with an empty query', async ({
        page,
        browserName
      }) => {
        const select = await openAndFocusSearch(page, variant.testId);
        await noResultsThenTokyo(page, select);
        await recordInputEvents(page);

        await page.keyboard.press('Escape');

        await expectClosedWithFocusOnTrigger(select);
        const seen = await takeInputEvents(page);
        // Real events only: the test never dispatches one.
        expect(seen.every((event) => event.trusted)).toBe(true);
        if (browserName === 'firefox') {
          // Proves the repro is real: Firefox's own clear ran and its input event
          // reached the page after the panel had been dismissed.
          expect(seen).toContainEqual({
            inputType: 'insertReplacementText',
            value: '',
            trusted: true
          });
        }

        await select.trigger.click();
        await expectReopensFresh(select, variant);
      });

      test('a keyboard reopen with Enter and with ArrowDown also starts empty', async ({
        page
      }) => {
        const select = await openAndFocusSearch(page, variant.testId);
        await noResultsThenTokyo(page, select);
        await page.keyboard.press('Escape');
        await expectClosedWithFocusOnTrigger(select);

        await page.keyboard.press('Enter');
        await expectReopensFresh(select, variant);

        await page.keyboard.press('Escape');
        await expectClosedWithFocusOnTrigger(select);

        await page.keyboard.press('ArrowDown');
        await expectReopensFresh(select, variant);
      });

      test('Escape pressed with focus back on the trigger closes it and reopens empty', async ({
        page
      }) => {
        const select = await openAndFocusSearch(page, variant.testId);
        await page.keyboard.type('par');
        await expect(select.items).toHaveCount(1);
        await page.keyboard.press('Shift+Tab');
        await expect(select.trigger).toBeFocused();

        await page.keyboard.press('Escape');

        await expectClosedWithFocusOnTrigger(select);
        await page.keyboard.press('Enter');
        await expectReopensFresh(select, variant);
      });
    });
  }

  test('multiple keeps its selection across the Escape and reopens with it intact', async ({
    page
  }) => {
    const select = await openAndFocusSearch(page, 'select-menu-multi');
    await noResultsThenTokyo(page, select);
    await page.keyboard.press('Escape');
    await expectClosedWithFocusOnTrigger(select);

    await select.trigger.click();
    await expectReopensFresh(select, { items: 8 });
    // New York was preselected by the example and must not be lost by dismissal.
    await expect(page.getByTestId('select-menu-multi-nyc')).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('focus returns to the trigger, so Tab continues to the next field', async ({ page }) => {
    const select = await openAndFocusSearch(page, 'select-menu-portal');
    await noResultsThenTokyo(page, select);
    await page.keyboard.press('Escape');
    await expectClosedWithFocusOnTrigger(select);

    await page.keyboard.press('Tab');

    await expect(page.getByTestId('select-menu-portal-next')).toBeFocused();
  });

  test('clearing the query by keyboard keeps the panel open and lists every option again', async ({
    page
  }) => {
    const select = await openAndFocusSearch(page, 'select-menu-search');
    await page.keyboard.type('lon');
    await expect(select.items).toHaveCount(1);

    await clearWithKeyboard(page);

    await expect(select.trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(select.items).toHaveCount(8);
  });

  test('the native cancel button clears the query without closing the panel', async ({
    page,
    browserName
  }) => {
    // Firefox draws no native clear button for input[type=search]; its only native
    // clear is the Escape one covered above.
    test.skip(browserName === 'firefox', 'Firefox renders no cancel button on a search input');

    const select = await openAndFocusSearch(page, 'select-menu-search');
    await page.keyboard.type('zzz');
    await expect(select.empty).toHaveText('No results');
    const box = await select.search.boundingBox();
    if (box === null) {
      throw new Error('search input has no box');
    }
    await recordInputEvents(page);

    await page.mouse.move(box.x + box.width - 14, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width - 14, box.y + box.height / 2);

    await expect(select.search).toHaveValue('');
    await expect(select.trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(select.items).toHaveCount(8);
    expect((await takeInputEvents(page)).every((event) => event.trusted)).toBe(true);
  });

  test('ordinary typing still filters in the menu and still opens a closed in-trigger Select', async ({
    page
  }) => {
    const menu = await openAndFocusSearch(page, 'select-menu-search');
    await page.keyboard.type('syd');
    await expect(menu.items).toHaveCount(1);
    await expect(menu.items).toHaveText('Sydney');
    await page.keyboard.press('Escape');
    await expectClosedWithFocusOnTrigger(menu);

    // Filter in the trigger: typing into a CLOSED Select is how it opens, so the
    // fix must not have turned input events off globally.
    const triggerSearch = page.getByTestId('select-search-demo-search');
    const inTrigger = page.getByTestId('select-search-demo').locator('.select-trigger');
    await triggerSearch.click();
    await expect(inTrigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(inTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(triggerSearch).toBeFocused();

    await page.keyboard.type('tok');

    await expect(inTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.select-dropdown .select-option')).toHaveText('Tokyo');
  });
});

test.describe('Select in a Modal -- Escape and the native search clear (ISSUE-023)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/select');
    await page.getByTestId('select-modal-trigger').click();
    await expect(page.getByTestId('select-modal')).toBeVisible();
  });

  for (const variant of MODAL_VARIANTS) {
    test(`${variant.name}: Escape closes only the Select, the Modal stays, the next click opens empty`, async ({
      page
    }) => {
      const modal = page.getByTestId('select-modal');
      const select = await openAndFocusSearch(page, variant.testId);
      await noResultsThenTokyo(page, select);

      await page.keyboard.press('Escape');

      await expectClosedWithFocusOnTrigger(select);
      await expect(modal).toBeVisible();
      await select.trigger.click();
      await expectReopensFresh(select, variant);
      await expect(modal).toBeVisible();

      // Dismissal ownership still works in order: the Select first, then the Modal.
      await page.keyboard.press('Escape');
      await expectClosedWithFocusOnTrigger(select);
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
    });
  }
});

/**
 * The custom element renders the same Select in an open shadow root, where a
 * portaled panel stays inside that root rather than going to <body>.
 */
const bootSelectElement = async (page: Page, attributes: string): Promise<Locator> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-select') !== 'undefined', null, {
    timeout: 15_000
  });
  await page.evaluate((attrs) => {
    document.body.innerHTML = `<div style="padding:24px"><sui-select id="wc-select" aria-label="City" searchable search-position="menu" ${attrs}></sui-select><button id="wc-next">Next field</button></div>`;
    const element = document.getElementById('wc-select');
    if (element === null) {
      throw new Error('sui-select was not created');
    }
    Reflect.set(element, 'items', [
      { id: 'nyc', label: 'New York' },
      { id: 'ldn', label: 'London' },
      { id: 'tyo', label: 'Tokyo' },
      { id: 'par', label: 'Paris' },
      { id: 'syd', label: 'Sydney' },
      { id: 'ber', label: 'Berlin' },
      { id: 'tor', label: 'Toronto' },
      { id: 'mum', label: 'Mumbai' }
    ]);
  }, attributes);
  return page.locator('#wc-select');
};

test.describe('<sui-select> -- Escape and the native search clear (ISSUE-023)', () => {
  for (const [name, attributes] of [
    ['in-flow', ''],
    ['portaled', 'use-portal']
  ] as const) {
    test(`${name}: Escape closes, the next click opens with an empty query and eight options`, async ({
      page
    }) => {
      const host = await bootSelectElement(page, attributes);
      const trigger = host.locator('.select-trigger');
      const panel = host.locator('.select-dropdown');
      const search = host.locator('.select-menu-search');
      const items = host.locator('.select-dropdown .select-option');

      await trigger.click();
      await expect(panel).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(search).toBeFocused();
      await page.keyboard.type('not-a-city');
      await expect(host.locator('.select-empty')).toHaveText('No results');
      await clearWithKeyboard(page);
      await page.keyboard.type('Tokyo');
      await expect(items).toHaveCount(1);

      await page.keyboard.press('Escape');

      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(panel).toHaveCount(0);
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(search).toHaveValue('');
      await expect(items).toHaveCount(8);
    });
  }
});
