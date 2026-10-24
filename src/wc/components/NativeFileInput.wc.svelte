<svelte:options
  customElement={{
    tag: 'sui-native-file-input',
    shadow: 'open',
    extend: formAssociated({ files: true, nativeFileOnly: true }),
    props: {
      name: { type: 'String', reflect: true },
      required: { type: 'Boolean', reflect: true },
      nativeAttrs: { type: 'Object' },
      element: { type: 'Object' },
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      accept: { type: 'String', reflect: true },
      multiple: { type: 'Boolean', reflect: true },
      maxSizeBytes: { type: 'Number', attribute: 'max-size-bytes' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onfiles: { type: 'Object' },
      onfileerror: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import NativeFileInput from '$lib/NativeFileInput/NativeFileInput.svelte';
  import { dispatchEvents } from '../dispatch';

  let { element = $bindable<HTMLInputElement | null>(null), ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // Both callback names avoid HTMLElement event-handler accessors. The shared
  // bridge emits files/fileerror and reads callbacks at invocation time.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<NativeFileInput bind:element {...props} {...dispatchers} />

<style>
  :host {
    display: var(--sui-native-file-input-display, block);
  }
</style>
