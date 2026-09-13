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
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onselect collides with HTMLElement's own onselect accessor with no exception
  // recorded for 'sui-calendar:onselect' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS,
  // so it stays callback-only. onrangeselect and onmonthchange do not collide, so both
  // dispatch -- 'rangeselect' and 'monthchange' -- for a consumer who only calls
  // addEventListener; each callback takes exactly one object argument (the range, and
  // the new visible month), so detail is that value unchanged and neither needs a
  // CALLBACK_ARGUMENT_NAMES entry.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Calendar {...props} {...dispatchers}>
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

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-calendar-display, block);
  }
</style>
