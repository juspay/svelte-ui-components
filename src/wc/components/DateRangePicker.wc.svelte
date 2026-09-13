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
      showDateInputs: { type: 'Boolean', reflect: true, attribute: 'show-date-inputs' },
      showTimeSelection: { type: 'Boolean', reflect: true, attribute: 'show-time-selection' },
      timeSelectionLayout: { type: 'String', reflect: true, attribute: 'time-selection-layout' },
      presetCheckmark: { type: 'Boolean', reflect: true, attribute: 'preset-checkmark' },
      presetToggle: { type: 'Boolean', reflect: true, attribute: 'preset-toggle' },
      placeholder: { type: 'String' },
      dualMonth: { type: 'Boolean', reflect: true, attribute: 'dual-month' },
      align: { type: 'String', reflect: true },
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
      onclear: { type: 'Object' },
      maxRangeDays: { type: 'Number', attribute: 'max-range-days' },
      timePicker: { type: 'Object' },
      compareCalendar: { type: 'Object' },
      triggerSnippet: { type: 'Object' },
      triggerIcon: { type: 'Object' },
      compareTrigger: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import DateRangePicker from '$lib/DateRangePicker/DateRangePicker.svelte';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * `timePicker` and `compareCalendar` are guarded rather than always supplied, and
   * `triggerIcon` is not, because the three behave differently when the snippet is
   * absent.
   *
   * `triggerIcon` has an `{:else}` branch rendering `{@html chevronDownSvg}` inside a
   * `.drp-trigger-icon` span the component draws either way, and no rule in
   * DateRangePicker sizes an svg inside that span -- the asset carries its own
   * width/height. Mirroring it as the slot's fallback is therefore exact.
   *
   * The other two have no default to lose but are not inert: each is wrapped in a row
   * (`.drp-time-row`, `.drp-compare-section`) whose own style is
   * `border-top: 1px solid` plus padding, so always supplying the snippet would draw a
   * divider across every panel above an empty strip. `compareCalendar` is load-bearing
   * beyond layout as well -- `typeof compareCalendar === 'function'` is what lets Apply
   * commit `compareStart`/`compareEnd` and fire `onapplycompare`, so supplying it
   * unconditionally would switch compare-range behaviour on for every consumer.
   *
   * `$host()` is called inline rather than held in a `const host`: a `$`-prefixed
   * identifier is Svelte's store-subscription spelling, so a local named `host` makes
   * `$host` read as that store and svelte-check reports the initializer as referencing
   * itself.
   */
  const hasTimePickerSlot = $host().querySelector('[slot="time-picker"]') !== null;
  const hasCompareCalendarSlot = $host().querySelector('[slot="compare-calendar"]') !== null;

  // dispatchEvents needs an actual value to call methods on, not another inline
  // `$host()` call per use -- named hostEl, not host, for the same reason as above:
  // svelte2tsx confuses a local variable named after a rune's name minus its `$` with
  // the rune itself (sveltejs/svelte#13715), reporting `$host` as used before its
  // declaration.
  const hostEl = $host();

  // oncancel collides with HTMLElement's own accessor with no recorded
  // exception, so dispatchEvents leaves it callback-only. onapply, onapplysingle,
  // onapplycompare, onopentoggle, and onclear collide with nothing and dispatch
  // 'apply', 'applysingle', 'applycompare', 'opentoggle', 'clear' -- each either
  // 0-argument (onclear) or a single object argument (the rest, named `event` in
  // DateRangePicker/properties.ts), so `detail` is exactly that argument (or absent
  // for onclear) with no CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  Four branches rather than two conditional snippet props, for the reason
  PieChart.wc.svelte states: a `{#snippet}` declared at the top level of the template is
  hoisted to module scope, while the `<slot>` inside it compiles to
  `$.slot(node, $$props, …)` -- and `$$props` only exists inside the component function.
  The hoisted version throws `$$props is not defined` the moment the snippet is rendered,
  which shows up as a silently empty shadow root rather than as a build error. Declaring
  each snippet inside `<DateRangePicker>` keeps it in component scope; the branching is
  what makes it conditional without a top-level declaration.

  `triggerSnippet` and `compareTrigger` stay out of the markup: both are
  `Snippet<[string]>`, called with the label they exist to render, and a `<slot>` cannot
  receive arguments.
-->
{#if hasTimePickerSlot && hasCompareCalendarSlot}
  <DateRangePicker {...props} {...dispatchers}>
    {#snippet triggerIcon()}
      {#if props.triggerIcon}{@render props.triggerIcon()}{:else}<slot name="trigger-icon">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html chevronDownSvg}
        </slot>{/if}
    {/snippet}
    {#snippet timePicker()}
      <slot name="time-picker"></slot>
    {/snippet}
    {#snippet compareCalendar()}
      <slot name="compare-calendar"></slot>
    {/snippet}
  </DateRangePicker>
{:else if hasTimePickerSlot}
  <DateRangePicker {...props} {...dispatchers}>
    {#snippet triggerIcon()}
      {#if props.triggerIcon}{@render props.triggerIcon()}{:else}<slot name="trigger-icon">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html chevronDownSvg}
        </slot>{/if}
    {/snippet}
    {#snippet timePicker()}
      <slot name="time-picker"></slot>
    {/snippet}
  </DateRangePicker>
{:else if hasCompareCalendarSlot}
  <DateRangePicker {...props} {...dispatchers}>
    {#snippet triggerIcon()}
      {#if props.triggerIcon}{@render props.triggerIcon()}{:else}<slot name="trigger-icon">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html chevronDownSvg}
        </slot>{/if}
    {/snippet}
    {#snippet compareCalendar()}
      <slot name="compare-calendar"></slot>
    {/snippet}
  </DateRangePicker>
{:else}
  <DateRangePicker {...props} {...dispatchers}>
    {#snippet triggerIcon()}
      {#if props.triggerIcon}{@render props.triggerIcon()}{:else}<slot name="trigger-icon">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html chevronDownSvg}
        </slot>{/if}
    {/snippet}
  </DateRangePicker>
{/if}

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-date-range-picker-display, inline-block);
  }
</style>
