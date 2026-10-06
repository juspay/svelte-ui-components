import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-028: every FileInput demo put a native <button> inside the drop region, which is
 * itself `role="button"` with a Tab stop, and FileDropzoneTrigger rendered its own `Button`
 * in there. One upload action was therefore two Tab stops and two "button" announcements
 * (native Orca read "Click or drag a file here push button" twice). Six FileInput and two
 * FileDropzoneTrigger targets were recorded.
 *
 * These drive the real keyboard (Shift+Tab out, Tab back through the region) and count real
 * `filechooser` events, because "one control" is a claim about what a person lands on and
 * what opens -- not about which attributes are present.
 *
 * Making the region the only Tab stop also made it the only thing that can show where focus
 * is. The nested button used to supply the one visible ring (the region never drew its own:
 * `outline: var(--file-input-focus-outline)` with no fallback computes to `none`), so removing
 * the button without giving the region a ring would have left a keyboard user with no sign of
 * focus at all (WCAG 2.4.7). The focus-indicator tests below read the resolved style on the
 * real focused element, in both themes, and measure it against the surface it sits on.
 */

const FILE_INPUT = '/components/file-input';
const DROPZONE = '/components/file-dropzone-trigger';

type Target = {
  readonly id: string;
  readonly route: string;
  /** The accessible name a person hears for the single action. */
  readonly name: string;
  readonly region: (page: Page) => Locator;
};

const byTestId =
  (testId: string) =>
  (page: Page): Locator =>
    page.getByTestId(testId);
const nthRegion =
  (index: number) =>
  (page: Page): Locator =>
    page.locator('.file-input').nth(index);

/** The six FileInput and two FileDropzoneTrigger targets the audit recorded. */
const NESTED_CONTROL_TARGETS: readonly Target[] = [
  {
    id: 'file-input-basic',
    route: FILE_INPUT,
    name: 'Click or drag a file here',
    region: byTestId('file-input-basic')
  },
  {
    id: 'file-input-images',
    route: FILE_INPUT,
    name: 'Upload image (max 1 MB)',
    region: byTestId('file-input-images')
  },
  {
    id: 'file-input-multi',
    route: FILE_INPUT,
    name: 'Select multiple files',
    region: byTestId('file-input-multi')
  },
  {
    id: 'fileinput-described',
    route: FILE_INPUT,
    name: 'Upload (described)',
    region: byTestId('fileinput-described')
  },
  {
    id: 'fileinput-info-only',
    route: FILE_INPUT,
    name: 'Upload (info only)',
    region: byTestId('fileinput-info-only')
  },
  {
    id: 'fileinput-undescribed',
    route: FILE_INPUT,
    name: 'Upload (no messages)',
    region: byTestId('fileinput-undescribed')
  },
  {
    id: 'dropzone-non-compact-caption',
    route: DROPZONE,
    name: 'Update logo .webp',
    region: nthRegion(0)
  },
  {
    id: 'dropzone-muted-caption',
    route: DROPZONE,
    name: 'Click to upload or drag and drop CSV (max. 10MB)',
    region: nthRegion(2)
  }
];

/** Region-owned controls that never had a nested button; they must stay exactly as they were. */
const ALREADY_SINGLE_TARGETS: readonly Target[] = [
  {
    id: 'file-input-card',
    route: FILE_INPUT,
    name: 'A plain card — click anywhere to open',
    region: byTestId('file-input-card')
  },
  { id: 'dropzone-compact', route: DROPZONE, name: 'Choose image', region: nthRegion(1) }
];

const ALL_ACTIVE_TARGETS = [...NESTED_CONTROL_TARGETS, ...ALREADY_SINGLE_TARGETS];

/** Anything a person could Tab to or activate inside a region, except its hidden file carrier. */
const INTERACTIVE_INSIDE =
  'button, a[href], [role="button"], select, textarea, input:not([type="file"]), [tabindex]:not([tabindex="-1"])';

type Stop = { readonly inside: boolean; readonly isRegion: boolean; readonly tag: string };

/**
 * Real keyboard navigation through one region: park on its first stop, Shift+Tab out of it,
 * then Tab forward and record each stop until focus leaves.
 */
const tabStopsThrough = async (page: Page, region: Locator): Promise<Stop[]> => {
  await region.focus();
  await page.keyboard.press('Shift+Tab');
  const stops: Stop[] = [];
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press('Tab');
    const stop = await region.evaluate((el) => {
      const active = document.activeElement;
      const w = window as Window & { __lastFocus?: Element | null };
      // Past the last control some engines hand focus to browser chrome and leave
      // activeElement untouched -- that is leaving the region, not a new stop.
      const unchanged = w.__lastFocus === active;
      w.__lastFocus = active;
      return {
        unchanged,
        inside: active !== null && el.contains(active),
        isRegion: active === el,
        tag: active?.tagName ?? ''
      };
    });
    if (!stop.inside || stop.unchanged) {
      break;
    }
    stops.push({ inside: stop.inside, isRegion: stop.isRegion, tag: stop.tag });
  }
  return stops;
};

/** Counts every file chooser the page opens, resolving each as a cancelling user would. */
const watchChoosers = (page: Page) => {
  let opened = 0;
  // One listener for the whole test: adding and removing it per action toggles chooser
  // interception asynchronously and loses events.
  page.on('filechooser', (chooser) => {
    opened += 1;
    void chooser.setFiles([]);
  });
  return {
    async during(action: () => Promise<void>): Promise<number> {
      const before = opened;
      await action();
      // A duplicate open would arrive a beat after the first.
      await page.waitForTimeout(300);
      return opened - before;
    }
  };
};

/** Lands on the region by Tab, the way a keyboard user does, and proves it has focus. */
const reachByKeyboard = async (page: Page, entry: Locator): Promise<void> => {
  await entry.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(entry).toBeFocused();
};

const dropFile = async (page: Page, region: Locator, name: string): Promise<void> => {
  const dataTransfer = await page.evaluateHandle((fileName) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(4)], fileName, { type: 'image/png' }));
    return transfer;
  }, name);
  await region.dispatchEvent('drop', { dataTransfer });
};

type Rgba = readonly [number, number, number, number];

/** Computed sRGB colours serialise as `rgb()` / `rgba()` in every engine. */
const parseRgba = (value: string): Rgba => {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/
  );
  if (match === null) {
    throw new Error(`Cannot parse the computed colour "${value}"`);
  }
  const alpha = typeof match[4] === 'string' ? Number(match[4]) / (match[5] === '%' ? 100 : 1) : 1;
  return [Number(match[1]), Number(match[2]), Number(match[3]), alpha];
};

const compositeOver = (top: Rgba, bottom: Rgba): Rgba => {
  const alpha = top[3] + bottom[3] * (1 - top[3]);
  const channel = (i: 0 | 1 | 2): number =>
    alpha === 0 ? 0 : (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / alpha;
  return [channel(0), channel(1), channel(2), alpha];
};

const relativeLuminance = ([r, g, b]: Rgba): number => {
  const linear = (value: number): number => {
    const unit = value / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

const contrastRatio = (a: Rgba, b: Rgba): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
};

type FocusIndicator = {
  readonly focusVisible: boolean;
  readonly outlineStyle: string;
  readonly outlineWidth: number;
  readonly outlineColor: Rgba;
  readonly hasBoxShadow: boolean;
  /** The surface behind the element: every ancestor background up to the first opaque one. */
  readonly surface: Rgba;
  /** False when no ancestor painted an opaque background, so `surface` is only the white canvas. */
  readonly surfaceResolved: boolean;
};

/** What a sighted keyboard user actually sees on the focused element, as the engine resolved it. */
const readFocusIndicator = async (focused: Locator): Promise<FocusIndicator> => {
  const raw = await focused.evaluate((el) => {
    const style = getComputedStyle(el);
    // Climb out through shadow roots too: a <sui-file-input> region has no parentElement.
    const parentAcrossShadow = (node: Element): Element | null => {
      const root = node.getRootNode();
      return node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    };
    const layers: string[] = [];
    for (
      let current = parentAcrossShadow(el);
      current !== null;
      current = parentAcrossShadow(current)
    ) {
      layers.push(getComputedStyle(current).backgroundColor);
    }
    return {
      focusVisible: el.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
      layers
    };
  });
  // Paint the ancestors bottom-up over the canvas until an opaque one makes the rest irrelevant.
  let surface: Rgba = [255, 255, 255, 1];
  let surfaceResolved = false;
  const painted: Rgba[] = [];
  for (const layer of raw.layers) {
    const colour = parseRgba(layer);
    painted.push(colour);
    if (colour[3] === 1) {
      surfaceResolved = true;
      break;
    }
  }
  for (const colour of painted.reverse()) {
    surface = compositeOver(colour, surface);
  }
  return {
    focusVisible: raw.focusVisible,
    outlineStyle: raw.outlineStyle,
    outlineWidth: Number.parseFloat(raw.outlineWidth),
    outlineColor: parseRgba(raw.outlineColor),
    hasBoxShadow: raw.boxShadow !== 'none' && raw.boxShadow !== '',
    surface,
    surfaceResolved
  };
};

/**
 * Switches theme and waits for the page to finish repainting. The shell transitions `color` and
 * `background` on theme change, and a ring that inherits `currentColor` reads a half-faded text
 * colour mid-transition -- measured against the settled card behind it, that is a false failure.
 * Waiting on the real CSS transitions (not a timeout) keeps the measurement on the final paint.
 */
const useTheme = (page: Page, theme: 'light' | 'dark'): Promise<void> =>
  page.evaluate(async (value) => {
    document.documentElement.setAttribute('data-theme', value);
    await Promise.allSettled(
      document
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition)
        .map((animation) => animation.finished)
    );
  }, theme);

/** WCAG 1.4.11: a focus indicator is a user-interface component and needs 3:1 against its ground. */
const MIN_INDICATOR_CONTRAST = 3;
/** WCAG 2.4.11's thickness floor for a perimeter indicator is 2 CSS px. */
const MIN_INDICATOR_WIDTH_PX = 2;

const expectDrawnRing = (indicator: FocusIndicator): void => {
  expect(indicator.focusVisible, 'keyboard focus must match :focus-visible').toBe(true);
  expect(['none', 'hidden']).not.toContain(indicator.outlineStyle);
  expect(indicator.outlineWidth).toBeGreaterThanOrEqual(MIN_INDICATOR_WIDTH_PX);
  expect(
    indicator.surfaceResolved,
    'an ancestor must paint an opaque surface, or the contrast below is measured against an assumed white canvas'
  ).toBe(true);
  expect(contrastRatio(indicator.outlineColor, indicator.surface)).toBeGreaterThanOrEqual(
    MIN_INDICATOR_CONTRAST
  );
};

for (const target of ALL_ACTIVE_TARGETS) {
  test.describe(`${target.id}: one interactive owner per upload action`, () => {
    test.beforeEach(async ({ page }) => {
      await gotoHydrated(page, target.route);
    });

    test('exposes one named button and nothing interactive inside it', async ({ page }) => {
      const region = target.region(page);

      await expect(region).toHaveRole('button');
      await expect(region).toHaveAccessibleName(target.name);
      await expect(region.locator(INTERACTIVE_INSIDE)).toHaveCount(0);
      await expect(region.getByRole('button')).toHaveCount(0);
      // The browser's own tree for the region: exactly one button node, not a button in a button.
      const snapshot = await region.ariaSnapshot();
      expect(snapshot.match(/\bbutton\b/g) ?? []).toHaveLength(1);
    });

    test('is one Tab stop, and it is the region itself', async ({ page }) => {
      const stops = await tabStopsThrough(page, target.region(page));

      expect(stops).toHaveLength(1);
      expect(stops[0]?.isRegion).toBe(true);
      expect(stops[0]?.tag).toBe('DIV');
    });

    test('opens exactly one file chooser for Enter, Space and a pointer click', async ({
      page
    }) => {
      const region = target.region(page);
      const choosers = watchChoosers(page);

      await reachByKeyboard(page, region);
      expect(await choosers.during(() => page.keyboard.press('Enter'))).toBe(1);

      await reachByKeyboard(page, region);
      expect(await choosers.during(() => page.keyboard.press('Space'))).toBe(1);

      expect(await choosers.during(() => region.click())).toBe(1);
    });
  });
}

test.describe('the hidden native file input is preserved and out of the keyboard and accessibility paths', () => {
  test('keeps accept, multiple, aria-hidden and tabindex=-1, and is never a Tab stop', async ({
    page
  }) => {
    await gotoHydrated(page, FILE_INPUT);

    const images = page.getByTestId('file-input-images-input');
    await expect(images).toHaveAttribute('type', 'file');
    await expect(images).toHaveAttribute('accept', 'image/*');
    await expect(images).toHaveAttribute('aria-hidden', 'true');
    await expect(images).toHaveAttribute('tabindex', '-1');
    await expect(page.getByTestId('file-input-multi-input')).toHaveJSProperty('multiple', true);
    await expect(page.getByTestId('file-input-basic-input')).toHaveJSProperty('multiple', false);
  });
});

test.describe('disabled stays disabled', () => {
  test('is not a Tab stop, announces as disabled, and neither click nor Enter opens a chooser', async ({
    page
  }) => {
    await gotoHydrated(page, FILE_INPUT);
    const region = page.getByTestId('file-input-disabled');
    const choosers = watchChoosers(page);

    await expect(region).toHaveRole('button');
    await expect(region).toHaveAccessibleName('File upload disabled');
    await expect(region).toHaveAttribute('aria-disabled', 'true');
    await expect(region).toHaveAttribute('tabindex', '-1');
    await expect(page.getByTestId('file-input-disabled-input')).toBeDisabled();
    expect(await tabStopsThrough(page, region)).toHaveLength(0);
    expect(await choosers.during(() => region.click({ force: true }))).toBe(0);
    await region.focus();
    expect(await choosers.during(() => page.keyboard.press('Enter'))).toBe(0);
  });
});

test.describe('drag and drop still lands in the control that took the drop', () => {
  test('shows the drag-over state and hands the dropped file to the demo that owns the region', async ({
    page
  }) => {
    await gotoHydrated(page, FILE_INPUT);
    const region = page.getByTestId('file-input-basic');

    await region.dispatchEvent('dragover');
    await expect(region).toContainText('Drop files here');
    await region.dispatchEvent('dragleave');
    await expect(region).toContainText('Click or drag a file here');

    await dropFile(page, region, 'dropped.png');
    await expect(page.getByTestId('file-input-basic-result')).toHaveText('Accepted: dropped.png');
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`every region-owned upload control shows where keyboard focus is (${theme} theme)`, () => {
    for (const target of ALL_ACTIVE_TARGETS) {
      test(`${target.id}: the one Tab stop draws a focus ring of at least 3:1 contrast`, async ({
        page
      }) => {
        await gotoHydrated(page, target.route);
        await useTheme(page, theme);
        const region = target.region(page);

        await reachByKeyboard(page, region);

        expectDrawnRing(await readFocusIndicator(region));
      });
    }
  });
}

test.describe('the focus ring is keyboard-only and does not replace a consumer-supplied one', () => {
  test('a pointer click on the region opens the chooser without drawing the ring', async ({
    page
  }) => {
    await gotoHydrated(page, FILE_INPUT);
    const region = page.getByTestId('file-input-basic');
    const choosers = watchChoosers(page);

    expect(await choosers.during(() => region.click())).toBe(1);

    const indicator = await readFocusIndicator(region);
    expect(indicator.focusVisible).toBe(false);
    expect(indicator.outlineStyle).toBe('none');
  });

  test('--file-input-focus-outline and --file-input-focus-outline-offset still override the default', async ({
    page
  }) => {
    await gotoHydrated(page, FILE_INPUT);
    const region = page.getByTestId('file-input-basic');
    await region.evaluate((el) => {
      el.style.setProperty('--file-input-focus-outline', '4px dashed rgb(255, 0, 0)');
      el.style.setProperty('--file-input-focus-outline-offset', '6px');
    });

    await reachByKeyboard(page, region);

    const style = await region.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        style: computed.outlineStyle,
        width: computed.outlineWidth,
        color: computed.outlineColor,
        offset: computed.outlineOffset
      };
    });
    expect(style).toEqual({
      style: 'dashed',
      width: '4px',
      color: 'rgb(255, 0, 0)',
      offset: '6px'
    });
  });
});

test.describe('activation="trigger": the control inside is the one owner and the region is passive', () => {
  const OWNED: readonly {
    readonly id: string;
    readonly route: string;
    readonly region: (page: Page) => Locator;
    readonly result: string;
    readonly dropped: string;
    readonly name: RegExp;
  }[] = [
    {
      id: 'file-input-owned',
      route: FILE_INPUT,
      region: byTestId('file-input-owned'),
      result: 'file-input-owned-result',
      dropped: 'owned.png',
      name: /^Choose file$/
    },
    {
      id: 'dropzone-owned-by-trigger',
      route: DROPZONE,
      region: nthRegion(3),
      result: 'file-dropzone-trigger-owned-accepted',
      dropped: 'owned.csv',
      name: /^Choose a CSV\s+CSV \(max\. 10MB\)$/
    }
  ];

  for (const owned of OWNED) {
    test.describe(owned.id, () => {
      test.beforeEach(async ({ page }) => {
        await gotoHydrated(page, owned.route);
      });

      test('the region has no role, tab stop or aria of its own; the button is the only stop', async ({
        page
      }) => {
        const region = owned.region(page);

        for (const attr of ['role', 'tabindex', 'aria-disabled', 'aria-describedby']) {
          await expect(region, `${attr} must be absent`).not.toHaveAttribute(attr, /.*/);
        }
        await expect(region.getByRole('button')).toHaveCount(1);
        await expect(region.getByRole('button')).toHaveAccessibleName(owned.name);

        expect(await region.evaluate((el) => el.querySelectorAll('button').length)).toBe(1);
        const keyboard = await tabStopsThrough(page, region.getByRole('button'));
        // `tabStopsThrough` measures containment in the locator it is given; here that is the
        // button, so one stop that is the button itself.
        expect(keyboard).toHaveLength(1);
        expect(keyboard[0]?.tag).toBe('BUTTON');
      });

      test('Enter, Space and a click on the button each open exactly one chooser; the region itself opens none', async ({
        page
      }) => {
        const region = owned.region(page);
        const button = region.getByRole('button');
        const choosers = watchChoosers(page);

        await reachByKeyboard(page, button);
        expect(await choosers.during(() => page.keyboard.press('Enter'))).toBe(1);
        await reachByKeyboard(page, button);
        expect(await choosers.during(() => page.keyboard.press('Space'))).toBe(1);
        expect(await choosers.during(() => button.click())).toBe(1);

        // A click or key that reaches the passive region directly is not an activation.
        expect(await choosers.during(() => region.dispatchEvent('click'))).toBe(0);
        expect(await choosers.during(() => region.dispatchEvent('keydown', { key: 'Enter' }))).toBe(
          0
        );
      });

      test('still takes a drop', async ({ page }) => {
        await dropFile(page, owned.region(page), owned.dropped);

        await expect(page.getByTestId(owned.result)).toHaveText(`Accepted: ${owned.dropped}`);
      });

      test('the owning control still shows where keyboard focus is', async ({ page }) => {
        const button = owned.region(page).getByRole('button');

        await reachByKeyboard(page, button);

        const indicator = await readFocusIndicator(button);
        expect(indicator.focusVisible).toBe(true);
        expect(indicator.outlineStyle !== 'none' || indicator.hasBoxShadow).toBe(true);
      });
    });
  }
});

test.describe('<sui-file-input> keeps the same single owner', () => {
  const loadElements = async (page: Page): Promise<void> => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () =>
        Boolean(customElements.get('sui-file-input')) &&
        Boolean(customElements.get('sui-file-dropzone-trigger'))
    );
  };

  type Report = {
    readonly role: string | null;
    readonly tabindex: string | null;
    readonly shadowButtons: number;
    readonly label: string;
    readonly slottedButtons: number | null;
    readonly slottedSurface: boolean | null;
  };

  const mount = async (page: Page, markup: string): Promise<Report> => {
    await page.evaluate((html) => {
      const host = document.createElement('div');
      host.id = 'wc-host';
      host.innerHTML = html;
      document.body.prepend(host);
    }, markup);
    return page.evaluate(async () => {
      const el = document.querySelector('#wc-host > sui-file-input');
      const shadow = el?.shadowRoot;
      // Custom elements upgrade and render on a later task.
      for (let i = 0; i < 50 && !shadow?.querySelector('.file-input'); i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      const root = shadow?.querySelector('.file-input');
      const slotted = el?.querySelector('sui-file-dropzone-trigger');
      return {
        role: root?.getAttribute('role') ?? null,
        tabindex: root?.getAttribute('tabindex') ?? null,
        shadowButtons: shadow?.querySelectorAll('button').length ?? 0,
        label: (root instanceof HTMLElement ? root.innerText : '').trim(),
        slottedButtons: slotted?.shadowRoot
          ? slotted.shadowRoot.querySelectorAll('button').length
          : null,
        slottedSurface: slotted?.shadowRoot
          ? slotted.shadowRoot.querySelector('.file-dropzone-trigger-surface') !== null
          : null
      };
    });
  };

  test('the default content is a label inside one role="button" region, not a nested button', async ({
    page
  }) => {
    await loadElements(page);
    const report = await mount(page, '<sui-file-input></sui-file-input>');

    expect(report.role).toBe('button');
    expect(report.tabindex).toBe('0');
    expect(report.shadowButtons).toBe(0);
    expect(report.label).toBe('Choose file');
  });

  test('a slotted <sui-file-dropzone-trigger> renders the surface, not a second button', async ({
    page
  }) => {
    await loadElements(page);
    const report = await mount(
      page,
      `<sui-file-input><sui-file-dropzone-trigger slot="trigger" heading="Pick" caption=".csv" icon="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"></sui-file-dropzone-trigger></sui-file-input>`
    );

    expect(report.role).toBe('button');
    expect(report.shadowButtons).toBe(0);
    expect(report.slottedButtons).toBe(0);
    expect(report.slottedSurface).toBe(true);
  });

  test('the default region draws a focus ring in light and dark', async ({ page }) => {
    await loadElements(page);
    // A control before the element to Tab from: the element is otherwise the document's first
    // stop, and Shift+Tab out of a first stop leaves the page in some engines.
    await mount(page, '<button id="wc-before">Before</button><sui-file-input></sui-file-input>');
    const region = page.locator('#wc-host sui-file-input .file-input');

    for (const theme of ['light', 'dark'] as const) {
      await useTheme(page, theme);
      await page.locator('#wc-before').focus();
      await page.keyboard.press('Tab');
      await expect(region).toBeFocused();

      expectDrawnRing(await readFocusIndicator(region));
    }
  });

  test('activation="trigger" makes the region passive and the fallback a real button', async ({
    page
  }) => {
    await loadElements(page);
    const report = await mount(page, '<sui-file-input activation="trigger"></sui-file-input>');

    expect(report.role).toBeNull();
    expect(report.tabindex).toBeNull();
    expect(report.shadowButtons).toBe(1);
  });
});
