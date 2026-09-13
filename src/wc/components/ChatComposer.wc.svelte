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
      // Not 'Boolean': presence-based conversion would flatten the tri-state
      // `boolean | 'idle' | 'recording' | 'busy'` to true/false, the same
      // reason textDisabled/voiceDisabled/sendDisabled below are 'String'.
      recording: { type: 'String' },
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
      statusText: { type: 'String', attribute: 'status-text' },
      statusTestId: { type: 'String', attribute: 'status-test-id' },
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
      oncanceldictation: { type: 'Object' },
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
  import type { ChatComposerDictationState } from '$lib/ChatComposer/dictationState';
  import { dispatchEvents } from '../dispatch';
  import sendSvg from '$lib/assets/send.svg?raw';
  import stopSvg from '$lib/assets/stop.svg?raw';
  import micSvg from '$lib/assets/mic.svg?raw';
  import attachSvg from '$lib/assets/attach.svg?raw';

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

  // Same flattening problem as the three `Boolean`-typed disables above, one
  // level wider: an attribute value is always a string, so `recording="busy"`
  // must reach the component as the literal string `'busy'` while a bare
  // presence attribute (`<sui-chat-composer recording>`, the boolean-era
  // markup) must keep meaning `true`, not the string `''`.
  const asRecording = (value: unknown): boolean | ChatComposerDictationState => {
    // Absent (never set as either attribute or property) must stay the
    // component's own `false` default -- falling through to the string branch
    // below would read a missing prop as `''`, the same shape as the bare
    // `<sui-chat-composer recording>` presence attribute, and wrongly turn an
    // untouched composer into a recording one.
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 'idle' || value === 'recording' || value === 'busy') {
      return value;
    }
    const text = String(value).trim().toLowerCase();
    if (text === 'false') {
      return false;
    }
    if (text === '' || text === 'true') {
      return true;
    }
    if (text === 'idle' || text === 'recording' || text === 'busy') {
      return text;
    }
    return false;
  };

  let { textDisabled, voiceDisabled, sendDisabled, sendable, recording, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  /*
   * ChatComposer.svelte falls back to a built-in rich-attachments strip or a plain
   * pill strip when `attachmentsPreview` is absent (`{:else if hasRichAttachments}` /
   * `{:else if attachments.length > 0}`). Assigning the snippet unconditionally would
   * make `typeof attachmentsPreview === 'function'` permanently true and silently
   * replace both of those with nothing for any consumer who did not also slot
   * `attachments-preview` content, so claim it only when the consumer really did.
   *
   * Two branches rather than a computed snippet reference: a `{#snippet}` containing
   * a `<slot>` declared at the wrapper's top level is hoisted to module scope, where
   * the `<slot>`'s compiled `$$props` lookup no longer resolves. Declaring it inside
   * each `<ChatComposer>` invocation keeps it in component scope (see PieChart.wc.svelte).
   *
   * Called as `$host()` again here rather than through the `hostEl` binding above:
   * scripts/check-wc-contract.js's host-guarded-snippet check looks for the literal
   * `$host().querySelector` call shape, and `hostEl` (needed for dispatchEvents,
   * below) would hide this guard from it. $host() is a cheap accessor with no
   * per-call state, so calling it twice changes nothing at runtime.
   */
  const hasAttachmentsPreviewSlot = $host().querySelector('[slot="attachments-preview"]') !== null;

  // onsubmit, oninput, onkeydown and onpaste each collide with HTMLElement's own
  // accessor of the same name, with no exception recorded in ../dispatch.ts's
  // DISPATCH_COLLISION_EXCEPTIONS, so all four stay callback-only. The other twelve --
  // onstop, onvoice, oncanceldictation, onattach, onattachclick, onremoverichimage,
  // onremoverichfile, onremoverichvideo, onopenrichimage, onopenrichvideo,
  // onopenrichfile, onaction -- collide with nothing and dispatch 'stop', 'voice',
  // 'canceldictation', 'attach', 'attachclick', 'removerichimage', 'removerichfile',
  // 'removerichvideo', 'openrichimage', 'openrichvideo', 'openrichfile' and 'action'
  // for a consumer who only calls addEventListener. Every one of those takes at
  // most one argument (see ChatComposer/properties.ts), so no CALLBACK_ARGUMENT_NAMES
  // entry is needed for this wrapper.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

{#if hasAttachmentsPreviewSlot}
  <ChatComposer
    {...props}
    {...dispatchers}
    textDisabled={asBooleanOrNull(textDisabled)}
    voiceDisabled={asBooleanOrNull(voiceDisabled)}
    sendDisabled={asBooleanOrNull(sendDisabled)}
    sendable={asBooleanOrNull(sendable)}
    recording={asRecording(recording)}
  >
    {#snippet attachmentsPreview()}
      <slot name="attachments-preview"></slot>
    {/snippet}
    {#snippet sendIcon()}
      <!-- Mirrors ChatComposer.svelte's sendIcon fallback: {@html sendSvg} -->
      <slot name="send-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sendSvg}
      </slot>
    {/snippet}
    {#snippet stopIcon()}
      <!-- Mirrors ChatComposer.svelte's stopIcon fallback: {@html stopSvg} -->
      <slot name="stop-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html stopSvg}
      </slot>
    {/snippet}
    {#snippet voiceIcon()}
      <!-- Mirrors ChatComposer.svelte's voiceIcon fallback: {@html micSvg} -->
      <slot name="voice-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html micSvg}
      </slot>
    {/snippet}
    {#snippet attachIcon()}
      <!-- Mirrors ChatComposer.svelte's attachIcon fallback: {@html attachSvg} -->
      <slot name="attach-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html attachSvg}
      </slot>
    {/snippet}
    {#snippet actionIcon()}
      <!-- Mirrors ChatComposer.svelte's actionIcon fallback: {@html micSvg} -->
      <slot name="action-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html micSvg}
      </slot>
    {/snippet}
    {#snippet richRemoveIcon()}
      <!-- Mirrors AttachmentChipRow.svelte's removeIcon fallback (forwarded as richRemoveIcon):
           <svg class="cross" viewBox="0 0 16 16" ...>. -->
      <slot name="rich-remove-icon">
        <svg class="cross" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8m0-8l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </slot>
    {/snippet}
    {#snippet richFileIcon()}
      <!-- Mirrors AttachmentChipRow.svelte's fileIcon fallback (forwarded as richFileIcon):
           <svg class="file-glyph" viewBox="0 0 24 24" ...>. -->
      <slot name="rich-file-icon">
        <svg class="file-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
            fill="currentColor"
          />
          <path
            d="M14 2v6h6"
            stroke="var(--attachment-chip-row-file-glyph-fold-color, #ffffff)"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    {/snippet}
    {#snippet leading()}
      <slot name="leading"></slot>
    {/snippet}
  </ChatComposer>
{:else}
  <ChatComposer
    {...props}
    {...dispatchers}
    textDisabled={asBooleanOrNull(textDisabled)}
    voiceDisabled={asBooleanOrNull(voiceDisabled)}
    sendDisabled={asBooleanOrNull(sendDisabled)}
    sendable={asBooleanOrNull(sendable)}
    recording={asRecording(recording)}
  >
    {#snippet sendIcon()}
      <!-- Mirrors ChatComposer.svelte's sendIcon fallback: {@html sendSvg} -->
      <slot name="send-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sendSvg}
      </slot>
    {/snippet}
    {#snippet stopIcon()}
      <!-- Mirrors ChatComposer.svelte's stopIcon fallback: {@html stopSvg} -->
      <slot name="stop-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html stopSvg}
      </slot>
    {/snippet}
    {#snippet voiceIcon()}
      <!-- Mirrors ChatComposer.svelte's voiceIcon fallback: {@html micSvg} -->
      <slot name="voice-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html micSvg}
      </slot>
    {/snippet}
    {#snippet attachIcon()}
      <!-- Mirrors ChatComposer.svelte's attachIcon fallback: {@html attachSvg} -->
      <slot name="attach-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html attachSvg}
      </slot>
    {/snippet}
    {#snippet actionIcon()}
      <!-- Mirrors ChatComposer.svelte's actionIcon fallback: {@html micSvg} -->
      <slot name="action-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html micSvg}
      </slot>
    {/snippet}
    {#snippet richRemoveIcon()}
      <!-- Mirrors AttachmentChipRow.svelte's removeIcon fallback (forwarded as richRemoveIcon):
           <svg class="cross" viewBox="0 0 16 16" ...>. -->
      <slot name="rich-remove-icon">
        <svg class="cross" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8m0-8l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </slot>
    {/snippet}
    {#snippet richFileIcon()}
      <!-- Mirrors AttachmentChipRow.svelte's fileIcon fallback (forwarded as richFileIcon):
           <svg class="file-glyph" viewBox="0 0 24 24" ...>. -->
      <slot name="rich-file-icon">
        <svg class="file-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
            fill="currentColor"
          />
          <path
            d="M14 2v6h6"
            stroke="var(--attachment-chip-row-file-glyph-fold-color, #ffffff)"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    {/snippet}
    {#snippet leading()}
      <slot name="leading"></slot>
    {/snippet}
  </ChatComposer>
{/if}

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-chat-composer-display, block);
  }
</style>
