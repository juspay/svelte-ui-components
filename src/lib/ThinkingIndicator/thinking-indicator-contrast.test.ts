import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * A ratchet on the colours ThinkingIndicator paints when a consumer sets nothing, and
 * on the dark layer that retunes them -- including BOTH stops of the shimmer sweep.
 *
 * It complements, and does not replace, tests/thinking-indicator-contrast.spec.ts: that
 * spec measures real painted pixels in three engines, because a style token cannot see a
 * gradient clipped to glyphs. This one runs in milliseconds and fails with the offending
 * token named, so a careless edit to a default is caught before a browser is started.
 *
 * What it pins, and why each exists:
 *   - #858585 (the old resting ink) is 3.4:1 on white and #bebebe (the old highlight) is
 *     1.9:1; the audit measured both on the page.
 *   - The dark layer used to retune only the label colour, so the shimmer's stops stayed
 *     at their light literals and sat at 4.4:1 and 2.1:1 on the dark chip.
 */

const COMPONENT = readFileSync(join(import.meta.dirname, 'ThinkingIndicator.svelte'), 'utf8');
const DARK = readFileSync(join(import.meta.dirname, '../styles/theme-dark.css'), 'utf8');

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Every literal fallback written for `var(--token, #rrggbb)` in the component. */
function fallbacks(token: string): string[] {
  const pattern = new RegExp(String.raw`var\(\s*${token}\s*,\s*(#[0-9a-fA-F]{6})\s*\)`, 'g');
  return Array.from(COMPONENT.matchAll(pattern), (match) => match[1].toLowerCase());
}

/** The single default a token falls back to; throws if the component disagrees with itself. */
function lightDefault(token: string): string {
  const all = fallbacks(token);
  if (all.length === 0) {
    throw new Error(`no literal fallback for ${token} in ThinkingIndicator.svelte`);
  }
  expect(new Set(all), `${token} has conflicting fallbacks: ${all.join(', ')}`).toHaveProperty(
    'size',
    1
  );
  return all[0];
}

function darkValue(token: string): string {
  const match = new RegExp(String.raw`${token}\s*:\s*(#[0-9a-fA-F]{6})\s*;`).exec(DARK);
  if (match === null) {
    throw new Error(`no ${token} entry in theme-dark.css`);
  }
  return match[1].toLowerCase();
}

const REQUIRED = 4.5;
/** Surfaces the ThinkingIndicator is documented to sit on, light layer. */
const LIGHT_SURFACES = ['#ffffff', '#fafafa', '#f4f4f5'];
/** Dark layer: page, card/chip/trace host, and raised surface. */
const DARK_SURFACES = ['#0f0f17', '#1e1e2e', '#252535'];

const LIGHT_TEXT = [
  '--thinking-indicator-label-color',
  '--thinking-indicator-shimmer-highlight',
  '--thinking-indicator-chip-color',
  '--thinking-indicator-chip-shimmer-highlight',
  '--thinking-indicator-detail-color',
  '--thinking-indicator-elapsed-color',
  '--thinking-indicator-trace-row-color',
  '--thinking-indicator-trace-prose-color',
  '--thinking-indicator-trace-secondary-color',
  '--thinking-indicator-trace-more-color',
  '--thinking-indicator-trace-added-color',
  '--thinking-indicator-trace-removed-color'
];

const DARK_TEXT = [
  '--thinking-indicator-label-color',
  '--thinking-indicator-shimmer-highlight',
  '--thinking-indicator-chip-color',
  '--thinking-indicator-chip-shimmer-highlight',
  '--thinking-indicator-detail-color',
  '--thinking-indicator-elapsed-color',
  '--thinking-indicator-trace-row-color',
  '--thinking-indicator-trace-prose-color',
  '--thinking-indicator-trace-secondary-color',
  '--thinking-indicator-trace-more-color',
  '--thinking-indicator-trace-added-color',
  '--thinking-indicator-trace-removed-color'
];

describe('ThinkingIndicator default text colours meet WCAG AA', () => {
  for (const token of LIGHT_TEXT) {
    it(`${token} (light default) reads on every light surface`, () => {
      const colour = lightDefault(token);
      // The chip is a white pill, whatever the page behind it is.
      const surfaces = token.includes('-chip-') ? ['#ffffff'] : LIGHT_SURFACES;
      for (const surface of surfaces) {
        expect(
          contrast(colour, surface),
          `${token} ${colour} on ${surface}`
        ).toBeGreaterThanOrEqual(REQUIRED);
      }
    });
  }

  it("trace row text also reads on a selectable row's hover and selected backgrounds", () => {
    const rowText = [
      '--thinking-indicator-trace-row-color',
      '--thinking-indicator-trace-secondary-color',
      '--thinking-indicator-trace-added-color',
      '--thinking-indicator-trace-removed-color'
    ];
    const surfaces = [
      lightDefault('--thinking-indicator-trace-row-hover-background'),
      lightDefault('--thinking-indicator-trace-row-selected-background')
    ];
    for (const token of rowText) {
      for (const surface of surfaces) {
        expect(
          contrast(lightDefault(token), surface),
          `${token} on ${surface}`
        ).toBeGreaterThanOrEqual(REQUIRED);
      }
    }
  });

  it('the query chip text reads on its own tinted pill', () => {
    expect(
      contrast(
        lightDefault('--thinking-indicator-trace-query-color'),
        lightDefault('--thinking-indicator-trace-query-background')
      )
    ).toBeGreaterThanOrEqual(REQUIRED);
  });
});

describe('ThinkingIndicator dark layer meets WCAG AA', () => {
  for (const token of DARK_TEXT) {
    it(`${token} (dark layer) reads on every dark surface`, () => {
      // Tokens the dark layer does not restate fall through to their light literal, and a
      // light literal on a dark ground is the exact bug the layer exists to prevent.
      const colour = darkValue(token);
      const surfaces = token.includes('-chip-') ? ['#1e1e2e'] : DARK_SURFACES;
      for (const surface of surfaces) {
        expect(
          contrast(colour, surface),
          `${token} ${colour} on ${surface}`
        ).toBeGreaterThanOrEqual(REQUIRED);
      }
    });
  }
});

describe('ThinkingIndicator dark layer, selectable rows', () => {
  it('trace row text reads on the dark hover and selected backgrounds', () => {
    const surfaces = [
      darkValue('--thinking-indicator-trace-row-hover-background'),
      darkValue('--thinking-indicator-trace-row-selected-background')
    ];
    for (const token of [
      '--thinking-indicator-trace-row-color',
      '--thinking-indicator-trace-secondary-color',
      '--thinking-indicator-trace-added-color',
      '--thinking-indicator-trace-removed-color'
    ]) {
      for (const surface of surfaces) {
        expect(
          contrast(darkValue(token), surface),
          `${token} on ${surface}`
        ).toBeGreaterThanOrEqual(REQUIRED);
      }
    }
  });
});

describe('ThinkingIndicator shimmer', () => {
  it('builds its default sweep from the label colour and the highlight token, light and chip', () => {
    // Both stops must be reachable from tokens: a hard-coded stop is invisible to a theme
    // layer, which is how the dark chip kept a light-theme gradient.
    const label = /var\(\s*--thinking-indicator-label-color,\s*#[0-9a-fA-F]{6}\s*\)\s*0%/;
    const highlight =
      /var\(\s*--thinking-indicator-shimmer-highlight,\s*#[0-9a-fA-F]{6}\s*\)\s*50%/;
    const chip = /var\(\s*--thinking-indicator-chip-color,\s*#[0-9a-fA-F]{6}\s*\)\s*0%/;
    const chipHighlight =
      /var\(\s*--thinking-indicator-chip-shimmer-highlight,\s*#[0-9a-fA-F]{6}\s*\)\s*50%/;
    expect(COMPONENT).toMatch(label);
    expect(COMPONENT).toMatch(highlight);
    expect(COMPONENT).toMatch(chip);
    expect(COMPONENT).toMatch(chipHighlight);
  });

  it('keeps a visible sweep: the two stops differ by at least 2:1 in every layer', () => {
    const pairs: [string, string][] = [
      [
        lightDefault('--thinking-indicator-label-color'),
        lightDefault('--thinking-indicator-shimmer-highlight')
      ],
      [
        lightDefault('--thinking-indicator-chip-color'),
        lightDefault('--thinking-indicator-chip-shimmer-highlight')
      ],
      [
        darkValue('--thinking-indicator-label-color'),
        darkValue('--thinking-indicator-shimmer-highlight')
      ],
      [
        darkValue('--thinking-indicator-chip-color'),
        darkValue('--thinking-indicator-chip-shimmer-highlight')
      ]
    ];
    for (const [base, top] of pairs) {
      expect(contrast(base, top), `${base} -> ${top}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('drops the gradient layer from static and reduced-motion labels instead of hiding it', () => {
    // Under an opaque text fill a leftover gradient still shows at antialiased glyph edges,
    // and with a dark highlight that is a dark fringe on light-on-dark recipes.
    const rule = (selector: string): string => {
      const match = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(COMPONENT);
      if (match === null) {
        throw new Error(`no ${selector} rule in ThinkingIndicator.svelte`);
      }
      return match[1];
    };
    expect(rule(String.raw`\.static-label`)).toMatch(/background-image:\s*none/);
    expect(rule(String.raw`\.chip-label\.static-label`)).toMatch(/background-image:\s*none/);
    const reduced = COMPONENT.slice(COMPONENT.indexOf('prefers-reduced-motion'));
    expect(reduced.match(/background-image:\s*none/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('does not paint the retired light-theme literals anywhere in the component', () => {
    // Comments explain the retired values on purpose; only live declarations count.
    const declarations = COMPONENT.replace(/\/\*[\s\S]*?\*\//g, '').toLowerCase();
    for (const retired of ['#858585', '#bebebe', '#a0a0a0']) {
      expect(declarations).not.toContain(retired);
    }
  });
});
