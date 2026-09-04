<svelte:options
  customElement={{
    tag: 'sui-chat-suggestions',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      disabled: { type: 'Boolean', reflect: true },
      layout: { type: 'String' },
      direction: { type: 'String' },
      maxVisible: { type: 'Number', attribute: 'max-visible' },
      loading: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      chipClasses: { type: 'String', attribute: 'chip-classes' },
      onselect: { type: 'Object' },
      icon: { type: 'Object' },
      onSelect: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatSuggestions from '$lib/ChatSuggestions/ChatSuggestions.svelte';
  let props = $props();
</script>

<ChatSuggestions {...props} />
