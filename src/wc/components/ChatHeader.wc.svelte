<svelte:options
  customElement={{
    tag: 'sui-chat-header',
    shadow: 'open',
    props: {
      title: { type: 'String', reflect: true },
      subtitle: { type: 'String', reflect: true },
      image: { type: 'String', reflect: true },
      imageAlt: { type: 'String', attribute: 'image-alt' },
      avatar: { type: 'Object' },
      actions: { type: 'Object' },
      closeIcon: { type: 'Object' },
      closeLabel: { type: 'String', attribute: 'close-label' },
      showClose: { type: 'Boolean', attribute: 'show-close' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatHeader from '$lib/ChatHeader/ChatHeader.svelte';
  let props = $props();
</script>

<ChatHeader {...props} />
