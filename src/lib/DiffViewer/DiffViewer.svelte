<script lang="ts">
  import Accordion from '../Accordion/Accordion.svelte';
  import Badge from '../Badge/Badge.svelte';
  import Button from '../Button/Button.svelte';
  import type { DiffViewerProperties } from './properties';

  let {
    path,
    hunks,
    additions,
    deletions,
    created = false,
    collapseThreshold = 40,
    classes,
    testId
  }: DiffViewerProperties = $props();

  const total = $derived(hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0));
  const resetKey = $derived(`${total}:${collapseThreshold}`);
  let openOverride = $state<{ key: string; value: boolean } | null>(null);
  const open = $derived(
    openOverride?.key === resetKey ? openOverride.value : total <= collapseThreshold
  );

  // A function binding keeps the user's current toggle while these inputs are
  // unchanged. A new total or threshold gets a new key and immediately falls
  // back to the documented threshold rule, without a synchronization effect.
  function setOpen(value: boolean): void {
    openOverride = { key: resetKey, value };
  }

  const filename = $derived(path.split('/').pop() ?? path);
  const directory = $derived(path.slice(0, path.length - filename.length));
</script>

<div class="diff-viewer {classes ?? ''}">
  <Accordion bind:expand={() => open, setOpen} lazy triggerClasses="diff-trigger" {testId}>
    {#snippet trigger({ expanded })}
      <span class="path">
        <span class="chevron" class:open={expanded}>›</span>
        <span class="directory">{directory}</span><span class="name">{filename}</span>
        {#if created}<Badge value="new" classes="diff-new-badge" />{/if}
      </span>
      <span class="counts">
        {#if additions}<span class="add">+{additions}</span>{/if}
        {#if deletions}<span class="del">−{deletions}</span>{/if}
      </span>
    {/snippet}
    <!-- Mounted once on first expand (Accordion's `lazy`), then kept mounted and
         merely CSS-hidden/inert on later collapses -- a plain {#if open} here
         would destroy and recreate this DOM on every toggle, resetting the
         .diff-body horizontal scroll position each time it reopens. -->
    <div class="diff-body">
      {#each hunks as hunk, index (index)}
        {#if index > 0 || hunk.header}
          <div class="hunk-sep">{hunk.header ?? '⋯'}</div>
        {/if}
        {#each hunk.lines as line, lineIndex (lineIndex)}
          <div class="diff-line" data-kind={line.kind}>
            <span class="num">{line.oldLine ?? ''}</span>
            <span class="num">{line.newLine ?? ''}</span>
            <span class="content"
              >{line.kind === 'add' ? '+' : line.kind === 'remove' ? '-' : ' '}{line.text}</span
            >
          </div>
        {/each}
      {/each}
    </div>
  </Accordion>

  {#if !open}
    <Button text="{total} lines — show" classes="diff-show" onclick={() => setOpen(true)} />
  {/if}
</div>

<style>
  .diff-viewer {
    font-family: var(--diff-font-family, ui-monospace, monospace);
    font-size: var(--diff-font-size, 13px);
    line-height: var(--diff-line-height, 1.4);
    background: var(--diff-background, #ffffff);
    border: var(--diff-border, 1px solid #d1d5db);
    border-radius: var(--diff-border-radius, 4px);
    overflow: hidden;
  }

  .diff-viewer :global(.diff-trigger) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--diff-gap, 12px);
    padding: var(--diff-trigger-padding, 8px 12px);
    background: var(--diff-header-background, #f9fafb);
    border-bottom: var(--diff-border, 1px solid #d1d5db);
    font-size: var(--diff-header-font-size, 12px);
    color: var(--diff-color, #374151);
  }

  .path {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .path :global(.diff-new-badge) {
    margin-left: var(--diff-small-gap, 8px);
    --badge-background: var(--diff-created-background, #dcfce7);
    --badge-color: var(--diff-created-color, #166534);
    --badge-font-size: var(--diff-header-font-size, 12px);
    --badge-padding: var(--diff-created-padding, 2px 8px);
    --badge-border: none;
    --badge-min-width: 0;
    --badge-min-height: 0;
    font-weight: var(--diff-created-font-weight, 500);
    letter-spacing: var(--diff-created-letter-spacing, 0.04em);
    text-transform: var(--diff-created-text-transform, uppercase);
  }

  .name {
    color: var(--diff-filename-color, #111827);
  }

  .directory {
    color: var(--diff-gutter-color, #6b7280);
  }

  .chevron {
    display: inline-block;
    margin-right: var(--diff-small-gap, 8px);
    transition: transform var(--diff-chevron-transition, 120ms ease);
    color: var(--diff-gutter-color, #6b7280);
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .counts {
    display: flex;
    gap: var(--diff-small-gap, 8px);
    font-variant-numeric: tabular-nums;
  }

  .add {
    color: var(--diff-add-color, #166534);
  }

  .del {
    color: var(--diff-remove-color, #991b1b);
  }

  .hunk-sep {
    padding: var(--diff-hunk-padding, 4px 12px);
    background: var(--diff-header-background, #f9fafb);
    color: var(--diff-gutter-color, #6b7280);
    font-size: var(--diff-header-font-size, 12px);
  }

  .diff-body {
    overflow-x: auto;
  }

  .diff-line {
    display: grid;
    grid-template-columns: var(--diff-gutter-width, 44px) var(--diff-gutter-width, 44px) 1fr;
    white-space: pre;
  }

  .num {
    padding: var(--diff-gutter-padding, 0 8px);
    text-align: right;
    color: var(--diff-gutter-color, #6b7280);
    user-select: none;
  }

  .content {
    padding: var(--diff-content-padding, 0 12px);
  }

  .diff-line[data-kind='add'] {
    background: var(--diff-add-background, #f0fdf4);
  }

  .diff-line[data-kind='add'] > .content {
    color: var(--diff-add-color, #166534);
  }

  .diff-line[data-kind='remove'] {
    background: var(--diff-remove-background, #fef2f2);
  }

  .diff-line[data-kind='remove'] > .content {
    color: var(--diff-remove-color, #991b1b);
  }

  .diff-line[data-kind='context'] > .content {
    color: var(--diff-color, #374151);
  }

  .diff-viewer :global(.diff-show) {
    --button-width: 100%;
    --button-padding: var(--diff-show-padding, 12px);
    --button-color: transparent;
    --button-hover-color: var(--diff-header-background, #f9fafb);
    --button-text-color: var(--diff-color, #374151);
    --button-hover-text-color: var(--diff-filename-color, #111827);
    --button-border: none;
    --button-border-radius: 0;
    --button-font-size: var(--diff-font-size, 13px);
  }
</style>
