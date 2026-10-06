import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// `--banner-right-margin-left` is the margin on the rightContent slot's wrapper, and the only
// reason an app sets it is `auto`: an auto margin takes the row's spare width, so the slot and the
// dismiss button after it sit at the end of the row. Layout cannot be proved in jsdom, so every
// claim here is a bounding box in a real browser, on the tests/fixtures/banner-right-margin page.
//
// Every part of the row is a fixed size (an 18px icon, a 120px body, a 60px slot, an 18px
// dismiss button, 12px side padding, an 8px gap), so no offset depends on a font and each
// expected number below is exact. They are offsets from the banner's left edge.
//
// The "token unset" tests pin what release 4.42.0 laid out. The numbers were measured on a build of
// that release's sources, and the same tests were run against that build to show they hold there
// too; a banner that does not use the token must not move. The rest need the new rule.
//
// The repo's Playwright project runs Chromium only, so this file only ever runs there in CI. The
// Firefox and WebKit results were measured by running this same file through a scratch Playwright
// config, not by CI: on 6 October 2026, in Chromium 148.0.7778.96, Firefox 150.0.2 and WebKit 26.4.
// Every part of the fixture has a fixed size, so no number here depends on the machine's fonts.
const BANNER_WIDTH = 480;
const SIDE_PADDING = 12;
const GAP = 8;
const SLOT_WIDTH = 60;
const BODY_WIDTH = 120;

type Box = { x: number; y: number; width: number; height: number };

type Row = {
  icon: number;
  body: number;
  right: number | null;
  dismiss: number | null;
};

const measure = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('boundingBox is null');
  }
  return box;
};

const measureOptional = async (locator: Locator): Promise<Box | null> =>
  (await locator.count()) === 0 ? null : measure(locator);

const openFixture = async (page: Page, query = ''): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/banner-right-margin/${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

const rowOf = async (page: Page, scenario: string): Promise<Row & { height: number }> => {
  const host = page.getByTestId(`brm-${scenario}`);
  const banner = await measure(host.locator('.banner'));
  const offset = (box: Box | null): number | null => (box === null ? null : box.x - banner.x);
  return {
    height: banner.height,
    icon: offset(await measure(page.getByTestId(`brm-${scenario}-icon`))) ?? Number.NaN,
    body: offset(await measure(page.getByTestId(`brm-${scenario}-body`))) ?? Number.NaN,
    right: offset(await measureOptional(page.getByTestId(`brm-${scenario}-right`))),
    dismiss: offset(await measureOptional(host.locator('.banner-dismiss')))
  };
};

// The slot and the dismiss button as offsets from the banner's top-left corner on both axes, for the
// rows where the row does not run left to right.
const offsetsIn = async (page: Page, scenario: string) => {
  const host = page.getByTestId(`brm-${scenario}`);
  const banner = await measure(host.locator('.banner'));
  const place = (box: Box): { x: number; y: number } => ({
    x: box.x - banner.x,
    y: box.y - banner.y
  });
  return {
    banner,
    slot: place(await measure(page.getByTestId(`brm-${scenario}-right`))),
    dismiss: place(await measure(host.locator('.banner-dismiss')))
  };
};

const expectRow = (actual: Row, expected: Row): void => {
  expect(actual.icon).toBeCloseTo(expected.icon, 1);
  expect(actual.body).toBeCloseTo(expected.body, 1);
  if (expected.right === null) {
    expect(actual.right).toBeNull();
  } else {
    expect(actual.right).toBeCloseTo(expected.right, 1);
  }
  if (expected.dismiss === null) {
    expect(actual.dismiss).toBeNull();
  } else {
    expect(actual.dismiss).toBeCloseTo(expected.dismiss, 1);
  }
};

// What release 4.42.0 laid out, measured on its sources in Chromium, Firefox and WebKit (the three
// agree to the pixel). `justify-content: center` is why the unset row sits in the middle.
const UNSET_ROWS: Readonly<Record<string, Row & { height: number }>> = {
  unset: { height: 44, icon: 133, body: 159, right: 287, dismiss: null },
  'unset-dismiss': { height: 44, icon: 120, body: 146, right: 274, dismiss: 342 },
  'unset-justify-end': { height: 44, icon: 254, body: 280, right: 408, dismiss: null },
  'unset-gap': { height: 44, icon: 121, body: 159, right: 299, dismiss: null },
  'tight-unset': { height: 44, icon: 12, body: 38, right: 102, dismiss: 170 },
  'no-right-unset': { height: 40, icon: 154, body: 180, right: null, dismiss: 308 },
  'rtl-unset': { height: 44, icon: 342, body: 214, right: 146, dismiss: 120 }
};

test.describe('token unset', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page);
  });

  for (const [scenario, expected] of Object.entries(UNSET_ROWS)) {
    test(`${scenario}: the row is laid out exactly as it was without the token`, async ({
      page
    }) => {
      const actual = await rowOf(page, scenario);
      expect(actual.height).toBeCloseTo(expected.height, 1);
      expectRow(actual, expected);
    });
  }

  test('the slot has no margin of its own', async ({ page }) => {
    for (const scenario of ['unset', 'unset-dismiss', 'unset-gap', 'tight-unset', 'rtl-unset']) {
      await expect(
        page.getByTestId(`brm-${scenario}`).locator('.banner-right'),
        scenario
      ).toHaveCSS('margin-left', '0px');
    }
  });

  test('the slot sits one gap after the text, which is all that separates them', async ({
    page
  }) => {
    for (const [scenario, gap] of [
      ['unset', GAP],
      ['unset-gap', 20]
    ] as const) {
      const row = await rowOf(page, scenario);
      expect(row.right, scenario).not.toBeNull();
      expect((row.right ?? Number.NaN) - (row.body + BODY_WIDTH), scenario).toBeCloseTo(gap, 1);
    }
  });
});

test.describe('token set', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page);
  });

  test('auto pushes the slot to the end of the row and packs the icon and text at the start', async ({
    page
  }) => {
    const row = await rowOf(page, 'auto');
    expect(row.height).toBeCloseTo(44, 1);
    expectRow(row, { icon: 12, body: 38, right: 408, dismiss: null });
    expect((row.right ?? Number.NaN) + SLOT_WIDTH).toBeCloseTo(BANNER_WIDTH - SIDE_PADDING, 1);
    await expect(page.getByTestId('brm-auto').locator('.banner-right')).toHaveCSS(
      'margin-left',
      '242px'
    );
  });

  test('auto sends the dismiss button along with the slot, one gap after it', async ({ page }) => {
    const row = await rowOf(page, 'auto-dismiss');
    expectRow(row, { icon: 12, body: 38, right: 382, dismiss: 450 });
    const dismissWidth = (
      await measure(page.getByTestId('brm-auto-dismiss').locator('.banner-dismiss'))
    ).width;
    expect((row.dismiss ?? Number.NaN) + dismissWidth).toBeCloseTo(BANNER_WIDTH - SIDE_PADDING, 1);
    expect((row.right ?? Number.NaN) + SLOT_WIDTH + GAP).toBeCloseTo(row.dismiss ?? Number.NaN, 1);
  });

  test('auto takes the spare width before justify-content can distribute it', async ({ page }) => {
    const rows = await Promise.all(
      ['auto', 'auto-justify-start', 'auto-justify-end'].map((scenario) => rowOf(page, scenario))
    );
    for (const row of rows) {
      expectRow(row, { icon: 12, body: 38, right: 408, dismiss: null });
    }
    // The control: the same two justify-content values do move the row when the token is unset.
    const unsetCentred = await rowOf(page, 'unset');
    const unsetEnd = await rowOf(page, 'unset-justify-end');
    expect(unsetCentred.icon).not.toBeCloseTo(unsetEnd.icon, 0);
  });

  test('a length is added to the gap, and the row stays centred around the wider slot', async ({
    page
  }) => {
    expectRow(await rowOf(page, 'fixed'), { icon: 113, body: 139, right: 307, dismiss: null });
    await expect(page.getByTestId('brm-fixed').locator('.banner-right')).toHaveCSS(
      'margin-left',
      '40px'
    );
    const gapped = await rowOf(page, 'fixed-gap');
    expectRow(gapped, { icon: 101, body: 139, right: 319, dismiss: null });
    expect((gapped.right ?? Number.NaN) - (gapped.body + BODY_WIDTH)).toBeCloseTo(20 + 40, 1);
  });

  test('a row with no spare width does not move, however the slot is asked to', async ({
    page
  }) => {
    const unset = await rowOf(page, 'tight-unset');
    const auto = await rowOf(page, 'tight-auto');
    expectRow(auto, unset);
    expect(auto.height).toBeCloseTo(unset.height, 1);
    const wrapper = (scenario: string): Promise<Box> =>
      measure(page.getByTestId(`brm-${scenario}`).locator('.banner-body'));
    expect((await wrapper('tight-auto')).width).toBeCloseTo(
      (await wrapper('tight-unset')).width,
      1
    );
    // Without spare width the text is what gives way, which is why there is nothing to take.
    expect((await wrapper('tight-auto')).width).toBeLessThan(BODY_WIDTH);
    await expect(page.getByTestId('brm-tight-auto').locator('.banner-right')).toHaveCSS(
      'margin-left',
      '0px'
    );
  });

  test('a banner with no right content has no slot for the token to act on', async ({ page }) => {
    await expect(page.getByTestId('brm-no-right-auto').locator('.banner-right')).toHaveCount(0);
    const unset = await rowOf(page, 'no-right-unset');
    const auto = await rowOf(page, 'no-right-auto');
    expectRow(auto, unset);
    expect(auto.height).toBeCloseTo(unset.height, 1);
  });

  test('the margin is the physical left one: in a right-to-left row it opens up beside the dismiss button', async ({
    page
  }) => {
    const row = await rowOf(page, 'rtl-auto');
    expectRow(row, { icon: 450, body: 322, right: 254, dismiss: 12 });
    // The slot stays against the text and the dismiss button is what lands at the end.
    expect(row.body - (row.right ?? Number.NaN) - SLOT_WIDTH).toBeCloseTo(GAP, 1);
    await expect(page.getByTestId('brm-rtl-auto').locator('.banner-right')).toHaveCSS(
      'margin-left',
      '216px'
    );
  });

  test('in a vertical writing mode the margin lies across the row: auto moves the slot sideways, not to the end', async ({
    page
  }) => {
    const unset = await offsetsIn(page, 'vertical-unset');
    const auto = await offsetsIn(page, 'vertical-auto');
    expect(unset.banner.width).toBeCloseTo(200, 1);
    expect(unset.banner.height).toBeCloseTo(480, 1);
    // The row now runs top to bottom, and nothing moves along it.
    expect(auto.slot.y).toBeCloseTo(unset.slot.y, 1);
    expect(auto.dismiss.x).toBeCloseTo(unset.dismiss.x, 1);
    expect(auto.dismiss.y).toBeCloseTo(unset.dismiss.y, 1);
    // The slot is far from the end of the row either way.
    expect(480 - (auto.slot.y + 24)).toBeGreaterThan(100);
    // Across the row it goes from the middle to the right edge, taking the 116px of spare width.
    expect(unset.slot.x).toBeCloseTo(70, 1);
    expect(auto.slot.x + SLOT_WIDTH).toBeCloseTo(200 - SIDE_PADDING, 1);
    await expect(page.getByTestId('brm-vertical-auto').locator('.banner-right')).toHaveCSS(
      'margin-left',
      '116px'
    );
  });
});

// An app that already pushes the slot with its own margin-left wrote that rule before this token
// existed. Its rule is placed ahead of the library's stylesheet or after it, as an app's can be, and
// the token is set on the same banner to make the two collide.
test.describe('an app rule on the slot', () => {
  const consumerMargin = 24;
  const rule = `.banner-right{margin-left:${consumerMargin}px}`;

  for (const order of ['first', 'last'] as const) {
    test(`wins over the token when it comes ${order} in the cascade`, async ({ page }) => {
      await openFixture(page, `?css=${encodeURIComponent(rule)}&order=${order}`);
      for (const scenario of ['auto', 'fixed']) {
        const slot = page.getByTestId(`brm-${scenario}`).locator('.banner-right');
        await expect(slot, scenario).toHaveCSS('margin-left', `${consumerMargin}px`);
        const row = await rowOf(page, scenario);
        expect((row.right ?? Number.NaN) - (row.body + BODY_WIDTH), scenario).toBeCloseTo(
          GAP + consumerMargin,
          1
        );
      }
    });

    test(`token unset: the rule is the slot's only margin when it comes ${order}`, async ({
      page
    }) => {
      await openFixture(page, `?css=${encodeURIComponent(rule)}&order=${order}`);
      const slot = page.getByTestId('brm-unset').locator('.banner-right');
      await expect(slot).toHaveCSS('margin-left', `${consumerMargin}px`);
      const row = await rowOf(page, 'unset');
      expect((row.right ?? Number.NaN) - (row.body + BODY_WIDTH)).toBeCloseTo(
        GAP + consumerMargin,
        1
      );
    });
  }

  test('token unset: a rule written inside a cascade layer still applies', async ({ page }) => {
    // An unlayered declaration beats a layered one whatever its specificity, so a fallback of `0`
    // here would have taken a margin the app set in a layer and zeroed it.
    await openFixture(page, `?css=${encodeURIComponent(`@layer app{${rule}}`)}&order=first`);
    const slot = page.getByTestId('brm-unset').locator('.banner-right');
    await expect(slot).toHaveCSS('margin-left', `${consumerMargin}px`);
    const row = await rowOf(page, 'unset');
    expect((row.right ?? Number.NaN) - (row.body + BODY_WIDTH)).toBeCloseTo(
      GAP + consumerMargin,
      1
    );
  });
});

// The token's declaration has no specificity, so how it ranks against the app's CSS is decided by
// specificity first and then by which of two equal rules comes later. Each rule here is placed ahead of
// the library's stylesheet (`first`) or after it (`last`), the two places an app's can be.
test.describe('an app rule with no specificity', () => {
  const rules = [
    { css: '*{margin-left:3px}', first: '0px', last: '3px' },
    { css: ':where(.banner-right){margin-left:5px}', first: '0px', last: '5px' },
    { css: '*{margin:3px}', first: '0px', last: '3px' },
    { css: '*{margin-inline-start:4px}', first: '0px', last: '4px' },
    // The same margin written with some specificity is not rolled back wherever it comes.
    { css: '.banner-right{margin-left:3px}', first: '3px', last: '3px' },
    { css: 'div *{margin-left:3px}', first: '3px', last: '3px' }
  ] as const;

  test('token unset: a rule with no specificity placed ahead of the library is rolled back, the documented exception', async ({
    page
  }) => {
    for (const rule of rules) {
      for (const order of ['first', 'last'] as const) {
        await openFixture(page, `?css=${encodeURIComponent(rule.css)}&order=${order}`);
        await expect(
          page.getByTestId('brm-unset').locator('.banner-right'),
          `${rule.css} ${order}`
        ).toHaveCSS('margin-left', rule[order]);
      }
    }
  });

  test('token set: a margin reset that ties with the token and comes after it beats it', async ({
    page
  }) => {
    for (const [css, order] of [
      ['*{margin:0}', 'last'],
      [':where(*){margin:0}', 'last'],
      // Some specificity beats the token wherever it comes.
      ['html *{margin:0}', 'first']
    ] as const) {
      await openFixture(page, `?css=${encodeURIComponent(css)}&order=${order}`);
      const label = `${css} ${order}`;
      await expect(page.getByTestId('brm-auto').locator('.banner-right'), label).toHaveCSS(
        'margin-left',
        '0px'
      );
      const auto = await rowOf(page, 'auto');
      const unset = await rowOf(page, 'unset');
      expect(auto.right, label).toBeCloseTo(unset.right ?? Number.NaN, 1);
      expect(auto.icon, label).toBeCloseTo(unset.icon, 1);
    }
  });

  test('token set: the same reset in a cascade layer, or ahead of the library without specificity, lets the token through', async ({
    page
  }) => {
    for (const [css, order] of [
      ['*{margin:0}', 'first'],
      [':where(*){margin:0}', 'first'],
      ['@layer reset{*{margin:0}}', 'last'],
      ['@layer reset{html *{margin:0}}', 'last']
    ] as const) {
      await openFixture(page, `?css=${encodeURIComponent(css)}&order=${order}`);
      const label = `${css} ${order}`;
      await expect(page.getByTestId('brm-auto').locator('.banner-right'), label).toHaveCSS(
        'margin-left',
        '242px'
      );
      expectRow(await rowOf(page, 'auto'), { icon: 12, body: 38, right: 408, dismiss: null });
    }
  });
});

// <sui-banner> carries the token across its shadow root because it is a custom property, so the
// wrapper needs no attribute for it. dist-wc is a self-contained bundle rather than a route of the
// demo site, so it is injected into a same-origin page; `pnpm run build` runs build:wc.
const loadBundle = async (page: Page): Promise<void> => {
  await openFixture(page);
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-banner') !== 'undefined', null, {
    timeout: 15_000
  });
};

type WcOptions = {
  hostTokens: string;
  ancestorTokens: string;
  slotted: boolean;
  dismissible: boolean;
};

const mountBanner = async (page: Page, options: WcOptions): Promise<void> => {
  await page.evaluate(
    ({ hostTokens, ancestorTokens, slotted, dismissible, width, slotWidth }) => {
      const parent = document.createElement('div');
      parent.style.cssText = `width:${width}px;${ancestorTokens}`;
      const banner = document.createElement('sui-banner');
      banner.id = 'wc-banner';
      banner.setAttribute('text', 'Short text');
      banner.style.cssText = hostTokens;
      if (dismissible) {
        banner.setAttribute('dismissible', '');
      }
      if (slotted) {
        const slot = document.createElement('div');
        slot.id = 'wc-slotted';
        slot.slot = 'right-content';
        slot.style.cssText = `width:${slotWidth}px;height:24px;`;
        banner.append(slot);
      }
      parent.append(banner);
      document.body.append(parent);
    },
    { ...options, width: BANNER_WIDTH, slotWidth: SLOT_WIDTH }
  );
  await expect(page.locator('#wc-banner .banner')).toBeVisible();
};

test.describe('sui-banner', () => {
  const ALL_UNSET: WcOptions = {
    hostTokens: '',
    ancestorTokens: '',
    slotted: true,
    dismissible: false
  };

  test('token unset: the slot sits one gap after the text', async ({ page }) => {
    await loadBundle(page);
    await mountBanner(page, ALL_UNSET);
    const body = await measure(page.locator('#wc-banner .banner-body'));
    const slot = await measure(page.locator('#wc-slotted'));
    expect(slot.x - (body.x + body.width)).toBeCloseTo(GAP, 1);
    await expect(page.locator('#wc-banner .banner-right')).toHaveCSS('margin-left', '0px');
  });

  for (const where of ['host', 'ancestor'] as const) {
    test(`auto set on the ${where} pushes the slot to the end of the row`, async ({ page }) => {
      await loadBundle(page);
      const tokens = '--banner-right-margin-left:auto;';
      await mountBanner(page, {
        ...ALL_UNSET,
        hostTokens: where === 'host' ? tokens : '',
        ancestorTokens: where === 'ancestor' ? tokens : ''
      });
      const banner = await measure(page.locator('#wc-banner .banner'));
      const slot = await measure(page.locator('#wc-slotted'));
      expect(slot.x + slot.width).toBeCloseTo(banner.x + banner.width - SIDE_PADDING, 1);
    });
  }

  test('with nothing slotted the wrapper is still there, so auto still sends the dismiss button to the end', async ({
    page
  }) => {
    await loadBundle(page);
    await mountBanner(page, { ...ALL_UNSET, slotted: false, dismissible: true });
    const banner = await measure(page.locator('#wc-banner .banner'));
    const unsetDismiss = await measure(page.locator('#wc-banner .banner-dismiss'));
    // Centred, so well short of the end.
    expect(
      banner.x + banner.width - SIDE_PADDING - (unsetDismiss.x + unsetDismiss.width)
    ).toBeGreaterThan(100);

    await page.locator('#wc-banner').evaluate((element) => {
      element.style.setProperty('--banner-right-margin-left', 'auto');
    });
    await expect
      .poll(async () => {
        const dismiss = await measure(page.locator('#wc-banner .banner-dismiss'));
        return dismiss.x + dismiss.width;
      })
      .toBeCloseTo(banner.x + banner.width - SIDE_PADDING, 1);
  });
});
