<svelte:options
  customElement={{
    tag: 'sui-chat',
    shadow: 'open',
    props: {
      messages: { type: 'Object' },
      value: { type: 'String' },
      chatTitle: { type: 'String', reflect: true, attribute: 'title' },
      subtitle: { type: 'String', reflect: true },
      image: { type: 'String', reflect: true },
      imageAlt: { type: 'String', attribute: 'image-alt' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      streaming: { type: 'Boolean', reflect: true },
      recording: { type: 'Boolean', reflect: true },
      autoscroll: { type: 'Boolean', reflect: true },
      scrollPolicy: { type: 'String', attribute: 'scroll-policy' },
      pinHold: { type: 'Boolean', attribute: 'pin-hold' },
      jump: { type: 'Boolean', reflect: true },
      jumpLabel: { type: 'String', attribute: 'jump-label' },
      jumpIcon: { type: 'Object' },
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
      messageBody: { type: 'Object' },
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
      onfeedback: { type: 'Object' },
      onscrollstate: { type: 'Object' },
      headerContent: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Chat from '$lib/Chat/Chat.svelte';
  // Bound whole rather than destructured: a rest element narrows the spread to
  // `{}`, and `<Chat {...props}>` then stops satisfying the component's
  // mandatory props. Only `check:wc` type-checks this directory, so that
  // regression reached a release before anything caught it.
  let props = $props();
</script>

<Chat {...props} title={props.chatTitle} />
