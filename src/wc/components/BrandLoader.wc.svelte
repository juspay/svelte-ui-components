<svelte:options
  customElement={{
    tag: 'sui-brand-loader',
    shadow: 'open',
    props: {
      brandLogoURL: { type: 'String', reflect: true, attribute: 'brand-logo-url' },
      brandText: { type: 'String', reflect: true, attribute: 'brand-text' },
      subText: { type: 'String', reflect: true, attribute: 'sub-text' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import BrandLoader from '$lib/BrandLoader/BrandLoader.svelte';
  let props = $props();
</script>

<BrandLoader {...props} />
