<svelte:options
  customElement={{
    tag: 'sui-banner',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      transitionDuration: { type: 'Number', attribute: 'transition-duration', reflect: true },
      linkText: { type: 'String', reflect: true, attribute: 'link-text' },
      dismissible: { type: 'Boolean', reflect: true },
      visible: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      bannerRole: { type: 'String', attribute: 'role' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' },
      icon: { type: 'Object' },
      rightContent: { type: 'Object' },
      dismissIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Banner from '$lib/Banner/Banner.svelte';
  import type { BannerProperties } from '$lib/Banner/properties';
  // Mirrors Banner.svelte's own dismissIcon default.
  import closeSvg from '$lib/assets/close.svg?raw';
  import { dispatchEvents } from '../dispatch';
  // The element renames `role` to `bannerRole` because the platform already defines `role` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    bannerRole,
    ...props
    // `title` is omitted as well as `role`: it is host-reserved, so the element never
    // declares it and the wrapper's own title snippet is unconditional. Including it
    // would advertise a prop nothing can set.
  }: Omit<BannerProperties, 'role' | 'title'> & { bannerRole?: BannerProperties['role'] } =
    $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick collides with HTMLElement's own onclick accessor with no exception
  // recorded for 'sui-banner:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS,
  // so it stays callback-only -- `banner.onclick = fn` still runs `fn(event)`, but no
  // synthetic 'click' is ever dispatched. ondismiss does not collide, so it dispatches
  // 'dismiss' (no arguments, so no detail) for a consumer who only calls
  // addEventListener.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  A body snippet is passed after {...props} and therefore wins, so a consumer
  assigning `element.icon` used to get nothing: the prop was declared but
  unreachable, the exact defect this wrapper exists to fix. The branch has to
  live *inside* the snippet rather than choosing between two snippets at the
  call site — a `<slot>` hoisted out of the component body compiles against a
  `$$props` binding that is not in scope there, and the element renders nothing
  at all. `title` keeps no property branch: it is host-reserved, never declared.
-->
<Banner {...props} {...dispatchers} role={bannerRole}>
  {#snippet icon()}
    {#if props.icon}{@render props.icon()}{:else}<slot name="icon"></slot>{/if}
  {/snippet}
  {#snippet title()}
    <slot name="title"></slot>
  {/snippet}
  {#snippet rightContent()}
    {#if props.rightContent}{@render props.rightContent()}{:else}<slot name="right-content"
      ></slot>{/if}
  {/snippet}
  {#snippet dismissIcon()}
    <!--
      A slot fallback only helps once the branch actually reaches the <slot> -- Banner's
      own dismissIcon default (bare {@html closeSvg}) is added here so hosts that supply
      neither the dismissIcon property nor slotted content still see the close glyph.
    -->
    {#if props.dismissIcon}{@render props.dismissIcon()}{:else}<slot name="dismiss-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html closeSvg}
      </slot>{/if}
  {/snippet}
</Banner>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-banner-display, block);
  }
</style>
