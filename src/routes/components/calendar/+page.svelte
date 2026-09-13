<script lang="ts">
  import Calendar from '$lib/Calendar/Calendar.svelte';

  let calendarDate = $state<Date | null>(null);
  let rangeStart = $state<Date | null>(null);
  let rangeEnd = $state<Date | null>(null);
  let disabledDemoDate = $state<Date | null>(null);

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  function formatDate(d: Date): string {
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  let formattedDate: string = $derived(calendarDate !== null ? formatDate(calendarDate) : 'None');

  let formattedRange: string = $derived.by(() => {
    if (rangeStart !== null && rangeEnd !== null) {
      return `${formatDate(rangeStart)} — ${formatDate(rangeEnd)}`;
    }
    if (rangeStart !== null) {
      return `${formatDate(rangeStart)} — ...`;
    }
    return 'None';
  });

  let formattedDisabledDemoDate: string = $derived(
    disabledDemoDate !== null ? formatDate(disabledDemoDate) : 'None'
  );

  // Recurs every month so keyboard navigation always has a disabled run to skip over,
  // including across a month boundary, however far the demo calendar is navigated.
  function isMidMonthDisabled(date: Date): boolean {
    const day = date.getDate();
    return day >= 10 && day <= 15;
  }
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Calendar</h1>
</div>

<div class="demo-row">
  <Calendar mode="single" bind:value={calendarDate} />
  <p class="selected-date">Selected: {formattedDate}</p>
</div>

<div class="demo-row">
  <Calendar mode="range" bind:rangeStart bind:rangeEnd />
  <p class="selected-date">Range: {formattedRange}</p>
</div>

<div class="demo-row">
  <Calendar
    mode="single"
    bind:value={disabledDemoDate}
    disabledDates={isMidMonthDisabled}
    testId="calendar-disabled-dates-demo"
  />
  <div>
    <p class="selected-date">Selected: {formattedDisabledDemoDate}</p>
    <p class="state-display">
      The 10th–15th of every month are disabled. Tab into the grid, then use the arrow keys — focus
      skips over the whole disabled run instead of landing inside it, even crossing into the next or
      previous month.
    </p>
  </div>
</div>
