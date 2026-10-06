import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { gotoHydrated } from './support/hydrated';

// The library sized a Modal by height only: the three size classes read a
// width token with no ceiling, so any consumer token wider than the screen, any
// wide child and any long footer label pushed the dialog off it, and the footer
// action row could not wrap. The panel now carries a per-alignment max-width --
// the centred one subtracts --modal-viewport-gutter, top and bottom are edge to
// edge -- and the footer row wraps. A consumer's width token still wins until it
// exceeds that ceiling, and a percentage token resolves against the same box it
// always did.
//
// Every geometry assertion lives here rather than in vitest because jsdom does
// no layout. The scenarios run in tests/fixtures/modal-viewport, which is driven
// by the query string, so none of them is a docs demo that the visual suite
// would have to baseline.

type Box = { x: number; y: number; width: number; height: number };

type Scenario = {
  size?: 'small' | 'medium' | 'large' | 'fit-content';
  align?: 'top' | 'center' | 'bottom';
  transition?: boolean;
  body?: 'normal' | 'wide' | 'narrow';
  tokens?: string;
  primary?: string;
  css?: string;
  portal?: boolean;
};

const measure = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('boundingBox is null');
  }
  return box;
};

// Transitions move the panel on y only, but a settled panel is the one a user
// sees, so measure after every running animation has finished.
const settle = async (page: Page): Promise<void> => {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => null)))
  );
};

const openScenario = async (page: Page, scenario: Scenario = {}): Promise<Locator> => {
  const query = new URLSearchParams();
  query.set('size', scenario.size ?? 'medium');
  query.set('align', scenario.align ?? 'center');
  query.set('transition', scenario.transition === false ? 'off' : 'on');
  query.set('body', scenario.body ?? 'normal');
  query.set('tokens', scenario.tokens ?? '');
  if (typeof scenario.primary === 'string') {
    query.set('primary', scenario.primary);
  }
  if (typeof scenario.css === 'string') {
    query.set('css', scenario.css);
  }
  if (scenario.portal === true) {
    query.set('portal', 'on');
  }
  await page.goto(`${fixtureBaseURL}/modal-viewport/?${query.toString()}`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
  const panel = page.getByTestId('fixture-modal').locator('.modal-content');
  await expect(panel).toBeVisible();
  await settle(page);
  return panel;
};

const panelAt = async (
  page: Page,
  viewportWidth: number,
  scenario: Scenario = {}
): Promise<Box> => {
  await page.setViewportSize({ width: viewportWidth, height: 700 });
  return measure(await openScenario(page, scenario));
};

const GUTTER = 32;
const TOKEN_WIDTH = 550;
const mediumWidth = (value: string): string => `--modal-medium-width: ${value};`;
const wideToken = mediumWidth('34.375rem');
const transitionModes = [
  { label: 'with the transition wrapper', transition: true },
  { label: 'with enableTransition=false', transition: false }
] as const;

test.describe('Modal viewport width: centred', () => {
  for (const mode of transitionModes) {
    test(`a ${TOKEN_WIDTH}px size token is capped to the viewport minus the gutter on a phone, ${mode.label}`, async ({
      page
    }) => {
      const box = await panelAt(page, 375, { transition: mode.transition, tokens: wideToken });

      expect(box.width).toBeCloseTo(375 - GUTTER, 0);
      expect(box.x).toBeCloseTo(GUTTER / 2, 0);
      expect(box.x + box.width).toBeCloseTo(375 - GUTTER / 2, 0);
    });

    test(`the same token is honoured untouched on a desktop viewport, ${mode.label}`, async ({
      page
    }) => {
      const box = await panelAt(page, 1280, { transition: mode.transition, tokens: wideToken });

      expect(box.width).toBeCloseTo(TOKEN_WIDTH, 0);
    });

    test(`a 700px unbreakable child with no width token is capped and centred, ${mode.label}`, async ({
      page
    }) => {
      const box = await panelAt(page, 375, { transition: mode.transition, body: 'wide' });

      expect(box.width).toBeCloseTo(375 - GUTTER, 0);
      expect(box.x).toBeCloseTo(GUTTER / 2, 0);
    });
  }

  test('the cap and the token trade places exactly at token + gutter', async ({ page }) => {
    // 581 is one pixel short of 550 + 32, so the ceiling is the smaller number;
    // 582 is where the consumer's token starts winning.
    const justBelow = await panelAt(page, TOKEN_WIDTH + GUTTER - 1, { tokens: wideToken });
    expect(justBelow.width).toBeCloseTo(TOKEN_WIDTH - 1, 0);

    const atBoundary = await panelAt(page, TOKEN_WIDTH + GUTTER, { tokens: wideToken });
    expect(atBoundary.width).toBeCloseTo(TOKEN_WIDTH, 0);
  });

  test('a keyword width token still sizes the panel, and is still capped', async ({ page }) => {
    // fit-content is invalid inside min(), and an invalid width falls back to
    // auto. A sheet stretches to the viewport on auto, so a lost keyword shows
    // up as a full-width panel; the ceiling therefore has to be a max-width.
    for (const mode of transitionModes) {
      const shrunk = await panelAt(page, 375, {
        align: 'top',
        transition: mode.transition,
        body: 'narrow',
        tokens: mediumWidth('fit-content')
      });
      expect(shrunk.width).toBeLessThan(300);
    }

    for (const keyword of ['fit-content', 'max-content']) {
      const capped = await panelAt(page, 375, { body: 'wide', tokens: mediumWidth(keyword) });
      expect(capped.width).toBeCloseTo(375 - GUTTER, 0);
    }
  });
});

// The panel's own width token resolves a percentage against the shrink-to-fit
// transition wrapper. The ceiling must not narrow that wrapper, or every
// percentage would be a fraction of the cap: calc(100% - 32px) rendered 343px
// before the ceiling existed and 311px once the cap shrank the box it resolves
// against. The normal body is wider than a phone, so the wrapper is the viewport.
test.describe('Modal viewport width: percentage tokens', () => {
  // Where the panel starts. With the transition wrapper a panel that fills the
  // ceiling is centred, but one a percentage leaves narrower is offset from the
  // start edge by half the gutter and so is not; without the wrapper the overlay
  // centres every one of them.
  const centredWidths = [
    { token: 'calc(100% - 32px)', width: 343, x: 16, xWithoutWrapper: 16 },
    { token: 'min(35rem, calc(100% - 2rem))', width: 343, x: 16, xWithoutWrapper: 16 },
    { token: '90%', width: 337.5, x: 16, xWithoutWrapper: 18.75 },
    { token: '95%', width: 343, x: 16, xWithoutWrapper: 16 },
    { token: '100%', width: 343, x: 16, xWithoutWrapper: 16 }
  ];
  const sheetWidths = [
    { token: 'calc(100% - 32px)', width: 343 },
    { token: '90%', width: 337.5 },
    { token: '95%', width: 356.25 },
    { token: '100%', width: 375 }
  ];

  for (const mode of transitionModes) {
    for (const { token, width, x, xWithoutWrapper } of centredWidths) {
      test(`centred ${token} renders ${width}px at 375px, ${mode.label}`, async ({ page }) => {
        const box = await panelAt(page, 375, {
          transition: mode.transition,
          tokens: mediumWidth(token)
        });

        expect(box.width).toBeCloseTo(width, 1);
        expect(box.x).toBeCloseTo(mode.transition ? x : xWithoutWrapper, 1);
        expect(box.x + box.width).toBeLessThanOrEqual(375 + 0.5);
      });
    }

    for (const align of ['top', 'bottom'] as const) {
      for (const { token, width } of sheetWidths) {
        test(`align=${align} ${token} renders ${width}px at 375px, ${mode.label}`, async ({
          page
        }) => {
          const box = await panelAt(page, 375, {
            align,
            transition: mode.transition,
            tokens: mediumWidth(token)
          });

          expect(box.width).toBeCloseTo(width, 1);
        });
      }
    }
  }
});

test.describe('Modal viewport width: top and bottom', () => {
  for (const align of ['top', 'bottom'] as const) {
    for (const mode of transitionModes) {
      test(`align=${align} ${mode.label}: a ${TOKEN_WIDTH}px token is capped to the full viewport width`, async ({
        page
      }) => {
        const options = { align, transition: mode.transition, tokens: wideToken };
        const narrow = await panelAt(page, 375, options);
        expect(narrow.width).toBeCloseTo(375, 0);
        expect(narrow.x).toBeCloseTo(0, 0);

        const wide = await panelAt(page, 768, options);
        expect(wide.width).toBeCloseTo(TOKEN_WIDTH, 0);
      });
    }

    for (const items of ['flex-start', 'flex-end', 'center']) {
      test(`align=${align} with ${items} alignment keeps a wide token inside the viewport`, async ({
        page
      }) => {
        const box = await panelAt(page, 375, {
          align,
          tokens: `--modal-${align}-align-items: ${items}; ${wideToken}`
        });

        expect(box.width).toBeCloseTo(375, 0);
        expect(box.x).toBeCloseTo(0, 0);
      });
    }
  }

  test('a bottom sheet with no width token still fills the viewport, as it did before', async ({
    page
  }) => {
    // The regression control: the ceiling must not reshape a default sheet.
    const phone = await panelAt(page, 375, { align: 'bottom' });
    expect(phone.width).toBeCloseTo(375, 0);
    expect(phone.x).toBeCloseTo(0, 0);

    const tablet = await panelAt(page, 768, { align: 'bottom' });
    expect(tablet.width).toBeCloseTo(768, 0);
  });
});

test.describe('Modal viewport width: tokens', () => {
  test('--modal-center-max-width: none restores the unbounded width', async ({ page }) => {
    const box = await panelAt(page, 375, {
      tokens: `${wideToken} --modal-center-max-width: none;`
    });

    expect(box.width).toBeCloseTo(TOKEN_WIDTH, 0);
    expect(box.x).toBeLessThan(0);
  });

  test('--modal-viewport-gutter sets the space reserved on both sides', async ({ page }) => {
    const flush = await panelAt(page, 375, {
      tokens: `${wideToken} --modal-viewport-gutter: 0px;`
    });
    expect(flush.width).toBeCloseTo(375, 0);

    const wide = await panelAt(page, 375, {
      tokens: `${wideToken} --modal-viewport-gutter: 48px;`
    });
    expect(wide.width).toBeCloseTo(375 - 48, 0);
  });

  for (const align of ['top', 'bottom'] as const) {
    test(`--modal-${align}-max-width caps a ${align} sheet independently of the centred ceiling`, async ({
      page
    }) => {
      const box = await panelAt(page, 375, {
        align,
        tokens: `${wideToken} --modal-${align}-max-width: 300px;`
      });

      expect(box.width).toBeCloseTo(300, 0);
    });

    test(`an app-wide --modal-center-max-width never reshapes a ${align} sheet`, async ({
      page
    }) => {
      // The same ancestor token narrows a centred dialog, which proves it
      // reaches the overlay, and leaves both sheets at the viewport width.
      const ancestor = '--modal-center-max-width: 300px;';
      const centred = await panelAt(page, 768, { tokens: ancestor });
      expect(centred.width).toBeCloseTo(300, 0);

      for (const viewportWidth of [375, 768]) {
        const sheet = await panelAt(page, viewportWidth, { align, tokens: ancestor });
        expect(sheet.width).toBeCloseTo(viewportWidth, 0);
        expect(sheet.x).toBeCloseTo(0, 0);
      }
    });
  }

  test('an embedded overlay with the ceiling set to its region keeps the panel inside it', async ({
    page
  }) => {
    // A host that shrinks the overlay with --modal-width and --modal-margin is
    // told to set the ceiling to that region; the viewport-measured default
    // cannot know where the region ends.
    const region = { left: 300, width: 700 };
    const box = await panelAt(page, 1280, {
      body: 'wide',
      tokens: `--modal-width: ${region.width}px; --modal-margin: 0 0 0 ${region.left}px; --modal-center-max-width: ${region.width - GUTTER}px; ${mediumWidth(`${region.width}px`)}`
    });

    expect(box.width).toBeCloseTo(region.width - GUTTER, 0);
    expect(box.x).toBeCloseTo(region.left + GUTTER / 2, 0);
  });

  test('with usePortal a token on an ancestor of the modal no longer reaches the overlay', async ({
    page
  }) => {
    const ancestor = '--modal-center-max-width: 300px;';
    const inline = await panelAt(page, 768, { tokens: ancestor });
    expect(inline.width).toBeCloseTo(300, 0);

    const portalled = await panelAt(page, 768, { tokens: ancestor, portal: true });
    expect(portalled.width).toBeGreaterThan(300 + 1);
  });

  test('--modal-viewport-gutter also drives the default height cap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // size=large asks for 80vh = 640px, which is under 800 - 32.
    const byDefault = await measure(await openScenario(page, { size: 'large' }));
    expect(byDefault.height).toBeCloseTo(640, 0);

    // A 200px gutter leaves 600px, below the 640px the size asks for.
    const widerGutter = await measure(
      await openScenario(page, { size: 'large', tokens: '--modal-viewport-gutter: 200px;' })
    );
    expect(widerGutter.height).toBeCloseTo(600, 0);
  });
});

// The wrapper that animates the panel can be wider than the panel: where a
// ceiling caps the panel, where a percentage token leaves it narrow, and beside
// every top or bottom sheet narrower than the viewport, because the wrapper
// stretches across it. Without pointer-events: none that strip swallows the
// click that should reach the overlay.
test.describe('Modal viewport width: overlay hit area', () => {
  const beside = async (page: Page, viewportWidth: number, scenario: Scenario) => {
    await page.setViewportSize({ width: viewportWidth, height: 700 });
    const panel = await measure(await openScenario(page, scenario));
    const wrapper = await measure(page.getByTestId('fixture-modal').locator('.modal-animation'));
    const point = { x: panel.x + panel.width + 6, y: panel.y + panel.height / 2 };
    // Without this the click would reach the overlay whether or not the rule
    // under test exists, and the assertions below would prove nothing.
    expect(point.x).toBeLessThan(wrapper.x + wrapper.width);
    return { panel, point };
  };

  test('a tap in the gutter beside a capped panel reaches the overlay', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    const panel = await openScenario(page, { tokens: wideToken });
    const box = await measure(panel);
    expect(box.x).toBeCloseTo(GUTTER / 2, 0);

    const clicks = page.getByTestId('fixture-overlay-clicks');
    await expect(clicks).toHaveText('0');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(clicks).toHaveText('0');

    await page.mouse.click(GUTTER / 4, box.y + box.height / 2);
    await expect(clicks).toHaveText('1');
  });

  const strips = [
    { name: 'a 90% panel', viewport: 375, scenario: { tokens: mediumWidth('90%') } },
    {
      name: 'a bottom sheet narrower than the viewport',
      viewport: 1280,
      scenario: { align: 'bottom', tokens: wideToken } as const
    },
    {
      name: 'a top sheet narrower than the viewport',
      viewport: 768,
      scenario: { align: 'top', tokens: wideToken } as const
    }
  ];

  for (const { name, viewport, scenario } of strips) {
    test(`a tap beside ${name} reaches the overlay and a tap inside it does not`, async ({
      page
    }) => {
      const { panel, point } = await beside(page, viewport, scenario);
      const clicks = page.getByTestId('fixture-overlay-clicks');

      await page.mouse.click(panel.x + panel.width / 2, point.y);
      await expect(clicks).toHaveText('0');

      await page.mouse.click(point.x, point.y);
      await expect(clicks).toHaveText('1');
    });
  }

  test('a drag that starts in the panel and is released beside it ends on the overlay', async ({
    page,
    browserName
  }) => {
    const { panel, point } = await beside(page, 375, { tokens: mediumWidth('90%') });

    // Every engine must resolve the release point to the overlay: that is what the rule under
    // test controls.
    const hitClass = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.className ?? null,
      point
    );
    expect(hitClass).toMatch(/(^|\s)modal(\s|$)/);

    await page.mouse.move(panel.x + panel.width / 2, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x, point.y, { steps: 5 });
    await page.mouse.up();

    // Whether the browser then raises a click on the overlay is the engine's call, not the
    // library's. Chromium and WebKit report the release on the element under the pointer, so the
    // click lands on the overlay. Firefox keeps reporting it on the panel (`.modal-content` is a
    // scroll container, and Gecko captures the mouse to one for the whole press), so no overlay
    // click is raised and a text selection dragged out of the dialog does not dismiss it.
    await expect(page.getByTestId('fixture-overlay-clicks')).toHaveText(
      browserName === 'firefox' ? '0' : '1'
    );
  });

  test('a consumer pointer-events rule on the transition wrapper wins', async ({ page }) => {
    const { point } = await beside(page, 1280, {
      align: 'bottom',
      tokens: wideToken,
      css: '.modal-animation { pointer-events: auto; }'
    });

    const hitClass = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.className ?? null,
      point
    );
    expect(hitClass).toContain('modal-animation');
  });
});

// An app that already styles the panel wrote its rule before the library added
// these declarations, and its stylesheet is linked ahead of the library's. Every
// rule the library adds is wrapped in :where() so it has no specificity; were it
// to tie, the library's later position would win and the app's rule would be
// silently dead. The fixture puts each rule first in the head to match.
test.describe('Modal viewport width: rules an app already has', () => {
  const centreWithAutoMargins = '.modal-content { margin-left: auto; margin-right: auto; }';

  test('a margin: 0 auto on the panel centres a bottom sheet narrower than the viewport', async ({
    page
  }) => {
    const box = await panelAt(page, 768, {
      align: 'bottom',
      tokens: mediumWidth('300px'),
      css: centreWithAutoMargins
    });

    expect(box.width).toBeCloseTo(300, 0);
    expect(box.x).toBeCloseTo((768 - 300) / 2, 0);
  });

  test('a margin: 0 auto on the panel centres a dialog that align-items stretches', async ({
    page
  }) => {
    const box = await panelAt(page, 1280, {
      tokens: `${mediumWidth('300px')} --modal-center-align-items: stretch;`,
      css: centreWithAutoMargins
    });

    expect(box.width).toBeCloseTo(300, 0);
    expect(box.x).toBeCloseTo((1280 - 300) / 2, 0);
  });

  test('a max-width on the panel replaces the ceiling', async ({ page }) => {
    const box = await panelAt(page, 1280, {
      tokens: mediumWidth('900px'),
      css: '.modal-content { max-width: 600px; }'
    });

    expect(box.width).toBeCloseTo(600, 0);
  });
});

const FOOTER_INLINE_PADDING = 20;
const footerFonts =
  '--modal-footer-primary-button-font-family: Arial, sans-serif; --modal-footer-secondary-button-font-family: Arial, sans-serif;';
const longFooter: Scenario = {
  size: 'fit-content',
  primary: 'Save payment group and continue',
  tokens: `--modal-footer-gap: 8px; ${footerFonts}`
};

const footerGeometry = async (page: Page, scenario: Scenario) => {
  const panel = await measure(await openScenario(page, scenario));
  const modal = page.getByTestId('fixture-modal');
  return {
    panel,
    secondary: await measure(modal.getByTestId('fixture-modal-secondary')),
    primary: await measure(modal.getByTestId('fixture-modal-primary'))
  };
};

test.describe('Modal viewport width: footer and body', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('footer actions that do not fit wrap onto a second row inside the panel', async ({
    page
  }) => {
    const { panel, secondary, primary } = await footerGeometry(page, longFooter);

    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(360);

    expect(primary.y).toBeGreaterThan(secondary.y + secondary.height - 1);
    for (const button of [secondary, primary]) {
      expect(button.x).toBeGreaterThanOrEqual(panel.x);
      expect(button.x + button.width).toBeLessThanOrEqual(panel.x + panel.width + 0.5);
    }
  });

  test('a footer that fits stays on one row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { secondary, primary } = await footerGeometry(page, longFooter);

    expect(primary.y).toBeCloseTo(secondary.y, 0);
  });

  test('--modal-footer-action-buttons-justify-content aligns the wrapped rows', async ({
    page
  }) => {
    // Wrapped, each button sits alone on its row, so the justify value alone
    // decides which edge of the footer it lands on.
    const startAligned = await footerGeometry(page, longFooter);
    expect(startAligned.primary.y).toBeGreaterThan(startAligned.secondary.y);
    for (const button of [startAligned.secondary, startAligned.primary]) {
      expect(button.x).toBeCloseTo(startAligned.panel.x + FOOTER_INLINE_PADDING, 0);
    }

    const endAligned = await footerGeometry(page, {
      ...longFooter,
      tokens: `${longFooter.tokens} --modal-footer-action-buttons-justify-content: flex-end;`
    });
    expect(endAligned.primary.y).toBeGreaterThan(endAligned.secondary.y);
    const footerEnd = endAligned.panel.x + endAligned.panel.width - FOOTER_INLINE_PADDING;
    for (const button of [endAligned.secondary, endAligned.primary]) {
      expect(button.x + button.width).toBeCloseTo(footerEnd, 0);
    }
  });

  test('a consumer rule on the footer row keeps the wrapped buttons right-aligned', async ({
    page
  }) => {
    const { panel, secondary, primary } = await footerGeometry(page, {
      ...longFooter,
      css: '.modal-content .footer-action-buttons { max-width: 100%; flex-wrap: wrap; justify-content: flex-end; }'
    });

    expect(primary.y).toBeGreaterThan(secondary.y + secondary.height - 1);
    const footerEnd = panel.x + panel.width - FOOTER_INLINE_PADDING;
    for (const button of [secondary, primary]) {
      expect(button.x + button.width).toBeCloseTo(footerEnd, 0);
    }
  });

  test('a consumer flex-wrap: nowrap on the footer row keeps the buttons on one line', async ({
    page
  }) => {
    const { secondary, primary } = await footerGeometry(page, {
      ...longFooter,
      css: '.modal-content .footer-action-buttons { flex-wrap: nowrap; }'
    });

    expect(primary.y).toBeCloseTo(secondary.y, 0);
  });

  test('a 700px unbreakable body is capped to the viewport and scrolls inside it', async ({
    page
  }) => {
    const content = await openScenario(page, { size: 'fit-content', body: 'wide' });
    const modal = page.getByTestId('fixture-modal');
    const panel = await measure(content);

    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(360);

    const scroll = await modal.locator('.slot-content').evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    }));
    expect(scroll.scrollWidth).toBeGreaterThanOrEqual(700);
    expect(scroll.clientWidth).toBeLessThan(scroll.scrollWidth);

    // The body scrolls; the footer does not leave the screen with it.
    const footer = await measure(modal.locator('.footer-content'));
    expect(footer.x).toBeGreaterThanOrEqual(0);
    expect(footer.x + footer.width).toBeLessThanOrEqual(360);
  });
});

// <sui-modal> wraps the same Modal.svelte, so the ceiling lives in the compiled
// custom element's shadow root and is covered here. The default footer buttons
// are not: the wrapper re-creates .footer-action-buttons in its own template and
// Svelte scopes Modal.svelte's footer rules to Modal's own markup, so neither the
// wrap nor the justify token reaches them.
test.describe('<sui-modal> viewport width', () => {
  const mountModal = async (page: Page, viewportWidth: number, markup: string) => {
    await page.setViewportSize({ width: viewportWidth, height: 700 });
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-modal') !== 'undefined', null, {
      timeout: 15_000
    });
    await page.evaluate((html) => {
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.append(host);
    }, markup);
    const panel = page.getByTestId('wc-modal').locator('.modal-content');
    await expect(panel).toBeVisible();
    await settle(page);
    return measure(panel);
  };

  const centered = `<sui-modal data-pw="wc-modal" size="medium" style="--modal-medium-width: 34.375rem"><p>Body</p></sui-modal>`;

  test('a wide size token is capped on a phone', async ({ page }) => {
    const box = await mountModal(page, 375, centered);

    expect(box.width).toBeCloseTo(375 - GUTTER, 0);
    expect(box.x).toBeCloseTo(GUTTER / 2, 0);
  });

  test('the same token is honoured on a desktop viewport', async ({ page }) => {
    const box = await mountModal(page, 1280, centered);

    expect(box.width).toBeCloseTo(TOKEN_WIDTH, 0);
  });

  test('align=bottom is capped to the full viewport width', async ({ page }) => {
    const box = await mountModal(
      page,
      375,
      `<sui-modal data-pw="wc-modal" size="medium" align="bottom" style="--modal-medium-width: 34.375rem"><p>Body</p></sui-modal>`
    );

    expect(box.width).toBeCloseTo(375, 0);
    expect(box.x).toBeCloseTo(0, 0);
  });
});
