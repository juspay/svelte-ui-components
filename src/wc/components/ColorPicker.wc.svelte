<svelte:options
  customElement={{
    tag: 'sui-color-picker',
    shadow: 'open',
    props: {
      value: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showValue: { type: 'Boolean', reflect: true, attribute: 'show-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      onchange: { type: 'Object' },
      oninput: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ColorPicker from '$lib/ColorPicker/ColorPicker.svelte';
  import { dispatchEvents } from '../dispatch';

  // `value` is $bindable on ColorPicker; see ChipInput.wc.svelte for why a one-way spread
  // leaves the host element's property stale.
  let { value = $bindable('#000000'), ...rest } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange and oninput are ColorPicker's only callback props, and both collide
  // with HTMLElement's own accessors with no exception recorded for
  // 'sui-color-picker:onchange' / 'sui-color-picker:oninput' in ../dispatch.ts's
  // DISPATCH_COLLISION_EXCEPTIONS -- so dispatchEvents intentionally returns nothing for
  // either. They stay callback-only: `colorPicker.onchange = fn` still runs `fn(value)`
  // exactly as before, but no synthetic 'change'/'input' event is ever dispatched.
  // Called anyway, on every wrapper, rather than special-cased away: proves the
  // collision guard produces this no-op instead of assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, rest));
</script>

<ColorPicker {...rest} {...dispatchers} bind:value />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-color-picker-display, block);
  }
</style>
