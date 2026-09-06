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
  import type { BreadcrumbItemData, BreadcrumbItemContext } from '$lib/Breadcrumb/properties';

  // `ariaLabel` is an ARIAMixin accessor on every Element, so declaring it as a
  // custom-element prop displaced the one assistive tech reads. The element now
  // exposes `breadcrumbAriaLabel` and still observes the same `aria-label`
  // attribute; only the JavaScript property name moved.
  let {
    breadcrumbAriaLabel = '',
    items = [],
    classes
  }: {
    breadcrumbAriaLabel?: string;
    items?: BreadcrumbItemData[];
    classes?: string;
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

<Breadcrumb {items} ariaLabel={breadcrumbAriaLabel} item={defaultItem} {classes} />
