<svelte:options
  customElement={{
    tag: 'sui-img',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      alt: { type: 'String', reflect: true },
      fallback: { type: 'String', reflect: true },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Img from '$lib/Img/Img.svelte';
  let props = $props();
</script>

<Img {...props} />
