<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Tooltip from '$lib/Tooltip/Tooltip.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Tooltip</h1>
</div>

<h3>Positions</h3>
<div class="demo-row" style="gap: 32px;">
  <Tooltip text="This is a top tooltip" position="top">
    <Button text="Hover (Top)" />
  </Tooltip>
  <Tooltip text="This is a bottom tooltip" position="bottom">
    <Button text="Hover (Bottom)" />
  </Tooltip>
  <Tooltip text="This is a right tooltip" position="right">
    <Button text="Hover (Right)" />
  </Tooltip>
  <Tooltip text="This is a left tooltip" position="left">
    <Button text="Hover (Left)" />
  </Tooltip>
</div>

<h3>icon snippet — leading icon in the trigger wrapper</h3>
<div class="demo-row" style="gap: 32px;">
  <Tooltip text="More information about this field">
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    {/snippet}
    <span>Hover the info icon</span>
  </Tooltip>

  <Tooltip text="This item has a warning" position="bottom">
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    {/snippet}
    <span>Warning label</span>
  </Tooltip>
</div>

<h3>content snippet — rich bubble body</h3>
<div class="demo-row" style="gap: 32px;">
  <Tooltip text="" position="top">
    {#snippet content()}
      <div style="padding: 4px 2px;">
        <strong>Keyboard shortcut</strong>
        <br />
        <span>⌘ + K to open command menu</span>
      </div>
    {/snippet}
    <Button text="Rich content tooltip" />
  </Tooltip>

  <Tooltip text="" position="bottom">
    {#snippet content()}
      <div style="padding: 4px 2px; display: flex; flex-direction: column; gap: 4px;">
        <span>Status: <strong>Active</strong></span>
        <span>Last updated: today</span>
      </div>
    {/snippet}
    <Button text="Multi-line tooltip" />
  </Tooltip>
</div>

<h3>icon + content snippets combined</h3>
<div class="demo-row" style="gap: 32px;">
  <Tooltip text="" position="right">
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    {/snippet}
    {#snippet content()}
      <div style="padding: 4px 2px;">
        <strong>Pro tip</strong>
        <br />
        <span>Hover or focus any trigger to reveal its tooltip.</span>
      </div>
    {/snippet}
    <span>Help text with icon</span>
  </Tooltip>
</div>

<h3>Delay</h3>
<div class="demo-row" style="gap: 32px;">
  <Tooltip text="Appears after 500 ms" delay={500}>
    <Button text="Delayed tooltip" />
  </Tooltip>
</div>
