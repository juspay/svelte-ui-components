<svelte:options
  customElement={{
    tag: 'sui-breadcrumb',
    shadow: 'open',
    props: {
      items: { type: 'Array', reflect: false },
      breadcrumbAriaLabel: { type: 'String', attribute: 'aria-label' },
      classes: { type: 'String', attribute: 'classes' },
      item: { type: 'Object' },
      separator: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import Breadcrumb from '$lib/Breadcrumb/Breadcrumb.svelte';
  import type { Snippet } from 'svelte';
  import type { BreadcrumbItemData, BreadcrumbItemContext } from '$lib/Breadcrumb/properties';

  // `ariaLabel` is an ARIAMixin accessor on every Element, so declaring it as a
  // custom-element prop displaced the one assistive tech reads. The element now
  // exposes `breadcrumbAriaLabel` and still observes the same `aria-label`
  // attribute; only the JavaScript property name moved.
  let {
    breadcrumbAriaLabel = '',
    items = [],
    classes,
    separator
  }: {
    breadcrumbAriaLabel?: string;
    items?: BreadcrumbItemData[];
    classes?: string;
    separator?: Snippet;
  } = $props();
</script>

{#snippet defaultItem(ctx: BreadcrumbItemContext)}
  {#if ctx.isLast}
    <span aria-current="page">{ctx.label}</span>
  {:else if typeof ctx.href === 'string' && ctx.href.length > 0}
    <a href={ctx.href}>{ctx.label}</a>
  {:else}
    <span>{ctx.label}</span>
  {/if}
{/snippet}

<!--
  `separator` is forwarded but NOT bridged to a named slot. Breadcrumb renders it once
  per gap, inside `{#each items}`, and Svelte appends one slot element per render
  site while the DOM assigns light-DOM children to the FIRST matching slot only. A
  four-crumb trail would put the slotted separator between crumbs one and two and leave
  the other two gaps EMPTY -- losing the built-in `/` as well, since the generated
  per-site slot element carries no fallback content. Until then it was not reachable at all:
  the element declared the prop and the wrapper dropped it, so `el.separator = snippet`
  did nothing. Passing it restores the JavaScript path, which is the one path a snippet
  this shape can take.
-->
<Breadcrumb {items} ariaLabel={breadcrumbAriaLabel} item={defaultItem} {separator} {classes} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-breadcrumb-display, block);
  }
</style>
