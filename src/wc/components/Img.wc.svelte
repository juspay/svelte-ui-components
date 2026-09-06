<svelte:options
  customElement={{
    tag: 'sui-img',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      alt: { type: 'String', reflect: true },
      fallback: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onerror: { type: 'Object' },
      inlineSvg: { type: 'Boolean', attribute: 'inline-svg' },
      transformSvg: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Img from '$lib/Img/Img.svelte';
  let props = $props();
</script>

<Img {...props} />
