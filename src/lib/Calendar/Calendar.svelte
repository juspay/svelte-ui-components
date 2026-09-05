<script lang="ts">
  import type { CalendarProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import { SvelteDate } from 'svelte/reactivity';
  import { tick, untrack } from 'svelte';
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import Button from '../Button/Button.svelte';

  let {
    value = $bindable(null),
    rangeStart = $bindable(null),
    rangeEnd = $bindable(null),
    mode = 'single',
    minDate = null,
    maxDate = null,
    disabledDates = [],
    weekStartsOn = 0,
    locale,
    testId,
    previousMonthIcon,
    nextMonthIcon,
    onselect: onselectProp,
    onSelect,
    onrangeselect: onrangeselectProp,
    onRangeSelect,
    onmonthchange: onmonthchangeProp,
    onMonthChange,
    classes,
    initialMonth = null
  }: CalendarProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onmonthchange = $derived(
    resolveDeprecatedProp(
      'Calendar',
      'onMonthChange',
      'onmonthchange',
      onMonthChange,
      onmonthchangeProp
    )
  );
  const onrangeselect = $derived(
    resolveDeprecatedProp(
      'Calendar',
      'onRangeSelect',
      'onrangeselect',
      onRangeSelect,
      onrangeselectProp
    )
  );
  const onselect = $derived(
    resolveDeprecatedProp('Calendar', 'onSelect', 'onselect', onSelect, onselectProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onmonthchange, onrangeselect, onselect);
  });

  const now = new SvelteDate();
  // Intentionally read initialMonth once (untracked) — it seeds the display month at mount
  // and subsequent prop changes should not navigate the calendar (user navigates via the buttons).
  let displayDate = untrack(() => {
    const seed = initialMonth !== null ? initialMonth : now;
    return new SvelteDate(seed.getFullYear(), seed.getMonth(), 1);
  });
  let focusedDay: number | null = $state(null);

  let gridRef: HTMLElement | null = $state(null);

  async function focusDayCell(): Promise<void> {
    await tick();
    if (focusedDay !== null && gridRef !== null) {
      const btn = gridRef.querySelector(`[data-day="${focusedDay}"]`);
      if (btn instanceof HTMLElement) {
        btn.focus();
      }
    }
  }

  const dayNameFormatter = $derived(new Intl.DateTimeFormat(locale, { weekday: 'short' }));

  const monthYearFormatter = $derived(
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  );

  let dayNames: string[] = $derived(
    Array.from({ length: 7 }, (_, i) => {
      const d = new SvelteDate(2024, 0, 7 + weekStartsOn + i);
      return dayNameFormatter.format(d);
    })
  );

  let headerLabel: string = $derived(monthYearFormatter.format(displayDate));

  let calendarDays = $derived.by(() => {
    const displayYear = displayDate.getFullYear();
    const displayMonth = displayDate.getMonth();
    const firstOfMonth = new SvelteDate(displayYear, displayMonth, 1);
    const lastOfMonth = new SvelteDate(displayYear, displayMonth + 1, 0);

    let startDayOfWeek = firstOfMonth.getDay() - weekStartsOn;
    if (startDayOfWeek < 0) {
      startDayOfWeek += 7;
    }

    const totalDaysInMonth = lastOfMonth.getDate();
    const today = new SvelteDate();
    today.setHours(0, 0, 0, 0);

    const normStart = rangeStart !== null ? normalizeDate(rangeStart) : null;
    const normEnd = rangeEnd !== null ? normalizeDate(rangeEnd) : null;

    type DayInfo = {
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isRangeStart: boolean;
      isRangeEnd: boolean;
      isInRange: boolean;
    };

    function fillerDay(year: number, month: number, day: number): DayInfo {
      const date = new SvelteDate(year, month, day);
      date.setHours(0, 0, 0, 0);
      return {
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isDisabled: true,
        isSelected: false,
        isRangeStart: false,
        isRangeEnd: false,
        isInRange: false
      };
    }

    const days: DayInfo[] = [];

    const prevMonthDays = new SvelteDate(displayYear, displayMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(fillerDay(displayYear, displayMonth - 1, prevMonthDays - i));
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new SvelteDate(displayYear, displayMonth, day);
      date.setHours(0, 0, 0, 0);
      const time = date.getTime();

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: time === today.getTime(),
        isDisabled: isDateDisabled(date),
        isSelected: mode === 'single' && value !== null && isSameDay(date, value),
        isRangeStart: mode === 'range' && normStart !== null && isSameDay(date, normStart),
        isRangeEnd: mode === 'range' && normEnd !== null && isSameDay(date, normEnd),
        isInRange:
          mode === 'range' &&
          normStart !== null &&
          normEnd !== null &&
          time > normStart.getTime() &&
          time < normEnd.getTime()
      });
    }

    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        days.push(fillerDay(displayYear, displayMonth + 1, i));
      }
    }

    return days;
  });

  function normalizeDate(d: Date): Date {
    const n = new SvelteDate(d);
    n.setHours(0, 0, 0, 0);
    return n;
  }

  function endOfDay(d: Date): Date {
    const newDate = new SvelteDate(d);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function isDateDisabled(date: Date): boolean {
    const time = date.getTime();

    if (minDate !== null && time < normalizeDate(minDate).getTime()) {
      return true;
    }
    if (maxDate !== null && time > normalizeDate(maxDate).getTime()) {
      return true;
    }
    if (typeof disabledDates === 'function') {
      return disabledDates(date);
    }
    if (Array.isArray(disabledDates)) {
      return disabledDates.some((d) => isSameDay(d, date));
    }

    return false;
  }

  function navigateMonth(delta: number): void {
    displayDate.setMonth(displayDate.getMonth() + delta);
    focusedDay = null;
    onmonthchange?.({ year: displayDate.getFullYear(), month: displayDate.getMonth() });
  }

  function selectDate(date: Date): void {
    if (isDateDisabled(date)) {
      return;
    }

    focusedDay = date.getDate();

    if (mode === 'single') {
      value = date;
      onselect?.({ date });
    } else {
      if (rangeStart === null || rangeEnd !== null) {
        rangeStart = date;
        rangeEnd = null;
      } else {
        const start = rangeStart;
        if (date.getTime() < normalizeDate(start).getTime()) {
          rangeEnd = start;
          rangeStart = date;
        } else if (isSameDay(date, start)) {
          rangeEnd = endOfDay(date);
        } else {
          rangeEnd = date;
        }
        onrangeselect?.({ rangeStart, rangeEnd });
      }
    }
  }

  function daysInMonth(year: number, month: number): number {
    return new SvelteDate(year, month + 1, 0).getDate();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const totalDays = daysInMonth(year, month);

    if (focusedDay === null) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        focusedDay = 1;
        focusDayCell();
        return;
      }
    }

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        if (focusedDay !== null && focusedDay < totalDays) {
          focusedDay++;
        } else if (focusedDay === totalDays) {
          navigateMonth(1);
          focusedDay = 1;
        }
        focusDayCell();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (focusedDay !== null && focusedDay > 1) {
          focusedDay--;
        } else if (focusedDay === 1) {
          navigateMonth(-1);
          focusedDay = daysInMonth(displayDate.getFullYear(), displayDate.getMonth());
        }
        focusDayCell();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (focusedDay !== null) {
          if (focusedDay + 7 <= totalDays) {
            focusedDay += 7;
          } else {
            const overflow = focusedDay + 7 - totalDays;
            navigateMonth(1);
            focusedDay = overflow;
          }
        }
        focusDayCell();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (focusedDay !== null) {
          if (focusedDay - 7 >= 1) {
            focusedDay -= 7;
          } else {
            const currentDay = focusedDay;
            const prevTotal = daysInMonth(year, month - 1);
            navigateMonth(-1);
            focusedDay = prevTotal + (currentDay - 7);
          }
        }
        focusDayCell();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedDay !== null) {
          const date = new SvelteDate(year, month, focusedDay);
          date.setHours(0, 0, 0, 0);
          selectDate(date);
        }
        break;
    }
  }
</script>

<div
  class="calendar {classes ?? ''}"
  data-pw={testId}
  testID={testId}
  role="application"
  aria-label="Calendar"
>
  <div class="header">
    <div class="nav-button nav-prev">
      <Button onclick={() => navigateMonth(-1)} ariaLabel="Previous month">
        {#if typeof previousMonthIcon === 'function'}
          {@render previousMonthIcon()}
        {:else}
          <!-- eslint-disable svelte/no-at-html-tags -->
          {@html chevronLeftSvg}
        {/if}
      </Button>
    </div>
    <span class="header-label">{headerLabel}</span>
    <div class="nav-button nav-next">
      <Button onclick={() => navigateMonth(1)} ariaLabel="Next month">
        {#if typeof nextMonthIcon === 'function'}
          {@render nextMonthIcon()}
        {:else}
          <!-- eslint-disable svelte/no-at-html-tags -->
          {@html chevronRightSvg}
        {/if}
      </Button>
    </div>
  </div>

  <div class="day-names">
    {#each dayNames as name (name)}
      <div class="day-name">{name}</div>
    {/each}
  </div>

  <div class="grid" bind:this={gridRef} tabindex="0" role="grid" onkeydown={handleKeyDown}>
    {#each calendarDays as dayInfo (dayInfo.date.getTime())}
      {#if dayInfo.isCurrentMonth}
        <button
          type="button"
          class="cell"
          class:today={dayInfo.isToday}
          class:selected={dayInfo.isSelected}
          class:range-start={dayInfo.isRangeStart}
          class:range-end={dayInfo.isRangeEnd}
          class:in-range={dayInfo.isInRange}
          class:disabled={dayInfo.isDisabled}
          data-day={dayInfo.day}
          disabled={dayInfo.isDisabled}
          tabindex={focusedDay === dayInfo.day ? 0 : -1}
          aria-label={dayInfo.date.toLocaleDateString(locale)}
          onclick={() => selectDate(dayInfo.date)}
        >
          {dayInfo.day}
        </button>
      {:else}
        <span class="cell outside-month">{dayInfo.day}</span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .calendar {
    font-family: var(--calendar-font-family, inherit);
    width: var(--calendar-width, 280px);
    padding: var(--calendar-padding, 16px);
    background-color: var(--calendar-background, #ffffff);
    border: var(--calendar-border, 1px solid #e0e0e0);
    border-radius: var(--calendar-border-radius, var(--radius, 4px));
    box-shadow: var(--calendar-box-shadow, none);
    box-sizing: border-box;
    user-select: none;
  }

  .header {
    display: var(--calendar-header-display, flex);
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--calendar-header-margin-bottom, 12px);
  }

  .header-label {
    font-size: var(--calendar-header-font-size, 16px);
    font-weight: var(--calendar-header-font-weight, 600);
    color: var(--calendar-header-color, #000000);
    text-transform: capitalize;
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;

    --button-width: var(--calendar-nav-button-size, 32px);
    --button-height: var(--calendar-nav-button-size, 32px);
    --button-border: none;
    --button-color: transparent;
    --button-border-radius: var(--calendar-nav-button-border-radius, var(--radius, 4px));
    --button-text-color: var(--calendar-nav-button-color, #666666);
    --button-padding: 0;
    --button-hover-color: var(--calendar-nav-button-hover-background, #f0f0f0);
  }

  /* Size the columns to the cell, not 1fr, and centre the whole grid. With 1fr
     columns the fixed-width cells sat centred inside wider tracks, leaving
     horizontal gaps between days — which broke the range highlight into
     disconnected boxes instead of one continuous pill. The day-name header must
     use the same track sizing so it stays aligned with the day grid below. */
  .day-names {
    display: grid;
    grid-template-columns: repeat(7, var(--calendar-cell-size, 36px));
    justify-content: center;
    text-align: center;
  }

  .day-name {
    font-size: var(--calendar-day-name-font-size, 12px);
    font-weight: var(--calendar-day-name-font-weight, 600);
    color: var(--calendar-day-name-color, #999999);
    padding: var(--calendar-day-name-padding, 4px 0);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, var(--calendar-cell-size, 36px));
    justify-content: center;
    row-gap: 2px;
  }

  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--calendar-cell-size, 36px);
    height: var(--calendar-cell-size, 36px);
    font-family: inherit;
    font-size: var(--calendar-cell-font-size, 14px);
    border-radius: var(--calendar-cell-border-radius, 50%);
    color: var(--calendar-cell-color, #000000);
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    outline: none;
  }

  .cell:hover:not(.disabled, .outside-month, .selected, .range-start, .range-end) {
    background-color: var(--calendar-cell-hover-background, #f0f0f0);
  }

  .cell:focus-visible {
    outline: 2px solid var(--calendar-focus-ring-color, #000000);
    outline-offset: -2px;
  }

  .today {
    border: var(--calendar-today-border, 1px solid #000000);
    font-weight: var(--calendar-today-font-weight, 700);
  }

  .selected {
    background-color: var(--calendar-selected-background, #000000);
    color: var(--calendar-selected-color, #ffffff);
  }

  .range-start {
    background-color: var(--calendar-range-start-background, #000000);
    color: var(--calendar-range-start-color, #ffffff);
    border-radius: 50% 0 0 50%;
  }

  .range-end {
    background-color: var(--calendar-range-end-background, #000000);
    color: var(--calendar-range-end-color, #ffffff);
    border-radius: 0 50% 50% 0;
  }

  .range-start.range-end {
    border-radius: var(--calendar-cell-border-radius, 50%);
  }

  .in-range {
    background-color: var(--calendar-range-background, #e8e8e8);
    border-radius: 0;
  }

  .disabled {
    color: var(--calendar-disabled-color, #cccccc);
    cursor: var(--calendar-disabled-cursor, not-allowed);
  }

  .outside-month {
    color: var(--calendar-outside-month-color, #cccccc);
    cursor: default;
  }
</style>
