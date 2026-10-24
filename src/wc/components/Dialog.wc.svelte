<svelte:options
  customElement={{
    tag: 'sui-dialog',
    shadow: 'open',
    props: {
      ondialogkeydown: { type: 'Object' },
      ondialogclick: { type: 'Object' },
      element: { type: 'Object' },
      open: { type: 'Boolean' },
      modal: { type: 'Boolean' },
      lockScroll: { type: 'Boolean', attribute: 'lock-scroll' },
      returnFocusTo: { type: 'Object' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      nativeAttrs: { type: 'Object' },
      ondialogclose: { type: 'Object' },
      ondialogcancel: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Dialog from '$lib/Dialog/Dialog.svelte';
  import { dispatchEvents } from '../dispatch';
  let {
    element = $bindable<HTMLDialogElement | null>(null),
    open = $bindable(false),
    ...props
  } = $props();
  const hostEl = $host();
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
  const ondialogclose = $derived(dispatchers.ondialogclose ?? props.ondialogclose);
  const ondialogcancel = $derived(dispatchers.ondialogcancel ?? props.ondialogcancel);
  const ondialogclick = $derived(dispatchers.ondialogclick ?? props.ondialogclick);
  const ondialogkeydown = $derived(dispatchers.ondialogkeydown ?? props.ondialogkeydown);
</script>

<Dialog
  onkeydown={ondialogkeydown}
  onclick={ondialogclick}
  bind:element
  {...props}
  {...dispatchers}
  bind:open
  onclose={ondialogclose}
  oncancel={ondialogcancel}
>
  <slot></slot>
</Dialog>

<style>
  :host {
    display: var(--sui-dialog-display, block);
  }
</style>
