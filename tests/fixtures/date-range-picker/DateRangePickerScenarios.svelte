<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import DateRangePicker from '$lib/DateRangePicker/DateRangePicker.svelte';
  import type { DateRangePreset } from '$lib/DateRangePicker/properties';

  let inertAncestorStart = $state<Date | null>(null);
  let inertAncestorEnd = $state<Date | null>(null);

  // Far from today, so a header label proves the picker opened on the selection's
  // month rather than the current one.
  const seededStart = new SvelteDate(2019, 2, 15);
  const seededEnd = new SvelteDate(2019, 2, 20);

  const daysAgo = (days: number): Date => {
    const day = new SvelteDate();
    day.setDate(day.getDate() - days);
    day.setHours(0, 0, 0, 0);
    return day;
  };

  const presets: DateRangePreset[] = [
    { label: 'Yesterday', getValue: () => ({ start: daysAgo(1), end: daysAgo(1) }) },
    { label: 'Last 7 days', getValue: () => ({ start: daysAgo(6), end: daysAgo(0) }) },
    { label: 'Last 30 days', getValue: () => ({ start: daysAgo(29), end: daysAgo(0) }) }
  ];

  const fixedPresets: DateRangePreset[] = [
    {
      label: 'Fixed February 2020',
      getValue: () => ({ start: new SvelteDate(2020, 1, 1), end: new SvelteDate(2020, 1, 29) })
    },
    {
      label: 'Fixed January 2018',
      getValue: () => ({ start: new SvelteDate(2018, 0, 1), end: new SvelteDate(2018, 0, 31) })
    }
  ];

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<h1>Date range picker scenarios</h1>

<div class="scenarios">
  <!-- The same props as the docs demo's responsive picker, minus responsiveLayout. -->
  <DateRangePicker
    mode="range"
    {presets}
    showDateInputs
    placeholder="Unconfined range"
    testId="drp-unconfined-demo"
  />

  <div class="inert-ancestor">
    <DateRangePicker
      mode="range"
      {presets}
      bind:rangeStart={inertAncestorStart}
      bind:rangeEnd={inertAncestorEnd}
      placeholder="Inert ancestor"
      testId="drp-inert-ancestor-demo"
    />
    <DateRangePicker mode="range" placeholder="Inert compare" testId="drp-inert-compare-demo">
      {#snippet compareTrigger(label)}
        Compare: {label}
      {/snippet}
      {#snippet compareCalendar()}
        <span>Compare calendar</span>
      {/snippet}
    </DateRangePicker>
  </div>

  <DateRangePicker
    mode="range"
    dualMonth={false}
    locale="en-US"
    presets={fixedPresets}
    showDateInputs
    rangeStart={seededStart}
    rangeEnd={seededEnd}
    placeholder="Seeded single month"
    testId="drp-single-month-seeded-demo"
  />
  <DateRangePicker
    mode="range"
    dualMonth={false}
    locale="en-US"
    maxRangeDays={3}
    rangeStart={seededStart}
    rangeEnd={seededEnd}
    placeholder="Seeded max range"
    testId="drp-single-month-maxrange-demo"
  />
  <DateRangePicker
    mode="single"
    locale="en-US"
    value={seededStart}
    placeholder="Seeded single date"
    testId="drp-single-seeded-demo"
  />

  <DateRangePicker
    mode="range"
    responsiveLayout
    locale="en-US"
    showDateInputs
    rangeStart={seededStart}
    rangeEnd={seededEnd}
    placeholder="Seeded responsive range"
    testId="drp-seeded-responsive-demo"
  />
</div>

<!-- Pinned to the bottom of the viewport, so a dropdown has no room below it. -->
<div class="low-trigger">
  <DateRangePicker
    mode="range"
    responsiveLayout
    {presets}
    placeholder="Low trigger"
    testId="drp-low-trigger-demo"
  />
</div>

<style>
  .scenarios {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
  }

  .inert-ancestor {
    display: flex;
    gap: 12px;
    pointer-events: none;
  }

  .low-trigger {
    position: fixed;
    left: 16px;
    bottom: 16px;
  }
</style>
