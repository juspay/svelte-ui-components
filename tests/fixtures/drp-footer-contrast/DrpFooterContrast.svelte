<script lang="ts">
  import { onMount } from 'svelte';
  import DateRangePicker from '$lib/DateRangePicker/DateRangePicker.svelte';

  const scenarios = ['range', 'range-empty', 'single', 'compare', 'compare-empty'] as const;

  const params = new URLSearchParams(window.location.search);

  const requested = params.get('scenario') ?? 'range';
  const scenario = scenarios.find((candidate) => candidate === requested) ?? null;
  if (scenario === null) {
    throw new Error(`Unknown scenario "${requested}"`);
  }

  // Custom properties on an ancestor of the picker, which is where an app sets
  // them for every picker at once.
  const tokens = params.get('tokens') ?? '';
  const isDark = params.get('theme') === 'dark';

  // A seeded selection enables Apply; the *-empty scenarios leave it disabled.
  const hasSelection = scenario === 'range' || scenario === 'single';
  const hasCompareSelection = scenario === 'compare';

  let rangeStart = $state<Date | null>(hasSelection ? new Date(2019, 2, 15) : null);
  let rangeEnd = $state<Date | null>(hasSelection ? new Date(2019, 2, 20) : null);
  let value = $state<Date | null>(hasSelection ? new Date(2019, 2, 15) : null);
  let compareStart = $state<Date | null>(hasCompareSelection ? new Date(2019, 1, 1) : null);
  let compareEnd = $state<Date | null>(hasCompareSelection ? new Date(2019, 1, 7) : null);

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<!-- The surface the picker sits on: white by default, the dark demo surface when the
     library's own dark theme is on. -->
<div
  class="surface"
  class:surface-dark={isDark}
  data-theme={isDark ? 'dark' : null}
  data-pw="fixture-surface"
  style={tokens}
>
  {#if scenario === 'single'}
    <DateRangePicker mode="single" bind:value clearable testId="fixture-drp" />
  {:else if scenario === 'compare' || scenario === 'compare-empty'}
    <DateRangePicker
      mode="range"
      bind:rangeStart
      bind:rangeEnd
      bind:compareStart
      bind:compareEnd
      testId="fixture-drp"
    >
      {#snippet compareTrigger(label)}
        Compare: {label}
      {/snippet}
      {#snippet compareCalendar()}
        <span>Compare calendar</span>
      {/snippet}
    </DateRangePicker>
  {:else}
    <DateRangePicker mode="range" bind:rangeStart bind:rangeEnd testId="fixture-drp" />
  {/if}
</div>

<style>
  .surface {
    min-height: 100vh;
    padding: 24px;
    background: #ffffff;
    color: #111827;
  }

  .surface-dark {
    background: #1a1a26;
    color: #d1d5db;
  }
</style>
