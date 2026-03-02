<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Sheet from '$lib/Sheet/Sheet.svelte';

  let showRight = $state(false);
  let showLeft = $state(false);
  let showTop = $state(false);
  let showBottom = $state(false);
  let showRaw = $state(false);
  let showFooter = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Sheet</h1>
</div>

<h3>Right (default)</h3>
<div class="demo-row">
  <Button text="Open right" onclick={() => (showRight = true)} />
  <Sheet bind:open={showRight} side="right" title="Settings">
    {#snippet content()}
      <p>Side panel sliding in from the right. Use for settings, details, or editing forms.</p>
    {/snippet}
  </Sheet>
</div>

<h3>Left</h3>
<div class="demo-row">
  <Button text="Open left" onclick={() => (showLeft = true)} />
  <Sheet bind:open={showLeft} side="left" title="Navigation">
    {#snippet content()}
      <p>Side panel sliding in from the left. Use for navigation or sidebar menus.</p>
    {/snippet}
  </Sheet>
</div>

<h3>Top</h3>
<div class="demo-row">
  <Button text="Open top" onclick={() => (showTop = true)} />
  <Sheet bind:open={showTop} side="top" title="Notifications">
    {#snippet content()}
      <p>Panel sliding down from the top. Use for notifications or alerts.</p>
    {/snippet}
  </Sheet>
</div>

<h3>Bottom</h3>
<div class="demo-row">
  <Button text="Open bottom" onclick={() => (showBottom = true)} />
  <Sheet bind:open={showBottom} side="bottom" title="Actions">
    {#snippet content()}
      <p>Panel sliding up from the bottom. Use for action sheets or mobile drawers.</p>
    {/snippet}
  </Sheet>
</div>

<h3>With footer</h3>
<div class="demo-row">
  <Button text="Open with footer" onclick={() => (showFooter = true)} />
  <Sheet bind:open={showFooter} side="right" title="Confirm">
    {#snippet content()}
      <p>Sheet with a footer for action buttons.</p>
    {/snippet}
    {#snippet footer()}
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <Button text="Cancel" onclick={() => (showFooter = false)} />
        <Button text="Save" onclick={() => (showFooter = false)} />
      </div>
    {/snippet}
  </Sheet>
</div>

<h3>Raw (no header)</h3>
<div class="demo-row">
  <Button text="Open raw" onclick={() => (showRaw = true)} />
  <Sheet bind:open={showRaw} side="right" showCloseButton={false}>
    {#snippet content()}
      <p>
        A completely raw panel with no title or close button. Click the overlay or press Escape to
        dismiss.
      </p>
    {/snippet}
  </Sheet>
</div>
