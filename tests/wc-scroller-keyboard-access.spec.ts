import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// ISSUE-021, custom-element side. `<sui-scroller>` renders its content through a `<slot>`, so the
// content is light-DOM markup the shadow-root region can neither query nor observe directly. The
// keyboard route has to be decided from what is slotted -- including a focusable control that lives
// in a nested element's own shadow root -- and has to follow slotted content that changes after
// mount. Real Tab and Arrow presses throughout.
const loadBundle = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () => typeof customElements.get('sui-scroller') !== 'undefined',
    null,
    {
      timeout: 15_000
    }
  );
};

type MountOptions = {
  readonly id: string;
  readonly direction: 'horizontal' | 'vertical';
  readonly content: string;
  readonly attributes?: string;
  readonly style?: string;
};

const mount = async (page: Page, options: MountOptions): Promise<void> => {
  await page.evaluate((o) => {
    let host = document.getElementById('wc-mount');
    if (host === null) {
      host = document.createElement('div');
      host.id = 'wc-mount';
      host.style.cssText =
        'position:relative;z-index:99999;background:#fff;padding:12px;width:520px';
      document.body.append(host);
    }
    host.insertAdjacentHTML(
      'beforeend',
      `<button type="button" id="${o.id}-before">Before</button>
       <sui-scroller id="${o.id}" direction="${o.direction}" ${o.attributes ?? ''} style="${o.style ?? ''}">${o.content}</sui-scroller>
       <button type="button" id="${o.id}-after">After</button>`
    );
    const el = document.getElementById(o.id) as HTMLElement & { showArrows: boolean };
    el.showArrows = false;
  }, options);
  await page.waitForFunction(
    (id) => document.getElementById(id)?.shadowRoot?.querySelector('.scroll-container') !== null,
    options.id
  );
};

const region = (page: Page, id: string): Locator => page.locator(`#${id} .scroll-container`);

const offset = (locator: Locator, axis: 'x' | 'y'): Promise<number> =>
  locator.evaluate((el, a) => (a === 'x' ? el.scrollLeft : el.scrollTop), axis);

const WIDE =
  '<div style="width:1600px;flex-shrink:0;padding:8px">Wide non-interactive content</div>';
const TALL =
  '<div style="height:600px;flex-shrink:0;padding:8px">Tall non-interactive content</div>';

for (const strip of [
  { tag: 'sui-attachment-chip-row', name: 'Pending attachments', axis: 'x' },
  { tag: 'sui-chat-suggestions', name: 'Chat suggestions', axis: 'y' }
] as const) {
  test(`${strip.tag}: its overflowing strip has a contextual name and a real keyboard route`, async ({
    page
  }) => {
    await loadBundle(page);
    await page.evaluate((tag) => {
      const box = document.createElement('div');
      box.style.cssText = 'position:relative;z-index:99999;width:260px;padding:12px';
      box.innerHTML = '<button id="strip-before">Before strip</button>';
      const host = document.createElement(tag);
      host.id = 'strip';
      // Give the inline-block WC host a definite width. Bound vertical scrolling through
      // the documented token; component CSS and disabled-chip behavior stay intact.
      host.style.width = '100%';
      if (tag === 'sui-attachment-chip-row') {
        Object.assign(host, {
          files: Array.from({ length: 12 }, (_, index) => ({
            id: String(index),
            filename: `Report ${index + 1}.pdf`
          }))
        });
      } else {
        Object.assign(host, {
          items: Array.from({ length: 12 }, (_, index) => `Suggestion ${index + 1}`),
          disabled: true,
          layout: 'scroll',
          direction: 'vertical'
        });
        host.style.setProperty('--scroller-height', '120px');
      }
      box.append(host);
      box.insertAdjacentHTML('beforeend', '<button id="strip-after">After strip</button>');
      document.body.append(box);
    }, strip.tag);

    const scroller = page.locator('#strip .scroll-container');
    await expect(scroller).toHaveAccessibleName(strip.name);
    const size = await scroller.evaluate(
      (el, axis) =>
        axis === 'x'
          ? { scroll: el.scrollWidth, client: el.clientWidth }
          : { scroll: el.scrollHeight, client: el.clientHeight },
      strip.axis
    );
    expect(size.scroll).toBeGreaterThan(size.client);
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.locator('#strip-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press(strip.axis === 'x' ? 'ArrowRight' : 'ArrowDown');
    }
    await expect.poll(() => offset(scroller, strip.axis)).toBe(120);
    await page.keyboard.press('Tab');
    await expect(page.locator('#strip-after')).toBeFocused();
  });
}

test.describe('sui-scroller keyboard route without arrows', () => {
  test.beforeEach(async ({ page }) => {
    await loadBundle(page);
  });

  test('horizontal: Tab reaches the region, ArrowRight scrolls it, Tab leaves it', async ({
    page
  }) => {
    await mount(page, { id: 'h', direction: 'horizontal', content: WIDE });

    const scroller = region(page, 'h');
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.locator('#h-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
    await expect(scroller).toHaveAccessibleName('Scrollable content');

    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('ArrowRight');
    }
    await expect.poll(() => offset(scroller, 'x')).toBe(120);

    await page.keyboard.press('Tab');
    await expect(page.locator('#h-after')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(scroller).toBeFocused();
  });

  test('vertical: Tab reaches the region, ArrowDown scrolls it, Tab leaves it', async ({
    page
  }) => {
    await mount(page, {
      id: 'v',
      direction: 'vertical',
      content: TALL,
      style: '--scroller-height:120px'
    });

    const scroller = region(page, 'v');
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.locator('#v-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();

    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('ArrowDown');
    }
    await expect.poll(() => offset(scroller, 'y')).toBe(120);
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => offset(scroller, 'y')).toBe(80);

    await page.keyboard.press('Tab');
    await expect(page.locator('#v-after')).toBeFocused();
  });

  test('the aria-label attribute names the region', async ({ page }) => {
    await mount(page, {
      id: 'named',
      direction: 'horizontal',
      content: WIDE,
      attributes: 'aria-label="Release timeline"'
    });

    const scroller = region(page, 'named');
    await expect(scroller).toHaveAccessibleName('Release timeline');
    await page.locator('#named-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
  });

  test('content that fits adds no Tab stop', async ({ page }) => {
    await mount(page, {
      id: 'fits',
      direction: 'horizontal',
      content: '<div style="width:200px;flex-shrink:0">Fits</div>'
    });

    await expect(region(page, 'fits')).toHaveAttribute('tabindex', '-1');
    await page.locator('#fits-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#fits-after')).toBeFocused();
  });

  test('slotted focusable content keeps its own Tab stops and the region adds none', async ({
    page
  }) => {
    await mount(page, {
      id: 'nested',
      direction: 'horizontal',
      content:
        '<div style="width:1600px;flex-shrink:0;display:flex;justify-content:space-between"><button type="button" id="nested-first">First</button><button type="button" id="nested-last">Last</button></div>'
    });

    await expect(region(page, 'nested')).toHaveAttribute('tabindex', '-1');
    await page.locator('#nested-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#nested-first')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#nested-last')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#nested-after')).toBeFocused();
  });

  test("a control inside a slotted element's own shadow root counts as focusable content", async ({
    page
  }) => {
    await mount(page, {
      id: 'deep',
      direction: 'horizontal',
      content:
        '<div style="width:1600px;flex-shrink:0"><sui-button id="deep-button" text="Nested action"></sui-button></div>'
    });
    await page.waitForFunction(
      () => document.getElementById('deep-button')?.shadowRoot?.querySelector('button') !== null
    );

    // The only focusable thing is a native button inside <sui-button>'s shadow root; a query
    // rooted at the scroller's region cannot see it, which would wrongly add a second stop.
    await expect(region(page, 'deep')).toHaveAttribute('tabindex', '-1');
    await page.locator('#deep-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#deep-button button')).toBeFocused();
  });

  test('slotted content that grows, gains a control or is resized updates the route', async ({
    page
  }) => {
    await mount(page, {
      id: 'live',
      direction: 'horizontal',
      content: '<div id="live-content" style="width:200px;flex-shrink:0">Small</div>'
    });

    const scroller = region(page, 'live');
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    // Slotted light-DOM content grows: nothing resized the region itself.
    await page.evaluate(() => {
      const content = document.getElementById('live-content');
      if (content !== null) {
        content.style.width = '1600px';
      }
    });
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.locator('#live-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();

    // A focusable control is added to the slotted content.
    await page.evaluate(() => {
      document
        .getElementById('live-content')
        ?.insertAdjacentHTML('beforeend', '<button type="button" id="live-inner">Inner</button>');
    });
    await expect(scroller).toHaveAttribute('tabindex', '-1');
    await page.evaluate(() => document.getElementById('live-inner')?.remove());
    await expect(scroller).toHaveAttribute('tabindex', '0');

    // The slotted element is replaced outright.
    await page.evaluate(() => {
      const host = document.getElementById('live');
      host?.replaceChildren();
      host?.insertAdjacentHTML('beforeend', '<div style="width:100px;flex-shrink:0">Tiny</div>');
    });
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    // Narrowing the host: the content is unchanged, the region shrinks below it.
    await page.evaluate(() => {
      const host = document.getElementById('live');
      host?.replaceChildren();
      host?.insertAdjacentHTML('beforeend', '<div style="width:400px;flex-shrink:0">Medium</div>');
    });
    await expect(scroller).toHaveAttribute('tabindex', '-1');
    await page.evaluate(() => {
      const host = document.getElementById('live');
      if (host !== null) {
        host.style.width = '240px';
      }
    });
    await expect(scroller).toHaveAttribute('tabindex', '0');
  });

  test('with arrows on, the arrows are the route and the region adds no Tab stop', async ({
    page
  }) => {
    await mount(page, { id: 'arrows', direction: 'horizontal', content: WIDE });
    await page.evaluate(() => {
      const el = document.getElementById('arrows') as HTMLElement & { showArrows: boolean };
      el.showArrows = true;
    });

    await expect(region(page, 'arrows')).toHaveAttribute('tabindex', '-1');
    await page.locator('#arrows-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#arrows [aria-label="Scroll next"]')).toBeFocused();
  });
});

// A control hidden inside slotted content that keeps its size: no box moves, so only a route that
// watches the control (or the slotted content's attributes) can notice. The hiding rules live in
// the document stylesheet because that is where a consumer of `<sui-scroller>` writes them.
// --button-visibility is Button's own documented hook: its inner control sets visibility itself,
// so hiding the <sui-button> host alone would leave the native button visible.
const HIDING_STYLE = `
  .pw-gone { display: none !important; }
  .pw-invisible { visibility: hidden !important; --button-visibility: hidden; }
  .pw-compact #hide-control { display: none !important; }
`;

type HidingStrategy = {
  readonly name: string;
  readonly hide: (page: Page) => Promise<void>;
  readonly show: (page: Page) => Promise<void>;
};

const onControl = (page: Page, apply: (el: HTMLElement) => void): Promise<void> =>
  page.locator('#hide-control').evaluate(apply);

const HIDING_STRATEGIES: readonly HidingStrategy[] = [
  {
    name: 'inline style display:none',
    hide: (page) => onControl(page, (el) => el.style.setProperty('display', 'none')),
    show: (page) => onControl(page, (el) => el.style.removeProperty('display'))
  },
  {
    name: 'a class that sets display:none',
    hide: (page) => onControl(page, (el) => el.classList.add('pw-gone')),
    show: (page) => onControl(page, (el) => el.classList.remove('pw-gone'))
  },
  {
    name: 'a class that sets visibility:hidden',
    hide: (page) => onControl(page, (el) => el.classList.add('pw-invisible')),
    show: (page) => onControl(page, (el) => el.classList.remove('pw-invisible'))
  },
  {
    name: 'the hidden attribute',
    hide: (page) => onControl(page, (el) => el.setAttribute('hidden', '')),
    show: (page) => onControl(page, (el) => el.removeAttribute('hidden'))
  },
  {
    name: 'the inert attribute',
    hide: (page) => onControl(page, (el) => el.setAttribute('inert', '')),
    show: (page) => onControl(page, (el) => el.removeAttribute('inert'))
  },
  {
    name: 'a class on an ancestor outside the element, through a stylesheet rule',
    hide: (page) => page.evaluate(() => document.documentElement.classList.add('pw-compact')),
    show: (page) => page.evaluate(() => document.documentElement.classList.remove('pw-compact'))
  }
];

const CONTROLS: ReadonlyArray<{
  readonly name: string;
  readonly markup: string;
  readonly notHiddenBy?: string;
}> = [
  { name: 'a native button', markup: '<button type="button" id="hide-control">Only</button>' },
  {
    name: 'a <sui-button> whose native button is in its shadow root',
    markup: '<sui-button id="hide-control" text="Only"></sui-button>',
    // The element's own :host rule sets `display`, and an author rule beats the user-agent
    // `[hidden]` rule, so the attribute does not hide this element at all (the button stays
    // rendered and focusable). Nothing to follow, so that case is not asserted here.
    notHiddenBy: 'the hidden attribute'
  }
];

test.describe('sui-scroller keyboard route follows controls hidden without any resize', () => {
  test.beforeEach(async ({ page }) => {
    await loadBundle(page);
    await page.addStyleTag({ content: HIDING_STYLE });
  });

  for (const control of CONTROLS) {
    for (const strategy of HIDING_STRATEGIES.filter(
      (entry) => entry.name !== control.notHiddenBy
    )) {
      test(`${control.name}, hidden and shown with ${strategy.name}`, async ({ page }) => {
        await mount(page, {
          id: 'hide',
          direction: 'horizontal',
          // A fixed height as well as width: without one, hiding the control collapses the row to
          // nothing, and a zero-height box adds no scrollable width -- there would be nothing left
          // to scroll, which is correctly not a Tab stop.
          content: `<div id="hide-content" style="width:1600px;height:48px;flex-shrink:0">${control.markup}</div>`
        });
        if (control.markup.includes('sui-button')) {
          await page.waitForFunction(() =>
            document.getElementById('hide-control')?.shadowRoot?.querySelector('button')
          );
        }
        const focusTarget = control.markup.includes('sui-button')
          ? page.locator('#hide-control button')
          : page.locator('#hide-control');

        const scroller = region(page, 'hide');
        const widthBefore = await page
          .locator('#hide-content')
          .evaluate((el) => el.getBoundingClientRect().width);

        await expect(scroller).toHaveAttribute('tabindex', '-1');
        await page.locator('#hide-before').focus();
        await page.keyboard.press('Tab');
        await expect(focusTarget).toBeFocused();

        await strategy.hide(page);
        await expect(scroller).toHaveAttribute('tabindex', '0');
        expect(
          await page.locator('#hide-content').evaluate((el) => el.getBoundingClientRect().width)
        ).toBe(widthBefore);

        await page.locator('#hide-before').focus();
        await page.keyboard.press('Tab');
        await expect(scroller).toBeFocused();
        await expect(scroller).toHaveAccessibleName('Scrollable content');
        for (let press = 0; press < 3; press += 1) {
          await page.keyboard.press('ArrowRight');
        }
        await expect.poll(() => offset(scroller, 'x')).toBe(120);
        await page.keyboard.press('Tab');
        await expect(page.locator('#hide-after')).toBeFocused();

        await strategy.show(page);
        await expect(scroller).toHaveAttribute('tabindex', '-1');
        await page.locator('#hide-before').focus();
        await page.keyboard.press('Tab');
        await expect(focusTarget).toBeFocused();
      });
    }
  }
});
