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
      weekStartsOn: { type: 'Number', reflect: true },
      locale: { type: 'String', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onrangeselect: { type: 'Object' },
      onmonthchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Calendar from '$lib/Calendar/Calendar.svelte';
  let props = $props();
</script>

<Calendar {...props} />
