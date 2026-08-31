<svelte:options
  customElement={{
    tag: 'sui-key-value',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      columns: { type: 'Number' },
      layout: { type: 'String' },
      size: { type: 'String' },
      hideEmpty: { type: 'Boolean', attribute: 'hide-empty' },
      emptyText: { type: 'String', attribute: 'empty-text' },
      valueSnippet: { type: 'Object' },
      labelSnippet: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import KeyValue from '$lib/KeyValue/KeyValue.svelte';
  let props = $props();
</script>

<KeyValue {...props} />
