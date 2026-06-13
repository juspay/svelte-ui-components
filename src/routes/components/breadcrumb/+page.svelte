<script lang="ts">
  import Breadcrumb from '$lib/Breadcrumb/Breadcrumb.svelte';
  import type { BreadcrumbItemData, BreadcrumbItemContext } from '$lib/Breadcrumb/properties';

  const basicItems: BreadcrumbItemData[] = [
    { href: '/components/breadcrumb', label: 'Home' },
    { href: '/components/breadcrumb', label: 'Products' },
    { href: '', label: 'Laptops' }
  ];

  const deepItems: BreadcrumbItemData[] = [
    { href: '/components/breadcrumb', label: 'Home' },
    { href: '/components/breadcrumb', label: 'Settings' },
    { href: '/components/breadcrumb', label: 'Account' },
    { href: '/components/breadcrumb', label: 'Security' },
    { href: '', label: 'Two-Factor Auth' }
  ];

  const iconItems: BreadcrumbItemData[] = [
    { href: '/components/breadcrumb', label: 'Home' },
    { href: '/components/breadcrumb', label: 'Orders' },
    { href: '', label: 'Order #1234' }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Breadcrumb</h1>
</div>

<h3>(a) Basic hyperlink trail</h3>
<div class="demo-row">
  <Breadcrumb items={basicItems} ariaLabel="Page navigation">
    {#snippet item(ctx: BreadcrumbItemContext)}
      {#if ctx.isLast}
        <span aria-current="page">{ctx.label}</span>
      {:else}
        <a href={ctx.href}>{ctx.label}</a>
      {/if}
    {/snippet}
  </Breadcrumb>
</div>

<h3>Deep hierarchy</h3>
<div class="demo-row">
  <Breadcrumb items={deepItems} ariaLabel="Page navigation">
    {#snippet item(ctx: BreadcrumbItemContext)}
      {#if ctx.isLast}
        <span aria-current="page">{ctx.label}</span>
      {:else}
        <a href={ctx.href}>{ctx.label}</a>
      {/if}
    {/snippet}
  </Breadcrumb>
</div>

<h3>(b) Icon crumb inside item snippet</h3>
<div class="demo-row">
  <Breadcrumb items={iconItems} ariaLabel="Order navigation">
    {#snippet item(ctx: BreadcrumbItemContext)}
      {#if ctx.isLast}
        <span aria-current="page" style="display:inline-flex;align-items:center;gap:4px;">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
            ><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
            /><path d="M16 10a4 4 0 0 1-8 0" /></svg
          >
          {ctx.label}
        </span>
      {:else if ctx.index === 0}
        <a href={ctx.href} style="display:inline-flex;align-items:center;gap:4px;">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
            ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
              points="9 22 9 12 15 12 15 22"
            /></svg
          >
          {ctx.label}
        </a>
      {:else}
        <a href={ctx.href}>{ctx.label}</a>
      {/if}
    {/snippet}
  </Breadcrumb>
</div>

<h3>(c) Custom separator snippet</h3>
<div class="demo-row">
  <Breadcrumb items={basicItems} ariaLabel="Page navigation">
    {#snippet item(ctx: BreadcrumbItemContext)}
      {#if ctx.isLast}
        <span aria-current="page">{ctx.label}</span>
      {:else}
        <a href={ctx.href}>{ctx.label}</a>
      {/if}
    {/snippet}
    {#snippet separator()}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
      >
    {/snippet}
  </Breadcrumb>
</div>
