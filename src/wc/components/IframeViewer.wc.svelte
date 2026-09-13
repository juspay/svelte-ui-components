<svelte:options
  customElement={{
    tag: 'sui-iframe-viewer',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      iframeViewerTitle: { type: 'String', reflect: true, attribute: 'title' },
      allowedOrigins: { type: 'Object', attribute: 'allowed-origins' },
      allow: { type: 'String', reflect: true },
      sandbox: { type: 'String', reflect: true },
      credentialless: { type: 'Boolean', reflect: true, attribute: 'credentialless' },
      loading: { type: 'String', reflect: true },
      referrerpolicy: { type: 'String', attribute: 'referrer-policy' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onmessage: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import IframeViewer from '$lib/IframeViewer/IframeViewer.svelte';
  import type { IframeViewerProperties } from '$lib/IframeViewer/properties';
  import { dispatchEvents } from '../dispatch';
  // The element renames `title` to `iframeViewerTitle` because the platform already defines `title` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    iframeViewerTitle,
    ...props
  }: Omit<IframeViewerProperties, 'title'> & {
    iframeViewerTitle?: IframeViewerProperties['title'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onmessage does not collide with a native HTMLElement handler (it is a
  // MessagePort/Window handler, not one HTMLElement's own prototype carries), so it
  // dispatches 'message' with detail: the MessageEvent argument, for a consumer who
  // only calls addEventListener.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<IframeViewer {...props} {...dispatchers} title={iframeViewerTitle} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-iframe-viewer-display, block);
  }
</style>
