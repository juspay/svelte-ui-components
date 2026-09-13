<script lang="ts">
  import Separator from '$lib/Separator/Separator.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Separator</h1>
</div>

<h3 class="demo-heading">Horizontal (default)</h3>
<p class="demo-caption">
  A decorative divider between stacked content. Hidden from assistive technology by default.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 320px;">
  <p>Section one</p>
  <Separator testId="separator-horizontal-demo" />
  <p>Section two</p>
</div>

<h3 class="demo-heading">Vertical</h3>
<p class="demo-caption">Divides items placed side by side, e.g. an inline action row.</p>
<div class="demo-row" style="align-items: center; gap: 12px; height: 24px;">
  <span>Edit</span>
  <Separator orientation="vertical" testId="separator-vertical-demo" />
  <span>Duplicate</span>
  <Separator orientation="vertical" />
  <span>Delete</span>
</div>

<h3 class="demo-heading">Non-decorative</h3>
<p class="demo-caption">
  Set <code>decorative={false}</code> when the line actually separates two meaningful sections -- it
  takes <code>role="separator"</code> with a matching <code>aria-orientation</code> instead of being hidden
  from assistive technology.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 320px;" role="menu">
  <div role="menuitem">Cut</div>
  <div role="menuitem">Copy</div>
  <Separator decorative={false} testId="separator-non-decorative-demo" />
  <div role="menuitem">Delete</div>
</div>

<h3 class="demo-heading">Themed</h3>
<p class="demo-caption">
  Every visual value is a CSS custom property -- thickness, color and length can all be overridden.
</p>
<div class="demo-row" style="flex-direction: column; max-width: 320px;">
  <p>Above</p>
  <Separator classes="separator-themed" testId="separator-themed-demo" />
  <p>Below</p>
</div>

<style>
  :global(.separator-themed) {
    --separator-thickness: 3px;
    --separator-background: #7c4dff;
    --separator-length: 60%;
  }
</style>
