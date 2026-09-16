import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Calendar from './Calendar.svelte';

// focusDayCell() awaits tick() internally before calling .focus(), decoupled from the
// keydown handler's own return -- a single `await tick()` after firing the event can
// still race it. Settling on tick() + a microtask turn + a second tick() (the same
// pattern Tabs.svelte.test.ts uses for its own roving-tabindex focus moves) reliably
// drains it.
async function settle(): Promise<void> {
  await tick();
  await Promise.resolve();
  await tick();
}

function dayButton(container: HTMLElement, day: number): HTMLElement {
  const el = container.querySelector(`[data-day="${day}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`no day button rendered for day ${day}`);
  }
  return el;
}

function grid(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[role="grid"]');
  if (!(el instanceof HTMLElement)) {
    throw new Error('no grid rendered');
  }
  return el;
}

function prevMonthButton(container: HTMLElement): HTMLButtonElement {
  const el = container.querySelector('.nav-prev button');
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error('no previous-month button rendered');
  }
  return el;
}

function nextMonthButton(container: HTMLElement): HTMLButtonElement {
  const el = container.querySelector('.nav-next button');
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error('no next-month button rendered');
  }
  return el;
}

// The whole calendar -- the grid container plus every day cell -- should carry exactly
// one tabIndex 0 at a time, wherever it lands.
function tabStops(container: HTMLElement): HTMLElement[] {
  const candidates = container.querySelectorAll<HTMLElement>('[role="grid"], [data-day]');
  return Array.from(candidates).filter((el) => el.tabIndex === 0);
}

async function pressKey(target: HTMLElement, key: string): Promise<void> {
  await fireEvent.keyDown(target, { key });
  await settle();
}

describe('Calendar keyboard navigation skips disabled days', () => {
  it('ArrowRight steps over a disabled day to the next enabled one, in both directions', async () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1), // June 2024
      disabledDates: [new Date(2024, 5, 15)]
    });

    await fireEvent.click(dayButton(container, 14));
    await settle();
    await pressKey(grid(container), 'ArrowRight');

    expect(document.activeElement).toBe(dayButton(container, 16));
    expect(dayButton(container, 16).tabIndex).toBe(0);
    expect(dayButton(container, 15).tabIndex).toBe(-1);

    // Walking back the same disabled day should land exactly where it started.
    await pressKey(grid(container), 'ArrowLeft');

    expect(document.activeElement).toBe(dayButton(container, 14));
    expect(dayButton(container, 14).tabIndex).toBe(0);
  });

  it('skips a run of disabled days across a month boundary', async () => {
    const onmonthchange = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1), // January 2024, 31 days
      disabledDates: [new Date(2024, 0, 30), new Date(2024, 0, 31)],
      onmonthchange
    });

    await fireEvent.click(dayButton(container, 29));
    await settle();
    await pressKey(grid(container), 'ArrowRight');

    expect(onmonthchange).toHaveBeenCalledWith({ year: 2024, month: 1 });
    expect(document.activeElement).toBe(dayButton(container, 1));
  });

  it('ArrowDown skips a disabled day directly below, landing a further week down', async () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1),
      disabledDates: [new Date(2024, 5, 22)] // exactly one week below day 15
    });

    await fireEvent.click(dayButton(container, 15));
    await settle();
    await pressKey(grid(container), 'ArrowDown');

    // Vertical movement stays in the same weekday column (steps of 7), so
    // skipping the disabled cell directly below lands a further week down,
    // not one day off to the side.
    expect(document.activeElement).toBe(dayButton(container, 29));
  });
});

describe('Calendar keyboard navigation on a fully disabled month', () => {
  it('does not hang when disabledDates disables every reachable day', async () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1),
      disabledDates: () => true
    });

    // Completing this test at all, inside vitest's own timeout, is the actual
    // regression guard -- the assertions below just confirm the state stayed sane.
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
      await pressKey(grid(container), key);
    }

    expect(tabStops(container)).toEqual([grid(container)]);
  });

  it('does not hang when every day in view is disabled but nothing was ever focused', async () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1),
      // Every June 2024 date, listed explicitly (an array) rather than via a predicate.
      disabledDates: Array.from({ length: 30 }, (_, i) => new Date(2024, 5, i + 1))
    });

    await pressKey(grid(container), 'ArrowRight');

    expect(tabStops(container)).toEqual([grid(container)]);
    expect(grid(container).tabIndex).toBe(0);
  });
});

describe('Calendar has exactly one tab stop that tracks selection', () => {
  it('defaults to the first enabled day, then moves to a clicked day', async () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1)
    });

    expect(tabStops(container)).toEqual([dayButton(container, 1)]);

    await fireEvent.click(dayButton(container, 10));
    await settle();

    expect(tabStops(container)).toEqual([dayButton(container, 10)]);
  });

  it('prefers an externally supplied selected value over the first enabled day', () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1),
      value: new Date(2024, 5, 12)
    });

    expect(tabStops(container)).toEqual([dayButton(container, 12)]);
  });
});

describe('Calendar arrow/Enter navigation on an all-enabled month is unchanged', () => {
  it('ArrowRight moves to the next day within the month', async () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1) // January 2024, 31 days
    });

    await pressKey(grid(container), 'ArrowRight');

    expect(document.activeElement).toBe(dayButton(container, 2));
    expect(grid(container).tabIndex).toBe(-1);
  });

  it('ArrowRight from the last day of the month rolls into next month day 1', async () => {
    const onmonthchange = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1),
      onmonthchange
    });

    await fireEvent.click(dayButton(container, 31));
    await settle();
    await pressKey(grid(container), 'ArrowRight');

    expect(onmonthchange).toHaveBeenCalledWith({ year: 2024, month: 1 });
    expect(document.activeElement).toBe(dayButton(container, 1));
  });

  it('ArrowLeft from day 1 rolls into the previous month, on its last day', async () => {
    const onmonthchange = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1),
      onmonthchange
    });

    await pressKey(grid(container), 'ArrowLeft');

    expect(onmonthchange).toHaveBeenCalledWith({ year: 2023, month: 11 });
    expect(document.activeElement).toBe(dayButton(container, 31));
  });

  it('ArrowDown wraps into next month preserving the weekday column', async () => {
    const onmonthchange = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1),
      onmonthchange
    });

    await fireEvent.click(dayButton(container, 27));
    await settle();
    await pressKey(grid(container), 'ArrowDown');

    expect(onmonthchange).toHaveBeenCalledWith({ year: 2024, month: 1 });
    expect(document.activeElement).toBe(dayButton(container, 3));
  });

  it('ArrowUp wraps into the previous month preserving the weekday column', async () => {
    const onmonthchange = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1),
      onmonthchange
    });

    await fireEvent.click(dayButton(container, 5));
    await settle();
    await pressKey(grid(container), 'ArrowUp');

    expect(onmonthchange).toHaveBeenCalledWith({ year: 2023, month: 11 });
    expect(document.activeElement).toBe(dayButton(container, 29));
  });

  it('Enter selects the focused day and fires onselect', async () => {
    const onselect = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 0, 1),
      onselect
    });

    await pressKey(grid(container), 'ArrowRight');
    await pressKey(grid(container), 'Enter');

    expect(onselect).toHaveBeenCalledTimes(1);
    const call = onselect.mock.calls.at(0);
    if (!call) {
      throw new Error('onselect was not called');
    }
    expect(call[0].date.getFullYear()).toBe(2024);
    expect(call[0].date.getMonth()).toBe(0);
    expect(call[0].date.getDate()).toBe(2);
    expect(dayButton(container, 2).classList.contains('selected')).toBe(true);
  });
});

describe('Calendar month navigation is bounded by minDate/maxDate', () => {
  it('disables the previous-month control when the whole previous month is before minDate', async () => {
    const onmonthchange = vi.fn();
    // minDate lands inside February 2024, so all of January 2024 -- the
    // previous month -- has no selectable day.
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 1, 1), // February 2024
      minDate: new Date(2024, 1, 10),
      onmonthchange
    });

    const prevButton = prevMonthButton(container);
    // Native `disabled` only, deliberately. These controls are real <button>
    // elements, so `disabled` already conveys the state to assistive tech;
    // adding `aria-disabled` on top would be redundant ARIA, which the first
    // rule of ARIA warns against. Asserting the native property is asserting
    // what the component actually does.
    expect(prevButton.disabled).toBe(true);

    await fireEvent.click(prevButton);
    await settle();

    expect(onmonthchange).not.toHaveBeenCalled();
    expect(container.querySelector('.header-label')?.textContent).toContain('2024');
    // Still on February: day 10 (in bounds) is rendered as a current-month cell.
    expect(dayButton(container, 10).classList.contains('disabled')).toBe(false);
  });

  it('disables the next-month control when the whole next month is after maxDate', async () => {
    const onmonthchange = vi.fn();
    // maxDate lands inside February 2024, so all of March 2024 -- the next
    // month -- has no selectable day.
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 1, 1), // February 2024
      maxDate: new Date(2024, 1, 20),
      onmonthchange
    });

    const nextButton = nextMonthButton(container);
    expect(nextButton.disabled).toBe(true);

    await fireEvent.click(nextButton);
    await settle();

    expect(onmonthchange).not.toHaveBeenCalled();
    expect(dayButton(container, 20).classList.contains('disabled')).toBe(false);
  });

  it('leaves both controls enabled when minDate/maxDate are null (unbounded)', async () => {
    const onmonthchange = vi.fn();
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 1, 1) // February 2024
      // minDate/maxDate default to null.
    });

    const prevButton = prevMonthButton(container);
    const nextButton = nextMonthButton(container);

    expect(prevButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(false);

    const { container: c2 } = render(Calendar, {
      initialMonth: new Date(2024, 1, 1),
      onmonthchange
    });
    await fireEvent.click(prevMonthButton(c2));
    await settle();
    expect(onmonthchange).toHaveBeenCalledWith({ year: 2024, month: 0 });

    await fireEvent.click(nextMonthButton(c2));
    await settle();
    expect(onmonthchange).toHaveBeenCalledWith({ year: 2024, month: 1 });
  });

  it('keeps the previous-month control enabled when minDate only trims part of the previous month', async () => {
    // minDate is the LAST day of January 2024 -- January still has one
    // selectable day, so paging back to it must stay allowed.
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 1, 1), // February 2024
      minDate: new Date(2024, 0, 31)
    });

    expect(prevMonthButton(container).disabled).toBe(false);
  });

  it('keeps the next-month control enabled when maxDate only trims part of the next month', async () => {
    // maxDate is the FIRST day of March 2024 -- March still has one
    // selectable day, so paging forward to it must stay allowed.
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 1, 1), // February 2024
      maxDate: new Date(2024, 2, 1)
    });

    expect(nextMonthButton(container).disabled).toBe(false);
  });
});
