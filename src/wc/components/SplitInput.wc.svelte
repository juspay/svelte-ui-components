<svelte:options
  customElement={{
    tag: 'sui-split-input',
    shadow: 'open',
    props: {
      values: { type: 'Array' },
      fields: { type: 'Array' },
      length: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      autoAdvance: { type: 'Boolean', reflect: true, attribute: 'auto-advance' },
      separator: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      splitInputAriaLabel: { type: 'String', attribute: 'aria-label' },
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      onchange: { type: 'Object' },
      oninput: { type: 'Object' },
      oncomplete: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import SplitInput from '$lib/SplitInput/SplitInput.svelte';
  import { dispatchEvents } from '../dispatch';

  // `values` is $bindable on SplitInput; see ChipInput.wc.svelte for the rationale.
  // `ariaLabel` is renamed because the platform already defines it on every
  // HTMLElement, the same reason ChipInput.wc.svelte renames its own.
  let { values = $bindable([]), splitInputAriaLabel, ...rest } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // oncomplete does not collide with a native HTMLElement handler, so it
  // dispatches 'complete' with detail: the assembled `values` array (its one
  // argument), for a consumer who only calls addEventListener. onchange and
  // oninput DO collide (with HTMLElement's own change/input accessors), so both
  // stay callback-only -- unchanged from before this wiring.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, rest));
</script>

<SplitInput {...rest} {...dispatchers} ariaLabel={splitInputAriaLabel} bind:values />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-split-input-display, block);
  }
</style>
