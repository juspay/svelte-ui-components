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
  let showCentered = $state(false);
  let showHeading = $state(false);
  let showCustomOverlayLabel = $state(false);
  let showCappedBottom = $state(false);
  let showWidthTokenBottom = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Sheet</h1>
</div>

<h3>Right (default)</h3>
<div class="demo-row">
  <Button text="Open right" onclick={() => (showRight = true)} testId="sheet-right-trigger" />
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
  <Button text="Open top" onclick={() => (showTop = true)} testId="sheet-top-trigger" />
  <Sheet bind:open={showTop} side="top" title="Notifications" testId="sheet-top">
    {#snippet content()}
      <p>Panel sliding down from the top. Use for notifications or alerts.</p>
    {/snippet}
  </Sheet>
</div>

<h3>Bottom</h3>
<div class="demo-row">
  <Button text="Open bottom" onclick={() => (showBottom = true)} testId="sheet-bottom-trigger" />
  <Sheet bind:open={showBottom} side="bottom" title="Actions" testId="sheet-bottom">
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
  <Button
    text="Open account menu"
    onclick={() => (showAnchored = true)}
    testId="sheet-anchored-trigger"
  />
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
  <Button
    text="Open blocking sheet"
    onclick={() => (showBlocking = true)}
    testId="sheet-blocking-trigger"
  />
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

<h3>Custom overlay label (overlayAriaLabel)</h3>
<div class="demo-row">
  <Button
    text="Open with custom overlay label"
    onclick={() => (showCustomOverlayLabel = true)}
    testId="sheet-custom-overlay-label-trigger"
  />
  <Sheet
    bind:open={showCustomOverlayLabel}
    side="left"
    title="Menu"
    dismissOnOutsideClick={true}
    overlayAriaLabel="Fermer"
    testId="sheet-custom-overlay-label"
  >
    {#snippet content()}
      <p>
        The dismissible overlay's accessible name is overridden here via
        <code>overlayAriaLabel</code>, instead of the default "Close sheet".
      </p>
    {/snippet}
  </Sheet>
</div>

<h3>Centered dialog</h3>
<div class="demo-row">
  <Button text="Open centered dialog" onclick={() => (showCentered = true)} />
  <Sheet bind:open={showCentered} side="center" title="Delete project?" testId="sheet-centered">
    {#snippet content()}
      <p>
        A fixed-size floating dialog centered in the viewport — a fade, not an edge slide-in, and
        sized by <code>--sheet-center-width</code>/<code>--sheet-center-max-width</code> rather than stretching
        to any edge.
      </p>
    {/snippet}
    {#snippet footer()}
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <Button text="Cancel" onclick={() => (showCentered = false)} />
        <Button text="Delete" onclick={() => (showCentered = false)} />
      </div>
    {/snippet}
  </Sheet>
</div>

<h3>Real heading tag (headingLevel)</h3>
<div class="demo-row">
  <Button text="Open with headingLevel" onclick={() => (showHeading = true)} />
  <Sheet
    bind:open={showHeading}
    side="center"
    title="Confirm action"
    headingLevel={2}
    testId="sheet-heading"
  >
    {#snippet content()}
      <p>
        The title above renders through a real <code>&lt;h2&gt;</code>, not the default
        <code>&lt;span&gt;</code>, because <code>headingLevel</code> is set.
      </p>
    {/snippet}
  </Sheet>
</div>

<h3>Width-capped bottom sheet (centred, fully bordered)</h3>
<div class="demo-row">
  <Button
    text="Open capped bottom"
    onclick={() => (showCappedBottom = true)}
    testId="sheet-capped-bottom-trigger"
  />
  <Sheet
    bind:open={showCappedBottom}
    side="bottom"
    title="Launch"
    testId="sheet-capped-bottom"
    classes="capped-bottom-sheet"
  >
    {#snippet content()}
      <p>
        A centred card rather than a full-bleed band: <code>--sheet-band-width</code> caps it and
        <code>--sheet-band-border</code> gives it all four edges, which a floating card needs and an edge-anchored
        panel does not.
      </p>
    {/snippet}
  </Sheet>
</div>

<h3>--sheet-width does not leak into top/bottom</h3>
<div class="demo-row">
  <Button
    text="Open width-token bottom"
    onclick={() => (showWidthTokenBottom = true)}
    testId="sheet-width-token-trigger"
  />
  <!-- Regression guard: this sets --sheet-width, the left/right token. A
       bottom sheet must ignore it and stay full-bleed, or every consumer
       theming their side sheets would silently reshape their bottom ones. -->
  <Sheet
    bind:open={showWidthTokenBottom}
    side="bottom"
    title="Unaffected"
    testId="sheet-width-token-bottom"
    classes="width-token-bottom-sheet"
  >
    {#snippet content()}
      <p>Still edge-to-edge, because <code>--sheet-width</code> governs left/right only.</p>
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

  :global(.capped-bottom-sheet) {
    --sheet-band-width: min(560px, 100vw);
    --sheet-band-box-sizing: border-box;
    --sheet-band-border: 1px solid #d4d4d8;
  }

  :global(.width-token-bottom-sheet) {
    --sheet-width: 280px;
  }
</style>
