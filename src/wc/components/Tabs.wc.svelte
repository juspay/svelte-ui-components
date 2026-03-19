<svelte:options
  customElement={{
    tag: 'sui-tabs',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      activeIndex: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Tabs from '$lib/Tabs/Tabs.svelte';
  let props = $props();
</script>

<Tabs {...props} />
