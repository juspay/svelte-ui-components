<script lang="ts">
  import { onMount } from 'svelte';
  import Calendar from '$lib/Calendar/Calendar.svelte';
  import DateRangePicker from '$lib/DateRangePicker/DateRangePicker.svelte';

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<h1>Embedded fill</h1>

<div class="host host-fluid" data-pw="fill-host">
  <DateRangePicker mode="single" placeholder="Fluid picker" testId="fill-picker" />
</div>
<div class="host host-picker-tokens" data-pw="fill-picker-tokens-host">
  <DateRangePicker mode="single" placeholder="Picker tokens only" testId="fill-picker-tokens" />
</div>
<div class="host" data-pw="fill-default-host">
  <DateRangePicker mode="single" placeholder="Default picker" testId="fill-picker-default" />
</div>
<div class="host host-fluid" data-pw="fill-calendar-host">
  <Calendar mode="single" testId="fill-calendar" />
</div>
<div class="host" data-pw="fill-default-calendar-host">
  <Calendar mode="single" testId="fill-calendar-default" />
</div>
<div class="host host-cell-size" data-pw="fill-cell-size-host">
  <Calendar mode="single" testId="fill-calendar-cell-size" />
</div>

<style>
  .host {
    width: 300px;
    margin-bottom: 16px;
  }

  .host-picker-tokens,
  .host-fluid {
    --drp-root-display: block;
    --drp-panel-min-width: 100%;
    --calendar-width: 100%;
  }

  .host-fluid {
    --calendar-grid-columns: repeat(7, minmax(0, 1fr));
    --calendar-cell-width: 100%;
  }

  .host-cell-size {
    --calendar-cell-size: 44px;
  }
</style>
