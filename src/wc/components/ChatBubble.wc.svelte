<svelte:options
  customElement={{
    tag: 'sui-chat-bubble',
    shadow: 'open',
    props: {
      open: { type: 'Boolean', reflect: true },
      position: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      closeLabel: { type: 'String', attribute: 'close-label' },
      icon: { type: 'Object' },
      openIcon: { type: 'Object' },
      // `children` is deliberately NOT declared here: `element.children` is a native
      // HTMLElement accessor, and a same-named custom-element prop displaces it (see
      // scripts/wc-parity/prop-parity.test.ts). Light DOM already carries the content
      // through the default <slot> below, so no JS-property path is needed for it.
      draggable: { type: 'Boolean', reflect: true },
      dragMode: { type: 'String', attribute: 'drag-mode' },
      dragX: { type: 'Number', attribute: 'drag-x' },
      dragY: { type: 'Number', attribute: 'drag-y' },
      resizable: { type: 'Boolean', reflect: true },
      panelWidth: { type: 'Number', attribute: 'panel-width' },
      panelHeight: { type: 'Number', attribute: 'panel-height' },
      minPanelWidth: { type: 'Number', attribute: 'min-panel-width' },
      minPanelHeight: { type: 'Number', attribute: 'min-panel-height' },
      expanded: { type: 'Boolean', reflect: true },
      expandedPanelWidth: { type: 'Number', attribute: 'expanded-panel-width' },
      expandedPanelHeight: { type: 'Number', attribute: 'expanded-panel-height' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      ontoggle: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChatBubble from '$lib/ChatBubble/ChatBubble.svelte';
  import { dispatchEvents } from '../dispatch';
  import chatSvg from '$lib/assets/chat.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onopen collides with nothing, so it dispatches 'open' for a consumer who
  // only calls addEventListener. onclose and ontoggle both collide with HTMLElement's
  // own accessors (onclose, ontoggle) with no exception recorded in
  // ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS, so both stay callback-only.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<ChatBubble {...props} {...dispatchers}>
  {#snippet icon()}
    <!-- Mirrors ChatBubble.svelte's icon fallback: {@html chatSvg} -->
    <slot name="icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chatSvg}
    </slot>
  {/snippet}
  {#snippet openIcon()}
    <!-- Mirrors ChatBubble.svelte's openIcon fallback: {@html closeSvg} -->
    <slot name="open-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html closeSvg}
    </slot>
  {/snippet}
  <slot></slot>
</ChatBubble>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-chat-bubble-display, block);
  }
</style>
