<script lang="ts">
  import type { Action } from 'svelte/action';
  import Loader from '../Loader/Loader.svelte';
  import Button from '../Button/Button.svelte';
  import type { TaskListProperties } from './properties';

  let { rows, onretry: onretryLegacy, onRetry, testId, classes }: TaskListProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onretry = $derived(onRetry ?? onretryLegacy);

  // Rows appended in one update stagger relative to the batch, not the list start —
  // mirrors ThinkingTrace's growthWatcher so a host that streams rows in gets the
  // same "only the new ones animate in" behaviour.
  let staggerBase = $state(0);

  const growthWatcher: Action<HTMLElement, number> = (_node, initialCount) => {
    let previousCount = initialCount;
    return {
      update(count: number): void {
        if (count > previousCount) {
          staggerBase = previousCount;
        }
        previousCount = count;
      }
    };
  };

  const rowDelay = (index: number): string => {
    return `${Math.max(0, index - staggerBase) * 120}ms`;
  };

  const handleRetry = (index: number): void => {
    onretry?.(index);
  };
</script>

<div
  class="task-list {classes ?? ''}"
  use:growthWatcher={rows.length}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#each rows as row, index (index)}
    <div
      class="task-row"
      class:pending={row.status === 'pending'}
      style:animation-delay={rowDelay(index)}
      data-pw={typeof testId === 'string' ? `${testId}-row-${index}` : null}
      testID={typeof testId === 'string' ? `${testId}-row-${index}` : null}
    >
      <span class="row-glyph">
        {#key row.status}
          <span class="glyph-inner" data-status={row.status} aria-hidden="true">
            {#if row.status === 'pending'}
              <span class="glyph-dot"></span>
            {:else if row.status === 'running'}
              <span class="glyph-spinner">
                <Loader />
              </span>
            {:else if row.status === 'done'}
              <span class="glyph-check">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
                >
              </span>
            {:else if row.status === 'failed'}
              <span class="glyph-x">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg
                >
              </span>
            {/if}
          </span>
        {/key}
      </span>

      <span class="row-text">
        <span class="row-label">{row.label}</span>
        {#if typeof row.secondary === 'string' && row.secondary.length > 0}
          <span class="row-secondary" class:mono={row.mono}>{row.secondary}</span>
        {/if}
      </span>

      {#if row.status === 'failed' && typeof row.retryLabel === 'string' && row.retryLabel.length > 0}
        <div class="row-retry">
          <Button
            text={row.retryLabel}
            size="sm"
            onclick={() => handleRetry(index)}
            {...typeof testId === 'string' ? { testId: `${testId}-row-${index}-retry` } : {}}
          />
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes task-list-fade-up {
    from {
      opacity: 0;
      transform: translateY(9px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes task-list-glyph-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes task-list-check-pop {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: var(--task-list-row-gap, 10px);
  }

  .task-row {
    display: flex;
    align-items: baseline;
    gap: var(--task-list-row-inline-gap, 10px);
    animation: task-list-fade-up 320ms var(--task-list-ease, cubic-bezier(0.23, 1, 0.32, 1)) both;
  }

  .row-glyph {
    display: inline-flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    width: var(--task-list-glyph-size, 16px);
    height: var(--task-list-glyph-size, 16px);
    flex-shrink: 0;
  }

  .glyph-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    animation: task-list-glyph-fade 150ms ease both;
  }

  .glyph-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--task-list-dot-color, #9a9a9a);
  }

  /* Loader draws its own ring via a rotating gradient rather than a bordered arc, so the old
     track/spinner two-tone maps onto the gradient's start/end stops: --loader-foreground is the
     bright leading edge, --loader-foreground-end the dimmer trailing one. The size vars are
     calc()'d off a single token so before/after stay proportional if a consumer overrides it. */
  .glyph-spinner {
    display: inline-flex;
    --loader-foreground: var(--task-list-spinner-color, #6b6b6b);
    --loader-foreground-end: var(--task-list-spinner-track-color, #dcdcdc);
    --loader-width: var(--task-list-spinner-size, 11px);
    --loader-height: var(--task-list-spinner-size, 11px);
    --loader-before-width: calc(var(--task-list-spinner-size, 11px) * 0.5);
    --loader-before-height: calc(var(--task-list-spinner-size, 11px) * 0.5);
    --loader-after-width: calc(var(--task-list-spinner-size, 11px) * 0.75);
    --loader-after-height: calc(var(--task-list-spinner-size, 11px) * 0.75);
  }

  .glyph-check,
  .glyph-x {
    display: inline-flex;
  }
  .glyph-check svg,
  .glyph-x svg {
    width: 12px;
    height: 12px;
  }
  .glyph-check {
    color: var(--task-list-done-color, #6b6b6b);
    animation: task-list-check-pop 200ms var(--task-list-ease, cubic-bezier(0.23, 1, 0.32, 1)) both;
  }
  .glyph-x {
    color: var(--task-list-error-color, #c93f38);
  }

  .row-text {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: var(--task-list-text-gap, 8px);
  }
  .task-row.pending .row-text {
    opacity: var(--task-list-pending-opacity, 0.55);
  }

  .row-label {
    font-size: var(--task-list-row-font-size, 0.875rem);
    font-weight: var(--task-list-row-weight, 500);
    color: var(--task-list-row-color, #2b2b2b);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-secondary {
    font-size: var(--task-list-secondary-font-size, 0.75rem);
    color: var(--task-list-secondary-color, #9a9a9a);
    white-space: nowrap;
  }
  .row-secondary.mono {
    font-family: var(--task-list-mono-font, ui-monospace, Menlo, monospace);
  }

  /* Themes the embedded Button into the compact error-tinted pill via its own custom
     properties — these inherit down into Button's internal rules regardless of the
     component boundary, the same wrapper-div pattern Banner uses for its dismiss button. */
  .row-retry {
    margin-left: auto;
    flex-shrink: 0;
    align-self: center;
    --button-color: var(--task-list-retry-background, rgba(201, 63, 56, 0.12));
    --button-text-color: var(--task-list-retry-color, #c93f38);
    --button-hover-color: var(--task-list-retry-hover-background, rgba(201, 63, 56, 0.2));
    --button-hover-text-color: var(--task-list-retry-color, #c93f38);
    --button-border: none;
    --button-padding: var(--task-list-retry-padding, 3px 10px);
    --button-border-radius: var(--task-list-retry-radius, 999px);
    --button-font-size: var(--task-list-retry-font-size, 0.75rem);
    --button-font-weight: var(--task-list-retry-weight, 600);
    --button-transition: background 150ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .task-row,
    .glyph-inner,
    .glyph-check {
      animation-duration: 0.001s;
    }
    /* Loader's spin lives on its own internally-scoped element, reached here via :global()
       scoped to a descendant of our local .glyph-spinner wrapper — the 3-class specificity
       that produces reliably beats Loader's own 2-class rule regardless of stylesheet order. */
    .glyph-spinner :global(.loader) {
      animation: none;
      -webkit-animation: none;
    }
  }
</style>
