<svelte:options
  customElement={{
    tag: 'sui-chat',
    shadow: 'open',
    props: {
      messages: { type: 'Object' },
      value: { type: 'String' },
      title: { type: 'String', reflect: true },
      subtitle: { type: 'String', reflect: true },
      image: { type: 'String', reflect: true },
      imageAlt: { type: 'String', attribute: 'image-alt' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      streaming: { type: 'Boolean', reflect: true },
      recording: { type: 'Boolean', reflect: true },
      autoscroll: { type: 'Boolean', reflect: true },
      toolStatus: { type: 'Object', attribute: 'tool-status' },
      suggestions: { type: 'Object' },
      attachments: { type: 'Object' },
      accept: { type: 'String', reflect: true },
      multiple: { type: 'Boolean', reflect: true },
      allowCopy: { type: 'Boolean', attribute: 'allow-copy' },
      closeLabel: { type: 'String', attribute: 'close-label' },
      showClose: { type: 'Boolean', attribute: 'show-close' },
      headerAvatar: { type: 'Object' },
      headerActions: { type: 'Object' },
      message: { type: 'Object' },
      messageAttachments: { type: 'Object' },
      empty: { type: 'Object' },
      composerLeading: { type: 'Object' },
      sendIcon: { type: 'Object' },
      stopIcon: { type: 'Object' },
      voiceIcon: { type: 'Object' },
      attachIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onsend: { type: 'Object' },
      onsuggestion: { type: 'Object' },
      onclose: { type: 'Object' },
      onstop: { type: 'Object' },
      onvoice: { type: 'Object' },
      onattach: { type: 'Object' },
      onretry: { type: 'Object' },
      onfeedback: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Chat from '$lib/Chat/Chat.svelte';
  let props = $props();
</script>

<Chat {...props} />
