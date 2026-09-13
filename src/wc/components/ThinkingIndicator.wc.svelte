<svelte:options
  customElement={{
    tag: 'sui-thinking-indicator',
    shadow: 'open',
    props: {
      label: { type: 'String', reflect: true },
      detail: { type: 'String' },
      expanded: { type: 'Boolean', reflect: true },
      variant: { type: 'String', reflect: true },
      showElapsed: { type: 'Boolean', attribute: 'show-elapsed' },
      avatar: { type: 'Object' },
      toggleIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      toggleTestId: { type: 'String', attribute: 'toggle-test-id' },
      detailTestId: { type: 'String', attribute: 'detail-test-id' },
      labelTestId: { type: 'String', attribute: 'label-test-id' },
      classes: { type: 'String' },
      rows: { type: 'Array' },
      kind: { type: 'String', reflect: true },
      busy: { type: 'Boolean', reflect: true },
      query: { type: 'String' },
      moreLabel: { type: 'String', attribute: 'more-label' },
      selectable: { type: 'Boolean' },
      selected: { type: 'Object' },
      onrowselect: { type: 'Object' },
      onsettled: { type: 'Object' },
      collapseDelayMs: { type: 'Object', attribute: 'collapse-delay-ms' },
      ontoggle: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  /*
   * Both are guarded rather than carrying the component's default as slot fallback,
   * because neither default survives being mirrored from out here.
   *
   * `avatar` is not only a glyph choice. In the collapsible variant the gate is
   * `{#if avatar || labelIsBusy}`, so always supplying the snippet would put a spinner
   * in front of every `<sui-thinking-indicator>` that is sitting idle -- a state that
   * renders no avatar at all today.
   *
   * `toggleIcon`'s default is an inline `<svg>` sized by `.arrow svg`, which compiles
   * to `.arrow.svelte-<hash> svg:where(.svelte-<hash>)`. Scoping classes are added to
   * markup the OWNING component renders, so the same svg emitted from this wrapper
   * would not match the rule and would render at its intrinsic size inside a 1rem box.
   * A mirror that silently drops the styling is worse than no mirror.
   */
  // Literal `$host()` calls, not `hostEl.querySelector(...)`: src/wc-content-slots.test.ts
  // greps the wrapper source for this exact
  // `$host().querySelector('[slot="..."]')` shape. $host() is idempotent -- it returns the
  // same element every call -- so this is a second read of the same value `hostEl` already
  // holds, not a second source of truth.
  const hasAvatarSlot = $host().querySelector('[slot="avatar"]') !== null;
  const hasToggleIconSlot = $host().querySelector('[slot="toggle-icon"]') !== null;

  // ontoggle collides with HTMLElement's own ontoggle accessor with no exception
  // recorded for 'sui-thinking-indicator:ontoggle' in
  // ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS, so it stays callback-only. Neither
  // onrowselect nor onsettled collides, so both dispatch for a consumer who only calls
  // addEventListener -- 'rowselect' with detail: the callback's own index (number or
  // null, ThinkingIndicator/properties.ts's own onrowselect?.(index) shape), and
  // 'settled' with no detail (onsettled?.() takes no argument).
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  Four branches rather than two conditional snippet props, for the reason
  PieChart.wc.svelte states: a `{#snippet}` declared at the top level of the template is
  hoisted to module scope, while the `<slot>` inside it compiles to
  `$.slot(node, $$props, …)` -- and `$$props` only exists inside the component function.
  The hoisted version throws `$$props is not defined` the moment the snippet is
  rendered, which shows up as a silently empty shadow root rather than as a build error.
  Declaring each snippet inside `<ThinkingIndicator>` keeps it in component scope; the
  branching is what makes it conditional without a top-level declaration.

  Each snippet renders at most once per instance: the three `avatar` sites sit in
  mutually exclusive `variant` branches, and `toggleIcon` exists only in the
  collapsible one.
-->
{#if hasAvatarSlot && hasToggleIconSlot}
  <ThinkingIndicator {...props} {...dispatchers}>
    {#snippet avatar()}
      <slot name="avatar"></slot>
    {/snippet}
    {#snippet toggleIcon()}
      <slot name="toggle-icon"></slot>
    {/snippet}
  </ThinkingIndicator>
{:else if hasAvatarSlot}
  <ThinkingIndicator {...props} {...dispatchers}>
    {#snippet avatar()}
      <slot name="avatar"></slot>
    {/snippet}
  </ThinkingIndicator>
{:else if hasToggleIconSlot}
  <ThinkingIndicator {...props} {...dispatchers}>
    {#snippet toggleIcon()}
      <slot name="toggle-icon"></slot>
    {/snippet}
  </ThinkingIndicator>
{:else}
  <ThinkingIndicator {...props} {...dispatchers} />
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
    display: var(--sui-thinking-indicator-display, block);
  }
</style>
