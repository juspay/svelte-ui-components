<svelte:options
  customElement={{
    tag: 'sui-chat-message-list',
    shadow: 'open',
    props: {
      messages: { type: 'Object' },
      autoscroll: { type: 'Boolean', reflect: true },
      message: { type: 'Object' },
      messageBody: { type: 'Object' },
      scrollPolicy: { attribute: 'scroll-policy', type: 'String' },
      pinHold: { attribute: 'pin-hold', type: 'Boolean' },
      jump: { type: 'Boolean' },
      onscrollstate: { type: 'Object' },
      messageAttachments: { type: 'Object' },
      empty: { type: 'Object' },
      jumpLabel: { type: 'String', attribute: 'jump-label' },
      jumpIcon: { type: 'Object' },
      allowCopy: { type: 'Boolean', attribute: 'allow-copy' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onretry: { type: 'Object' },
      onfeedback: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  let props = $props();
</script>

<ChatMessageList {...props} />
