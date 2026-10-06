import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * The AnimatedNumber example page, in both themes.
 *
 * Two defects shipped on this route and neither is visible to a style read:
 *
 *  - ISSUE-015: all eleven native action buttons kept a literal `#fff` background
 *    while the dark scheme repainted their labels `buttontext` (white). Computed
 *    `color` and `-webkit-text-fill-color` were both white and so was the
 *    background: 1:1, an invisible label. Axe's initial sweep missed it because
 *    it cannot see what the compositor finally paints.
 *  - ISSUE-004: the status paragraphs (and the `<code>` inside them) hard-coded
 *    `#6b7684`, 4.13:1 on the dark ground.
 *
 * So the assertion here is on RENDERED pixels, not on resolved styles. Each target
 * is captured twice in the same state -- once with only its own text painted, once
 * with every text node transparent -- and the difference between the two captures
 * is the ink. The second capture is the backdrop exactly as the compositor painted
 * it (gradients, hover fills and all), so no ancestor-chain colour model is
 * involved. The device scale factor is raised so a 14-16px stroke has fully inked
 * interior pixels to read, rather than antialiased edges that would score as
 * partial ink.
 *
 * A computed-style cross-check rides along on purpose: the measured ink has to
 * agree with `color`, otherwise either the measurement or the stylesheet is lying.
 */

const ROUTE = '/components/animated-number';

const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

/** WCAG 1.4.3 for normal-size text, and 1.4.11 for a non-text indicator. */
const NORMAL_TEXT_CONTRAST = 4.5;
const INDICATOR_CONTRAST = 3;

/** Every native control on the page that performs a value change, in DOM order. */
const ACTIONS = [
  '+1',
  '+7',
  '+100',
  '−137',
  'reset to 99',
  'randomise all',
  '$99.99 → $100.01',
  'back to $99.99',
  'next value',
  'flip sign',
  'burst: 5 changes in 200ms'
] as const;

test.use({ deviceScaleFactor: 3 });

interface Measured {
  readonly status: 'measured' | 'no-visible-ink';
  readonly ratio: number;
  readonly ink: readonly number[];
  readonly backdrop: readonly number[];
}

interface Paint {
  readonly color: string;
  readonly textFill: string;
}

/**
 * Scores two same-sized captures of the same box, inside the page because a
 * canvas is the one PNG decoder all three engines share.
 *
 * Pixels whose channel difference reaches 92% of the box's peak are the fully
 * inked interior; the ink colour is their median in the ink capture and the
 * surface is their median in the backdrop capture. Anything under 10/255 across
 * the whole box means nothing was painted over the surface at all.
 */
const scoreCaptures = (page: Page, ink: Buffer, backdrop: Buffer): Promise<Measured> =>
  page.evaluate(
    async ({ inkPng, backdropPng }) => {
      const decode = (base64: string): Promise<ImageData> =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (context === null) {
              reject(new Error('2d canvas unavailable'));
              return;
            }
            context.drawImage(image, 0, 0);
            resolve(context.getImageData(0, 0, canvas.width, canvas.height));
          };
          image.onerror = () => reject(new Error('capture failed to decode'));
          image.src = `data:image/png;base64,${base64}`;
        });
      const luminance = (rgb: readonly number[]): number => {
        const [r, g, b] = rgb.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const contrast = (a: readonly number[], b: readonly number[]): number => {
        const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (high + 0.05) / (low + 0.05);
      };
      const median = (values: number[]): number => {
        const sorted = [...values].sort((x, y) => x - y);
        return sorted[Math.floor(sorted.length / 2)];
      };

      const [inked, bare] = await Promise.all([decode(inkPng), decode(backdropPng)]);
      if (inked.width !== bare.width || inked.height !== bare.height) {
        throw new Error(
          `capture geometry changed between the pair: ${inked.width}x${inked.height} vs ${bare.width}x${bare.height}`
        );
      }
      const pixels = inked.width * inked.height;
      const differences = new Uint8Array(pixels);
      let peak = 0;
      for (let index = 0; index < pixels; index += 1) {
        const offset = index * 4;
        const delta = Math.max(
          Math.abs(inked.data[offset] - bare.data[offset]),
          Math.abs(inked.data[offset + 1] - bare.data[offset + 1]),
          Math.abs(inked.data[offset + 2] - bare.data[offset + 2])
        );
        differences[index] = delta;
        peak = Math.max(peak, delta);
      }

      const channelsOf = (data: Uint8ClampedArray, index: number): number[] => [
        data[index * 4],
        data[index * 4 + 1],
        data[index * 4 + 2]
      ];
      const surface = [0, 1, 2].map((channel) =>
        median(Array.from({ length: pixels }, (_, index) => bare.data[index * 4 + channel]))
      );
      if (peak <= 10) {
        return {
          status: 'no-visible-ink' as const,
          ratio: 1,
          ink: surface,
          backdrop: surface
        };
      }
      const floor = Math.max(peak * 0.92, 11);
      const strong: number[] = [];
      for (let index = 0; index < pixels; index += 1) {
        if (differences[index] >= floor) {
          strong.push(index);
        }
      }
      const inkColour = [0, 1, 2].map((channel) =>
        median(strong.map((index) => channelsOf(inked.data, index)[channel]))
      );
      const surfaceColour = [0, 1, 2].map((channel) =>
        median(strong.map((index) => channelsOf(bare.data, index)[channel]))
      );
      return {
        status: 'measured' as const,
        ratio: contrast(inkColour, surfaceColour),
        ink: inkColour,
        backdrop: surfaceColour
      };
    },
    { inkPng: ink.toString('base64'), backdropPng: backdrop.toString('base64') }
  );

const HIDE_ALL_TEXT =
  'main, main * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }';

/**
 * The rendered contrast of `target`'s OWN text in whatever state the page is in.
 * Descendants are hidden in both captures, so a paragraph is scored on its own
 * words and each `<code>` inside it is scored separately.
 */
const measureLabel = async (
  page: Page,
  target: Locator
): Promise<Measured & { readonly paint: Paint }> => {
  const paint = await target.evaluate((element): Paint => {
    const style = getComputedStyle(element);
    return { color: style.color, textFill: style.webkitTextFillColor };
  });
  const inject = (): Promise<void> =>
    page.evaluate((css) => {
      const sheet = document.createElement('style');
      sheet.setAttribute('data-probe-hide', '');
      sheet.textContent = css;
      document.head.appendChild(sheet);
    }, HIDE_ALL_TEXT);
  const cleanUp = async (): Promise<void> => {
    await page.evaluate(() => document.querySelector('style[data-probe-hide]')?.remove());
    await target.evaluate((element) => {
      (element as HTMLElement).style.removeProperty('color');
      (element as HTMLElement).style.removeProperty('-webkit-text-fill-color');
    });
  };
  try {
    await inject();
    await target.evaluate((element, pinned) => {
      (element as HTMLElement).style.setProperty('color', pinned.color, 'important');
      (element as HTMLElement).style.setProperty(
        '-webkit-text-fill-color',
        pinned.textFill,
        'important'
      );
    }, paint);
    const ink = await target.screenshot({ animations: 'disabled', caret: 'hide' });
    await target.evaluate((element) => {
      (element as HTMLElement).style.removeProperty('color');
      (element as HTMLElement).style.removeProperty('-webkit-text-fill-color');
    });
    const backdrop = await target.screenshot({ animations: 'disabled', caret: 'hide' });
    return { ...(await scoreCaptures(page, ink, backdrop)), paint };
  } finally {
    await cleanUp();
  }
};

/**
 * Focus-ring pair: the same padded clip with focus on and then off. The ring is
 * whatever differs, so a UA default ring and an authored one are scored alike.
 */
const measureFocusRing = async (page: Page, target: Locator): Promise<Measured> => {
  await target.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const box = await target.boundingBox();
  if (box === null) {
    throw new Error('focus target has no box');
  }
  const pad = 8;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2
  };
  await page.mouse.move(2, 2);
  await target.evaluate((element) => (element as HTMLElement).blur());
  const unfocused = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
  await target.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
  const focused = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
  await target.evaluate((element) => (element as HTMLElement).blur());
  return scoreCaptures(page, focused, unfocused);
};

const settleAnimations = (page: Page): Promise<unknown> =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => null)))
  );

/**
 * Switches theme through the real ThemeSwitcher, then waits for the colour
 * tokens to stop moving. The shell transitions them for a few hundred ms, so a
 * capture taken at the flip would measure a blend that is neither theme.
 */
const useTheme = async (page: Page, theme: Theme): Promise<void> => {
  await gotoHydrated(page, ROUTE);
  await page
    .getByRole('button', { name: theme === 'dark' ? 'Dark theme' : 'Light theme', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await settleAnimations(page);
  await page.evaluate(async () => {
    const paint = (): string =>
      [document.body, document.querySelector('main'), document.querySelector('main button')]
        .map((node) => (node === null ? '' : getComputedStyle(node).backgroundColor))
        .join('|');
    let previous = '';
    let stable = 0;
    while (stable < 5) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const current = paint();
      stable = current === previous ? stable + 1 : 0;
      previous = current;
    }
  });
};

const action = (page: Page, name: string): Locator =>
  page.getByRole('button', { name, exact: true });

const channelDistance = (measured: readonly number[], css: string): number => {
  const parsed =
    css
      .match(/\d+(\.\d+)?/g)
      ?.slice(0, 3)
      .map(Number) ?? [];
  return Math.max(...parsed.map((channel, index) => Math.abs(channel - measured[index])));
};

const failureSummary = (
  rows: readonly { readonly label: string; readonly ratio: number; readonly status: string }[],
  threshold: number
): string[] =>
  rows
    .filter((row) => row.status !== 'measured' || row.ratio < threshold)
    .map((row) => `${row.label}: ${row.ratio.toFixed(2)}:1 (${row.status}), needs ${threshold}:1`);

for (const theme of THEMES) {
  test.describe(`AnimatedNumber example, ${theme} theme`, () => {
    test(`status text and its inline code reach ${NORMAL_TEXT_CONTRAST}:1 as rendered`, async ({
      page
    }) => {
      await useTheme(page, theme);

      const paragraphs = page.locator('main p.state-display');
      const paragraphCount = await paragraphs.count();
      // Five paragraphs and five inline <code> spans on the page today. A count
      // that drops to zero would make every loop below pass without measuring.
      expect(paragraphCount).toBeGreaterThanOrEqual(5);

      const rows: { label: string; ratio: number; status: string }[] = [];
      let measuredCodes = 0;
      for (let index = 0; index < paragraphCount; index += 1) {
        const paragraph = paragraphs.nth(index);
        const own = await measureLabel(page, paragraph);
        rows.push({ label: `status #${index}`, ratio: own.ratio, status: own.status });
        expect(
          channelDistance(own.ink, own.paint.color),
          `status #${index}: rendered ink disagrees with its computed colour`
        ).toBeLessThanOrEqual(16);

        const codes = paragraph.locator('code');
        for (let code = 0; code < (await codes.count()); code += 1) {
          const inline = await measureLabel(page, codes.nth(code));
          measuredCodes += 1;
          rows.push({
            label: `status #${index} code #${code}`,
            ratio: inline.ratio,
            status: inline.status
          });
        }
      }
      expect(measuredCodes).toBeGreaterThanOrEqual(5);
      expect(failureSummary(rows, NORMAL_TEXT_CONTRAST)).toEqual([]);
    });

    for (const state of ['default', 'hover', 'focus', 'active'] as const) {
      test(`every action label reaches ${NORMAL_TEXT_CONTRAST}:1 as rendered in the ${state} state`, async ({
        page
      }) => {
        await useTheme(page, theme);

        const rows: { label: string; ratio: number; status: string }[] = [];
        for (const name of ACTIONS) {
          const control = action(page, name);
          await control.scrollIntoViewIfNeeded();
          await page.mouse.move(2, 2);

          if (state === 'hover') {
            await control.hover();
          } else if (state === 'active') {
            const box = await control.boundingBox();
            if (box === null) {
              throw new Error(`${name} has no box`);
            }
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
          } else if (state === 'focus') {
            // A real Tab arrival, so :focus-visible is what the keyboard user gets.
            await control.focus();
            await page.keyboard.press('Shift+Tab');
            await page.keyboard.press('Tab');
            await expect(control).toBeFocused();
            expect(await control.evaluate((element) => element.matches(':focus-visible'))).toBe(
              true
            );
          }

          const label = await measureLabel(page, control);
          if (state === 'active') {
            // Released away from the button so the press does not fire a click.
            await page.mouse.move(2, 2);
            await page.mouse.up();
          }

          rows.push({ label: `${name} [${state}]`, ratio: label.ratio, status: label.status });
          if (state === 'default') {
            expect(
              label.paint.textFill,
              `${name}: -webkit-text-fill-color must resolve to the foreground`
            ).toBe(label.paint.color);
            expect(
              channelDistance(label.ink, label.paint.color),
              `${name}: rendered ink disagrees with its computed colour`
            ).toBeLessThanOrEqual(16);
          }
        }
        expect(rows).toHaveLength(ACTIONS.length);
        expect(failureSummary(rows, NORMAL_TEXT_CONTRAST)).toEqual([]);
      });
    }

    test('keyboard focus draws a ring that reaches 3:1 on every action', async ({ page }) => {
      await useTheme(page, theme);

      const rows: { label: string; ratio: number; status: string }[] = [];
      for (const name of ACTIONS) {
        const ring = await measureFocusRing(page, action(page, name));
        rows.push({ label: `${name} [focus ring]`, ratio: ring.ratio, status: ring.status });
      }
      expect(failureSummary(rows, INDICATOR_CONTRAST)).toEqual([]);
    });

    test('a disabled action stays legible and does not take the hover fill', async ({ page }) => {
      await useTheme(page, theme);

      const rows: { label: string; ratio: number; status: string }[] = [];
      for (const name of ACTIONS) {
        const control = action(page, name);
        await control.scrollIntoViewIfNeeded();
        await control.evaluate((element) => ((element as HTMLButtonElement).disabled = true));

        const idle = await control.evaluate((element) => getComputedStyle(element).backgroundColor);
        await control.hover({ force: true });
        const hovered = await control.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        );
        // Disabled text is exempt from 1.4.3, but exempt is not invisible: it must
        // still be painted, and at 3:1 it is still readable as a label.
        const label = await measureLabel(page, control);
        rows.push({ label: `${name} [disabled]`, ratio: label.ratio, status: label.status });
        expect(hovered, `${name}: a disabled button must not react to hover`).toBe(idle);

        await control.evaluate((element) => ((element as HTMLButtonElement).disabled = false));
      }
      expect(failureSummary(rows, INDICATOR_CONTRAST)).toEqual([]);
    });

    test('Tab walks the eleven actions in order and every one shows where focus is', async ({
      page
    }) => {
      await useTheme(page, theme);

      await action(page, ACTIONS[0]).focus();
      await page.keyboard.press('Shift+Tab');

      const visited: { name: string; outlineWidth: string; outlineStyle: string }[] = [];
      for (let step = 0; step < ACTIONS.length; step += 1) {
        await page.keyboard.press('Tab');
        visited.push(
          await page.evaluate(() => {
            const element = document.activeElement;
            const style = element === null ? null : getComputedStyle(element);
            return {
              name: element?.textContent?.trim() ?? '',
              outlineWidth: style?.outlineWidth ?? '',
              outlineStyle: style?.outlineStyle ?? ''
            };
          })
        );
      }

      expect(visited.map((entry) => entry.name)).toEqual([...ACTIONS]);
      for (const entry of visited) {
        expect(entry.outlineStyle, `${entry.name} has no focus outline`).not.toBe('none');
        expect(
          Number.parseFloat(entry.outlineWidth),
          `${entry.name} outline is 0 wide`
        ).toBeGreaterThan(0);
      }
    });

    test('every action still performs its value change', async ({ page }) => {
      await useTheme(page, theme);

      const read = (): Promise<Record<string, string | null>> =>
        page.evaluate(() =>
          Object.fromEntries(
            ['counter', 'revenue', 'money', 'percent', 'stat', 'signed'].map((id) => [
              id,
              document.querySelector(`[data-pw="${id}"]`)?.getAttribute('aria-label') ?? null
            ])
          )
        );

      const initial = await read();
      expect(initial.counter).toBe('99');
      expect(initial.money).toBe('$99.99');
      expect(initial.signed).toBe('-42');

      // Alternate the activation key so both Enter and Space are covered, and
      // finish with the pointer for the remainder so all three paths are real.
      const steps: readonly {
        readonly name: (typeof ACTIONS)[number];
        readonly via: 'Enter' | 'Space' | 'click';
        readonly expected: Readonly<Record<string, string>>;
      }[] = [
        { name: '+1', via: 'Enter', expected: { counter: '100' } },
        { name: '+7', via: 'Space', expected: { counter: '107' } },
        { name: '+100', via: 'click', expected: { counter: '207' } },
        { name: '−137', via: 'Enter', expected: { counter: '70' } },
        { name: 'reset to 99', via: 'Space', expected: { counter: '99' } },
        { name: '$99.99 → $100.01', via: 'click', expected: { money: '$100.01' } },
        { name: 'back to $99.99', via: 'Enter', expected: { money: '$99.99' } },
        { name: 'next value', via: 'Space', expected: { stat: '₹1.45Cr' } },
        { name: 'flip sign', via: 'click', expected: { signed: '42' } },
        { name: 'burst: 5 changes in 200ms', via: 'Enter', expected: { counter: '944' } }
      ];

      for (const step of steps) {
        const control = action(page, step.name);
        await control.scrollIntoViewIfNeeded();
        if (step.via === 'click') {
          await control.click();
        } else {
          await control.focus();
          await page.keyboard.press(step.via === 'Enter' ? 'Enter' : 'Space');
        }
        for (const [id, value] of Object.entries(step.expected)) {
          await expect(page.getByTestId(id), `${step.name} -> ${id}`).toHaveAttribute(
            'aria-label',
            value
          );
        }
      }

      // The one nondeterministic action: all four values are re-rolled. The
      // revenue range is 99,999,999 wide, so an unchanged label means the
      // handler did not run rather than that it drew the same number.
      const before = await read();
      await action(page, 'randomise all').click();
      await expect(page.getByTestId('revenue')).not.toHaveAttribute(
        'aria-label',
        before.revenue ?? ''
      );
      const after = await read();
      for (const [id, value] of Object.entries(after)) {
        expect(value, `${id} lost its accessible name`).toBeTruthy();
      }

      // Settled digits, not just labels: the glyph a reader sees is the value.
      await settleAnimations(page);
      const shown = await page.evaluate(() =>
        [...document.querySelectorAll('[data-pw="counter"] .animated-number-digit')]
          .map((column) => {
            const glyph = [...column.querySelectorAll('.animated-number-digit-glyph')].find(
              (node) => !node.hasAttribute('inert')
            );
            return glyph?.textContent ?? '?';
          })
          .join('')
      );
      expect(shown).toBe(after.counter?.replace(/\D/g, ''));
    });
  });
}
