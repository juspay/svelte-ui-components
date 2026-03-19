<svelte:options
  customElement={{
    tag: 'sui-grid-item',
    shadow: 'open',
    props: {
      icon: { type: 'String', reflect: true },
      text: { type: 'String', reflect: true },
      headerIcon: { type: 'String', reflect: true },
      showLoader: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import GridItem from '$lib/GridItem/GridItem.svelte';
  let props = $props();
</script>

<GridItem {...props} />
