<svelte:options
  customElement={{
    tag: 'sui-status',
    shadow: 'open',
    props: {
      statusIcon: { type: 'String', reflect: true, attribute: 'status-icon' },
      statusIconAlt: { type: 'String', reflect: true, attribute: 'status-icon-alt' },
      statusText: { type: 'String', reflect: true, attribute: 'status-text' },
      statusDescription: { type: 'String', reflect: true, attribute: 'status-description' },
      statusTextTag: { type: 'String', reflect: true, attribute: 'status-text-tag' },
      buttonProperties: { type: 'Object' },
      classes: { type: 'String' },
      icon: { type: 'Object' },
      descriptionSnippet: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      onbuttonclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Status from '$lib/Status/Status.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // `icon`'s own default is an `Img` resolved from `statusIcon`/`statusIconAlt`
  // with a derived legacy-path fallback -- reproducing that here would mean
  // re-deriving Status.svelte's own `statusIconFallback` check, so the snippet is
  // claimed only when the consumer actually slotted something, which leaves
  // Status's own `Img` default in place otherwise (same tradeoff PieChart.wc.svelte
  // makes for `center`/`empty`).
  //
  // Literal `$host()` call, not `hostEl.querySelector(...)`: src/wc-content-slots.test.ts
  // greps the wrapper source for this exact
  // `$host().querySelector('[slot="..."]')` shape. $host() is idempotent -- it returns the
  // same element every call -- so this is a second read of the same value `hostEl` already
  // holds, not a second source of truth.
  const hasIconSlot = $host().querySelector('[slot="icon"]') !== null;

  // onbuttonclick does not collide with a native HTMLElement handler, so it
  // dispatches 'buttonclick' for a consumer who only calls addEventListener. Its
  // declared type below reads `() => void`, but Status.svelte wires it straight
  // into Button's own onclick, and Button.svelte's handler calls it with the
  // click's MouseEvent -- one argument, not zero -- so detail is that MouseEvent
  // (dispatch-integration.test.ts verifies this rather than trusting the signature).
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!-- Closes the review finding on #503 that `children` was unreachable from the
     custom element, without declaring it as a prop — declaring it leaves
     `element.children` undefined. Safe here because the component renders
     children inline with no wrapper element of its own, so an always-present
     snippet contributes nothing when the slot is empty. ChatHeader and StatCard
     deliberately do NOT get this: their `{#if}` *creates* the wrapping element
     (`.extra`, `.statcard-children`), so always supplying the snippet would
     render an empty div — StatCard's carries a 4px margin. Those two need
     light-DOM detection, which is a separate change. -->

<!--
  `descriptionSnippet` needs no guard: `.status-description` is already on the page
  unconditionally, and its own default is a plain `{@html statusDescription}`, which
  the fallback below reproduces exactly, so an unfilled slot still shows the same
  description text instead of leaving the area empty.

  Both snippets read `props.X` (the JS-assigned fallback) inside an `{#if}`, which is
  what keeps a `{#snippet}` declared at the template's top level out of hoisted
  module scope -- see Card.wc.svelte's comment above its own snippets for the
  compiled-output detail.
-->
{#snippet iconImpl()}
  {#if props.icon}{@render props.icon()}{:else}<slot name="icon"></slot>{/if}
{/snippet}
{#snippet descriptionSnippetImpl()}
  {#if props.descriptionSnippet}{@render props.descriptionSnippet()}{:else}<slot
      name="description-snippet"
      ><!-- eslint-disable-next-line -->{@html props.statusDescription ?? ''}</slot
    >{/if}
{/snippet}

<Status
  {...props}
  {...dispatchers}
  icon={hasIconSlot ? iconImpl : props.icon}
  descriptionSnippet={descriptionSnippetImpl}
>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Status>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-status-display, block);
  }
</style>
