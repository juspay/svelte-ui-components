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

// jsdom has no accessibility engine, so these assert the ARIA contract on the rendered
// markup (the hierarchy and the attributes a browser maps into its accessibility tree).
// tests/a11y-calendar.spec.ts proves the same contract through real browsers' trees.
describe('Calendar renders a valid ARIA grid > row > gridcell hierarchy', () => {
  function childrenOf(el: Element): Element[] {
    return Array.from(el.children);
  }

  function weekRows(container: HTMLElement): Element[] {
    return childrenOf(grid(container)).slice(1);
  }

  function cellOf(container: HTMLElement, day: number): HTMLElement {
    const el = dayButton(container, day).closest('[role="gridcell"]');
    if (!(el instanceof HTMLElement)) {
      throw new Error(`day ${day} is not inside a gridcell`);
    }
    return el;
  }

  it('owns only rows: one header row of seven columnheaders, then the week rows', () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1), locale: 'en-US' });

    const rows = childrenOf(grid(container));
    expect(rows.length).toBe(7); // 1 header row + 6 weeks
    expect(rows.every((row) => row.getAttribute('role') === 'row')).toBe(true);

    const headers = childrenOf(rows[0]);
    expect(headers.map((h) => h.getAttribute('role'))).toEqual(Array(7).fill('columnheader'));
    expect(headers.map((h) => h.textContent?.trim())).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat'
    ]);
    expect(headers.map((h) => h.getAttribute('aria-label'))).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ]);
  });

  it('puts exactly seven gridcells in every week row and no button outside a gridcell', () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1) });

    for (const row of weekRows(container)) {
      const cells = childrenOf(row);
      expect(cells.length).toBe(7);
      expect(cells.every((c) => c.getAttribute('role') === 'gridcell')).toBe(true);
    }

    expect(container.querySelectorAll('[role="grid"] > button').length).toBe(0);
    for (const button of container.querySelectorAll('[data-day]')) {
      expect(button.parentElement?.getAttribute('role')).toBe('gridcell');
      expect(button.parentElement?.parentElement?.getAttribute('role')).toBe('row');
      expect(button.parentElement?.parentElement?.parentElement).toBe(grid(container));
    }
    // 30 enabled-or-not June days are real date controls; the 12 filler days are not.
    expect(container.querySelectorAll('[data-day]').length).toBe(30);
  });

  it('sizes the week rows to the month: five rows when the month fits, six when it spills', () => {
    const five = render(Calendar, { initialMonth: new Date(2024, 1, 1) }); // Feb 2024 Thu-start, 29d
    expect(weekRows(five.container).length).toBe(5);
    const six = render(Calendar, { initialMonth: new Date(2024, 5, 1) }); // Jun 2024 Sat-start, 30d
    expect(weekRows(six.container).length).toBe(6);
  });

  it('names the grid by the visible month heading, which announces month changes', async () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1), locale: 'en-US' });

    const labelledby = grid(container).getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const heading = container.querySelector(`[id="${labelledby}"]`);
    expect(heading?.textContent?.trim()).toBe('June 2024');
    expect(heading?.getAttribute('aria-live')).toBe('polite');

    await fireEvent.click(nextMonthButton(container));
    await settle();
    expect(container.querySelector(`[id="${labelledby}"]`)?.textContent?.trim()).toBe('July 2024');
  });

  it('gives every calendar instance its own heading id, so two grids are never named alike', () => {
    const a = render(Calendar, { initialMonth: new Date(2024, 5, 1) });
    const b = render(Calendar, { initialMonth: new Date(2024, 6, 1) });

    const idA = grid(a.container).getAttribute('aria-labelledby');
    const idB = grid(b.container).getAttribute('aria-labelledby');
    expect(idA).not.toBe(idB);
  });

  it('names each date control with its weekday, month, day and year in the requested locale', () => {
    const en = render(Calendar, { initialMonth: new Date(2024, 5, 1), locale: 'en-US' });
    expect(dayButton(en.container, 15).getAttribute('aria-label')).toBe('Saturday, June 15, 2024');

    const de = render(Calendar, { initialMonth: new Date(2024, 5, 1), locale: 'de-DE' });
    expect(dayButton(de.container, 15).getAttribute('aria-label')).toBe('Samstag, 15. Juni 2024');
    const headers = de.container.querySelectorAll('[role="columnheader"]');
    expect(headers[0].getAttribute('aria-label')).toBe('Sonntag');
  });

  it('keeps the visible day number and class hooks on the date button', () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1) });
    const button = dayButton(container, 7);
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent?.trim()).toBe('7');
    expect(button.classList.contains('cell')).toBe(true);
  });

  it('reflects the selected day as aria-selected on its gridcell, and only that one', async () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1) });

    for (let day = 1; day <= 30; day++) {
      expect(cellOf(container, day).getAttribute('aria-selected')).toBe('false');
    }

    await fireEvent.click(dayButton(container, 12));
    await settle();

    expect(cellOf(container, 12).getAttribute('aria-selected')).toBe('true');
    expect(cellOf(container, 11).getAttribute('aria-selected')).toBe('false');
    expect(container.querySelectorAll('[role="gridcell"][aria-selected="true"]').length).toBe(1);
    expect(grid(container).hasAttribute('aria-multiselectable')).toBe(false);
  });

  it('marks today with aria-current="date" on its date control and nothing else', () => {
    // SvelteDate extends the Date captured when svelte/reactivity loaded, so a fake
    // clock cannot move the component's "today"; bracket the render with real reads so
    // a run that straddles midnight cannot flake.
    const before = new Date();
    const { container } = render(Calendar, { locale: 'en-US' });
    const after = new Date();

    const current = container.querySelectorAll('[aria-current]');
    expect(current.length).toBe(1);
    expect(current[0].getAttribute('aria-current')).toBe('date');
    expect(current[0].tagName).toBe('BUTTON');
    expect([String(before.getDate()), String(after.getDate())]).toContain(
      current[0].getAttribute('data-day')
    );
  });

  it('exposes disabled days on both the gridcell and the native button', () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1),
      disabledDates: [new Date(2024, 5, 12)],
      minDate: new Date(2024, 5, 3)
    });

    for (const day of [1, 2, 12]) {
      expect(cellOf(container, day).getAttribute('aria-disabled')).toBe('true');
      expect((dayButton(container, day) as HTMLButtonElement).disabled).toBe(true);
    }
    expect(cellOf(container, 13).hasAttribute('aria-disabled')).toBe(false);
    expect((dayButton(container, 13) as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders the other-month filler days as disabled, dated gridcells that complete each row', () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1), locale: 'en-US' });

    // June 2024 starts on Saturday: Sun 26 May .. Fri 31 May fill the first row.
    const firstWeek = childrenOf(weekRows(container)[0]);
    const filler = firstWeek.slice(0, 6);
    expect(filler.map((c) => c.textContent?.trim())).toEqual(['26', '27', '28', '29', '30', '31']);
    for (const cell of filler) {
      expect(cell.getAttribute('aria-disabled')).toBe('true');
      expect(cell.querySelector('button')).toBeNull();
    }
    expect(filler[0].getAttribute('aria-label')).toBe('Sunday, May 26, 2024');
    expect(filler[5].getAttribute('aria-label')).toBe('Friday, May 31, 2024');
  });

  it('in range mode, marks start, end and the days between as selected on a multiselectable grid', async () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1), mode: 'range' });

    expect(grid(container).getAttribute('aria-multiselectable')).toBe('true');

    await fireEvent.click(dayButton(container, 8));
    await fireEvent.click(dayButton(container, 11));
    await settle();

    const selected = Array.from(
      container.querySelectorAll('[role="gridcell"][aria-selected="true"] [data-day]')
    ).map((el) => el.getAttribute('data-day'));
    expect(selected).toEqual(['8', '9', '10', '11']);
    expect(cellOf(container, 7).getAttribute('aria-selected')).toBe('false');
    expect(cellOf(container, 12).getAttribute('aria-selected')).toBe('false');
  });

  it('orders the columnheaders from weekStartsOn and still fills seven cells per row', () => {
    const { container } = render(Calendar, {
      initialMonth: new Date(2024, 5, 1),
      weekStartsOn: 1,
      locale: 'en-US'
    });

    const headers = container.querySelectorAll('[role="columnheader"]');
    expect(headers[0].getAttribute('aria-label')).toBe('Monday');
    expect(headers[6].getAttribute('aria-label')).toBe('Sunday');
    for (const row of weekRows(container)) {
      expect(childrenOf(row).length).toBe(7);
    }
    // June 1st is a Saturday: with a Monday start it sits in column six of the first row.
    expect(childrenOf(weekRows(container)[0])[5].querySelector('[data-day="1"]')).not.toBeNull();
  });

  it('re-keys the rows across a month change without leaving a stray cell or row', async () => {
    const { container } = render(Calendar, { initialMonth: new Date(2024, 5, 1) });

    await fireEvent.click(nextMonthButton(container)); // July 2024 starts on a Monday: 31 days => 5 rows
    await settle();

    const rows = childrenOf(grid(container));
    expect(rows.every((row) => row.getAttribute('role') === 'row')).toBe(true);
    expect(rows.slice(1).every((row) => childrenOf(row).length === 7)).toBe(true);
    expect(container.querySelectorAll('[data-day]').length).toBe(31);
  });
});
