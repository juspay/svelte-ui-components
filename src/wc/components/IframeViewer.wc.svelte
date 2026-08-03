<svelte:options
  customElement={{
    tag: 'sui-iframe-viewer',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      title: { type: 'String', reflect: true },
      allowedOrigins: { type: 'Object', attribute: 'allowed-origins' },
      allow: { type: 'String', reflect: true },
      sandbox: { type: 'String', reflect: true },
      credentialless: { type: 'Boolean', reflect: true, attribute: 'credentialless' },
      loading: { type: 'String', reflect: true },
      referrerpolicy: { type: 'String', attribute: 'referrer-policy' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onMessage: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import IframeViewer from '$lib/IframeViewer/IframeViewer.svelte';
  let props = $props();
</script>

<IframeViewer {...props} />
