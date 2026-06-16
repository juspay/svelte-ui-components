<svelte:options
  customElement={{
    tag: 'sui-date-range-picker',
    shadow: 'open',
    props: {
      rangeStart: { type: 'Object' },
      rangeEnd: { type: 'Object' },
      value: { type: 'Object' },
      mode: { type: 'String', reflect: true },
      minDate: { type: 'Object' },
      maxDate: { type: 'Object' },
      disabledDates: { type: 'Object' },
      presets: { type: 'Object' },
      placeholder: { type: 'String' },
      dualMonth: { type: 'Boolean', reflect: true, attribute: 'dual-month' },
      compareStart: { type: 'Object' },
      compareEnd: { type: 'Object' },
      weekStartsOn: { type: 'Number', reflect: true, attribute: 'week-starts-on' },
      locale: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      clearable: { type: 'Boolean', reflect: true },
      initialPresetLabel: { type: 'String', attribute: 'initial-preset-label' },
      openCompare: { type: 'Boolean', reflect: true, attribute: 'open-compare' },
      onapply: { type: 'Object' },
      onapplysingle: { type: 'Object' },
      onapplycompare: { type: 'Object' },
      oncancel: { type: 'Object' },
      onopentoggle: { type: 'Object' },
      onclear: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import DateRangePicker from '$lib/DateRangePicker/DateRangePicker.svelte';
  let props = $props();
</script>

<DateRangePicker {...props} />
