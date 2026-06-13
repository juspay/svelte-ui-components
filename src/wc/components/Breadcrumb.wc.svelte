<svelte:options
  customElement={{
    tag: 'sui-breadcrumb',
    shadow: 'open',
    props: {
      items: { type: 'Array', reflect: false },
      ariaLabel: { type: 'String', attribute: 'aria-label' },
      classes: { type: 'String', attribute: 'classes' }
    }
  }}
/>

<script lang="ts">
  import Breadcrumb from '$lib/Breadcrumb/Breadcrumb.svelte';
  import type { BreadcrumbItemData, BreadcrumbItemContext } from '$lib/Breadcrumb/properties';

  let {
    items = [],
    ariaLabel = '',
    classes
  }: {
    items?: BreadcrumbItemData[];
    ariaLabel?: string;
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

<Breadcrumb {items} {ariaLabel} item={defaultItem} {classes} />
