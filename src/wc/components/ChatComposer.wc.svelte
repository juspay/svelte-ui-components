<svelte:options
  customElement={{
    tag: 'sui-chat-composer',
    shadow: 'open',
    props: {
      value: { type: 'String' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      textDisabled: { type: 'String', attribute: 'text-disabled' },
      voiceDisabled: { type: 'String', attribute: 'voice-disabled' },
      sendDisabled: { type: 'String', attribute: 'send-disabled' },
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
      sendable: { type: 'String' },
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

  // `{ type: 'Boolean' }` is presence-based: an absent attribute arrives as
  // `false`, never `null`. That flattens the tri-state `boolean | null`
  // these four props need (see `controlDisabled.ts` / `properties.ts`) —
  // `false` permanently overrides the `disabled` fallback instead of
  // deferring to it, breaking e.g. `<sui-chat-composer disabled>` (the
  // per-control attributes are absent, so they'd force every control back
  // on). Declared `{ type: 'String' }` instead and restored to `boolean |
  // null` here, mirroring Input.wc.svelte's `asSpellcheck`.
  const asBooleanOrNull = (value: unknown): boolean | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const text = String(value).trim().toLowerCase();
    if (text === 'false') {
      return false;
    }
    if (text === '' || text === 'true') {
      return true;
    }
    return null;
  };

  let { textDisabled, voiceDisabled, sendDisabled, sendable, ...props } = $props();
</script>

<ChatComposer
  {...props}
  textDisabled={asBooleanOrNull(textDisabled)}
  voiceDisabled={asBooleanOrNull(voiceDisabled)}
  sendDisabled={asBooleanOrNull(sendDisabled)}
  sendable={asBooleanOrNull(sendable)}
/>
