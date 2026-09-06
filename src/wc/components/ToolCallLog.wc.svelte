<svelte:options
  customElement={{
    tag: 'sui-tool-call-log',
    shadow: 'open',
    props: {
      chips: { type: 'Array' },
      onchipclick: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import ToolCallLog from '$lib/ToolCallLog/ToolCallLog.svelte';
  let props = $props();
</script>

<ToolCallLog {...props} />
