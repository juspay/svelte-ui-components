<svelte:options
  customElement={{
    tag: 'sui-gallery',
    shadow: 'open',
    props: {
      images: { type: 'Object' },
      lightboxTransitionDuration: {
        type: 'Number',
        attribute: 'lightbox-transition-duration',
        reflect: true
      },
      view: { type: 'String' },
      open: { type: 'Boolean', reflect: true },
      activeIndex: { type: 'Number', attribute: 'active-index', reflect: true },
      enableLightbox: { type: 'Boolean', attribute: 'enable-lightbox' },
      loop: { type: 'Boolean' },
      showCounter: { type: 'Boolean', attribute: 'show-counter' },
      showCaption: { type: 'Boolean', attribute: 'show-caption' },
      previousIcon: { type: 'Object' },
      nextIcon: { type: 'Object' },
      closeIcon: { type: 'Object' },
      editIcon: { type: 'Object' },
      deleteIcon: { type: 'Object' },
      itemFooter: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onkeydown: { type: 'Object' },
      onimageclick: { type: 'Object' },
      oneditclick: { type: 'Object' },
      ondeleteclick: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Gallery from '$lib/Gallery/Gallery.svelte';
  import Icon from '$lib/Icon/Icon.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';
  import chevronLeftSvg from '$lib/assets/chevron-left-lg.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right-lg.svg?raw';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onimageclick/oneditclick/ondeleteclick/onopen do not collide with a native
  // HTMLElement handler, so they dispatch 'imageclick'/'editclick'/'deleteclick'/'open'
  // for a consumer who only calls addEventListener -- the first three carry
  // detail: { index, event } (Gallery.svelte's own parameter names, named once in
  // ../dispatch.ts's CALLBACK_ARGUMENT_NAMES), 'open' carries the bare index.
  // onkeydown/onclose/onchange DO collide (recorded in prop-parity.test.ts's
  // KNOWN_HOST_EVENT_HANDLER_DECLARATIONS) and stay callback-only.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  A property-assigned icon wins; the slot is the fallback, carrying Gallery's own
  `<Icon svg={...} />` as ITS fallback so a consumer supplying neither still sees the
  built-in control. The branch stays inside the body snippet so `<slot>` keeps its
  `$$props` scope. `<Icon>` carries its own styles, so mirroring it renders the same
  glyph at the same size the component would have.

  The three lightbox controls each render at most once. `editIcon` and `deleteIcon`
  are deliberately NOT bridged: Gallery renders those inside `{#each images}`, once
  per image, and Svelte appends one `<slot>` element per render site while the DOM
  assigns light-DOM children to the FIRST matching slot only. With three images the
  slotted icon would reach image one and images two and three would render EMPTY --
  losing the built-in glyph too, since the generated per-site `<slot>` carries no
  fallback. They stay JS-property-only props.
-->
<Gallery {...props} {...dispatchers}>
  {#snippet closeIcon()}
    {#if props.closeIcon}{@render props.closeIcon()}{:else}<slot name="close-icon">
        <Icon svg={closeSvg} />
      </slot>{/if}
  {/snippet}
  {#snippet previousIcon()}
    {#if props.previousIcon}{@render props.previousIcon()}{:else}<slot name="previous-icon">
        <Icon svg={chevronLeftSvg} />
      </slot>{/if}
  {/snippet}
  {#snippet nextIcon()}
    {#if props.nextIcon}{@render props.nextIcon()}{:else}<slot name="next-icon">
        <Icon svg={chevronRightSvg} />
      </slot>{/if}
  {/snippet}
</Gallery>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-gallery-display, block);
  }
</style>
