import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// ISSUE-012, custom-element side. A native control in `<sui-menu>`'s `trigger` slot used to be a
// second Tab stop: the shadow-root wrapper is a focusable role="button", and the slotted button
// sits inside it. `interactive-trigger` removed the wrapper's focusability but nothing then wired
// the slotted button -- it could not open the menu and focus fell to <body> on close, because the
// wrapper's querySelector cannot see light-DOM content. Real Tab and the browser's accessibility
// tree are used throughout; a slotted element receives no props, so the wiring has to arrive by
// events and attributes, and only a real interaction shows it did.
const loadBundle = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-menu') !== 'undefined', null, {
    timeout: 15_000
  });
};

type MountOptions = {
  readonly attributes?: string;
  readonly trigger: string;
};

const mount = async (page: Page, options: MountOptions): Promise<void> => {
  await page.evaluate(({ attributes, trigger }) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div id="mount">
        <button id="before" type="button">Before</button>
        <sui-menu ${attributes ?? ''}>${trigger}</sui-menu>
        <button id="after" type="button">After</button>
      </div>`
    );
    const menu = document.querySelector('#mount sui-menu') as HTMLElement & {
      items: unknown;
    };
    menu.items = [
      { label: 'Rename', value: 'rename' },
      { label: 'Share', value: 'share' },
      { label: 'Remove', value: 'remove', danger: true }
    ];
  }, options);
  await page.waitForFunction(() =>
    document.querySelector('#mount sui-menu')?.shadowRoot?.querySelector('.menu-trigger')
  );
};

const activeId = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.activeElement?.id ?? null);

const openMenuCount = (page: Page): Promise<number> =>
  page.evaluate(
    () =>
      document.querySelector('#mount sui-menu')?.shadowRoot?.querySelectorAll('[role="menu"]')
        .length ?? 0
  );

test.describe('sui-menu interactive-trigger with a slotted native control', () => {
  test.beforeEach(async ({ page }) => {
    await loadBundle(page);
    await mount(page, {
      attributes: 'interactive-trigger',
      trigger: '<button slot="trigger" id="slotted" type="button">Open</button>'
    });
  });

  test('the shadow-root wrapper is not a second interactive element', async ({ page }) => {
    const wrapper = await page.evaluate(() => {
      const el = document
        .querySelector('#mount sui-menu')
        ?.shadowRoot?.querySelector('.menu-trigger');
      return {
        role: el?.getAttribute('role') ?? null,
        tabindex: el?.getAttribute('tabindex') ?? null
      };
    });
    expect(wrapper).toEqual({ role: null, tabindex: null });
  });

  test('real Tab and Shift+Tab pass through the slotted button exactly once', async ({ page }) => {
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    expect(await activeId(page)).toBe('slotted');

    await page.keyboard.press('Tab');
    expect(await activeId(page)).toBe('after');

    await page.keyboard.press('Shift+Tab');
    expect(await activeId(page)).toBe('slotted');
    await page.keyboard.press('Shift+Tab');
    expect(await activeId(page)).toBe('before');
  });

  test('the accessibility tree holds one named button carrying the popup state', async ({
    page
  }) => {
    const menu = page.locator('#mount sui-menu');
    const snapshot = (await menu.ariaSnapshot()).trim();
    expect(snapshot.match(/button/g)).toHaveLength(1);
    expect(snapshot).toContain('button "Open"');

    const slotted = page.locator('#slotted');
    await expect(slotted).toHaveAttribute('aria-haspopup', 'menu');
    await expect(slotted).toHaveAttribute('aria-expanded', 'false');
  });

  test('a click opens once, aria-expanded follows, and a second click closes', async ({ page }) => {
    const slotted = page.locator('#slotted');
    await slotted.click();
    await expect(slotted).toHaveAttribute('aria-expanded', 'true');
    expect(await openMenuCount(page)).toBe(1);

    await slotted.click();
    await expect(slotted).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => openMenuCount(page)).toBe(0);
  });

  for (const key of ['Enter', 'Space', 'ArrowDown']) {
    test(`${key} on the slotted button opens the menu exactly once`, async ({ page }) => {
      const slotted = page.locator('#slotted');
      await slotted.focus();
      await page.keyboard.press(key);

      await expect(slotted).toHaveAttribute('aria-expanded', 'true');
      expect(await openMenuCount(page)).toBe(1);
      // Menu moves focus to its first item inside the shadow root.
      await expect(page.locator('#mount sui-menu [role="menuitem"]').first()).toBeFocused();
    });
  }

  test('ArrowUp opens at the last item, Escape returns focus to the slotted button', async ({
    page
  }) => {
    const slotted = page.locator('#slotted');
    await slotted.focus();
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#mount sui-menu [role="menuitem"]').last()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(slotted).toHaveAttribute('aria-expanded', 'false');
    // The wrapper's own querySelector cannot see a light-DOM control, so before the fix focus
    // fell to <body> here and a keyboard user lost their place.
    await expect.poll(() => activeId(page)).toBe('slotted');
  });

  test('selecting an item closes the menu and returns focus to the slotted button', async ({
    page
  }) => {
    const slotted = page.locator('#slotted');
    await slotted.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mount sui-menu [role="menuitem"]').first()).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(slotted).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => activeId(page)).toBe('slotted');
  });

  test('replacing the slotted control moves the popup state to the new one', async ({ page }) => {
    await page.evaluate(() => {
      const menu = document.querySelector('#mount sui-menu');
      menu?.querySelector('[slot="trigger"]')?.remove();
      menu?.insertAdjacentHTML(
        'beforeend',
        '<button slot="trigger" id="replacement" type="button">Replaced</button>'
      );
    });

    const replacement = page.locator('#replacement');
    await expect(replacement).toHaveAttribute('aria-haspopup', 'menu');
    await expect(replacement).toHaveAttribute('aria-expanded', 'false');
    await replacement.click();
    await expect(replacement).toHaveAttribute('aria-expanded', 'true');
  });
});

// The slotted element is often a host, not the control: `<sui-button>` renders its native
// `<button>` in its own shadow root, so the control assistive technology exposes is one the Menu
// can only reach by looking through that root. The popup state has to land on that button -- the
// host has no role of its own -- and has to follow it when it renders late or is replaced.
const defineShadowTriggers = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    if (!customElements.get('x-shadow-trigger')) {
      customElements.define(
        'x-shadow-trigger',
        class extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' }).innerHTML =
              '<button type="button"><slot></slot></button>';
          }
        }
      );
    }
    if (!customElements.get('x-late-trigger')) {
      customElements.define(
        'x-late-trigger',
        class extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
          }
          connectedCallback() {
            // The control is rendered well after the element is connected, as a component that
            // loads its template or data first would.
            setTimeout(() => {
              if (this.shadowRoot !== null && this.shadowRoot.childElementCount === 0) {
                this.shadowRoot.innerHTML = '<button type="button"><slot></slot></button>';
              }
            }, 300);
          }
        }
      );
    }
  });
};

const SHADOW_TRIGGERS: ReadonlyArray<{ name: string; trigger: string }> = [
  {
    name: '<sui-button>',
    trigger: '<sui-button slot="trigger" id="slotted" text="Open"></sui-button>'
  },
  {
    name: 'a custom element with its own shadow button',
    trigger: '<x-shadow-trigger slot="trigger" id="slotted">Open</x-shadow-trigger>'
  }
];

for (const { name, trigger } of SHADOW_TRIGGERS) {
  test.describe(`sui-menu interactive-trigger with a slotted ${name}`, () => {
    test.beforeEach(async ({ page }) => {
      await loadBundle(page);
      await defineShadowTriggers(page);
      await mount(page, { attributes: 'interactive-trigger', trigger });
      await expect(page.locator('#slotted button')).toHaveCount(1);
    });

    // Playwright's CSS engine pierces open shadow roots, so this is the host's own button.
    const control = (page: Page) => page.locator('#slotted button');

    test('the real button carries the popup state, closed and open', async ({ page }) => {
      await expect(control(page)).toHaveAttribute('aria-haspopup', 'menu');
      await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
      // The host is not the control and gets no ARIA of its own.
      await expect(page.locator('#slotted')).not.toHaveAttribute('aria-expanded', /.*/);

      await control(page).click();
      await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
      expect(await openMenuCount(page)).toBe(1);

      await control(page).click();
      await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(() => openMenuCount(page)).toBe(0);
    });

    test('real Tab and Shift+Tab pass through the one button exactly once', async ({ page }) => {
      await page.locator('#before').focus();
      await page.keyboard.press('Tab');
      await expect(control(page)).toBeFocused();
      await page.keyboard.press('Tab');
      expect(await activeId(page)).toBe('after');
      await page.keyboard.press('Shift+Tab');
      await expect(control(page)).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      expect(await activeId(page)).toBe('before');
    });

    test('the accessibility tree holds one named button that reports expansion', async ({
      page
    }) => {
      const menu = page.locator('#mount sui-menu');
      const closed = (await menu.ariaSnapshot()).trim();
      expect(closed.match(/button/g)).toHaveLength(1);
      expect(closed).toContain('button "Open"');
      expect(closed).not.toContain('[expanded]');

      await page.locator('#before').focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
      // aria-expanded on the real button is what the tree reads.
      await expect(menu.getByRole('button', { name: 'Open', expanded: true })).toHaveCount(1);
    });

    for (const key of ['Enter', 'Space', 'ArrowDown']) {
      test(`${key} opens the menu once and Escape returns focus to the button`, async ({
        page
      }) => {
        await page.locator('#before').focus();
        await page.keyboard.press('Tab');
        await expect(control(page)).toBeFocused();
        await page.keyboard.press(key);

        await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
        expect(await openMenuCount(page)).toBe(1);
        await expect(page.locator('#mount sui-menu [role="menuitem"]').first()).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(control(page)).toBeFocused();
        await expect.poll(() => openMenuCount(page)).toBe(0);
      });
    }

    test('selecting an item closes the menu and returns focus to the button', async ({ page }) => {
      await control(page).focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(control(page)).toBeFocused();
    });

    test('replacing the host moves the popup state and returns the old button to how it was', async ({
      page
    }) => {
      const replaced = await control(page).elementHandle();
      await page.evaluate((markup) => {
        const menu = document.querySelector('#mount sui-menu');
        menu?.querySelector('[slot="trigger"]')?.remove();
        menu?.insertAdjacentHTML('beforeend', markup);
      }, '<x-shadow-trigger slot="trigger" id="replacement">Again</x-shadow-trigger>');

      const next = page.locator('#replacement button');
      await expect(next).toHaveAttribute('aria-haspopup', 'menu');
      await expect(next).toHaveAttribute('aria-expanded', 'false');
      expect(await replaced?.getAttribute('aria-expanded')).toBeNull();
      expect(await replaced?.getAttribute('aria-haspopup')).toBeNull();

      await next.click();
      await expect(next).toHaveAttribute('aria-expanded', 'true');
    });
  });
}

test.describe('sui-menu interactive-trigger with a control that renders after Menu has mounted', () => {
  test('the popup state arrives with the control, without waiting for the first open', async ({
    page
  }) => {
    await loadBundle(page);
    await defineShadowTriggers(page);
    await mount(page, {
      attributes: 'interactive-trigger',
      trigger: '<x-late-trigger slot="trigger" id="slotted">Open</x-late-trigger>'
    });

    // Menu mounted while the host's shadow root was still empty; only watching that root can
    // find the button once it appears.
    const control = page.locator('#slotted button');
    await expect(control).toHaveAttribute('aria-haspopup', 'menu');
    await expect(control).toHaveAttribute('aria-expanded', 'false');

    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(await openMenuCount(page)).toBe(1);
  });
});

test.describe('sui-menu without interactive-trigger keeps its wrapper-owned behavior', () => {
  test('a non-interactive slotted glyph is one named, keyboard-operable stop', async ({ page }) => {
    await loadBundle(page);
    await mount(page, {
      attributes: 'trigger-aria-label="More options"',
      trigger: '<span slot="trigger" aria-hidden="true">&#8943;</span>'
    });

    const wrapper = page.locator('#mount sui-menu .menu-trigger');
    await expect(wrapper).toHaveAttribute('role', 'button');
    await expect(wrapper).toHaveAttribute('tabindex', '0');
    await expect(wrapper).toHaveAccessibleName('More options');

    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(wrapper).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await activeId(page)).toBe('after');

    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(wrapper).toHaveAttribute('aria-expanded', 'true');
    expect(await openMenuCount(page)).toBe(1);
  });

  test('a slotted button without the attribute is left exactly as the consumer wrote it', async ({
    page
  }) => {
    await loadBundle(page);
    await mount(page, {
      trigger: '<button slot="trigger" id="slotted" type="button">Open</button>'
    });

    // Back-compat: nothing is adopted, so the slotted element gains no popup ARIA of its own.
    await expect(page.locator('#slotted')).not.toHaveAttribute('aria-haspopup', /.*/);
    await expect(page.locator('#slotted')).not.toHaveAttribute('aria-expanded', /.*/);
    await expect(page.locator('#mount sui-menu .menu-trigger')).toHaveAttribute('role', 'button');
  });
});
