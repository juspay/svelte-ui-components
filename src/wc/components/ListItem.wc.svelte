<svelte:options
  customElement={{
    tag: 'sui-list-item',
    shadow: 'open',
    props: {
      leftImageUrl: { type: 'String', reflect: true, attribute: 'left-image-url' },
      leftImageFallbackUrl: { type: 'String', attribute: 'left-image-fallback-url' },
      rightImageUrl: { type: 'String', reflect: true, attribute: 'right-image-url' },
      label: { type: 'String', reflect: true },
      sanitize: { type: 'Object' },
      useAccordion: { type: 'Boolean', attribute: 'use-accordion' },
      rightContentText: { type: 'String', reflect: true, attribute: 'right-content-text' },
      testId: { type: 'String', attribute: 'test-id' },
      topSectionTestId: { type: 'String', attribute: 'top-section-test-id' },
      rightImageTestId: { type: 'String', attribute: 'right-image-test-id' },
      leftImageTestId: { type: 'String', attribute: 'left-image-test-id' },
      centerTextTestId: { type: 'String', attribute: 'center-text-test-id' },
      showLoader: { type: 'Boolean', reflect: true, attribute: 'show-loader' },
      showRightContentLoader: { type: 'Boolean', attribute: 'show-right-content-loader' },
      expand: { type: 'Boolean', reflect: true },
      preventFocus: { type: 'Boolean', attribute: 'prevent-focus' },
      suppressRoleAndTabindex: { type: 'Boolean', attribute: 'suppress-role-and-tabindex' },
      transformSvg: { type: 'Object' },
      classes: { type: 'String' },
      onkeydown: { type: 'Object' },
      leftContent: { type: 'Object' },
      centerContent: { type: 'Object' },
      rightContent: { type: 'Object' },
      bottomContent: { type: 'Object' },
      onleftimageclick: { type: 'Object' },
      onrightimageclick: { type: 'Object' },
      oncentertextclick: { type: 'Object' },
      onitemclick: { type: 'Object' },
      ontopsectionclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ListItem from '$lib/ListItem/ListItem.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onleftimageclick/onrightimageclick/oncentertextclick/onitemclick/
  // ontopsectionclick do not collide with a native HTMLElement handler, so all five
  // dispatch -- 'leftimageclick', 'rightimageclick', 'centertextclick', 'itemclick',
  // 'topsectionclick' -- each with detail: the MouseEvent argument, for a consumer
  // who only calls addEventListener. onkeydown DOES collide (recorded in
  // prop-parity.test.ts's KNOWN_HOST_EVENT_HANDLER_DECLARATIONS) and stays
  // callback-only.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!-- A property-assigned snippet wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<ListItem {...props} {...dispatchers}>
  {#snippet leftContent()}
    {#if props.leftContent}{@render props.leftContent()}{:else}<slot name="left-content"
      ></slot>{/if}
  {/snippet}
  {#snippet centerContent()}
    {#if props.centerContent}{@render props.centerContent()}{:else}<slot name="center-content"
      ></slot>{/if}
  {/snippet}
  {#snippet rightContent()}
    {#if props.rightContent}{@render props.rightContent()}{:else}<slot name="right-content"
      ></slot>{/if}
  {/snippet}
  {#snippet bottomContent()}
    {#if props.bottomContent}{@render props.bottomContent()}{:else}<slot name="bottom-content"
      ></slot>{/if}
  {/snippet}
</ListItem>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-list-item-display, block);
  }
</style>
