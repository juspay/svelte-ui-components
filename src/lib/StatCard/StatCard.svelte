<script lang="ts">
  import type { StatCardProperties } from './properties';
  import DeltaIndicator from '../DeltaIndicator/DeltaIndicator.svelte';
  import Tooltip from '../Tooltip/Tooltip.svelte';
  import CheckListItem from '../CheckListItem/CheckListItem.svelte';

  let {
    title,
    value,
    delta,
    deltaPositive,
    subtitle,
    footer,
    valueSnippet,
    rows,
    rowsDirection = 'column',
    tooltip,
    checkbox,
    headerRight,
    children,
    testId,
    classes,
    onclick,
    onCheckboxChange
  }: StatCardProperties = $props();

  const isInteractive = $derived(typeof onclick === 'function');

  /**
   * When `deltaPositive` is explicitly provided use it; otherwise infer from
   * the leading character of `delta` — '+' → positive, '-' → negative,
   * anything else (e.g. '0%') → undefined (neutral, no colour applied).
   */
  const resolvedDeltaPositive = $derived(
    typeof deltaPositive === 'boolean'
      ? deltaPositive
      : typeof delta === 'string' && delta.trim().length > 0
        ? delta.trimStart().startsWith('+')
          ? true
          : delta.trimStart().startsWith('-')
            ? false
            : null
        : null
  );

  const hasDelta = $derived(typeof delta === 'string' && delta.trim().length > 0);
  const hasRows = $derived(Array.isArray(rows) && rows.length > 0);
  const hasTitle = $derived(typeof title === 'string' && title.length > 0);

  /**
   * The header is rendered when ANY header content is present — not only a title.
   * This keeps `checkbox` and `headerRight` visible on title-less cards.
   */
  const hasHeaderContent = $derived(
    hasTitle || Boolean(checkbox) || typeof headerRight === 'function'
  );

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === ' ') {
        event.preventDefault();
      }
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  };

  const handleCheckboxChange = (checked: boolean): void => {
    onCheckboxChange?.(checked);
  };

  /**
   * Keep header checkbox interaction from bubbling to the card's click/keydown
   * handler — otherwise toggling the checkbox on an interactive card would also
   * fire its `onclick` action.
   */
  const stopHeaderInteraction = (event: Event): void => {
    event.stopPropagation();
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="statcard {classes ?? ''}"
  class:statcard-interactive={isInteractive}
  data-pw={typeof testId === 'string' ? testId : null}
  role={isInteractive ? 'button' : null}
  tabindex={isInteractive ? 0 : null}
  onclick={isInteractive ? onclick : null}
  onkeydown={isInteractive ? handleKeydown : null}
>
  {#if hasHeaderContent}
    <div class="statcard-header">
      <div class="statcard-header-left">
        {#if hasTitle}
          {#if tooltip}
            <Tooltip
              text={tooltip.text}
              position={tooltip.position ?? 'top'}
              testId={tooltip.testId}
            >
              <span class="statcard-title-tooltip-trigger">
                <span class="statcard-title statcard-title-tooltip">{title}</span>
                <span class="statcard-tooltip-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2" />
                    <rect x="7.25" y="6.9" width="1.5" height="4.1" rx="0.75" fill="currentColor" />
                    <circle cx="8" cy="4.8" r="0.9" fill="currentColor" />
                  </svg>
                </span>
              </span>
            </Tooltip>
          {:else}
            <div class="statcard-title">{title}</div>
          {/if}
        {/if}
        {#if checkbox}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="statcard-header-checkbox"
            onclick={stopHeaderInteraction}
            onkeydown={stopHeaderInteraction}
          >
            <CheckListItem
              text={checkbox.text}
              checked={checkbox.checked ?? false}
              onclick={handleCheckboxChange}
            />
          </div>
        {/if}
      </div>
      {#if headerRight}
        <div class="statcard-header-right">{@render headerRight()}</div>
      {/if}
    </div>
  {/if}

  {#if hasRows && rows}
    <div class="statcard-rows" class:statcard-rows-horizontal={rowsDirection === 'row'}>
      {#each rows as row, rowIndex (rowIndex)}
        {#if rowIndex > 0}
          <div class="statcard-row-divider"></div>
        {/if}
        <div class="statcard-row" data-pw={typeof row.testId === 'string' ? row.testId : null}>
          {#if typeof row.heading === 'string' && row.heading.length > 0}
            <div class="statcard-row-heading-wrap">
              {#if row.tooltip}
                <Tooltip
                  text={row.tooltip.text}
                  position={row.tooltip.position ?? 'top'}
                  testId={row.tooltip.testId}
                >
                  <div class="statcard-row-heading statcard-row-heading-tooltip">{row.heading}</div>
                </Tooltip>
              {:else}
                <div class="statcard-row-heading">{row.heading}</div>
              {/if}
            </div>
          {/if}
          <div class="statcard-row-value-line">
            <div class="statcard-value">{row.value}</div>
            {#if typeof row.change === 'number'}
              <DeltaIndicator value={row.change} invertColors={row.invertChangeColors ?? false} />
            {/if}
            {#if typeof row.additionalContent === 'string' && row.additionalContent.length > 0}
              <div class="statcard-row-additional">{row.additionalContent}</div>
            {/if}
          </div>
          {#if Array.isArray(row.breakdown) && row.breakdown.length > 0}
            {#if typeof row.breakdownHeading === 'string' && row.breakdownHeading.length > 0}
              <div class="statcard-breakdown-heading">{row.breakdownHeading}</div>
            {/if}
            <div class="statcard-breakdown-grid">
              {#each row.breakdown as breakdownItem, breakdownIndex (breakdownIndex)}
                <div class="statcard-breakdown-item">
                  <div class="statcard-breakdown-label">{breakdownItem.label}</div>
                  <div class="statcard-breakdown-value">{breakdownItem.value}</div>
                  {#if typeof breakdownItem.change === 'number'}
                    <DeltaIndicator
                      value={breakdownItem.change}
                      invertColors={breakdownItem.invertChangeColors ?? false}
                    />
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="statcard-value-row">
      {#if typeof valueSnippet === 'function'}
        <div class="statcard-value">{@render valueSnippet()}</div>
      {:else if typeof value === 'string' && value.length > 0}
        <div class="statcard-value">{value}</div>
      {/if}

      {#if hasDelta}
        <div
          class="statcard-delta"
          class:statcard-delta-positive={resolvedDeltaPositive === true}
          class:statcard-delta-negative={resolvedDeltaPositive === false}
        >
          {delta}
        </div>
      {/if}
    </div>
  {/if}

  {#if typeof subtitle === 'string' && subtitle.length > 0}
    <div class="statcard-subtitle">{subtitle}</div>
  {/if}

  {#if children}
    <div class="statcard-children">{@render children()}</div>
  {/if}

  {#if typeof footer === 'function'}
    <div class="statcard-footer">{@render footer()}</div>
  {/if}
</div>

<style>
  .statcard {
    display: flex;
    flex-direction: column;
    gap: var(--statcard-gap, 4px);
    padding: var(--statcard-padding, 16px);
    background: var(--statcard-background, #ffffff);
    border: var(--statcard-border, 1px solid #e5e7eb);
    border-radius: var(--statcard-border-radius, var(--radius, 4px));
    box-shadow: var(--statcard-box-shadow, none);
    width: var(--statcard-width, auto);
    min-width: var(--statcard-min-width, 0);
    max-width: var(--statcard-max-width, none);
    height: var(--statcard-height, auto);
    color: var(--statcard-color, inherit);
    cursor: var(--statcard-cursor, default);
    box-sizing: border-box;
  }

  .statcard-interactive {
    cursor: var(--statcard-cursor, pointer);
  }

  .statcard-interactive:focus-visible {
    outline: var(--statcard-focus-outline, 2px solid currentColor);
    outline-offset: var(--statcard-focus-outline-offset, 2px);
  }

  .statcard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--statcard-header-gap, 8px);
  }

  .statcard-header-left {
    display: flex;
    align-items: center;
    gap: var(--statcard-header-left-gap, 8px);
    flex: 1;
    min-width: 0;
  }

  .statcard-header-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* Wrapper keeps the checkbox in the event path (to stop bubbling to the card
     action). `margin-left: auto` pushes it to the header's right edge so the title
     stays left and the checkbox reads as a right-aligned control. (A previous
     `display: contents` here removed the box, which silently defeated the flex
     alignment.) */
  .statcard-header-checkbox {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .statcard-title {
    font-size: var(--statcard-title-font-size, 12px);
    font-weight: var(--statcard-title-font-weight, 500);
    color: var(--statcard-title-color, #6b7280);
    line-height: var(--statcard-title-line-height, 1.4);
    white-space: var(--statcard-title-white-space, nowrap);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .statcard-title-tooltip-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--statcard-tooltip-icon-gap, 4px);
    min-width: 0;
  }

  .statcard-title-tooltip {
    cursor: default;
    /* Default surface (Euler) uses the ⓘ icon as the tooltip affordance, so the
       title carries no underline. The Shopify theme flips both tokens — dotted
       underline on, icon off — via its own stylesheet. */
    text-decoration: var(--statcard-title-tooltip-decoration, none);
    text-underline-offset: 2px;
  }

  .statcard-tooltip-icon {
    display: var(--statcard-tooltip-icon-display, inline-flex);
    align-items: center;
    justify-content: center;
    width: var(--statcard-tooltip-icon-size, 14px);
    height: var(--statcard-tooltip-icon-size, 14px);
    flex-shrink: 0;
    color: var(--statcard-tooltip-icon-color, currentColor);
    cursor: default;
  }

  .statcard-tooltip-icon svg {
    width: 100%;
    height: 100%;
  }

  .statcard-value-row {
    display: flex;
    align-items: var(--statcard-value-row-align, baseline);
    gap: var(--statcard-value-row-gap, 8px);
    flex-wrap: wrap;
  }

  .statcard-value {
    font-size: var(--statcard-value-font-size, 24px);
    font-weight: var(--statcard-value-font-weight, 600);
    color: var(--statcard-value-color, inherit);
    line-height: var(--statcard-value-line-height, 1.2);
  }

  .statcard-delta {
    font-size: var(--statcard-delta-font-size, 13px);
    font-weight: var(--statcard-delta-font-weight, 500);
    color: var(--statcard-delta-color, #6b7280);
    line-height: var(--statcard-delta-line-height, 1.4);
  }

  .statcard-delta-positive {
    color: var(--statcard-delta-positive-color, #16a34a);
  }

  .statcard-delta-negative {
    color: var(--statcard-delta-negative-color, #dc2626);
  }

  .statcard-subtitle {
    font-size: var(--statcard-subtitle-font-size, 12px);
    font-weight: var(--statcard-subtitle-font-weight, 400);
    color: var(--statcard-subtitle-color, #9ca3af);
    line-height: var(--statcard-subtitle-line-height, 1.4);
  }

  /* Multi-row layout */
  .statcard-rows {
    display: flex;
    flex-direction: column;
    gap: var(--statcard-rows-gap, 0px);
  }

  .statcard-row-divider {
    height: var(--statcard-row-divider-height, 1px);
    background: var(--statcard-row-divider-color, #e5e7eb);
    margin: var(--statcard-row-divider-margin, 8px 0);
  }

  /* Horizontal layout: lay the metric sections side by side with vertical
     dividers. Each section flexes to share the available width equally. */
  .statcard-rows-horizontal {
    flex-direction: row;
  }

  .statcard-rows-horizontal .statcard-row {
    flex: 1;
    min-width: 0;
  }

  .statcard-rows-horizontal .statcard-row-divider {
    align-self: stretch;
    flex-shrink: 0;
    width: var(--statcard-row-divider-height, 1px);
    height: auto;
    margin: var(--statcard-row-divider-margin-horizontal, 0 16px);
  }

  .statcard-row {
    display: flex;
    flex-direction: column;
    gap: var(--statcard-row-gap, 4px);
  }

  .statcard-row-heading-wrap {
    display: flex;
    align-items: center;
  }

  .statcard-row-heading {
    font-size: var(--statcard-row-heading-font-size, 12px);
    font-weight: var(--statcard-row-heading-font-weight, 500);
    color: var(--statcard-row-heading-color, #6b7280);
    line-height: var(--statcard-row-heading-line-height, 1.4);
  }

  .statcard-row-heading-tooltip {
    cursor: default;
    text-decoration: underline dotted;
    text-underline-offset: 2px;
  }

  .statcard-row-value-line {
    display: flex;
    align-items: baseline;
    gap: var(--statcard-row-value-gap, 8px);
    flex-wrap: wrap;
  }

  .statcard-row-additional {
    font-size: var(--statcard-row-additional-font-size, 12px);
    font-weight: var(--statcard-row-additional-font-weight, 400);
    color: var(--statcard-row-additional-color, #9ca3af);
    line-height: 1.4;
  }

  /* Breakdown grid */
  .statcard-breakdown-heading {
    font-size: var(--statcard-breakdown-heading-font-size, 11px);
    font-weight: var(--statcard-breakdown-heading-font-weight, 600);
    color: var(--statcard-breakdown-heading-color, #6b7280);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-top: var(--statcard-breakdown-heading-margin-top, 6px);
  }

  .statcard-breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--statcard-breakdown-col-min, 100px), 1fr));
    gap: var(--statcard-breakdown-gap, 8px);
    margin-top: var(--statcard-breakdown-margin-top, 4px);
  }

  .statcard-breakdown-item {
    display: flex;
    flex-direction: column;
    gap: var(--statcard-breakdown-item-gap, 2px);
  }

  .statcard-breakdown-label {
    font-size: var(--statcard-breakdown-label-font-size, 11px);
    font-weight: var(--statcard-breakdown-label-font-weight, 400);
    color: var(--statcard-breakdown-label-color, #9ca3af);
    line-height: 1.4;
  }

  .statcard-breakdown-value {
    font-size: var(--statcard-breakdown-value-font-size, 14px);
    font-weight: var(--statcard-breakdown-value-font-weight, 600);
    color: var(--statcard-breakdown-value-color, inherit);
    line-height: 1.2;
  }

  .statcard-children {
    margin-top: var(--statcard-children-margin-top, 4px);
  }

  .statcard-footer {
    margin-top: var(--statcard-footer-margin-top, 8px);
    padding-top: var(--statcard-footer-padding-top, 8px);
    border-top: var(--statcard-footer-border-top, 1px solid #e5e7eb);
  }
</style>
