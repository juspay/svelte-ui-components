import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Progress from './Progress.svelte';

/**
 * `animateValue` is new, additive and opt-in (see properties.ts). Left unset
 * the component must render exactly the old `.label` text node; only with it
 * on does the label become an `AnimatedNumber` instance instead. jsdom has no
 * `Element.animate`, no CSS global and no `matchMedia` (see AnimatedNumber's
 * own test file), so this only asserts DOM shape -- which of the two label
 * forms is present -- never the roll itself.
 */

const label = (container: HTMLElement): HTMLElement | null => container.querySelector('.label');

describe('Progress animateValue default (off)', () => {
  it('renders the old plain-text label untouched when unset', () => {
    const { container } = render(Progress, { value: 60, showLabel: true });
    const node = label(container);
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe('60%');
    expect(node?.querySelector('.animated-number')).toBeNull();
  });

  it('renders the old plain-text label untouched when explicitly false', () => {
    const { container } = render(Progress, {
      value: 60,
      showLabel: true,
      animateValue: false
    });
    const node = label(container);
    expect(node?.textContent).toBe('60%');
    expect(node?.querySelector('.animated-number')).toBeNull();
  });
});

describe('Progress animateValue on', () => {
  it('routes the percentage through AnimatedNumber, with the % inside its accessible name', () => {
    const { container } = render(Progress, {
      value: 60,
      showLabel: true,
      animateValue: true
    });
    const node = label(container);
    expect(node).not.toBeNull();
    const animated = node?.querySelector('.animated-number');
    expect(animated).not.toBeNull();
    expect(animated?.getAttribute('role')).toBe('img');
    // AnimatedNumber's own accessible name mirrors the glyphs it renders (see
    // its test file), so asserting it here is a DOM-attribute check on what
    // number it was actually given -- not a textContent scrape, which would
    // also pick up the nine off-screen glyphs every odometer column keeps in
    // the DOM for the CSS transition to roll through.
    expect(animated?.getAttribute('aria-label')).toBe('60%');
    // Two digit columns for "60"; the % is a static literal column, not a digit,
    // so it never rolls even though it lives inside the accessible name.
    expect(animated?.querySelectorAll('.animated-number-digit')).toHaveLength(2);
    // Nothing is left outside the role="img" element. A unit sitting beside it
    // reads fine in a linear pass but vanishes when a screen-reader user navigates
    // by graphic, which announces only the element's own label.
    const withoutAnimated = node?.cloneNode(true) as HTMLElement;
    withoutAnimated.querySelector('[role="img"]')?.remove();
    expect(withoutAnimated.textContent?.trim()).toBe('');
  });

  it('rounds the same way the static label does', () => {
    const { container } = render(Progress, {
      value: 1,
      max: 3,
      showLabel: true,
      animateValue: true
    });
    // (1/3) * 100 = 33.33... -> Math.round -> 33, matching labelText exactly.
    const animated = label(container)?.querySelector('.animated-number');
    expect(animated?.getAttribute('aria-label')).toBe('33%');
  });

  it('stays inert on an indeterminate bar -- no label, no AnimatedNumber', () => {
    const { container } = render(Progress, {
      value: -1,
      showLabel: true,
      animateValue: true
    });
    expect(label(container)).toBeNull();
    expect(container.querySelector('.animated-number')).toBeNull();
  });

  it('stays inert when showLabel is off', () => {
    const { container } = render(Progress, {
      value: 60,
      showLabel: false,
      animateValue: true
    });
    expect(label(container)).toBeNull();
    expect(container.querySelector('.animated-number')).toBeNull();
  });
});

/**
 * `headerStart`, `headerEnd` and `note` are additive (see properties.ts).
 * With none of them passed, the component's root must still be the bare
 * `.container` progressbar -- no `.progress-root`, `.progress-header` or `.progress-note` -- so every
 * existing consumer renders the same DOM as before.
 */
const span = (cls: string, text: string) =>
  createRawSnippet(() => ({ render: () => `<span class="${cls}">${text}</span>` }));

describe('Progress header and note (unset)', () => {
  it('renders the bare progressbar with no wrapper', () => {
    const { container } = render(Progress, { value: 40 });
    const first = container.firstElementChild;
    expect(first?.classList.contains('container')).toBe(true);
    expect(first?.getAttribute('role')).toBe('progressbar');
    expect(container.querySelector('.progress-root, .progress-header, .progress-note')).toBeNull();
  });
});

describe('Progress header and note (set)', () => {
  it('puts headerStart and headerEnd in a header row before the track', () => {
    const { container } = render(Progress, {
      value: 40,
      headerStart: span('name', 'Context'),
      headerEnd: span('value', '40%')
    });
    const root = container.querySelector('.progress-root');
    const header = root?.querySelector(':scope > .progress-header');
    expect([...(header?.children ?? [])].map((e) => e.textContent)).toEqual(['Context', '40%']);
    expect(root?.firstElementChild).toBe(header);
    expect(header?.nextElementSibling?.getAttribute('role')).toBe('progressbar');
    expect(root?.querySelector('.progress-note')).toBeNull();
  });

  it('puts note in a row after the progressbar', () => {
    const { container } = render(Progress, { value: 40, note: span('n', 'resets in 2h') });
    const root = container.querySelector('.progress-root');
    expect(root?.querySelector('.progress-header')).toBeNull();
    const noteRow = root?.querySelector(':scope > .progress-note');
    expect(noteRow?.textContent).toBe('resets in 2h');
    expect(noteRow?.previousElementSibling?.getAttribute('role')).toBe('progressbar');
  });

  it('keeps the progressbar name and value with all three set', () => {
    const { container } = render(Progress, {
      value: 40,
      ariaLabel: 'Context',
      headerStart: span('name', 'Context'),
      headerEnd: span('value', '40%'),
      note: span('n', 'resets in 2h')
    });
    const bar = container.querySelector('[role=progressbar]');
    expect(bar?.getAttribute('aria-label')).toBe('Context');
    expect(bar?.getAttribute('aria-valuenow')).toBe('40');
    expect(
      [...(container.querySelector('.progress-root')?.children ?? [])].map(
        (e) => e.className.split(' ')[0]
      )
    ).toEqual(['progress-header', 'container', 'progress-note']);
  });
});
