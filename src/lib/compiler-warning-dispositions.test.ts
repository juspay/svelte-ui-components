import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import { compile } from 'svelte/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../../svelte.config.js';
import Card from './Card/Card.svelte';
import Pill from './Pill/Pill.svelte';
import ThemeSwitcher from './ThemeSwitcher/ThemeSwitcher.svelte';

/**
 * Every compiler warning that `pnpm run check` reports has an explicit outcome. These are the
 * ones resolved in code, each pinned two ways: the compiler no longer reports it, and the claim
 * that made it safe to resolve that way is still true when the real component runs.
 *
 * Not covered here, deliberately: Modal's `debounceTime` capture (a real defect), Icon's
 * conditional tabindex and MediaPlayer's conditional caption track (owned and handled elsewhere).
 */

const ROOT = join(import.meta.dirname, '..', '..');

/** Warning codes the compiler reports for a source string, using the repo's own compile options. */
function codesFor(source: string, filename: string): string[] {
  return compile(source, {
    filename: join(ROOT, filename),
    generate: false,
    ...config.compilerOptions
  }).warnings.map((warning) => warning.code);
}

function codesForFile(relativePath: string): string[] {
  return codesFor(readFileSync(join(ROOT, relativePath), 'utf8'), relativePath);
}

describe('warnings resolved in the component source', () => {
  it.each([
    ['src/lib/Card/Card.svelte', 'state_referenced_locally'],
    ['src/lib/Pill/Pill.svelte', 'state_referenced_locally'],
    ['src/lib/ThemeSwitcher/ThemeSwitcher.svelte', 'state_referenced_locally'],
    ['src/lib/Radio/Radio.svelte', 'a11y_role_supports_aria_props_implicit']
  ])('%s no longer reports %s', (file, code) => {
    expect(codesForFile(file)).not.toContain(code);
  });

  // The assertions above would also pass if the compiler stopped detecting these shapes, or if a
  // suppression had been widened to hide the whole file. These show the detector is live on the
  // same shapes, and that an ignore covers one statement and nothing after it.
  it('still reports a captured prop that is not covered by an ignore', () => {
    const source = `<script lang="ts">
  let { attrs }: { attrs?: object } = $props();
  const first = attrs;
</script>
<p>{String(first)}</p>`;

    expect(codesFor(source, 'src/lib/Probe/Probe.svelte')).toContain('state_referenced_locally');
  });

  it('keeps a state_referenced_locally ignore to the one statement it precedes', () => {
    const source = `<script lang="ts">
  let { attrs, other }: { attrs?: object; other?: object } = $props();
  // svelte-ignore state_referenced_locally
  const covered = attrs;
  const uncovered = other;
</script>
<p>{String(covered)}{String(uncovered)}</p>`;

    expect(
      codesFor(source, 'src/lib/Probe/Probe.svelte').filter(
        (code) => code === 'state_referenced_locally'
      )
    ).toHaveLength(1);
  });

  it('still reports aria-invalid on a native radio, so the Radio fix is not an artefact of the checker', () => {
    const source = '<input type="radio" aria-invalid="true" />';

    expect(codesFor(source, 'src/lib/Probe/Probe.svelte')).toContain(
      'a11y_role_supports_aria_props_implicit'
    );
  });
});

describe('options_missing_custom_element is dropped for web-component wrappers only', () => {
  const wrapper = '<svelte:options customElement="x-probe" />\n<p>probe</p>';

  it('is silent for a .wc.svelte wrapper, which the shipping build compiles with customElement: true', () => {
    expect(codesFor(wrapper, 'src/wc/components/Probe.wc.svelte')).not.toContain(
      'options_missing_custom_element'
    );
  });

  it('still reports the same option on any other file', () => {
    expect(codesFor(wrapper, 'src/lib/Probe/Probe.svelte')).toContain(
      'options_missing_custom_element'
    );
  });

  it('leaves every other warning on a wrapper alone', () => {
    const withUnrelatedWarning = `${wrapper}\n<img src="/x.png" />`;

    expect(codesFor(withUnrelatedWarning, 'src/wc/components/Probe.wc.svelte')).toEqual([
      'a11y_missing_attribute'
    ]);
  });

  it('is what the real Card wrapper compiles under', () => {
    expect(codesForFile('src/wc/components/Card.wc.svelte')).toEqual([]);
  });
});

describe('the Card and Pill dev notice reads attrs once; rendering still follows attrs', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('Card applies an attrs change made after mount', async () => {
    const { container, rerender } = render(Card, { attrs: { 'data-state': 'before' } });
    const root = container.querySelector('.card');
    expect(root?.getAttribute('data-state')).toBe('before');

    await rerender({ attrs: { 'data-state': 'after', 'data-extra': 'added' } });

    expect(root?.getAttribute('data-state')).toBe('after');
    expect(root?.getAttribute('data-extra')).toBe('added');
  });

  it('Card does not repeat the dev notice for an attrs change, which is what "initial value" means here', async () => {
    const { rerender } = render(Card, { attrs: { 'data-state': 'before' } });
    expect(warn).not.toHaveBeenCalled();

    await rerender({ attrs: { class: 'late' } });

    expect(warn).not.toHaveBeenCalled();
  });

  it('Pill applies an attrs change made after mount', async () => {
    const { container, rerender } = render(Pill, {
      text: 'Syncing',
      attrs: { 'data-state': 'before' }
    });
    const root = container.querySelector('.pill');
    expect(root?.getAttribute('data-state')).toBe('before');

    await rerender({ attrs: { 'data-state': 'after', 'data-extra': 'added' } });

    expect(root?.getAttribute('data-state')).toBe('after');
    expect(root?.getAttribute('data-extra')).toBe('added');
  });

  it('Pill does not repeat the dev notice for an attrs change', async () => {
    const { rerender } = render(Pill, { text: 'Syncing', attrs: { 'data-state': 'before' } });
    expect(warn).not.toHaveBeenCalled();

    await rerender({ attrs: { 'aria-pressed': 'true' } });

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('ThemeSwitcher.value is the initial selection, not a controlled binding', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  const pressedLabel = (container: HTMLElement): string | null =>
    container.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label') ?? null;

  it('selects the initial value on mount', () => {
    const { container } = render(ThemeSwitcher, {
      mode: 'segment',
      value: 'dark',
      storageKey: ''
    });

    expect(pressedLabel(container)).toBe('Dark theme');
  });

  it('does not follow a later change to the prop', async () => {
    const { container, rerender } = render(ThemeSwitcher, {
      mode: 'segment',
      value: 'dark',
      storageKey: ''
    });

    await rerender({ value: 'light' });

    expect(pressedLabel(container)).toBe('Dark theme');
  });

  it('moves with the user instead, and the user choice survives the prop staying put', async () => {
    const { container, rerender } = render(ThemeSwitcher, {
      mode: 'segment',
      value: 'dark',
      storageKey: ''
    });
    const light = container.querySelector<HTMLButtonElement>('[aria-label="Light theme"]');
    light?.click();
    await rerender({ value: 'dark' });

    expect(pressedLabel(container)).toBe('Light theme');
  });
});
