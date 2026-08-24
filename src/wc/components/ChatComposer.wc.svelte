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
      attachmentsPreview: { type: 'Object' },
      richImages: { type: 'Object' },
      richFiles: { type: 'Object' },
      richVideos: { type: 'Object' },
      richImageTooltip: { type: 'Object' },
      richVideoTooltip: { type: 'Object' },
      richRemoveIcon: { type: 'Object' },
      richFileIcon: { type: 'Object' },
      onremoverichimage: { type: 'Object' },
      onremoverichfile: { type: 'Object' },
      onremoverichvideo: { type: 'Object' },
      onopenrichimage: { type: 'Object' },
      onopenrichvideo: { type: 'Object' },
      onopenrichfile: { type: 'Object' },
      sendable: { type: 'Boolean' },
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
      inputTestId: { type: 'String', attribute: 'input-test-id' },
      inputAriaLabel: { type: 'String', attribute: 'input-aria-label' },
      sendTestId: { type: 'String', attribute: 'send-test-id' },
      sendSlotTestId: { type: 'String', attribute: 'send-slot-test-id' },
      stopTestId: { type: 'String', attribute: 'stop-test-id' },
      voiceTestId: { type: 'String', attribute: 'voice-test-id' },
      attachTestId: { type: 'String', attribute: 'attach-test-id' },
      actionTestId: { type: 'String', attribute: 'action-test-id' },
      classes: { type: 'String' },
      onsubmit: { type: 'Object' },
      oninput: { type: 'Object' },
      onkeydown: { type: 'Object' },
      onstop: { type: 'Object' },
      onvoice: { type: 'Object' },
      onattach: { type: 'Object' },
      onpaste: { type: 'Object' },
      onattachclick: { type: 'Object' },
      onaction: { type: 'Object' },
      actionIcon: { type: 'Object' },
      actionLabel: { type: 'String', attribute: 'action-label' }
    }
  }}
/>

<script lang="ts">
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';
  let props = $props();
</script>

<ChatComposer {...props} />
