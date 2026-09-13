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
  import type { ChatProperties } from '$lib/Chat/properties';
  import { dispatchEvents } from '../dispatch';
  import sendSvg from '$lib/assets/send.svg?raw';
  import stopSvg from '$lib/assets/stop.svg?raw';
  import micSvg from '$lib/assets/mic.svg?raw';
  import attachSvg from '$lib/assets/attach.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  // The element renames `title` to `chatTitle` because the platform already defines `title` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    chatTitle,
    ...props
  }: Omit<ChatProperties, 'title'> & { chatTitle?: ChatProperties['title'] } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  /*
   * Chat.svelte forwards `headerAvatar` straight into ChatHeader's `avatar`, whose
   * own fallback renders `image` through <Img> only when `avatar` is absent (see
   * ChatHeader.svelte's `{:else if typeof image === 'string' ...}`). Assigning the
   * snippet unconditionally would make that check permanently true and silently
   * suppress the image for every <sui-chat image="..."> that does not also slot
   * `header-avatar` content, so claim it only when the consumer really did.
   *
   * Two branches rather than a computed snippet reference: a `{#snippet}` containing
   * a `<slot>` declared at the wrapper's top level is hoisted to module scope, where
   * the `<slot>`'s compiled `$$props` lookup no longer resolves. Declaring it inside
   * each `<Chat>` invocation keeps it in component scope (see PieChart.wc.svelte).
   */
  const hasHeaderAvatarSlot = hostEl.querySelector('[slot="header-avatar"]') !== null;

  // onclose collides with HTMLElement's own onclose accessor, so it stays
  // callback-only. The other eight -- onsend, onsuggestion, onstop, onvoice, onattach,
  // onretry, onfeedback, onscrollstate -- collide with nothing and dispatch
  // 'send', 'suggestion', 'stop', 'voice', 'attach', 'retry', 'feedback' and
  // 'scrollstate' for a consumer who only calls addEventListener. onsend,
  // onsuggestion and onfeedback take two arguments each, so their detail is named via
  // CALLBACK_ARGUMENT_NAMES in ../dispatch.ts (Chat.svelte's own properties.ts
  // parameter names) instead of an invented shape; onscrollstate forwards
  // ChatMessageListProperties['onscrollstate'] verbatim (one argument, the state
  // object), so its detail is that object as-is.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

{#if hasHeaderAvatarSlot}
  <Chat {...props} {...dispatchers} title={chatTitle}>
    {#snippet headerAvatar()}
      <slot name="header-avatar"></slot>
    {/snippet}
    {#snippet headerActions()}
      <slot name="header-actions"></slot>
    {/snippet}
    {#snippet headerContent()}
      <slot name="header-content"></slot>
    {/snippet}
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
    {#snippet composerLeading()}
      <slot name="composer-leading"></slot>
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
    {#snippet jumpIcon()}
      <!-- Mirrors ChatMessageList.svelte's jumpIcon fallback: {@html chevronDownSvg} -->
      <slot name="jump-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html chevronDownSvg}
      </slot>
    {/snippet}
  </Chat>
{:else}
  <Chat {...props} {...dispatchers} title={chatTitle}>
    {#snippet headerActions()}
      <slot name="header-actions"></slot>
    {/snippet}
    {#snippet headerContent()}
      <slot name="header-content"></slot>
    {/snippet}
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
    {#snippet composerLeading()}
      <slot name="composer-leading"></slot>
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
    {#snippet jumpIcon()}
      <!-- Mirrors ChatMessageList.svelte's jumpIcon fallback: {@html chevronDownSvg} -->
      <slot name="jump-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html chevronDownSvg}
      </slot>
    {/snippet}
  </Chat>
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
    display: var(--sui-chat-display, block);
  }
</style>
