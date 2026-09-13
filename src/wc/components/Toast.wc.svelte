<svelte:options
  customElement={{
    tag: 'sui-toast',
    shadow: 'open',
    props: {
      duration: { type: 'Number', reflect: true },
      leftIcon: { type: 'String', reflect: true, attribute: 'left-icon' },
      message: { type: 'String', reflect: true },
      subtext: { type: 'String', reflect: true },
      rightIcon: { type: 'String', reflect: true, attribute: 'right-icon' },
      type: { type: 'String', reflect: true },
      direction: { type: 'String', reflect: true },
      overlapPage: { type: 'Boolean', reflect: true, attribute: 'overlap-page' },
      inAnimationOffset: { type: 'Number', attribute: 'in-animation-offset' },
      inAnimationDuration: { type: 'Number', attribute: 'in-animation-duration' },
      outAnimationOffset: { type: 'Number', attribute: 'out-animation-offset' },
      outAnimationDuration: { type: 'Number', attribute: 'out-animation-duration' },
      testId: { type: 'String', attribute: 'test-id' },
      messageTestId: { type: 'String', attribute: 'message-test-id' },
      subTextTestId: { type: 'String', attribute: 'sub-text-test-id' },
      closeIconTestId: { type: 'String', attribute: 'close-icon-test-id' },
      classes: { type: 'String' },
      bottomContent: { type: 'Object' },
      ontoasthide: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Toast from '$lib/Toast/Toast.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // ontoasthide is the only callback prop this wrapper declares, and it does not
  // collide with a native HTMLElement handler, so it dispatches 'toasthide' (with no
  // detail -- Toast.svelte's own ontoasthide?.() takes no argument) for a consumer who
  // only calls addEventListener.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Toast {...props} {...dispatchers}>
  {#snippet bottomContent()}
    <slot name="bottom-content"></slot>
  {/snippet}
</Toast>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-toast-display, block);
  }
</style>
