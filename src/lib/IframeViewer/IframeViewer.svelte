<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { IframeViewerProperties } from './properties';

  let {
    unstyled = false,
    src,
    nativeAttrs,
    // eslint-disable-next-line no-useless-assignment -- Bindable output is assigned by the mounted DOM reference.
    element = $bindable(),
    onload,
    onerror,
    title = 'Embedded Content',
    allowedOrigins = [],
    allow = 'fullscreen',
    sandbox,
    loading,
    referrerpolicy,
    credentialless,
    testId,
    classes,
    // Called unguarded below, so it keeps the no-op default the resolver gave it.
    onmessage = () => {}
  }: IframeViewerProperties = $props();

  let iframeEl = $state<HTMLIFrameElement | null>(null);
  const assignFrameElement = (node: HTMLIFrameElement | null) => {
    iframeEl = node;
    element = node;
  };

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
    onmessage(event);
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

{#snippet frame()}
  {#if src}
    <iframe
      {...nativeAttrs}
      {...unstyled && typeof testId === 'string' ? { 'data-pw': testId, testID: testId } : {}}
      class={unstyled ? (classes ?? '') : nativeAttrs?.class}
      class:iframe-unstyled={unstyled}
      bind:this={() => iframeEl, assignFrameElement}
      {onload}
      {onerror}
      {src}
      {title}
      {allow}
      {sandbox}
      {loading}
      {referrerpolicy}
      {...credentialless ? { credentialless: '' } : {}}
    ></iframe>
  {/if}
{/snippet}

{#if unstyled}
  {@render frame()}
{:else}
  <div class="iframe-viewer {classes ?? ''}" data-pw={testId} testID={testId}>
    {@render frame()}
  </div>
{/if}

<style>
  .iframe-viewer {
    width: var(--iframe-viewer-width, 100%);
    height: var(--iframe-viewer-height, 100%);
    display: flex;
  }

  iframe:where(:not(.iframe-unstyled)) {
    width: 100%;
    height: 100%;
    border: var(--iframe-viewer-border, none);
    border-radius: var(--iframe-viewer-border-radius, 0);
  }
</style>
