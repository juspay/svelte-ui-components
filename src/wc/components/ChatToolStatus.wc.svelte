<svelte:options
  customElement={{
    tag: 'sui-chat-tool-status',
    shadow: 'open',
    props: {
      label: { type: 'String', reflect: true },
      icon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import ChatToolStatus from '$lib/ChatToolStatus/ChatToolStatus.svelte';
  let props = $props();
</script>

<ChatToolStatus {...props} />
