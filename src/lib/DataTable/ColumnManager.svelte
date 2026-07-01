<script lang="ts" generics="T extends import('./properties').DataRow">
  import type { ColumnDefinition, DataRow } from './properties';
  import columnsSvg from './icons/columns.svg?raw';
  import dragSvg from './icons/drag.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';

  let {
    columns,
    hiddenFields,
    order,
    reorderable = false,
    onToggle,
    onReorder
  }: {
    columns: ColumnDefinition<T>[];
    hiddenFields: Set<string>;
    order: string[];
    reorderable?: boolean;
    onToggle: (field: string, visible: boolean) => void;
    onReorder: (order: string[]) => void;
  } = $props();

  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement | null>(null);
  let panelRef = $state<HTMLDivElement | null>(null);
  let dragField = $state<string | null>(null);

  const byField = $derived(new Map(columns.map((c) => [c.field, c])));
  const orderedColumns = $derived(
    order.map((field) => byField.get(field)).filter((c): c is ColumnDefinition<T> => !!c)
  );

  const close = (): void => {
    open = false;
  };

  const onWindowPointerDown = (event: MouseEvent): void => {
    if (!open) return;
    const target = event.target as Node;
    if (panelRef?.contains(target) || triggerRef?.contains(target)) {
      return;
    }
    close();
  };

  const handleDrop = (targetField: string): void => {
    if (!dragField || dragField === targetField) {
      dragField = null;
      return;
    }
    const next = [...order];
    const from = next.indexOf(dragField);
    const to = next.indexOf(targetField);
    if (from === -1 || to === -1) {
      dragField = null;
      return;
    }
    next.splice(from, 1);
    next.splice(to, 0, dragField);
    dragField = null;
    onReorder(next);
  };
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="dt-colmgr">
  <button
    bind:this={triggerRef}
    type="button"
    class="dt-colmgr-trigger"
    aria-label="Manage columns"
    aria-haspopup="dialog"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html columnsSvg}
  </button>

  {#if open}
    <div bind:this={panelRef} class="dt-colmgr-panel" role="dialog" aria-label="Manage columns">
      <div class="dt-colmgr-header">
        <span>Columns</span>
        <button type="button" class="dt-colmgr-close" aria-label="Close" onclick={close}>
          {@html closeSvg}
        </button>
      </div>
      <ul class="dt-colmgr-list">
        {#each orderedColumns as column (column.field)}
          {@const canHide = column.canHide !== false}
          <li
            class="dt-colmgr-item"
            class:dragging={dragField === column.field}
            draggable={reorderable}
            ondragstart={() => (dragField = column.field)}
            ondragover={(e) => reorderable && e.preventDefault()}
            ondrop={() => handleDrop(column.field)}
            ondragend={() => (dragField = null)}
          >
            {#if reorderable}
              <span class="dt-colmgr-grip" aria-hidden="true">{@html dragSvg}</span>
            {/if}
            <label class="dt-colmgr-label">
              <input
                type="checkbox"
                checked={!hiddenFields.has(column.field)}
                disabled={!canHide}
                onchange={(e) => onToggle(column.field, e.currentTarget.checked)}
              />
              <span>{column.header}</span>
            </label>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .dt-colmgr {
    position: relative;
    display: inline-flex;
  }

  .dt-colmgr-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--table-toolbar-btn-size, 32px);
    height: var(--table-toolbar-btn-size, 32px);
    border: var(--table-toolbar-btn-border, 1px solid var(--table-color-border));
    border-radius: var(--table-toolbar-btn-border-radius, 8px);
    background: var(--table-toolbar-btn-background, var(--table-color-surface));
    color: var(--table-toolbar-btn-color, var(--table-color-text-muted));
    cursor: pointer;
  }

  .dt-colmgr-trigger:hover {
    background: var(--table-toolbar-btn-hover-background, var(--table-color-hover-overlay-subtle));
    color: var(--table-toolbar-btn-hover-color, var(--table-color-text));
  }

  .dt-colmgr-trigger :global(svg) {
    width: 16px;
    height: 16px;
  }

  .dt-colmgr-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 20;
    min-width: var(--table-colmgr-width, 220px);
    background: var(--table-colmgr-background, var(--table-color-surface));
    border: var(--table-colmgr-border, 1px solid var(--table-color-border));
    border-radius: var(--table-colmgr-border-radius, 8px);
    box-shadow: var(--table-colmgr-shadow, var(--table-shadow-popover));
    padding: var(--table-colmgr-padding, 8px);
  }

  .dt-colmgr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--table-colmgr-title-font-size, var(--table-font-size-sm));
    font-weight: var(--table-colmgr-title-font-weight, var(--table-font-weight-semibold));
    color: var(--table-colmgr-title-color, var(--table-color-text));
    padding: 4px 6px 8px;
  }

  .dt-colmgr-close {
    display: inline-flex;
    border: none;
    background: transparent;
    color: var(--table-colmgr-close-color, var(--table-color-text-subtle));
    cursor: pointer;
    padding: 2px;
  }

  .dt-colmgr-close :global(svg) {
    width: 12px;
    height: 12px;
  }

  .dt-colmgr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: var(--table-colmgr-max-height, 280px);
    overflow-y: auto;
  }

  .dt-colmgr-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    border-radius: 6px;
  }

  .dt-colmgr-item:hover {
    background: var(--table-colmgr-item-hover-background, var(--table-color-hover-overlay-muted));
  }

  .dt-colmgr-item.dragging {
    opacity: 0.5;
  }

  .dt-colmgr-grip {
    display: inline-flex;
    color: var(--table-colmgr-grip-color, var(--table-color-border-strong));
    cursor: grab;
  }

  .dt-colmgr-grip :global(svg) {
    width: 14px;
    height: 14px;
  }

  .dt-colmgr-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--table-colmgr-item-font-size, var(--table-font-size-sm));
    color: var(--table-colmgr-item-color, var(--table-color-text-secondary));
    cursor: pointer;
    flex: 1;
  }
</style>
