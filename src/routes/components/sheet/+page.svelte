<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Sheet from '$lib/Sheet/Sheet.svelte';

  let showRight = $state(false);
  let showLeft = $state(false);
  let showTop = $state(false);
  let showBottom = $state(false);
  let showRaw = $state(false);
  let showFooter = $state(false);
  let showLifecycle = $state(false);
  let lifecycleLog = $state<string[]>([]);
  let showAnchored = $state(false);
  let showBlocking = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Sheet</h1>
</div>

<h3>Right (default)</h3>
<div class="demo-row">
  <Button text="Open right" onclick={() => (showRight = true)} />
  <Sheet bind:open={showRight} side="right" title="Settings" testId="sheet-right">
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
  <Sheet bind:open={showFooter} side="right" title="Confirm" testId="sheet-footer">
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

<h3>Lifecycle callbacks (onafteropen / onafterclose)</h3>
<div class="demo-row">
  <Button
    text="Open with lifecycle"
    onclick={() => {
      lifecycleLog = [];
      showLifecycle = true;
    }}
  />
  <Sheet
    bind:open={showLifecycle}
    side="right"
    title="Lifecycle demo"
    onafteropen={() => (lifecycleLog = [...lifecycleLog, 'onafteropen fired'])}
    onafterclose={() => (lifecycleLog = [...lifecycleLog, 'onafterclose fired'])}
  >
    {#snippet content()}
      <p>Open and close this sheet to observe the transition-end callbacks in the log below.</p>
    {/snippet}
  </Sheet>
</div>
{#if lifecycleLog.length > 0}
  <p class="state-display">{lifecycleLog.join(' → ')}</p>
{/if}

<h3>Anchored corner panel (dismissible, no dimming backdrop)</h3>
<div class="demo-row" style="position: relative; height: 160px;">
  <Button text="Open account menu" onclick={() => (showAnchored = true)} />
  <Sheet
    bind:open={showAnchored}
    side="right"
    title="Account"
    showOverlay={false}
    dismissOnOutsideClick={true}
    testId="sheet-anchored"
    classes="anchored-sheet"
  >
    {#snippet content()}
      <p>
        Floats below a fixed header, inset from the edge, sized to its content — not a full-height
        edge-to-edge slide-in. Still click-outside and Escape dismissible even though there is no
        dimming backdrop.
      </p>
    {/snippet}
  </Sheet>
</div>

<h3>Blocking backdrop (dimmed, not click-dismissible)</h3>
<div class="demo-row">
  <Button text="Open blocking sheet" onclick={() => (showBlocking = true)} />
  <Sheet
    bind:open={showBlocking}
    side="right"
    title="Required action"
    showOverlay={true}
    dismissOnOutsideClick={false}
    testId="sheet-blocking"
  >
    {#snippet content()}
      <p>
        A dimmed backdrop that blocks interaction with the page underneath but does not close when
        the overlay is clicked — the user must use the close button or an explicit action. Escape
        still closes.
      </p>
    {/snippet}
  </Sheet>
</div>

<style>
  :global(.anchored-sheet) {
    --sheet-top: 56px;
    --sheet-right: 16px;
    --sheet-bottom: auto;
    --sheet-width: 280px;
  }
</style>
