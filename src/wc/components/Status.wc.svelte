<svelte:options
  customElement={{
    tag: 'sui-status',
    shadow: 'open',
    props: {
      statusIcon: { type: 'String', reflect: true, attribute: 'status-icon' },
      statusText: { type: 'String', reflect: true, attribute: 'status-text' },
      statusDescription: { type: 'String', reflect: true, attribute: 'status-description' },
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
