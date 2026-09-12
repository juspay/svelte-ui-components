import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import DateRangePicker from './DateRangePicker.svelte';
import type { DateRangePreset } from './properties';

// Fixed dates so preset getValue() results are deterministic across test runs.
const TODAY = new Date(2026, 5, 15);
const YESTERDAY = new Date(2026, 5, 14);

function makePresets(): DateRangePreset[] {
  return [
    { label: 'Today', getValue: () => ({ start: TODAY, end: TODAY }) },
    { label: 'Yesterday', getValue: () => ({ start: YESTERDAY, end: YESTERDAY }) }
  ];
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getPanel(container: HTMLElement): HTMLElement {
  const panel = container.querySelector<HTMLElement>('[data-pw="drp-panel"]');
  if (panel === null) {
    throw new Error('drp panel not found');
  }
  return panel;
}

const compareTriggerSnippet = createRawSnippet<[string]>((label) => ({
  render: () => `<span>${label()}</span>`
}));

const compareCalendarSnippet = createRawSnippet(() => ({
  render: () => `<button type="button">compare day</button>`
}));

describe('DateRangePicker main panel focus management', () => {
  it('moves focus to the first focusable element inside the panel when it opens', async () => {
    const { container, getByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    await waitFor(() => {
      const panel = getPanel(container);
      const first = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0];
      expect(document.activeElement).toBe(first);
    });
  });

  it('traps Tab at the last focusable element, cycling back to the first', async () => {
    const { container, getByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    const panel = await waitFor(() => getPanel(container));

    // Select a preset so Apply becomes enabled and is included in the focusable set —
    // otherwise the disabled Apply button is skipped and the trap boundary is ambiguous.
    await fireEvent.click(getByRole('option', { name: 'Today' }));

    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    expect(focusable.length).toBeGreaterThan(1);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    expect(document.activeElement).toBe(last);
    await fireEvent.keyDown(panel, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('traps Shift+Tab at the first focusable element, cycling back to the last', async () => {
    const { container, getByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    const panel = await waitFor(() => getPanel(container));

    await fireEvent.click(getByRole('option', { name: 'Today' }));

    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    expect(focusable.length).toBeGreaterThan(1);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first.focus();
    expect(document.activeElement).toBe(first);
    await fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('does not move focus when Tab is pressed away from either edge', async () => {
    const { container, getByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    const panel = await waitFor(() => getPanel(container));
    await fireEvent.click(getByRole('option', { name: 'Today' }));

    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const middle = focusable[1];
    middle.focus();
    expect(document.activeElement).toBe(middle);

    await fireEvent.keyDown(panel, { key: 'Tab' });
    // Not an edge — the trap leaves the key alone (jsdom does not itself move focus
    // on Tab, so this just confirms nothing was force-moved by the handler).
    expect(document.activeElement).toBe(middle);
  });

  it('returns focus to the trigger when the panel closes via Escape', async () => {
    const { container, getByRole, queryByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    const panel = await waitFor(() => getPanel(container));

    // Simulate the user having tabbed to some other element inside the panel before
    // hitting Escape — fireEvent.click does not itself move jsdom focus, so without this
    // the trigger would trivially "still" be focused even with no restore logic at all.
    const somewhereInPanel = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0];
    somewhereInPanel.focus();
    expect(document.activeElement).toBe(somewhereInPanel);
    expect(document.activeElement).not.toBe(trigger);

    await fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Date range picker' })).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('returns focus to the trigger when the panel closes via Apply', async () => {
    const { container, getByRole, queryByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    await waitFor(() => getPanel(container));
    await fireEvent.click(getByRole('option', { name: 'Today' }));

    const applyButton = getByRole('button', { name: 'Apply date selection' });
    // Same reasoning as the Escape case above: move focus into the panel by hand first
    // so the assertion below can only pass because closePicker actually restores it.
    applyButton.focus();
    expect(document.activeElement).toBe(applyButton);

    await fireEvent.click(applyButton);

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Date range picker' })).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('never traps focus while the panel is closed', async () => {
    const { queryByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    expect(queryByRole('dialog', { name: 'Date range picker' })).toBeNull();

    const outside = document.createElement('button');
    outside.textContent = 'outside';
    document.body.append(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);

    await fireEvent.keyDown(outside, { key: 'Tab' });
    // No panel exists, so nothing intercepts Tab — focus is left exactly where it was.
    expect(document.activeElement).toBe(outside);

    outside.remove();
  });

  it('still closes the panel on an outside click, unaffected by the focus trap', async () => {
    const { getByRole, queryByRole } = render(DateRangePicker, {
      testId: 'drp',
      presets: makePresets(),
      dualMonth: false
    });

    const trigger = getByRole('button', { name: 'Open date picker' });
    trigger.focus();
    await fireEvent.click(trigger);

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Date range picker' })).not.toBeNull();
    });

    await fireEvent.click(document.body);

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Date range picker' })).toBeNull();
    });
  });
});

describe('DateRangePicker compare panel focus management (still works alongside the shared trap)', () => {
  it('opens the compare panel, moves focus in, and returns it to the compare trigger on Cancel', async () => {
    const { getByRole, queryByRole } = render(DateRangePicker, {
      testId: 'drp',
      compareTrigger: compareTriggerSnippet,
      compareCalendar: compareCalendarSnippet
    });

    const compareTrigger = getByRole('button', { name: 'Open compare period picker' });
    compareTrigger.focus();
    await fireEvent.click(compareTrigger);

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Compare period picker' })).not.toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).not.toBe(compareTrigger);
    });

    await fireEvent.click(getByRole('button', { name: 'Cancel compare selection' }));

    await waitFor(() => {
      expect(queryByRole('dialog', { name: 'Compare period picker' })).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(compareTrigger);
    });
  });
});
