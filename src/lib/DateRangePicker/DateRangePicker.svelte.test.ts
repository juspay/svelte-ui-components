import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

/** Matches Menu.svelte.test.ts / ContextMenu.svelte.test.ts's own helper: the
 *  shared dismissal registry (src/lib/_interaction/dismissal.ts) arbitrates
 *  outside-press via a capture-phase `pointerdown` listener, not `click` --
 *  a real click sequence fires pointerdown first, but `fireEvent.click` only
 *  synthesizes the `click` event and never reaches it. */
const pointerDownOn = (node: Node): boolean =>
  node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

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

    pointerDownOn(document.body);

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

/**
 * jsdom has no layout and no matchMedia. This stand-in evaluates `(max-width: Npx)`
 * queries against a viewport width the test controls, and emits `change` to a query's
 * listeners when a resize flips its answer -- the same thing a real window does, so a
 * test can drive the breakpoints by width instead of by the query strings.
 */
const installViewport = (initialWidth: number) => {
  let viewportWidth = initialWidth;
  const listenersByQuery = new Map<string, Set<(event: MediaQueryListEvent) => void>>();

  const matchesQuery = (query: string): boolean => {
    const maxWidth = /\(max-width:\s*(\d+)px\)/.exec(query);
    return maxWidth !== null && viewportWidth <= Number(maxWidth[1]);
  };

  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches(): boolean {
      return matchesQuery(query);
    },
    media: query,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void): void => {
      const listeners = listenersByQuery.get(query) ?? new Set();
      listeners.add(listener);
      listenersByQuery.set(query, listeners);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void): void => {
      listenersByQuery.get(query)?.delete(listener);
    }
  }));

  return {
    resizeTo: (nextWidth: number): void => {
      const before = new Map(
        Array.from(listenersByQuery.keys()).map((query) => [query, matchesQuery(query)])
      );
      viewportWidth = nextWidth;
      listenersByQuery.forEach((listeners, query) => {
        const matches = matchesQuery(query);
        if (matches !== before.get(query)) {
          listeners.forEach((listener) =>
            listener({ matches, media: query } as MediaQueryListEvent)
          );
        }
      });
    },
    listenerCount: (): number =>
      Array.from(listenersByQuery.values()).reduce((total, set) => total + set.size, 0)
  };
};

const openPanel = async (props: Record<string, unknown>) => {
  const view = render(DateRangePicker, { testId: 'drp', ...props });
  await fireEvent.click(view.getByRole('button', { name: 'Open date picker' }));
  const panel = await waitFor(() => getPanel(view.container));
  return { ...view, panel };
};

const calendarCount = (panel: HTMLElement): number =>
  panel.querySelectorAll('.drp-calendar-embedded').length;

// The focus restore after a flip runs in a tick that follows the DOM update, so an
// assertion that focus was left alone has to wait past it or it passes without looking.
const settleAfterFlip = async (): Promise<void> => {
  await tick();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await tick();
};

const visibleMonthLabel = (panel: HTMLElement): string | null =>
  panel.querySelector('.drp-calendar-embedded .header-label')?.textContent ?? null;

describe('DateRangePicker presetsPosition', () => {
  it("puts the presets on top only when presetsPosition is 'top'", async () => {
    const top = await openPanel({ presets: makePresets(), presetsPosition: 'top' });
    expect(top.panel.classList.contains('drp-panel-presets-top')).toBe(true);
    top.unmount();

    const side = await openPanel({ presets: makePresets(), presetsPosition: 'side' });
    expect(side.panel.classList.contains('drp-panel-presets-top')).toBe(false);
    side.unmount();

    const byDefault = await openPanel({ presets: makePresets() });
    expect(byDefault.panel.classList.contains('drp-panel-presets-top')).toBe(false);
  });
});

describe('DateRangePicker responsiveLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('turns the panel into a one-month sheet at the narrow breakpoint', async () => {
    installViewport(500);
    const { panel } = await openPanel({ presets: makePresets(), responsiveLayout: true });

    await waitFor(() => {
      expect(panel.classList.contains('drp-panel-sheet')).toBe(true);
    });
    expect(panel.classList.contains('drp-panel-narrow')).toBe(true);
    expect(panel.classList.contains('drp-panel-presets-top')).toBe(true);
    expect(calendarCount(panel)).toBe(1);
  });

  it('leaves the same viewport alone when responsiveLayout is not set', async () => {
    installViewport(500);
    const { panel } = await openPanel({ presets: makePresets() });

    expect(panel.classList.contains('drp-panel-sheet')).toBe(false);
    expect(panel.classList.contains('drp-panel-narrow')).toBe(false);
    expect(panel.classList.contains('drp-panel-presets-top')).toBe(false);
    expect(calendarCount(panel)).toBe(2);
  });

  it('keeps two months in a sheet between the two breakpoints', async () => {
    installViewport(900);
    const { panel } = await openPanel({ presets: makePresets(), responsiveLayout: true });

    await waitFor(() => {
      expect(panel.classList.contains('drp-panel-sheet')).toBe(true);
    });
    expect(panel.classList.contains('drp-panel-presets-top')).toBe(true);
    expect(panel.classList.contains('drp-panel-narrow')).toBe(false);
    expect(calendarCount(panel)).toBe(2);
  });

  it('needs the narrow breakpoint, not the wide one, to make a single-date picker a sheet', async () => {
    installViewport(900);
    const wide = await openPanel({ mode: 'single', responsiveLayout: true });
    expect(wide.panel.classList.contains('drp-panel-sheet')).toBe(false);
    expect(wide.panel.classList.contains('drp-panel-narrow')).toBe(false);
    wide.unmount();

    installViewport(500);
    const narrow = await openPanel({ mode: 'single', responsiveLayout: true });
    await waitFor(() => {
      expect(narrow.panel.classList.contains('drp-panel-sheet')).toBe(true);
    });
    expect(narrow.panel.classList.contains('drp-panel-narrow')).toBe(true);
  });

  it('flips the layout while the panel is open without losing the draft', async () => {
    const viewport = installViewport(1280);
    const onapply = vi.fn();
    const { panel, getByRole } = await openPanel({
      presets: makePresets(),
      responsiveLayout: true,
      onapply
    });

    expect(panel.classList.contains('drp-panel-sheet')).toBe(false);
    expect(calendarCount(panel)).toBe(2);

    await fireEvent.click(getByRole('option', { name: 'Today' }));

    viewport.resizeTo(500);
    await waitFor(() => {
      expect(panel.classList.contains('drp-panel-sheet')).toBe(true);
    });
    expect(panel.classList.contains('drp-panel-narrow')).toBe(true);
    expect(calendarCount(panel)).toBe(1);

    viewport.resizeTo(1280);
    await waitFor(() => {
      expect(panel.classList.contains('drp-panel-sheet')).toBe(false);
    });
    expect(calendarCount(panel)).toBe(2);

    viewport.resizeTo(500);
    await waitFor(() => {
      expect(panel.classList.contains('drp-panel-narrow')).toBe(true);
    });
    await fireEvent.click(getByRole('button', { name: 'Apply date selection' }));

    expect(onapply).toHaveBeenCalledTimes(1);
    expect(onapply).toHaveBeenCalledWith(
      expect.objectContaining({ rangeStart: TODAY, rangeEnd: TODAY, presetLabel: 'Today' })
    );
  });

  it('does not throw and renders the unconfined layout when matchMedia does not exist', async () => {
    expect(typeof window.matchMedia).not.toBe('function');

    const { panel } = await openPanel({ presets: makePresets(), responsiveLayout: true });

    expect(panel.classList.contains('drp-panel-sheet')).toBe(false);
    expect(panel.classList.contains('drp-panel-narrow')).toBe(false);
    expect(calendarCount(panel)).toBe(2);
  });

  it('stops listening for viewport changes once it is destroyed', () => {
    const viewport = installViewport(1280);
    const { unmount } = render(DateRangePicker, { responsiveLayout: true });

    expect(viewport.listenerCount()).toBe(2);
    unmount();
    expect(viewport.listenerCount()).toBe(0);
  });

  it('listens only while responsiveLayout is on, following the prop both ways', async () => {
    const viewport = installViewport(500);
    const view = await openPanel({ presets: makePresets() });
    expect(viewport.listenerCount()).toBe(0);
    expect(view.panel.classList.contains('drp-panel-sheet')).toBe(false);

    await view.rerender({ responsiveLayout: true });
    expect(viewport.listenerCount()).toBe(2);
    await waitFor(() => {
      expect(view.panel.classList.contains('drp-panel-sheet')).toBe(true);
    });

    await view.rerender({ responsiveLayout: false });
    expect(viewport.listenerCount()).toBe(0);
    await waitFor(() => {
      expect(view.panel.classList.contains('drp-panel-sheet')).toBe(false);
    });
    expect(calendarCount(view.panel)).toBe(2);
  });

  it('types a date in the following month and the one-month calendar follows it', async () => {
    installViewport(500);
    const { panel, getByLabelText } = await openPanel({
      responsiveLayout: true,
      showDateInputs: true,
      locale: 'en-US',
      rangeStart: new Date(2019, 2, 15),
      rangeEnd: new Date(2019, 2, 20)
    });
    await waitFor(() => {
      expect(calendarCount(panel)).toBe(1);
    });
    expect(visibleMonthLabel(panel)).toBe('March 2019');

    // With two months showing, April would already be on screen; in the collapsed layout
    // it is not, so the picker has to navigate the single calendar to it.
    const endDateInput = getByLabelText('End date');
    await fireEvent.input(endDateInput, { target: { value: 'Apr 5, 2019' } });
    await fireEvent.keyDown(endDateInput, { key: 'Enter' });

    await waitFor(() => {
      expect(visibleMonthLabel(panel)).toBe('April 2019');
    });
  });

  it('puts focus back inside the panel when a flip destroys the focused day', async () => {
    const viewport = installViewport(1280);
    const { panel } = await openPanel({
      responsiveLayout: true,
      locale: 'en-US',
      rangeStart: new Date(2019, 2, 15),
      rangeEnd: new Date(2019, 2, 20)
    });
    expect(calendarCount(panel)).toBe(2);

    const rightCalendar = panel.querySelectorAll<HTMLElement>('.drp-calendar-embedded')[1];
    const focusedDay = rightCalendar.querySelector<HTMLElement>('button.cell:not(:disabled)');
    if (focusedDay === null) {
      throw new Error('no focusable day in the second calendar');
    }
    focusedDay.focus();
    expect(document.activeElement).toBe(focusedDay);

    viewport.resizeTo(500);
    await waitFor(() => {
      expect(calendarCount(panel)).toBe(1);
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0]
      );
    });
  });

  it('leaves focus on the trigger when a flip happens with the panel open', async () => {
    const viewport = installViewport(1280);
    const { panel, getByRole } = await openPanel({
      responsiveLayout: true,
      locale: 'en-US',
      rangeStart: new Date(2019, 2, 15),
      rangeEnd: new Date(2019, 2, 20)
    });
    const trigger = getByRole('button', { name: 'Close date picker' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    viewport.resizeTo(500);
    await waitFor(() => {
      expect(calendarCount(panel)).toBe(1);
    });
    await settleAfterFlip();

    expect(document.activeElement).toBe(trigger);
  });

  it('leaves focus on a control that survives the flip', async () => {
    const viewport = installViewport(1280);
    const { panel, getByLabelText } = await openPanel({
      responsiveLayout: true,
      showDateInputs: true,
      locale: 'en-US',
      rangeStart: new Date(2019, 2, 15),
      rangeEnd: new Date(2019, 2, 20)
    });
    const endDateInput = getByLabelText('End date');
    endDateInput.focus();
    expect(document.activeElement).toBe(endDateInput);

    viewport.resizeTo(500);
    await waitFor(() => {
      expect(calendarCount(panel)).toBe(1);
    });
    await settleAfterFlip();

    expect(document.activeElement).toBe(endDateInput);
  });
});

describe('DateRangePicker without responsiveLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never asks the window for a media query', async () => {
    const matchMediaSpy = vi.fn((query: string): MediaQueryList => {
      throw new Error(`unexpected matchMedia(${query})`);
    });
    vi.stubGlobal('matchMedia', matchMediaSpy);

    const { panel } = await openPanel({ presets: makePresets() });

    expect(matchMediaSpy).not.toHaveBeenCalled();
    expect(panel.classList.contains('drp-panel-sheet')).toBe(false);
    expect(calendarCount(panel)).toBe(2);
  });

  it('still mounts when matchMedia is only a partial stand-in', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addListener: vi.fn() }));
    const partial = await openPanel({ presets: makePresets() });
    expect(partial.panel.classList.contains('drp-panel-sheet')).toBe(false);
    partial.unmount();

    vi.stubGlobal('matchMedia', vi.fn());
    const bare = await openPanel({ presets: makePresets() });
    expect(bare.panel.classList.contains('drp-panel-sheet')).toBe(false);
  });
});

describe('DateRangePicker responsiveLayout with an unusable matchMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when the stand-in cannot subscribe or answers nothing', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addListener: vi.fn() }));
    const partial = await openPanel({ presets: makePresets(), responsiveLayout: true });
    expect(partial.panel.classList.contains('drp-panel-sheet')).toBe(false);
    partial.unmount();

    vi.stubGlobal('matchMedia', vi.fn());
    const bare = await openPanel({ presets: makePresets(), responsiveLayout: true });
    expect(bare.panel.classList.contains('drp-panel-sheet')).toBe(false);
    expect(calendarCount(bare.panel)).toBe(2);
  });
});

describe('DateRangePicker single-month calendar', () => {
  const MARCH_2019_START = new Date(2019, 2, 15);
  const MARCH_2019_END = new Date(2019, 2, 20);
  const FIXED_PRESETS: DateRangePreset[] = [
    {
      label: 'February 2020',
      getValue: () => ({ start: new Date(2020, 1, 1), end: new Date(2020, 1, 29) })
    }
  ];

  const openSingleMonthPanel = (props: Record<string, unknown> = {}) =>
    openPanel({
      dualMonth: false,
      locale: 'en-US',
      rangeStart: MARCH_2019_START,
      rangeEnd: MARCH_2019_END,
      ...props
    });

  it('opens on the month of the committed range, not the current month', async () => {
    const { panel } = await openSingleMonthPanel();

    expect(visibleMonthLabel(panel)).toBe('March 2019');
  });

  it('moves to the preset month when a preset is picked', async () => {
    const { panel, getByRole } = await openSingleMonthPanel({ presets: FIXED_PRESETS });
    expect(visibleMonthLabel(panel)).toBe('March 2019');

    await fireEvent.click(getByRole('option', { name: 'February 2020' }));

    await waitFor(() => {
      expect(visibleMonthLabel(panel)).toBe('February 2020');
    });
  });

  it('moves to the month of a committed typed date', async () => {
    const { panel, getByLabelText } = await openSingleMonthPanel({ showDateInputs: true });

    const startDateInput = getByLabelText('Start date');
    await fireEvent.input(startDateInput, { target: { value: 'Jan 5, 2018' } });
    await fireEvent.keyDown(startDateInput, { key: 'Enter' });

    await waitFor(() => {
      expect(visibleMonthLabel(panel)).toBe('January 2018');
    });
  });

  it('returns to a typed date in the month the calendar was paged away from', async () => {
    const { panel, getByLabelText } = await openSingleMonthPanel({ showDateInputs: true });

    await fireEvent.click(getByLabelText('Next month'));
    expect(visibleMonthLabel(panel)).toBe('April 2019');

    // March is no longer the visible month, which the picker only knows if paging with
    // the calendar's own header was mirrored back into it. Otherwise it still believes
    // March is on screen and leaves the calendar on April.
    const startDateInput = getByLabelText('Start date');
    await fireEvent.input(startDateInput, { target: { value: 'Mar 12, 2019' } });
    await fireEvent.keyDown(startDateInput, { key: 'Enter' });

    await waitFor(() => {
      expect(visibleMonthLabel(panel)).toBe('March 2019');
    });
  });

  it('disables days beyond maxRangeDays once a start date is picked', async () => {
    const { panel } = await openSingleMonthPanel({ maxRangeDays: 3 });

    const dayButton = (day: number): HTMLButtonElement => {
      const button = panel.querySelector<HTMLButtonElement>(`.cell[data-day="${day}"]`);
      if (button === null) {
        throw new Error(`day ${day} not found`);
      }
      return button;
    };

    expect(dayButton(20).disabled).toBe(false);
    await fireEvent.click(dayButton(10));

    expect(dayButton(12).disabled).toBe(false);
    expect(dayButton(13).disabled).toBe(true);
    expect(dayButton(20).disabled).toBe(true);
  });

  it('opens a single-date picker on the month of its committed value', async () => {
    const { panel } = await openPanel({
      mode: 'single',
      locale: 'en-US',
      value: MARCH_2019_START
    });

    expect(visibleMonthLabel(panel)).toBe('March 2019');
  });
});
