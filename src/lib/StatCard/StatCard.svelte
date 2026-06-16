<script lang="ts">
  import type { StatCardProperties } from './properties';

  let {
    title,
    value,
    delta,
    deltaPositive,
    subtitle,
    footer,
    valueSnippet,
    testId,
    classes,
    onclick
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
  {#if typeof title === 'string' && title.length > 0}
    <div class="statcard-title">{title}</div>
  {/if}

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

  {#if typeof subtitle === 'string' && subtitle.length > 0}
    <div class="statcard-subtitle">{subtitle}</div>
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
    border-radius: var(--statcard-border-radius, 8px);
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

  .statcard-title {
    font-size: var(--statcard-title-font-size, 12px);
    font-weight: var(--statcard-title-font-weight, 500);
    color: var(--statcard-title-color, #6b7280);
    line-height: var(--statcard-title-line-height, 1.4);
    white-space: var(--statcard-title-white-space, nowrap);
    overflow: hidden;
    text-overflow: ellipsis;
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

  .statcard-footer {
    margin-top: var(--statcard-footer-margin-top, 8px);
    padding-top: var(--statcard-footer-padding-top, 8px);
    border-top: var(--statcard-footer-border-top, 1px solid #e5e7eb);
  }
</style>
