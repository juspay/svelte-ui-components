import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `package.json`'s `sideEffects` list tells a bundler which modules it may drop when nothing
 * they export is used. Each entry below is here for a reason, and the list is easy to break
 * with a change that looks harmless.
 *
 * - `./dist-wc/**` and `./src/wc/**`: importing the custom-element bundle registers every
 *   `sui-*` element as a side effect. Dropped as "unused", the import would do nothing.
 * - `**\/*.css`: `import '@juspay/svelte-ui-components/theme-dark.css'` is a bare import with
 *   no binding, which is the definition of a dropped module. Measured on the published 4.53.0
 *   package, webpack 5 in production mode emitted 0 bytes of CSS for it until the CSS was
 *   listed, then 33,497. Vite 8 and esbuild kept it either way.
 * - Everything else in `dist/` has no top-level effect and stays unlisted, which is what lets
 *   a bundler skip the modules of the barrel that a consumer never uses. For a single-component
 *   import (Pill through the barrel, webpack 5 production, svelte-loader) the bundle was 272,818
 *   bytes with no `sideEffects` field and 64,428 with this list; listing the CSS cost 0 bytes.
 *
 * `false` would be the tempting one-line value and would drop the CSS import again.
 */

type Manifest = {
  readonly sideEffects?: boolean | readonly string[];
  readonly exports?: Readonly<Record<string, unknown>>;
};

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as Manifest;

const stripDotSlash = (value: string): string => value.replace(/^\.\//, '');

/**
 * The subset of glob syntax a `sideEffects` entry uses here: `**` crosses directories, `*` and
 * `?` stay inside one path segment. Like the bundlers, an entry with no `/` matches at any depth.
 */
const globToRegExp = (pattern: string): RegExp => {
  const source = stripDotSlash(pattern)
    .split('')
    .reduce<{ out: string; index: number }>(
      (state, character, index, characters) => {
        if (index < state.index) {
          return state;
        }
        if (character === '*' && characters[index + 1] === '*') {
          const slash = characters[index + 2] === '/';
          return { out: state.out + (slash ? '(?:.*/)?' : '.*'), index: index + (slash ? 3 : 2) };
        }
        if (character === '*') {
          return { out: state.out + '[^/]*', index: index + 1 };
        }
        if (character === '?') {
          return { out: state.out + '[^/]', index: index + 1 };
        }
        return {
          out: state.out + character.replace(/[.+^${}()|[\]\\]/g, '\\$&'),
          index: index + 1
        };
      },
      { out: '', index: 0 }
    ).out;
  return new RegExp(pattern.includes('/') ? `^${source}$` : `^(?:.*/)?${source}$`);
};

const covers = (patterns: readonly string[], file: string): boolean =>
  patterns.some((pattern) => globToRegExp(pattern).test(stripDotSlash(file)));

const cssFilesExposed = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return value.endsWith('.css') ? [value] : [];
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(cssFilesExposed);
  }
  return [];
};

describe('package.json sideEffects', () => {
  const declared = manifest.sideEffects;
  const patterns = Array.isArray(declared) ? declared : [];

  it('is a list of paths, not a boolean and not absent', () => {
    expect(Array.isArray(declared)).toBe(true);
  });

  it('lists every CSS file the package exposes, so a bare import of it survives tree-shaking', () => {
    const exposed = cssFilesExposed(manifest.exports);
    // The package ships one stylesheet today; this stays true if more are added.
    expect(exposed).toContain('./dist/styles/theme-dark.css');
    for (const file of exposed) {
      expect(covers(patterns, file), `${file} is not covered by sideEffects`).toBe(true);
    }
  });

  it('keeps the custom-element registrations', () => {
    expect(covers(patterns, './dist-wc/index.js')).toBe(true);
    expect(covers(patterns, './src/wc/index.ts')).toBe(true);
  });

  it('does not list ordinary component modules, which is what lets a bundler skip them', () => {
    expect(covers(patterns, './dist/Pill/Pill.svelte')).toBe(false);
    expect(covers(patterns, './dist/index.js')).toBe(false);
  });

  describe('the glob matcher the checks above rely on', () => {
    const published = ['./src/wc/**', './dist-wc/**'];

    it('rejects the CSS file under the value published in 4.53.0, so the check can fail', () => {
      expect(covers(published, './dist/styles/theme-dark.css')).toBe(false);
    });

    it('accepts it once CSS is listed, at any depth', () => {
      expect(covers(['**/*.css'], './dist/styles/theme-dark.css')).toBe(true);
      expect(covers(['**/*.css'], './theme.css')).toBe(true);
    });

    it('keeps `*` inside one segment and `**` across segments', () => {
      expect(covers(['./dist/*.css'], './dist/a.css')).toBe(true);
      expect(covers(['./dist/*.css'], './dist/styles/a.css')).toBe(false);
      expect(covers(['./dist-wc/**'], './dist-wc/index.js')).toBe(true);
      expect(covers(['./dist-wc/**'], './dist-wcx/index.js')).toBe(false);
    });

    it('treats the dot in an extension literally', () => {
      expect(covers(['**/*.css'], './dist/styles/a.scss')).toBe(false);
      expect(covers(['**/*.css'], './dist/styles/acss')).toBe(false);
    });
  });
});
