import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectHostDisplayEntries,
  generateStylesheet,
  parseHostDisplay,
  run
} from './host-display-compat.ts';

const REAL_COMPONENTS_DIR = resolve(process.cwd(), 'src/wc/components');

/**
 * The 11 components whose new :host default is inline-block, per this PR's own audit
 * (Avatar, ChatSuggestions, Checkbox, DateRangePicker, DeltaIndicator, Img, KeyboardInput,
 * Label, LoadingDots, Radio, ThemeSwitcher). Kept here only to CHECK the tool's derived set
 * against — collectHostDisplayEntries below always reads the live .svelte files, never this
 * list, so the two cannot drift the way a tool that hardcoded this set could.
 */
const EXPECTED_INLINE_BLOCK_TAGS = new Set([
  'sui-animated-number',
  'sui-avatar',
  'sui-chat-suggestions',
  'sui-checkbox',
  'sui-date-range-picker',
  'sui-delta-indicator',
  'sui-img',
  'sui-keyboard-input',
  'sui-label',
  'sui-loading-dots',
  'sui-radio',
  'sui-theme-switcher'
]);

/** Same shape every real wrapper has: svelte:options tag, then a :host display rule in <style>. */
function wrapper(tag: string, property: string, defaultValue: string): string {
  return [
    '<svelte:options',
    '  customElement={{',
    `    tag: '${tag}',`,
    "    shadow: 'open',",
    '    props: {}',
    '  }}',
    '/>',
    '',
    '<script lang="ts">',
    '  let props = $props();',
    '</script>',
    '',
    '<slot></slot>',
    '',
    '<style>',
    '  :host {',
    `    display: var(${property}, ${defaultValue});`,
    '  }',
    '</style>',
    ''
  ].join('\n');
}

function tempComponentsDir(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'sui-host-display-'));
  const dir = join(root, 'src/wc/components');
  mkdirSync(dir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(dir, name), contents);
  }
  return root;
}

describe('parseHostDisplay', () => {
  it('reads the tag and the custom-property name + default off a real wrapper shape', () => {
    const source = wrapper('sui-badge', '--sui-badge-display', 'block');

    expect(parseHostDisplay(source, 'Badge.wc.svelte')).toEqual({
      file: 'Badge.wc.svelte',
      tag: 'sui-badge',
      property: '--sui-badge-display',
      newDefault: 'block'
    });
  });

  it('reads an inline-block default the same way', () => {
    const source = wrapper('sui-avatar', '--sui-avatar-display', 'inline-block');

    expect(parseHostDisplay(source, 'Avatar.wc.svelte')?.newDefault).toBe('inline-block');
  });

  it('MUST flag a wrapper with a tag but no :host display rule, rather than guessing one', () => {
    // A wrapper that lost its :host rule (or never had one written correctly) must not
    // silently vanish from the generated shim -- that would ship a stylesheet that looks
    // complete while leaving that element's layout unprotected. This is the detector-fires
    // proof: this input MUST come back null so the caller can surface it as a skip.
    const source = [
      "<svelte:options customElement={{ tag: 'sui-mystery' }} />",
      '<script lang="ts">let props = $props();</script>',
      '<slot></slot>'
    ].join('\n');

    expect(parseHostDisplay(source, 'Mystery.wc.svelte')).toBeNull();
  });

  it('flags a file with a :host display rule but no readable tag', () => {
    const source = [
      '<script lang="ts">let props = $props();</script>',
      '<style>:host { display: var(--sui-x-display, block); }</style>'
    ].join('\n');

    expect(parseHostDisplay(source, 'NoTag.wc.svelte')).toBeNull();
  });

  it('does not match a display rule that is not the exact var(--x, y) shape this PR uses', () => {
    // Cannot see: a fallback chain (var(--a, var(--b, block))), a value with no var() at all,
    // or a :host rule assembled from an imported partial rather than written inline. All three
    // come back null here and are surfaced as a skip, never silently treated as "no override".
    const source = [
      "<svelte:options customElement={{ tag: 'sui-nested' }} />",
      '<style>:host { display: var(--sui-nested-display, var(--fallback, block)); }</style>'
    ].join('\n');

    expect(parseHostDisplay(source, 'Nested.wc.svelte')).toBeNull();
  });
});

describe('collectHostDisplayEntries against the real component wrappers', () => {
  const { entries, skipped } = collectHostDisplayEntries(REAL_COMPONENTS_DIR);

  it('reads every wrapper with zero skips', () => {
    // A skip here would mean the shim silently omits a real element -- assert the count
    // directly instead of only checking >0, so a future wrapper added without (or with a
    // malformed) :host rule fails this test instead of quietly shrinking the shim.
    expect(skipped).toEqual([]);
    expect(entries.length).toBeGreaterThan(0);
  });

  it('derives the inline-block set from source and it matches the audited list exactly', () => {
    const derived = new Set(
      entries.filter((entry) => entry.newDefault === 'inline-block').map((entry) => entry.tag)
    );
    expect(derived).toEqual(EXPECTED_INLINE_BLOCK_TAGS);
  });

  it('every other entry defaults to block, and every property name is --<tag>-display', () => {
    for (const entry of entries) {
      const expectedDefault = EXPECTED_INLINE_BLOCK_TAGS.has(entry.tag) ? 'inline-block' : 'block';
      expect(entry.newDefault).toBe(expectedDefault);
      expect(entry.property).toBe(`--${entry.tag}-display`);
    }
  });
});

describe('generateStylesheet', () => {
  const entries = [
    {
      file: 'Badge.wc.svelte',
      tag: 'sui-badge',
      property: '--sui-badge-display',
      newDefault: 'block'
    },
    {
      file: 'Avatar.wc.svelte',
      tag: 'sui-avatar',
      property: '--sui-avatar-display',
      newDefault: 'inline-block'
    }
  ];

  it('emits exactly one rule per element, pinned to literal inline regardless of the new default', () => {
    const css = generateStylesheet(entries);

    expect(css).toContain('sui-badge { --sui-badge-display: inline; }');
    expect(css).toContain('sui-avatar { --sui-avatar-display: inline; }');
    // Only ever `inline` -- never the element's own new default -- because the old implicit
    // behaviour being restored was inline for every element, block-default and
    // inline-block-default alike.
    expect(css).not.toContain(': block;');
    expect(css).not.toContain(': inline-block;');
  });

  it('documents itself as a removable compatibility shim, not a permanent override', () => {
    const css = generateStylesheet(entries);
    // Collapse the JSDoc-style " * " line prefixes so a prose check does not depend on
    // exactly where the header happens to wrap.
    const prose = css.replace(/\n\s*\*\s?/g, ' ');

    expect(css).toContain('COMPATIBILITY SHIM');
    expect(css).toContain('percentage-width');
    expect(prose).toContain('delete rules one at a time');
    expect(prose).toContain('DO NOT KEEP THIS FILE');
  });
});

describe('run', () => {
  it('prints the stylesheet and writes nothing when --out is omitted', () => {
    const lines: string[] = [];

    const summary = run(['--root', process.cwd()], (line) => lines.push(line));

    expect(summary.exitCode).toBe(0);
    expect(summary.outPath).toBeNull();
    expect(lines.join('\n')).toContain('sui-badge { --sui-badge-display: inline; }');
  });

  it('writes to --out, and only there', () => {
    const root = tempComponentsDir({
      'Good.wc.svelte': wrapper('sui-good', '--sui-good-display', 'block')
    });
    const out = join(root, 'host-display-compat.css');
    const lines: string[] = [];

    const summary = run(['--root', root, '--out', out], (line) => lines.push(line));

    expect(summary.exitCode).toBe(0);
    expect(summary.outPath).toBe(resolve(out));
    expect(lines.some((line) => line.includes('sui-good'))).toBe(false);

    const written = readFileSync(out, 'utf8');
    expect(written).toContain('sui-good { --sui-good-display: inline; }');

    rmSync(root, { recursive: true, force: true });
  });

  it('refuses to generate -- and writes nothing -- when a wrapper is missing its :host rule', () => {
    const root = tempComponentsDir({
      'Good.wc.svelte': wrapper('sui-good', '--sui-good-display', 'block'),
      'Bad.wc.svelte': "<svelte:options customElement={{ tag: 'sui-bad' }} />\n<slot></slot>\n"
    });
    const out = join(root, 'out.css');
    const lines: string[] = [];

    const summary = run(['--root', root, '--out', out], (line) => lines.push(line));

    expect(summary.exitCode).toBe(1);
    expect(summary.skipped).toEqual(['Bad.wc.svelte']);
    expect(lines.some((line) => line.includes('Bad.wc.svelte'))).toBe(true);
    expect(() => readFileSync(out, 'utf8')).toThrow();

    rmSync(root, { recursive: true, force: true });
  });

  it('exits 2 when the target has no src/wc/components directory at all', () => {
    const empty = mkdtempSync(join(tmpdir(), 'sui-host-display-empty-'));

    const summary = run(['--root', empty], () => {});

    expect(summary.exitCode).toBe(2);
    rmSync(empty, { recursive: true, force: true });
  });

  it('prints usage and exits 0 on --help without touching the filesystem', () => {
    const lines: string[] = [];

    const summary = run(['--help'], (line) => lines.push(line));

    expect(summary.exitCode).toBe(0);
    expect(lines.join('\n')).toContain('Usage:');
  });
});
