<svelte:options
  customElement={{
    tag: 'sui-chip-input',
    shadow: 'open',
    props: {
      values: { type: 'Array' },
      chipInputAriaLabel: { type: 'String', attribute: 'aria-label' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      editable: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      onadd: { type: 'Object' },
      ondismiss: { type: 'Object' },
      onedit: { type: 'Object' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChipInput from '$lib/ChipInput/ChipInput.svelte';
  import { dispatchEvents } from '../dispatch';

  // `values` is $bindable on ChipInput and is reassigned when a chip is added or dismissed.
  // Spreading it one-way leaves the host element's property frozen at whatever the consumer
  // last set, so `document.querySelector('sui-chip-input').values` never sees the new chip.
  let { chipInputAriaLabel, values = $bindable([]), ...rest } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange collides with HTMLElement's own onchange accessor, so it stays
  // callback-only. onadd, ondismiss and onedit collide with nothing and dispatch
  // 'add', 'dismiss' and 'edit' for a consumer who only calls addEventListener. onedit
  // takes two arguments, so its detail is named via CALLBACK_ARGUMENT_NAMES in
  // ../dispatch.ts (ChipInput.svelte's own properties.ts parameter names); onadd and
  // ondismiss take one, so detail is that string as-is.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `rest[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, rest));
</script>

<ChipInput {...rest} {...dispatchers} ariaLabel={chipInputAriaLabel} bind:values />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-chip-input-display, block);
  }
</style>
