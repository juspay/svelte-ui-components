<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { IframeViewerProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    src,
    title = 'Embedded Content',
    allowedOrigins = [],
    allow = 'fullscreen',
    sandbox,
    loading,
    referrerpolicy,
    credentialless,
    testId,
    classes,
    onMessage: onMessageProp,
    onmessage
  }: IframeViewerProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onMessage = $derived(
    resolveDeprecatedProp('IframeViewer', 'onMessage', 'onmessage', onMessageProp, onmessage) ??
      (() => {})
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onMessage);
  });

  let iframeEl: HTMLIFrameElement | null = $state(null);

  export const postMessage = (message: unknown, targetOrigin: string): void => {
    iframeEl?.contentWindow?.postMessage(message, targetOrigin);
  };

  const messageHandler = (event: MessageEvent): void => {
    // Secure by default: forward a message only when its origin is allow-listed AND it
    // originates from the embedded iframe's own window. An empty allowedOrigins list
    // therefore processes nothing.
    if (
      allowedOrigins.length === 0 ||
      !allowedOrigins.includes(event.origin) ||
      event.source !== iframeEl?.contentWindow
    ) {
      return;
    }
    onMessage(event);
  };

  onMount(() => {
    window.addEventListener('message', messageHandler);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', messageHandler);
    }
  });
</script>

<div class="iframe-viewer {classes ?? ''}" data-pw={testId} testID={testId}>
  {#if src}
    <iframe
      bind:this={iframeEl}
      {src}
      {title}
      {allow}
      {sandbox}
      {loading}
      {referrerpolicy}
      {...credentialless ? { credentialless: '' } : {}}
    ></iframe>
  {/if}
</div>

<style>
  .iframe-viewer {
    width: var(--iframe-viewer-width, 100%);
    height: var(--iframe-viewer-height, 100%);
    display: flex;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: var(--iframe-viewer-border, none);
    border-radius: var(--iframe-viewer-border-radius, 0);
  }
</style>
