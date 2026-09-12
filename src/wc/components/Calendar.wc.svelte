<svelte:options
  customElement={{
    tag: 'sui-calendar',
    shadow: 'open',
    props: {
      value: { type: 'Object' },
      rangeStart: { type: 'Object' },
      rangeEnd: { type: 'Object' },
      mode: { type: 'String', reflect: true },
      minDate: { type: 'Object' },
      maxDate: { type: 'Object' },
      disabledDates: { type: 'Object' },
      weekStartsOn: { type: 'Number', reflect: true, attribute: 'week-starts-on' },
      locale: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      previousMonthIcon: { type: 'Object' },
      nextMonthIcon: { type: 'Object' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onrangeselect: { type: 'Object' },
      onmonthchange: { type: 'Object' },
      initialMonth: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Calendar from '$lib/Calendar/Calendar.svelte';
  // Mirrors Calendar.svelte's own previousMonthIcon/nextMonthIcon defaults so the
  // fallback below is the same artwork, not a retyped copy.
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  let props = $props();
</script>

<Calendar {...props}>
  {#snippet previousMonthIcon()}
    <!--
      A snippet declared here is always a function, so Calendar.svelte's own
      `{#if typeof previousMonthIcon === 'function'} ... {:else}{@html chevronLeftSvg}{/if}`
      would always take the true branch and never show its default chevron. Native
      slot fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="previous-month-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronLeftSvg}
    </slot>
  {/snippet}
  {#snippet nextMonthIcon()}
    <slot name="next-month-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronRightSvg}
    </slot>
  {/snippet}
</Calendar>
