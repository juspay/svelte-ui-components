<svelte:options
  customElement={{
    tag: 'sui-chat-composer',
    shadow: 'open',
    props: {
      value: { type: 'String' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      submitOnEnter: { type: 'Boolean', attribute: 'submit-on-enter' },
      maxLength: { type: 'Number', attribute: 'max-length' },
      streaming: { type: 'Boolean', reflect: true },
      recording: { type: 'Boolean', reflect: true },
      attachments: { type: 'Object' },
      accept: { type: 'String', reflect: true },
      multiple: { type: 'Boolean', reflect: true },
      sendLabel: { type: 'String', attribute: 'send-label' },
      stopLabel: { type: 'String', attribute: 'stop-label' },
      voiceLabel: { type: 'String', attribute: 'voice-label' },
      attachLabel: { type: 'String', attribute: 'attach-label' },
      sendIcon: { type: 'Object' },
      stopIcon: { type: 'Object' },
      voiceIcon: { type: 'Object' },
      attachIcon: { type: 'Object' },
      leading: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onsubmit: { type: 'Object' },
      oninput: { type: 'Object' },
      onkeydown: { type: 'Object' },
      onstop: { type: 'Object' },
      onvoice: { type: 'Object' },
      onattach: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';
  let props = $props();
</script>

<ChatComposer {...props} />
