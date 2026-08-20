<svelte:options
  customElement={{
    tag: 'sui-chat-message',
    shadow: 'open',
    props: {
      role: { type: 'String', reflect: true },
      content: { type: 'String' },
      html: { type: 'String' },
      streaming: { type: 'Boolean', reflect: true },
      status: { type: 'String', reflect: true },
      avatar: { type: 'Object' },
      header: { type: 'Object' },
      attachments: { type: 'Object' },
      allowCopy: { type: 'Boolean', attribute: 'allow-copy' },
      actions: { type: 'Object' },
      copyLabel: { type: 'String', attribute: 'copy-label' },
      retryLabel: { type: 'String', attribute: 'retry-label' },
      feedbackUpLabel: { type: 'String', attribute: 'feedback-up-label' },
      feedbackDownLabel: { type: 'String', attribute: 'feedback-down-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onretry: { type: 'Object' },
      onfeedback: { type: 'Object' },
      oncopy: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';
  let props = $props();
</script>

<ChatMessage {...props} />
