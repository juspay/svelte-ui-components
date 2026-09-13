<svelte:options
  customElement={{
    tag: 'sui-chat-header',
    shadow: 'open',
    props: {
      chatHeaderTitle: { type: 'String', reflect: true, attribute: 'title' },
      subtitle: { type: 'String', reflect: true },
      image: { type: 'String', reflect: true },
      imageAlt: { type: 'String', attribute: 'image-alt' },
      avatar: { type: 'Object' },
      actions: { type: 'Object' },
      closeIcon: { type: 'Object' },
      closeLabel: { type: 'String', attribute: 'close-label' },
      showClose: { type: 'Boolean', attribute: 'show-close' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatHeader from '$lib/ChatHeader/ChatHeader.svelte';
  import { dispatchEvents } from '../dispatch';
  import closeSvg from '$lib/assets/close.svg?raw';
  let { chatHeaderTitle, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  /*
   * ChatHeader.svelte falls back to rendering `image` through <Img> only when
   * `avatar` is absent (`{:else if typeof image === 'string' ...}`). Assigning the
   * snippet unconditionally would make `typeof avatar === 'function'` permanently
   * true and silently suppress that image for every `<sui-chat-header image="...">`
   * that does not also slot `avatar` content, so claim it only when the consumer
   * really did (see PieChart.wc.svelte for the same shape).
   *
   * Two branches rather than a computed snippet reference: a `{#snippet}`
   * containing a `<slot>` declared at the wrapper's top level is hoisted to module
   * scope, where the `<slot>`'s compiled `$$props` lookup no longer resolves.
   * Declaring it inside each `<ChatHeader>` invocation keeps it in component scope.
   *
   * Called as `$host()` again here rather than through the `hostEl` binding above:
   * scripts/check-wc-contract.js's host-guarded-snippet check looks for the literal
   * `$host().querySelector` call shape, and `hostEl` (needed for dispatchEvents,
   * below) would hide this guard from it. $host() is a cheap accessor with no
   * per-call state, so calling it twice changes nothing at runtime.
   */
  const hasAvatarSlot = $host().querySelector('[slot="avatar"]') !== null;

  // onclose is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclose accessor with no exception recorded for
  // 'sui-chat-header:onclose' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `chatHeader.onclose = fn` still runs `fn()` exactly as before, but no synthetic
  // 'close' event is ever dispatched. Called anyway, on every wrapper, rather than
  // special-cased away: proves the collision guard produces this no-op instead of
  // assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

{#if hasAvatarSlot}
  <ChatHeader {...props} {...dispatchers} title={chatHeaderTitle}>
    {#snippet avatar()}
      <slot name="avatar"></slot>
    {/snippet}
    {#snippet actions()}
      <slot name="actions"></slot>
    {/snippet}
    {#snippet closeIcon()}
      <!-- Mirrors ChatHeader.svelte's closeIcon fallback: {@html closeSvg} -->
      <slot name="close-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html closeSvg}
      </slot>
    {/snippet}
    <slot></slot>
  </ChatHeader>
{:else}
  <ChatHeader {...props} {...dispatchers} title={chatHeaderTitle}>
    {#snippet actions()}
      <slot name="actions"></slot>
    {/snippet}
    {#snippet closeIcon()}
      <!-- Mirrors ChatHeader.svelte's closeIcon fallback: {@html closeSvg} -->
      <slot name="close-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html closeSvg}
      </slot>
    {/snippet}
    <slot></slot>
  </ChatHeader>
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
    display: var(--sui-chat-header-display, block);
  }
</style>
