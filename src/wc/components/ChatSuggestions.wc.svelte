<svelte:options
  customElement={{
    tag: 'sui-chat-suggestions',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onselect: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatSuggestions from '$lib/ChatSuggestions/ChatSuggestions.svelte';
  let props = $props();
</script>

<ChatSuggestions {...props} />
