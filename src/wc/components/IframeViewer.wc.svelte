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
  let { iframeViewerTitle, ...props } = $props();
</script>

<IframeViewer {...props} title={iframeViewerTitle} />
