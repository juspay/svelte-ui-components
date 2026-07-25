<script lang="ts">
  import type { RelativeTimeProperties } from './properties';
  import Tooltip from '../Tooltip/Tooltip.svelte';
  import { onMount } from 'svelte';

  let {
    date,
    locale,
    format = 'long',
    updateInterval = 60000,
    tooltip = false,
    testId,
    classes
  }: RelativeTimeProperties = $props();

  let resolvedDate = $derived(date instanceof Date ? date : new Date(date));

  let isoString = $derived(resolvedDate.toISOString());

  let fullDateText = $derived(
    resolvedDate.toLocaleString(locale, {
      dateStyle: 'full',
      timeStyle: 'short'
    })
  );

  let relativeText = $state('');

  function computeRelativeTime(): string {
    const now = Date.now();
    const target = resolvedDate.getTime();
    const diffMs = target - now;
    const absDiffMs = Math.abs(diffMs);

    const seconds = Math.round(absDiffMs / 1000);
    const minutes = Math.round(absDiffMs / 60000);
    const hours = Math.round(absDiffMs / 3600000);
    const days = Math.round(absDiffMs / 86400000);
    const weeks = Math.round(absDiffMs / 604800000);
    const months = Math.round(absDiffMs / 2592000000);
    const years = Math.round(absDiffMs / 31536000000);

    const formatter = new Intl.RelativeTimeFormat(locale, { style: format });

    let unit: Intl.RelativeTimeFormatUnit;
    let value: number;

    if (seconds < 60) {
      unit = 'second';
      value = seconds;
    } else if (minutes < 60) {
      unit = 'minute';
      value = minutes;
    } else if (hours < 24) {
      unit = 'hour';
      value = hours;
    } else if (days < 7) {
      unit = 'day';
      value = days;
    } else if (weeks < 4) {
      unit = 'week';
      value = weeks;
    } else if (months < 12) {
      unit = 'month';
      value = months;
    } else {
      unit = 'year';
      value = years;
    }

    const sign = diffMs < 0 ? -1 : 1;
    return formatter.format(sign * value, unit);
  }

  function updateRelativeTime() {
    relativeText = computeRelativeTime();
  }

  onMount(() => {
    updateRelativeTime();

    if (updateInterval > 0) {
      const intervalId = setInterval(updateRelativeTime, updateInterval);
      return () => clearInterval(intervalId);
    }
  });
</script>

{#if tooltip}
  <Tooltip text={fullDateText}>
    <time
      class="relative-time {classes ?? ''}"
      datetime={isoString}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {relativeText}
    </time>
  </Tooltip>
{:else}
  <time
    class="relative-time {classes ?? ''}"
    datetime={isoString}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    {relativeText}
  </time>
{/if}

<style>
  .relative-time {
    font-size: var(--relative-time-font-size, 14px);
    font-weight: var(--relative-time-font-weight, 400);
    font-family: var(--relative-time-font-family);
    color: var(--relative-time-color, inherit);
    cursor: var(--relative-time-cursor, default);
  }
</style>
