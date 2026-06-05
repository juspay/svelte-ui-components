<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Sheet from '$lib/Sheet/Sheet.svelte';

  let showRight = $state(false);
  let showLeft = $state(false);
  let showTop = $state(false);
  let showBottom = $state(false);
  let showRaw = $state(false);
  let showFooter = $state(false);

  // Animation-customisation demos (PR #206 — CSS-variable-driven animation)
  let showSlowPanel = $state(false);
  let showBouncePanel = $state(false);
  let showInstantClose = $state(false);
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

<h2>Animation</h2>
<p>
  The panel and overlay entry/exit animations are fully driven by CSS custom properties (added in
  PR #206). Override keyframe names, duration, easing, and fill-mode independently for both
  the panel and the overlay, in both entry and exit directions.
</p>

<h3>Slow entry (800 ms ease-in-out)</h3>
<div class="demo-row">
  <Button text="Open slow panel" onclick={() => (showSlowPanel = true)} />
  <Sheet
    bind:open={showSlowPanel}
    side="right"
    title="Slow entry"
    classes="demo-sheet-slow"
  >
    {#snippet content()}
      <p>
        Panel entry duration is 800 ms with <code>ease-in-out</code> easing. The overlay fades in at
        the default 200 ms — the two animations run in parallel and are independently controlled.
      </p>
    {/snippet}
  </Sheet>
</div>

<h3>Custom exit — instant close (0 ms exit)</h3>
<div class="demo-row">
  <Button text="Open instant-close panel" onclick={() => (showInstantClose = true)} />
  <Sheet
    bind:open={showInstantClose}
    side="left"
    title="Instant close"
    classes="demo-sheet-instant-close"
  >
    {#snippet content()}
      <p>
        Exit duration is set to <code>1ms</code> so the panel disappears immediately on dismiss,
        while the entry slide still plays at the default 300 ms. Useful for flows where the user
        should not wait for the close animation.
      </p>
    {/snippet}
  </Sheet>
</div>

<h3>Custom keyframes — bounce entry</h3>
<div class="demo-row">
  <Button text="Open bounce panel" onclick={() => (showBouncePanel = true)} />
  <Sheet
    bind:open={showBouncePanel}
    side="bottom"
    title="Bounce entry"
    classes="demo-sheet-bounce"
  >
    {#snippet content()}
      <p>
        <code>--sheet-panel-animation-name</code> is set to a custom
        <code>@keyframes demo-bounce-in</code> defined in the consumer stylesheet. Any named
        keyframes can be supplied — the component applies them as-is.
      </p>
    {/snippet}
  </Sheet>
</div>

<style>
  :global(.demo-sheet-slow) {
    --sheet-panel-animation-duration: 800ms;
    --sheet-panel-animation-easing: ease-in-out;
  }

  :global(.demo-sheet-instant-close) {
    --sheet-panel-exit-animation-duration: 1ms;
    --sheet-overlay-exit-animation-duration: 1ms;
  }

  :global(.demo-sheet-bounce) {
    --sheet-panel-animation-name: demo-bounce-in;
    --sheet-panel-animation-duration: 500ms;
    --sheet-panel-animation-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes demo-bounce-in {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
</style>
