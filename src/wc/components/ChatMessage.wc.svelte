<svelte:options
  customElement={{
    tag: 'sui-chat-message',
    shadow: 'open',
    props: {
      chatMessageRole: { type: 'String', reflect: true, attribute: 'role' },
      content: { type: 'String' },
      html: { type: 'String' },
      markdown: { type: 'String' },
      body: { type: 'Object' },
      streaming: { type: 'Boolean', reflect: true },
      typewriter: { type: 'Boolean', reflect: true },
      typewriterSpeed: { type: 'Number', attribute: 'typewriter-speed' },
      clampLines: { type: 'Number', attribute: 'clamp-lines' },
      marker: { type: 'Boolean', reflect: true },
      status: { type: 'String', reflect: true },
      avatar: { type: 'Object' },
      header: { type: 'Object' },
      attachments: { type: 'Object' },
      allowCopy: { type: 'Boolean', attribute: 'allow-copy' },
      actions: { type: 'Object' },
      copyLabel: { type: 'String', attribute: 'copy-label' },
      retryLabel: { type: 'String', attribute: 'retry-label' },
      expandLabel: { type: 'String', attribute: 'expand-label' },
      collapseLabel: { type: 'String', attribute: 'collapse-label' },
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
  import { dispatchEvents } from '../dispatch';
  let { chatMessageRole, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  /*
   * ChatMessage.svelte only falls into its typewriter / html / plain-text rendering
   * when `hasBody` (`typeof body === 'function'`) is false (see ChatMessage.svelte's
   * `{#if hasBody}...{:else if typewriterActive}...{:else if hasHtml}...{:else if
   * content.length > 0}`). Assigning the snippet unconditionally would make `hasBody`
   * permanently true and silently blank out the entire message -- markdown, html and
   * plain text alike -- for every message that does not also slot `body` content, so
   * claim it only when the consumer really did.
   *
   * Two branches rather than a computed snippet reference: a `{#snippet}` containing
   * a `<slot>` declared at the wrapper's top level is hoisted to module scope, where
   * the `<slot>`'s compiled `$$props` lookup no longer resolves. Declaring it inside
   * each `<ChatMessage>` invocation keeps it in component scope (see PieChart.wc.svelte).
   */
  const hasBodySlot = hostEl.querySelector('[slot="body"]') !== null;

  // oncopy collides with HTMLElement's own oncopy accessor, so it stays
  // callback-only. onretry and onfeedback collide with nothing and dispatch 'retry'
  // and 'feedback' for a consumer who only calls addEventListener -- 'retry' with
  // no detail, 'feedback' with the single ChatMessageFeedback value as detail (one
  // argument, so no CALLBACK_ARGUMENT_NAMES entry is needed here).
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

{#if hasBodySlot}
  <ChatMessage {...props} {...dispatchers} role={chatMessageRole}>
    {#snippet body()}
      <slot name="body"></slot>
    {/snippet}
    {#snippet avatar()}
      <slot name="avatar"></slot>
    {/snippet}
    {#snippet header()}
      <slot name="header"></slot>
    {/snippet}
    {#snippet attachments()}
      <slot name="attachments"></slot>
    {/snippet}
    {#snippet actions()}
      <slot name="actions"></slot>
    {/snippet}
  </ChatMessage>
{:else}
  <ChatMessage {...props} {...dispatchers} role={chatMessageRole}>
    {#snippet avatar()}
      <slot name="avatar"></slot>
    {/snippet}
    {#snippet header()}
      <slot name="header"></slot>
    {/snippet}
    {#snippet attachments()}
      <slot name="attachments"></slot>
    {/snippet}
    {#snippet actions()}
      <slot name="actions"></slot>
    {/snippet}
  </ChatMessage>
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
    display: var(--sui-chat-message-display, block);
  }
</style>
