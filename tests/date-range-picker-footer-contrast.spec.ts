import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// The footer of an open DateRangePicker was unreadable in the default theme. Cancel and Clear
// resolved their label colour to Button's white primary text on the white panel (1:1), and an
// enabled Apply took `currentColor` as its background, which is its own white label (1:1 again);
// only the disabled Apply and the hover fill were legible. Both default chains now end in a
// literal that suits the default light panel. Every token keeps its name and still wins, and an
// ancestor's --button-text-color still reaches Cancel and Clear exactly as it did.
//
// Contrast is measured, not derived: the label colour and the composited background behind it are
// read from the rendered buttons, in a real browser, on the tests/fixtures/drp-footer-contrast
// page (driven by the query string, so none of it is a docs demo the visual suite would have to
// baseline). The repo's Playwright project runs Chromium only; the same file was run on Firefox
// and WebKit through a scratch Playwright configuration, not by CI.

type Scenario = 'range' | 'range-empty' | 'single' | 'compare' | 'compare-empty';
type ButtonKind = 'cancel' | 'clear' | 'apply';
type Rgb = { red: number; green: number; blue: number };
type Paint = {
  color: string;
  ownBackground: string;
  effectiveBackground: string;
  opacity: string;
  borderTop: string;
  disabled: boolean;
  box: { x: number; y: number; width: number; height: number };
};

const FIXTURE_ROUTE = `${fixtureBaseURL}/drp-footer-contrast/`;
// WCAG 2.1 SC 1.4.3: the minimum for text of ordinary size.
const AA_TEXT = 4.5;

// Button's own default primary fill, which is what the Apply default now matches.
const SLATE = 'rgb(58, 69, 80)';
const WHITE = 'rgb(255, 255, 255)';
const CANCEL_HOVER_FILL = 'rgb(245, 245, 245)';
const APPLY_HOVER_FILL = 'rgb(51, 51, 51)';
const DISABLED_APPLY_FILL = 'rgb(204, 204, 204)';
const DISABLED_APPLY_TEXT = 'rgb(136, 136, 136)';
// A disabled control is exempt from SC 1.4.3, so these pin what the base already measured and
// assert nothing about passing: #888888 on #cccccc, then the same pair after the 0.4 dimming has
// blended both toward the white panel.
const DISABLED_APPLY_PAIR_CONTRAST = 2.21;
const DISABLED_APPLY_DIMMED_CONTRAST = 1.3;
const DARK_PANEL = 'rgb(30, 30, 46)';
// The library's own dark theme (theme-dark.css) sets --button-secondary-text-color to #d1d5db.
const DARK_THEME_LABEL = 'rgb(209, 213, 219)';

const CONSUMER_TOKENS: Record<string, string> = {
  '--drp-cancel-color': 'rgb(1, 2, 3)',
  '--drp-cancel-border-color': 'rgb(4, 5, 6)',
  '--drp-cancel-hover-background': 'rgb(7, 8, 9)',
  '--drp-apply-background': 'rgb(10, 20, 30)',
  '--drp-apply-color': 'rgb(40, 50, 60)',
  '--drp-apply-hover-background': 'rgb(70, 80, 90)',
  '--drp-apply-disabled-background': 'rgb(100, 110, 120)',
  '--drp-apply-disabled-color': 'rgb(130, 140, 150)',
  '--drp-clear-color': 'rgb(11, 12, 13)',
  '--drp-clear-border-color': 'rgb(14, 15, 16)',
  '--drp-clear-hover-background': 'rgb(17, 18, 19)'
};

const toStyle = (tokens: Record<string, string>): string =>
  Object.entries(tokens)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');

const parseRgb = (text: string): Rgb => {
  const channels = (text.match(/[\d.]+/g) ?? []).map(Number);
  if (channels.length < 3) {
    throw new Error(`Not an rgb colour: ${text}`);
  }
  return { red: channels[0], green: channels[1], blue: channels[2] };
};

const luminance = ({ red, green, blue }: Rgb): number => {
  const linear = (channel: number): number => {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
};

const ratioOfLuminances = (first: number, second: number): number =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

const contrastOf = (paint: Paint): number =>
  ratioOfLuminances(
    luminance(parseRgb(paint.color)),
    luminance(parseRgb(paint.effectiveBackground))
  );

const blendOver = (color: Rgb, opacity: number, backdrop: Rgb): Rgb => ({
  red: color.red * opacity + backdrop.red * (1 - opacity),
  green: color.green * opacity + backdrop.green * (1 - opacity),
  blue: color.blue * opacity + backdrop.blue * (1 - opacity)
});

// The label and fill of a dimmed button after its opacity has blended both toward the backdrop.
const dimmedContrastOf = (paint: Paint, backdrop: string): number => {
  const opacity = Number(paint.opacity);
  const behind = parseRgb(backdrop);
  return ratioOfLuminances(
    luminance(blendOver(parseRgb(paint.color), opacity, behind)),
    luminance(blendOver(parseRgb(paint.effectiveBackground), opacity, behind))
  );
};

// Soft, so one run reports the contrast of every state rather than stopping at the first.
const expectLegible = (paint: Paint, label: string): void => {
  expect
    .soft(contrastOf(paint), `${label}: label ${paint.color} on ${paint.effectiveBackground}`)
    .toBeGreaterThanOrEqual(AA_TEXT);
};

// Self-contained: Playwright serialises it into the page.
const readPaint = (element: HTMLElement): Paint => {
  const channels = (text: string): number[] => (text.match(/[\d.]+/g) ?? []).map(Number);
  const layers: number[][] = [];
  for (let node: HTMLElement | null = element; node !== null; node = node.parentElement) {
    const layer = channels(getComputedStyle(node).backgroundColor);
    if (layer.length >= 3 && (layer.length === 3 || layer[3] > 0)) {
      layers.push(layer);
      if (layer.length === 3 || layer[3] === 1) {
        break;
      }
    }
  }
  let composite = [255, 255, 255];
  for (const layer of layers.reverse()) {
    const alpha = layer.length === 3 ? 1 : layer[3];
    composite = composite.map((channel, index) =>
      Math.round(layer[index] * alpha + channel * (1 - alpha))
    );
  }
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    color: style.color,
    ownBackground: style.backgroundColor,
    effectiveBackground: `rgb(${composite.join(', ')})`,
    opacity: style.opacity,
    borderTop: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
    disabled: element instanceof HTMLButtonElement && element.disabled,
    box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  };
};

type OpenOptions = { tokens?: Record<string, string> | null; dark?: boolean };

const openScenario = async (
  page: Page,
  scenario: Scenario,
  options: OpenOptions = {}
): Promise<Locator> => {
  const { tokens = null, dark = false } = options;
  const query = new URLSearchParams({ scenario });
  if (tokens !== null) {
    query.set('tokens', toStyle(tokens));
  }
  if (dark) {
    query.set('theme', 'dark');
  }
  await page.goto(`${FIXTURE_ROUTE}?${query.toString()}`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
  if (scenario === 'compare' || scenario === 'compare-empty') {
    await page.getByRole('button', { name: 'Open compare period picker' }).click();
    const comparePanel = page.getByRole('dialog', { name: 'Compare period picker' });
    await expect(comparePanel).toBeVisible();
    return comparePanel;
  }
  await page.getByRole('button', { name: 'Open date picker' }).click();
  const panel = page.getByTestId('fixture-drp-panel');
  await expect(panel).toBeVisible();
  return panel;
};

const footerButton = (panel: Locator, scenario: Scenario, kind: ButtonKind): Locator => {
  const isCompare = scenario === 'compare' || scenario === 'compare-empty';
  const noun = isCompare ? 'compare selection' : 'date selection';
  const verb = kind === 'cancel' ? 'Cancel' : kind === 'clear' ? 'Clear' : 'Apply';
  return panel.getByRole('button', { name: `${verb} ${noun}`, exact: true });
};

const paintAt = async (button: Locator, state: 'rest' | 'hover'): Promise<Paint> => {
  if (state === 'hover') {
    await button.hover();
  } else {
    await button.page().mouse.move(0, 0);
  }
  return button.evaluate(readPaint);
};

// Every state of one footer button, rest first so the pointer has not reached it yet.
const paintsOf = async (
  panel: Locator,
  scenario: Scenario,
  kind: ButtonKind
): Promise<{ rest: Paint; hover: Paint }> => {
  const button = footerButton(panel, scenario, kind);
  const rest = await paintAt(button, 'rest');
  const hover = await paintAt(button, 'hover');
  return { rest, hover };
};

test.use({ viewport: { width: 1000, height: 800 } });

test.describe('DateRangePicker footer contrast', () => {
  test('default theme: Cancel and the enabled Apply are legible at rest and on hover', async ({
    page
  }) => {
    const panel = await openScenario(page, 'range');
    const panelPaint = await panel.evaluate(readPaint);
    expect(panelPaint.ownBackground).toBe(WHITE);

    const cancel = await paintsOf(panel, 'range', 'cancel');
    const apply = await paintsOf(panel, 'range', 'apply');
    expectLegible(cancel.rest, 'cancel rest');
    expectLegible(cancel.hover, 'cancel hover');
    expectLegible(apply.rest, 'apply rest');
    expectLegible(apply.hover, 'apply hover');

    expect(cancel.rest.color).toBe(SLATE);
    expect(cancel.rest.effectiveBackground).toBe(WHITE);
    expect(cancel.hover.color).toBe(SLATE);
    expect(cancel.hover.effectiveBackground).toBe(CANCEL_HOVER_FILL);

    expect(apply.rest.disabled).toBe(false);
    expect(apply.rest.color).toBe(WHITE);
    expect(apply.rest.ownBackground).toBe(SLATE);
    expect(apply.hover.ownBackground).toBe(APPLY_HOVER_FILL);

    // The fix is colour only: Cancel keeps its hairline border, Apply stays borderless.
    expect(cancel.rest.borderTop).toBe('1px solid rgb(208, 208, 208)');
    expect(apply.rest.borderTop.startsWith('0px')).toBe(true);
  });

  test('the disabled Apply keeps its documented colours and dimming', async ({ page }) => {
    const panel = await openScenario(page, 'range-empty');
    const apply = footerButton(panel, 'range-empty', 'apply');
    await expect(apply).toBeDisabled();
    const paint = await paintAt(apply, 'rest');
    expect(paint.ownBackground).toBe(DISABLED_APPLY_FILL);
    expect(paint.color).toBe(DISABLED_APPLY_TEXT);
    expect(paint.opacity).toBe('0.4');
  });

  test('the disabled Apply keeps the contrast it always had, exempt from 4.5:1', async ({
    page
  }) => {
    for (const scenario of ['range-empty', 'compare-empty'] as const) {
      const panel = await openScenario(page, scenario);
      const apply = footerButton(panel, scenario, 'apply');
      await expect(apply).toBeDisabled();
      const paint = await paintAt(apply, 'rest');
      const backdrop = (await panel.evaluate(readPaint)).effectiveBackground;
      expect
        .soft(
          contrastOf(paint),
          `${scenario}: label ${paint.color} on ${paint.effectiveBackground}`
        )
        .toBeCloseTo(DISABLED_APPLY_PAIR_CONTRAST, 2);
      expect
        .soft(dimmedContrastOf(paint, backdrop), `${scenario}: same pair dimmed over ${backdrop}`)
        .toBeCloseTo(DISABLED_APPLY_DIMMED_CONTRAST, 2);
    }
  });

  test('single mode: Clear, Cancel and Apply are all legible', async ({ page }) => {
    const panel = await openScenario(page, 'single');
    for (const kind of ['clear', 'cancel'] as const) {
      const { rest, hover } = await paintsOf(panel, 'single', kind);
      expectLegible(rest, `${kind} rest`);
      expectLegible(hover, `${kind} hover`);
      expect(rest.color, `${kind} rest`).toBe(SLATE);
      expect(hover.effectiveBackground, `${kind} hover`).toBe(CANCEL_HOVER_FILL);
    }
    const apply = await paintsOf(panel, 'single', 'apply');
    expectLegible(apply.rest, 'apply rest');
    expectLegible(apply.hover, 'apply hover');
  });

  test('the standalone compare panel shares the rule, enabled and disabled', async ({ page }) => {
    const panel = await openScenario(page, 'compare');
    const cancel = await paintsOf(panel, 'compare', 'cancel');
    const apply = await paintsOf(panel, 'compare', 'apply');
    expectLegible(cancel.rest, 'compare cancel rest');
    expectLegible(cancel.hover, 'compare cancel hover');
    expectLegible(apply.rest, 'compare apply rest');
    expectLegible(apply.hover, 'compare apply hover');
    expect(cancel.rest.color).toBe(SLATE);
    expect(apply.rest.ownBackground).toBe(SLATE);

    const emptyPanel = await openScenario(page, 'compare-empty');
    const disabled = footerButton(emptyPanel, 'compare-empty', 'apply');
    await expect(disabled).toBeDisabled();
    const disabledPaint = await paintAt(disabled, 'rest');
    expect(disabledPaint.ownBackground).toBe(DISABLED_APPLY_FILL);
    expect(disabledPaint.color).toBe(DISABLED_APPLY_TEXT);
    expect(disabledPaint.opacity).toBe('0.4');
  });

  for (const scenario of ['range', 'single', 'compare'] as const) {
    test(`${scenario}: a consumer's --drp-* values win exactly over the new defaults`, async ({
      page
    }) => {
      const panel = await openScenario(page, scenario, { tokens: CONSUMER_TOKENS });
      const cancel = await paintsOf(panel, scenario, 'cancel');
      expect(cancel.rest.color).toBe('rgb(1, 2, 3)');
      expect(cancel.rest.borderTop).toBe('1px solid rgb(4, 5, 6)');
      expect(cancel.hover.ownBackground).toBe('rgb(7, 8, 9)');
      const apply = await paintsOf(panel, scenario, 'apply');
      expect(apply.rest.ownBackground).toBe('rgb(10, 20, 30)');
      expect(apply.rest.color).toBe('rgb(40, 50, 60)');
      expect(apply.hover.ownBackground).toBe('rgb(70, 80, 90)');
      if (scenario === 'single') {
        const clear = await paintsOf(panel, scenario, 'clear');
        expect(clear.rest.color).toBe('rgb(11, 12, 13)');
        expect(clear.rest.borderTop).toBe('1px solid rgb(14, 15, 16)');
        expect(clear.hover.ownBackground).toBe('rgb(17, 18, 19)');
      }
    });
  }

  test('a consumer-set disabled Apply keeps its token colours', async ({ page }) => {
    const panel = await openScenario(page, 'range-empty', { tokens: CONSUMER_TOKENS });
    const paint = await paintAt(footerButton(panel, 'range-empty', 'apply'), 'rest');
    expect(paint.ownBackground).toBe('rgb(100, 110, 120)');
    expect(paint.color).toBe('rgb(130, 140, 150)');
  });

  test('an ancestor --button-text-color still reaches Cancel and Clear, below --drp-*-color', async ({
    page
  }) => {
    const ancestor = { '--button-text-color': 'rgb(255, 0, 0)' };
    const panel = await openScenario(page, 'single', { tokens: ancestor });
    for (const kind of ['clear', 'cancel'] as const) {
      const { rest, hover } = await paintsOf(panel, 'single', kind);
      expect(rest.color, `${kind} rest`).toBe('rgb(255, 0, 0)');
      expect(hover.color, `${kind} hover`).toBe('rgb(255, 0, 0)');
    }
    // Apply names its own label colour, so the ancestor never reached it.
    const apply = await paintsOf(panel, 'single', 'apply');
    expect(apply.rest.color).toBe(WHITE);

    const outranked = await openScenario(page, 'single', {
      tokens: {
        ...ancestor,
        '--drp-cancel-color': 'rgb(1, 2, 3)',
        '--drp-clear-color': 'rgb(4, 5, 6)'
      }
    });
    expect((await paintAt(footerButton(outranked, 'single', 'cancel'), 'rest')).color).toBe(
      'rgb(1, 2, 3)'
    );
    expect((await paintAt(footerButton(outranked, 'single', 'clear'), 'rest')).color).toBe(
      'rgb(4, 5, 6)'
    );
  });

  test('the compare panel keeps taking an ancestor --button-text-color, trigger token included', async ({
    page
  }) => {
    // The compare panel sits inside the compare trigger's wrapper, which forwards
    // --drp-compare-trigger-color to --button-text-color. That reached Cancel before and still does.
    const panel = await openScenario(page, 'compare', {
      tokens: { '--drp-compare-trigger-color': 'rgb(9, 9, 9)' }
    });
    expect((await paintAt(footerButton(panel, 'compare', 'cancel'), 'rest')).color).toBe(
      'rgb(9, 9, 9)'
    );
  });

  test('the secondary button label token feeds the default, below an ancestor --button-text-color', async ({
    page
  }) => {
    const secondary = { '--button-secondary-text-color': 'rgb(0, 0, 255)' };
    const panel = await openScenario(page, 'range', { tokens: secondary });
    expect((await paintAt(footerButton(panel, 'range', 'cancel'), 'rest')).color).toBe(
      'rgb(0, 0, 255)'
    );

    const outranked = await openScenario(page, 'range', {
      tokens: { ...secondary, '--button-text-color': 'rgb(255, 0, 0)' }
    });
    expect((await paintAt(footerButton(outranked, 'range', 'cancel'), 'rest')).color).toBe(
      'rgb(255, 0, 0)'
    );
  });

  test('the library dark theme: Cancel and Apply are legible on the dark panel', async ({
    page
  }) => {
    const panel = await openScenario(page, 'range', { dark: true });
    expect((await panel.evaluate(readPaint)).ownBackground).toBe(DARK_PANEL);
    const cancel = await paintsOf(panel, 'range', 'cancel');
    const apply = await paintsOf(panel, 'range', 'apply');
    expectLegible(cancel.rest, 'dark cancel rest');
    expectLegible(cancel.hover, 'dark cancel hover');
    expectLegible(apply.rest, 'dark apply rest');
    expectLegible(apply.hover, 'dark apply hover');
    expect(cancel.rest.color).toBe(DARK_THEME_LABEL);
  });

  test('a dark ancestor that sets only --button-* tokens: Cancel follows them, Apply is legible', async ({
    page
  }) => {
    const tokens = {
      '--button-text-color': 'rgb(230, 230, 235)',
      '--button-color': 'rgb(60, 60, 80)',
      '--button-hover-text-color': 'rgb(255, 255, 255)'
    };
    const panel = await openScenario(page, 'range', { tokens, dark: true });
    const cancel = await paintsOf(panel, 'range', 'cancel');
    const apply = await paintsOf(panel, 'range', 'apply');
    expectLegible(cancel.rest, 'ancestor-token cancel rest');
    expectLegible(apply.rest, 'ancestor-token apply rest');
    expect(cancel.rest.color).toBe('rgb(230, 230, 235)');
    expect(cancel.hover.color).toBe(WHITE);
    // Apply never read the ancestor's --button-color, so it takes the new default fill.
    expect(apply.rest.ownBackground).toBe(SLATE);
  });

  test("an ancestor's --button-color never reaches Apply, so a light or transparent one stays legible", async ({
    page
  }) => {
    const ancestors = {
      light: { '--button-color': 'rgb(224, 224, 224)', '--button-text-color': 'rgb(17, 17, 17)' },
      transparent: {
        '--button-color': 'transparent',
        '--button-text-color': 'rgb(0, 80, 200)',
        '--button-border': '1px solid rgb(0, 80, 200)'
      }
    };
    for (const [name, tokens] of Object.entries(ancestors)) {
      const panel = await openScenario(page, 'range', { tokens });
      const apply = await paintsOf(panel, 'range', 'apply');
      expectLegible(apply.rest, `${name} ancestor apply rest`);
      expect(apply.rest.ownBackground, name).toBe(SLATE);
      expect(apply.rest.color, name).toBe(WHITE);
      expect(apply.rest.borderTop.startsWith('0px'), name).toBe(true);
    }

    const consumerWins = await openScenario(page, 'range', {
      tokens: { '--button-color': 'rgb(0, 128, 0)', '--drp-apply-background': 'rgb(10, 20, 30)' }
    });
    const winning = await paintsOf(consumerWins, 'range', 'apply');
    expect(winning.rest.ownBackground).toBe('rgb(10, 20, 30)');
  });

  test('the old documented defaults, set by hand: inherit now renders like unset, currentColor does not', async ({
    page
  }) => {
    const panel = await openScenario(page, 'single', {
      tokens: {
        '--drp-cancel-color': 'inherit',
        '--drp-clear-color': 'inherit',
        '--drp-apply-background': 'currentColor'
      }
    });
    for (const kind of ['clear', 'cancel'] as const) {
      const { rest } = await paintsOf(panel, 'single', kind);
      expectLegible(rest, `${kind} with the token set to inherit`);
      expect(rest.color, kind).toBe(SLATE);
    }
    // currentColor is a value the consumer chose, so it is the consumer's white fill under a white label.
    const apply = await paintsOf(panel, 'single', 'apply');
    expect(apply.rest.ownBackground).toBe(WHITE);
    expect(apply.rest.color).toBe(WHITE);
  });

  test('unset renders exactly what the explicit default tokens render', async ({ page }) => {
    const unsetPanel = await openScenario(page, 'range');
    const unset = {
      cancel: await paintsOf(unsetPanel, 'range', 'cancel'),
      apply: await paintsOf(unsetPanel, 'range', 'apply')
    };
    const explicitPanel = await openScenario(page, 'range', {
      tokens: { '--drp-cancel-color': SLATE, '--drp-apply-background': SLATE }
    });
    const explicit = {
      cancel: await paintsOf(explicitPanel, 'range', 'cancel'),
      apply: await paintsOf(explicitPanel, 'range', 'apply')
    };
    expect(explicit).toEqual(unset);
  });
});
