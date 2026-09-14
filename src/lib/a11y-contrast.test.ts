import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * A ratchet, not a palette test. These are the fallback values baked into
 * `var(--token, #hex)` defaults -- what a consumer who sets no token actually
 * sees. A consumer overriding the token owns their own contrast; the default
 * is the library's own claim, so it is the one worth pinning.
 *
 * #637c95 shipped at 4.33:1 on white and 3.92:1 on Banner's own tinted
 * background, i.e. below AA in the default configuration of both components.
 */

const LIB = join(import.meta.dirname, '.');

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The fallback in `var(--token, #rrggbb)`, which is what an unstyled consumer renders. */
function tokenDefault(file: string, token: string): string {
  const source = readFileSync(join(LIB, file), 'utf8');
  const match = new RegExp(String.raw`var\(\s*${token}\s*,\s*(#[0-9a-fA-F]{6})\s*\)`).exec(source);
  if (match === null) {
    throw new Error(`no literal default found for ${token} in ${file}`);
  }
  return match[1].toLowerCase();
}

const WHITE = '#ffffff';

describe('default text colours meet WCAG AA', () => {
  it('Input label text, on the page default', () => {
    const colour = tokenDefault('Input/Input.svelte', '--input-label-msg-text-color');
    expect(contrastRatio(colour, WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it('InputButton label text, on the page default', () => {
    const colour = tokenDefault('InputButton/InputButton.svelte', '--input-label-msg-text-color');
    expect(contrastRatio(colour, WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it('Banner text, against Banner’s own default background', () => {
    const colour = tokenDefault('Banner/Banner.svelte', '--banner-color');
    const background = tokenDefault('Banner/Banner.svelte', '--banner-background');
    expect(contrastRatio(colour, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('the helper measures a known-failing pair as failing', () => {
    // Guards the guard: the previous default, so a broken ratio calculation
    // that returned a large number for everything could not pass this suite.
    expect(contrastRatio('#637c95', WHITE)).toBeLessThan(4.5);
    expect(contrastRatio('#637c95', '#f0f4f8')).toBeLessThan(4.5);
  });
});
