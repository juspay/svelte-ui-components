import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import StatCard from './StatCard.svelte';

/**
 * The header checkbox is a CheckListItem, which used to leave its box unnamed. These pin that the
 * card now exposes it under `checkbox.text` -- including on a card with no title -- and that naming
 * it did not disturb the other half of the contract: toggling the box must never run the card
 * action of an interactive (`onclick`) card, by pointer or by keyboard.
 */

describe('StatCard header checkbox accessible name', () => {
  it('names the checkbox from checkbox.text on a titled card', () => {
    const { getByRole } = render(StatCard, {
      title: 'Include Returns',
      value: '₹10.9Cr',
      checkbox: { text: 'With returns', checked: false },
      testId: 'card'
    });
    expect(getByRole('checkbox', { name: 'With returns' })).toBeTruthy();
  });

  it('names the checkbox on a card whose header has no title', () => {
    const { getByRole, container } = render(StatCard, {
      value: '₹10.9Cr',
      checkbox: { text: 'Include returns' },
      testId: 'card'
    });
    expect(container.querySelector('[data-pw="card-title"]')).toBeNull();
    expect(getByRole('checkbox', { name: 'Include returns' })).toBeTruthy();
  });

  it('exposes exactly one checkbox and hides the native form mirror', () => {
    const { getAllByRole, container } = render(StatCard, {
      title: 'Total',
      value: '1',
      checkbox: { text: 'Live data' }
    });
    expect(getAllByRole('checkbox')).toHaveLength(1);
    const mirrors = container.querySelectorAll('input[type="checkbox"]');
    expect(mirrors).toHaveLength(1);
    expect(mirrors[0]?.getAttribute('aria-hidden')).toBe('true');
    expect(mirrors[0]?.getAttribute('tabindex')).toBe('-1');
  });

  it('renders no checkbox when none is configured', () => {
    const { queryByRole } = render(StatCard, { title: 'Total', value: '1' });
    expect(queryByRole('checkbox')).toBeNull();
  });

  it('reports the new checked state through oncheckboxchange', async () => {
    const oncheckboxchange = vi.fn();
    const { getByRole } = render(StatCard, {
      title: 'Total',
      value: '1',
      checkbox: { text: 'Live data', checked: false },
      oncheckboxchange
    });
    const box = getByRole('checkbox', { name: 'Live data' });
    await fireEvent.click(box);
    expect(box.getAttribute('aria-checked')).toBe('true');
    await fireEvent.keyDown(box, { key: ' ' });
    expect(oncheckboxchange.mock.calls).toEqual([[true], [false]]);
  });
});

describe('StatCard header checkbox on an interactive card', () => {
  it('does not run the card action when the box is toggled by pointer or keyboard', async () => {
    const onclick = vi.fn();
    const oncheckboxchange = vi.fn();
    const { getByRole } = render(StatCard, {
      title: 'View Report',
      value: '68.4%',
      checkbox: { text: 'Live data', checked: false },
      oncheckboxchange,
      onclick,
      testId: 'card'
    });
    const box = getByRole('checkbox', { name: 'Live data' });

    await fireEvent.click(box);
    await fireEvent.keyDown(box, { key: ' ' });
    await fireEvent.keyDown(box, { key: 'Enter' });

    expect(oncheckboxchange.mock.calls).toEqual([[true], [false], [true]]);
    expect(onclick).not.toHaveBeenCalled();
  });

  it('runs the same action from its native button and delegated card pointer click', async () => {
    const onclick = vi.fn();
    const { getByRole, container } = render(StatCard, {
      title: 'View Report',
      value: '68.4%',
      checkbox: { text: 'Live data' },
      onclick
    });
    const card = getByRole('button');
    expect(card.tagName).toBe('BUTTON');
    expect(card.querySelector('[role="checkbox"]')).toBeNull();
    await fireEvent.click(card);
    expect(onclick).toHaveBeenCalledTimes(1);
    // jsdom does not synthesize native button activation from a keydown.
    // Trusted Enter/Space behavior is covered by independent-action-semantics.spec.ts.
    const value = container.querySelector('.statcard-value');
    if (value === null) {
      throw new Error('Expected the card value pointer surface');
    }
    await fireEvent.click(value);
    expect(onclick).toHaveBeenCalledTimes(2);
  });
});
