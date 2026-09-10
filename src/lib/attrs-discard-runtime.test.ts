import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Card from './Card/Card.svelte';
import Pill from './Pill/Pill.svelte';

/**
 * That `discardedAttrWarnings` returns the right strings proves nothing about
 * whether a consumer ever sees one. These render the real components and read
 * `console.warn`, so they fail if the wiring is dropped from either template.
 *
 * The rendered DOM is asserted alongside the warning on purpose: the point of
 * the warning is that the entry was discarded, so a test that checked only the
 * message could pass while `attrs` had silently started winning instead.
 */

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

const messages = (): string[] =>
  (warn.mock.calls as readonly (readonly unknown[])[]).map((call) => String(call[0]));

describe('Card warns an untyped caller that a managed attrs entry is discarded', () => {
  it('warns for class, and the class really is discarded', async () => {
    const { container } = render(Card, {
      classes: 'mine',
      attrs: { class: 'from-attrs' }
    });

    const root = container.querySelector('.card');
    expect(root).not.toBeNull();
    expect(root?.className).toContain('mine');
    expect(root?.className).not.toContain('from-attrs');

    expect(messages().some((m) => m.includes('Card') && m.includes('"class"'))).toBe(true);
  });

  it('stays silent for an attribute Card does not manage, which still lands', async () => {
    const { container } = render(Card, { attrs: { 'data-state': 'waiting' } });

    expect(container.querySelector('.card')?.getAttribute('data-state')).toBe('waiting');
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays silent when attrs is omitted entirely', async () => {
    render(Card, {});
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('Pill warns on its own list, not Card’s', () => {
  it('warns for aria-pressed, which Pill manages and Card does not', async () => {
    render(Pill, { text: 'Syncing', attrs: { 'aria-pressed': 'true' } });
    expect(messages().some((m) => m.includes('Pill') && m.includes('"aria-pressed"'))).toBe(true);
  });

  it('stays silent for style, which Pill does not manage', async () => {
    render(Pill, { text: 'Syncing', attrs: { style: 'color: red' } });
    expect(warn).not.toHaveBeenCalled();
  });
});
