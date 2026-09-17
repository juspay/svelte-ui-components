import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DeltaIndicator from './DeltaIndicator.svelte';
import type { DeltaIndicatorProperties } from './properties';

/*
 * jsdom has no Element.animate, no CSS global and no matchMedia, so nothing
 * here can observe AnimatedNumber's roll itself -- that is AnimatedNumber's
 * own test file's job. What this asserts is the wiring: `animateValue` left
 * unset must render the exact old plain-text markup (proving the additive
 * prop is byte-identical opt-out by default), and set to `true` must swap in
 * AnimatedNumber's structure carrying the formatter's STRING output, without
 * disturbing the arrow, the direction class, or `invertColors`/`hideArrow`/
 * `neutralThreshold`.
 */

function renderRoot(props: DeltaIndicatorProperties): HTMLElement {
  const { container } = render(DeltaIndicator, props);
  const root = container.querySelector('.delta-indicator');
  if (!(root instanceof HTMLElement)) {
    throw new Error('DeltaIndicator root is missing');
  }
  return root;
}

describe('DeltaIndicator animateValue default (off)', () => {
  it('renders the old plain-text markup, with no AnimatedNumber in the tree', () => {
    const root = renderRoot({ value: 12.5 });
    const textNode = root.querySelector('.delta-indicator-text');
    expect(textNode?.textContent).toBe('13%');
    expect(root.querySelector('.animated-number')).toBeNull();
    expect(root.querySelector('[role="img"]')).toBeNull();
  });

  it('is unaffected by a custom format when unset', () => {
    const root = renderRoot({ value: 42.5, format: (v) => `+$${v.toFixed(2)}` });
    expect(root.querySelector('.delta-indicator-text')?.textContent).toBe('+$42.50');
    expect(root.querySelector('.animated-number')).toBeNull();
  });
});

describe('DeltaIndicator animateValue on', () => {
  it('renders the formatted default text through AnimatedNumber', () => {
    const root = renderRoot({ value: 12.5, animateValue: true });
    const animated = root.querySelector('.delta-indicator-text .animated-number');
    expect(animated).not.toBeNull();
    expect(animated?.getAttribute('aria-label')).toBe('13%');
  });

  it("animates the custom format's STRING output, not the raw value", () => {
    const root = renderRoot({
      value: 42.5,
      animateValue: true,
      format: (v) => `+$${v.toFixed(2)}`
    });
    const animated = root.querySelector('.delta-indicator-text .animated-number');
    expect(animated?.getAttribute('aria-label')).toBe('+$42.50');
  });

  it('leaves the arrow, direction class and tone untouched', () => {
    const up = renderRoot({ value: 5, animateValue: true });
    expect(up.querySelector('.delta-indicator-arrow.delta-arrow-up')).not.toBeNull();
    expect(up.classList.contains('delta-positive')).toBe(true);

    const down = renderRoot({ value: -5, animateValue: true, invertColors: true });
    expect(down.querySelector('.delta-indicator-arrow.delta-arrow-down')).not.toBeNull();
    // invertColors flips a down-move to positive tone.
    expect(down.classList.contains('delta-positive')).toBe(true);
  });

  it('still honours hideArrow and neutralThreshold', () => {
    const neutral = renderRoot({ value: 0.4, animateValue: true, neutralThreshold: 0.5 });
    expect(neutral.querySelector('.delta-indicator-arrow')).toBeNull();
    expect(neutral.querySelector('.delta-indicator-dash')).not.toBeNull();
    expect(neutral.classList.contains('delta-neutral')).toBe(true);

    const hidden = renderRoot({ value: 8, animateValue: true, hideArrow: true });
    expect(hidden.querySelector('.delta-indicator-arrow')).toBeNull();
    expect(hidden.querySelector('.delta-indicator-dash')).toBeNull();
    expect(hidden.querySelector('.delta-indicator-text .animated-number')).not.toBeNull();
  });

  it('rolls to a new value on rerender, keeping the AnimatedNumber wrapper', async () => {
    const { container, rerender } = render(DeltaIndicator, { value: 12.5, animateValue: true });
    const before = container.querySelector('.animated-number');
    expect(before?.getAttribute('aria-label')).toBe('13%');

    await rerender({ value: 27.9, animateValue: true });
    const after = container.querySelector('.animated-number');
    expect(after?.getAttribute('aria-label')).toBe('28%');
  });
});
