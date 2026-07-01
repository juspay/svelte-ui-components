<script lang="ts">
  import type { ColumnFilterProperties, ColumnFilterValue } from './properties';
  import filterSvg from './icons/filter.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';

  let {
    field,
    header,
    filterType,
    filterOptions = [],
    value = null,
    onApply,
    onClear
  }: ColumnFilterProperties = $props();

  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement | null>(null);
  let popoverRef = $state<HTMLDivElement | null>(null);

  // ── Local draft state, seeded from the active filter ──────────────────────
  let textDraft = $state('');
  let selectDraft = $state('');
  let multiDraft = $state<string[]>([]);
  let minDraft = $state('');
  let maxDraft = $state('');

  const seedDraft = (): void => {
    if (!value) {
      textDraft = '';
      selectDraft = '';
      multiDraft = [];
      minDraft = '';
      maxDraft = '';
      return;
    }
    if (filterType === 'text') {
      textDraft = typeof value.value === 'string' ? value.value : '';
    } else if (filterType === 'select') {
      selectDraft = typeof value.value === 'string' ? value.value : '';
    } else if (filterType === 'multiselect') {
      multiDraft = Array.isArray(value.value) ? [...value.value] : [];
    } else if (filterType === 'number') {
      const v = value.value as { min: number | null; max: number | null };
      minDraft = v?.min != null ? String(v.min) : '';
      maxDraft = v?.max != null ? String(v.max) : '';
    }
  };

  let isActive = $derived.by(() => {
    if (!value) return false;
    if (filterType === 'multiselect') {
      return Array.isArray(value.value) && value.value.length > 0;
    }
    if (filterType === 'number') {
      const v = value.value as { min: number | null; max: number | null };
      return !!v && (v.min !== null || v.max !== null);
    }
    return String(value.value ?? '').trim() !== '';
  });

  const toggleOpen = (): void => {
    open = !open;
    if (open) {
      seedDraft();
    }
  };

  const close = (): void => {
    open = false;
  };

  const toggleMulti = (optionValue: string): void => {
    multiDraft = multiDraft.includes(optionValue)
      ? multiDraft.filter((v) => v !== optionValue)
      : [...multiDraft, optionValue];
  };

  const apply = (): void => {
    let filterValue: ColumnFilterValue['value'];
    if (filterType === 'text') {
      filterValue = textDraft;
    } else if (filterType === 'select') {
      filterValue = selectDraft;
    } else if (filterType === 'multiselect') {
      filterValue = multiDraft;
    } else {
      filterValue = {
        min: minDraft.trim() === '' ? null : Number(minDraft),
        max: maxDraft.trim() === '' ? null : Number(maxDraft)
      };
    }
    onApply({ field, type: filterType, value: filterValue });
    close();
  };

  const clear = (): void => {
    onClear(field);
    close();
  };

  const onWindowPointerDown = (event: MouseEvent): void => {
    if (!open) return;
    const target = event.target as Node;
    if (popoverRef?.contains(target) || triggerRef?.contains(target)) {
      return;
    }
    close();
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && open) {
      close();
      triggerRef?.focus();
    }
  };
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onKeydown} />

<div class="dt-filter">
  <button
    bind:this={triggerRef}
    type="button"
    class="dt-filter-trigger"
    class:active={isActive}
    aria-label={`Filter by ${header}`}
    aria-haspopup="dialog"
    aria-expanded={open}
    onclick={(e) => {
      e.stopPropagation();
      toggleOpen();
    }}
  >
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html filterSvg}
  </button>

  {#if open}
    <div
      bind:this={popoverRef}
      class="dt-filter-popover"
      role="dialog"
      aria-label={`Filter ${header}`}
    >
      <div class="dt-filter-popover-header">
        <span>Filter: {header}</span>
        <button type="button" class="dt-filter-close" aria-label="Close" onclick={close}>
          {@html closeSvg}
        </button>
      </div>

      <div class="dt-filter-body">
        {#if filterType === 'text'}
          <input
            class="dt-filter-input"
            type="text"
            placeholder={`Search ${header}…`}
            bind:value={textDraft}
            onkeydown={(e) => e.key === 'Enter' && apply()}
          />
        {:else if filterType === 'number'}
          <div class="dt-filter-range">
            <input class="dt-filter-input" type="number" placeholder="Min" bind:value={minDraft} />
            <span class="dt-filter-range-sep">—</span>
            <input class="dt-filter-input" type="number" placeholder="Max" bind:value={maxDraft} />
          </div>
        {:else if filterType === 'select'}
          <select class="dt-filter-input" bind:value={selectDraft}>
            <option value="">All</option>
            {#each filterOptions as option (option.id)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        {:else if filterType === 'multiselect'}
          <div class="dt-filter-options" role="group" aria-label={`${header} options`}>
            {#each filterOptions as option (option.id)}
              <label class="dt-filter-option">
                <input
                  type="checkbox"
                  checked={multiDraft.includes(option.value)}
                  onchange={() => toggleMulti(option.value)}
                />
                <span>{option.label}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <div class="dt-filter-actions">
        <button type="button" class="dt-filter-btn dt-filter-btn-ghost" onclick={clear}>
          Clear
        </button>
        <button type="button" class="dt-filter-btn dt-filter-btn-primary" onclick={apply}>
          Apply
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dt-filter {
    position: relative;
    display: inline-flex;
  }

  .dt-filter-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--table-filter-icon-color, var(--table-color-text-subtle));
    cursor: pointer;
    border-radius: 4px;
    line-height: var(--table-line-height-tight);
  }

  .dt-filter-trigger:hover {
    background-color: var(--table-filter-hover-background, var(--table-color-hover-overlay));
    color: var(--table-filter-hover-color, var(--table-color-text-muted));
  }

  .dt-filter-trigger.active {
    color: var(--table-filter-active-color, var(--table-color-accent));
  }

  .dt-filter-trigger :global(svg) {
    width: var(--table-filter-icon-size, 14px);
    height: var(--table-filter-icon-size, 14px);
    display: block;
  }

  .dt-filter-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 20;
    min-width: var(--table-filter-popover-width, 220px);
    background: var(--table-filter-popover-background, var(--table-color-surface));
    border: var(--table-filter-popover-border, 1px solid var(--table-color-border));
    border-radius: var(--table-filter-popover-border-radius, 8px);
    box-shadow: var(--table-filter-popover-shadow, var(--table-shadow-popover));
    padding: var(--table-filter-popover-padding, 12px);
    text-transform: none;
    letter-spacing: normal;
  }

  .dt-filter-popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--table-filter-title-font-size, var(--table-font-size-sm));
    font-weight: var(--table-filter-title-font-weight, var(--table-font-weight-semibold));
    color: var(--table-filter-title-color, var(--table-color-text));
    margin-bottom: 10px;
  }

  .dt-filter-close {
    display: inline-flex;
    border: none;
    background: transparent;
    color: var(--table-filter-close-color, var(--table-color-text-subtle));
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
  }

  .dt-filter-close :global(svg) {
    width: 12px;
    height: 12px;
  }

  .dt-filter-body {
    margin-bottom: 12px;
  }

  .dt-filter-input {
    width: 100%;
    box-sizing: border-box;
    font-size: var(--table-filter-input-font-size, var(--table-font-size-sm));
    padding: var(--table-filter-input-padding, 6px 8px);
    border: var(--table-filter-input-border, 1px solid var(--table-color-border));
    border-radius: var(--table-filter-input-border-radius, 6px);
    color: var(--table-filter-input-color, var(--table-color-text));
    background: var(--table-filter-input-background, var(--table-color-surface));
    outline: none;
  }

  .dt-filter-input:focus-visible {
    border-color: var(--table-focus-outline-color, var(--table-color-focus));
    box-shadow: 0 0 0 2px var(--table-filter-input-focus-ring, var(--table-shadow-focus-subtle));
  }

  .dt-filter-range {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dt-filter-range-sep {
    color: var(--table-filter-range-sep-color, var(--table-color-text-subtle));
  }

  .dt-filter-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: var(--table-filter-options-max-height, 180px);
    overflow-y: auto;
  }

  .dt-filter-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--table-filter-option-font-size, var(--table-font-size-sm));
    color: var(--table-filter-option-color, var(--table-color-text-secondary));
    cursor: pointer;
  }

  .dt-filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .dt-filter-btn {
    font-size: var(--table-filter-btn-font-size, var(--table-font-size-sm));
    padding: var(--table-filter-btn-padding, 6px 12px);
    border-radius: var(--table-filter-btn-border-radius, 6px);
    cursor: pointer;
    border: 1px solid transparent;
  }

  .dt-filter-btn-ghost {
    background: transparent;
    color: var(--table-filter-btn-ghost-color, var(--table-color-text-muted));
    border-color: var(--table-filter-btn-ghost-border, var(--table-color-border));
  }

  .dt-filter-btn-ghost:hover {
    background: var(
      --table-filter-btn-ghost-hover-background,
      var(--table-color-hover-overlay-subtle)
    );
  }

  .dt-filter-btn-primary {
    background: var(--table-filter-btn-primary-background, var(--table-color-accent));
    color: var(--table-filter-btn-primary-color, var(--table-color-on-accent));
  }

  .dt-filter-btn-primary:hover {
    background: var(--table-filter-btn-primary-hover-background, var(--table-color-accent-strong));
  }
</style>
