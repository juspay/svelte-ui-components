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
      initialMonth: { type: 'Object' },
      onSelect: { type: 'Object' },
      onRangeSelect: { type: 'Object' },
      onMonthChange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Calendar from '$lib/Calendar/Calendar.svelte';
  let props = $props();
</script>

<Calendar {...props}>
  {#snippet previousMonthIcon()}
    <slot name="previous-month-icon"></slot>
  {/snippet}
  {#snippet nextMonthIcon()}
    <slot name="next-month-icon"></slot>
  {/snippet}
</Calendar>
