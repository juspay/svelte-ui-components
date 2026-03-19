<svelte:options
  customElement={{
    tag: 'sui-badge',
    shadow: 'open',
    props: {
      image: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Badge from '$lib/Badge/Badge.svelte';
  let props = $props();
</script>

<Badge {...props} />
