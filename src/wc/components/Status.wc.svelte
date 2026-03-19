<svelte:options
  customElement={{
    tag: 'sui-status',
    shadow: 'open',
    props: {
      statusIcon: { type: 'String', reflect: true },
      statusText: { type: 'String', reflect: true },
      statusDescription: { type: 'String', reflect: true },
      buttonProperties: { type: 'Object' },
      classes: { type: 'String' },
      onbuttonClick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Status from '$lib/Status/Status.svelte';
  let props = $props();
</script>

<Status {...props} />
