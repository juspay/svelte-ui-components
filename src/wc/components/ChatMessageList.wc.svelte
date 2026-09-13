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
  import { dispatchEvents } from '../dispatch';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';

  // `message`, `messageBody` and `messageAttachments` stay JS-property-only: each is
  // called with a ChatMessageData argument (see properties.ts), and a <slot> cannot
  // carry that argument -- bridging one to markup would compile and render while
  // silently dropping the value it exists to display. They pass through untouched
  // in the spread below. See docs/ChatMessageList.md.
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // None of onscrollstate/onretry/onfeedback collide with a native HTMLElement
  // handler, so all three dispatch -- 'scrollstate', 'retry', 'feedback' -- for a
  // consumer who only calls addEventListener. onscrollstate's single argument (the
  // `{ atBottom, scrollable }` state object) becomes detail as-is; onfeedback takes
  // two arguments, so its detail is named via CALLBACK_ARGUMENT_NAMES in
  // ../dispatch.ts (ChatMessageList.svelte's own properties.ts parameter names).
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<ChatMessageList {...props} {...dispatchers}>
  {#snippet empty()}
    <slot name="empty"></slot>
  {/snippet}
  {#snippet jumpIcon()}
    <!-- Mirrors ChatMessageList.svelte's jumpIcon fallback: {@html chevronDownSvg} -->
    <slot name="jump-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronDownSvg}
    </slot>
  {/snippet}
</ChatMessageList>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-chat-message-list-display, block);
  }
</style>
