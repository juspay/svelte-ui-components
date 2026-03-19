<svelte:options
  customElement={{
    tag: 'sui-brand-loader',
    shadow: 'open',
    props: {
      brandLogoURL: { type: 'String', reflect: true },
      brandText: { type: 'String', reflect: true },
      subText: { type: 'String', reflect: true },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import BrandLoader from '$lib/BrandLoader/BrandLoader.svelte';
  let props = $props();
</script>

<BrandLoader {...props} />
