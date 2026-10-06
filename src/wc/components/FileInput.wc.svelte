<svelte:options
  customElement={{
    tag: 'sui-file-input',
    shadow: 'open',
    props: {
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      activation: { type: 'String', reflect: true },
      accept: { type: 'String', reflect: true },
      multiple: { type: 'Boolean', reflect: true },
      maxSizeBytes: { type: 'Number', attribute: 'max-size-bytes' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onfiles: { type: 'Object' },
      onerror: { type: 'Object' },
      trigger: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import FileInput from '$lib/FileInput/FileInput.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onerror collides with HTMLElement's own accessor with no recorded
  // exception, so dispatchEvents leaves it callback-only. onfiles collides with
  // nothing and dispatches 'files' -- a single-argument callback
  // (FileInput/properties.ts's own `(files: File[]) => void`), so `detail` is
  // exactly that array with no CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<FileInput {...props} {...dispatchers}>
  {#snippet trigger({ openFilePicker, dragOver, disabled })}
    <slot name="trigger">
      <!-- The region is the one control, so its default content is not a button; only when the
           consumer hands ownership to the trigger (activation="trigger") is there nothing else to
           be the control, and the default has to be one. -->
      {#if props.activation === 'trigger'}
        <button class="default-trigger" onclick={openFilePicker} {disabled}>
          {dragOver ? 'Drop files here' : 'Choose file'}
        </button>
      {:else}
        <span class="default-trigger">{dragOver ? 'Drop files here' : 'Choose file'}</span>
      {/if}
    </slot>
  {/snippet}
</FileInput>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-file-input-display, block);
  }

  /* The fallback used to be a bare native button. It is now plain content inside the
     drop region, so it is dressed like one with system colours -- a stylesheet outside
     this shadow root cannot reach it, and a fallback nobody can see is no fallback. */
  .default-trigger {
    display: inline-block;
    padding: 1px 6px;
    border: 1px solid ButtonBorder;
    border-radius: 3px;
    background: ButtonFace;
    color: ButtonText;
    font: inherit;
    text-align: center;
    cursor: pointer;
  }

  .default-trigger:disabled {
    cursor: not-allowed;
  }
</style>
