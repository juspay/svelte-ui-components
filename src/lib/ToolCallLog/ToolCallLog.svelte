<script lang="ts">
  import type { Action } from 'svelte/action';
  import { onMount } from 'svelte';
  import Loader from '../Loader/Loader.svelte';
  import Pill from '../Pill/Pill.svelte';
  import { computeMenuDropdownPosition } from '../Menu/dropdownPosition';
  import type { ToolCallChip, ToolCallLogProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    chips,
    onchipclick: onchipclickProp,
    onChipClick,
    testId,
    classes
  }: ToolCallLogProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onchipclick = $derived(
    resolveDeprecatedProp('ToolCallLog', 'onChipClick', 'onchipclick', onChipClick, onchipclickProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onchipclick);
  });

  // Exactly one popover open at a time, component-local.
  let openIndex = $state<number | null>(null);

  // Chips appended in one update stagger relative to the batch, not the list start.
  let staggerBase = $state(0);

  // Anchor elements for the portaled popover's position math, index-aligned with `chips`.
  let chipEls: (HTMLButtonElement | null)[] = $state([]);

  // The open popover's own element and measured size, fed back into the position math.
  let popoverEl: HTMLDivElement | null = $state(null);
  let popoverWidth = $state(0);
  let popoverHeight = $state(0);
  // Bumped on scroll/resize while a popover is mounted, so `popoverStyle` re-derives.
  let popoverTick = $state(0);

  // Gap between the chip and the popover below it. A plain constant rather than a
  // themeable CSS var, matching Menu's own PORTAL_MENU_GAP — the portal's inline
  // `position: fixed` coordinates already own layout, so a CSS var here would be
  // unreadable from JS without a getComputedStyle round trip for no real gain.
  const POPOVER_GAP = 6;

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

  const chipDelay = (index: number): string => {
    return `${Math.max(0, index - staggerBase) * 120}ms`;
  };

  const handleChipClick = (index: number, chip: ToolCallChip): void => {
    if (typeof chip.detail === 'string' && chip.detail.length > 0) {
      openIndex = openIndex === index ? null : index;
      return;
    }
    onchipclick?.(index, chip);
  };

  // Bound to the window (rather than the popover) so Escape closes it regardless
  // of focus, without forcing an interactive role onto the popover itself.
  const handleWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && openIndex !== null) {
      openIndex = null;
    }
  };

  /**
   * Fixed-position coordinates for the open popover. Re-derives whenever the
   * open index, the anchor's live rect (via `popoverTick`, bumped on scroll/
   * resize), or the popover's own measured size changes. Reuses Menu's portal
   * placement math — the pure bottom-left corner case, viewport-clamped, is
   * exactly what a chip popover anchored below-left of its chip needs, and the
   * clamp is what keeps it from overflowing the right/bottom edge inside a
   * narrow card.
   */
  const popoverStyle = $derived.by(() => {
    if (openIndex === null || typeof window === 'undefined') {
      return '';
    }
    const anchor = chipEls[openIndex];
    if (anchor === null || typeof anchor === 'undefined') {
      return '';
    }
    void popoverTick;
    const anchorRect = anchor.getBoundingClientRect();
    const { left, top } = computeMenuDropdownPosition({
      container: {
        left: anchorRect.left,
        right: anchorRect.right,
        top: anchorRect.top,
        bottom: anchorRect.bottom
      },
      dropdown: { width: popoverWidth, height: popoverHeight },
      placement: 'bottom-left',
      gap: POPOVER_GAP,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
    return `position:fixed;left:${left}px;top:${top}px;right:auto;bottom:auto;margin:0;z-index:var(--tool-call-log-popover-z-index,1000);`;
  });

  /**
   * Svelte action for the popover element: relocates it to `document.body`
   * (mirroring Menu's `usePortal`) so an `overflow: hidden` or scrolling
   * ancestor — a chat bubble, a card — can never clip it, and keeps
   * `popoverTick` bumping (rAF-coalesced) while it is mounted so `popoverStyle`
   * re-derives on scroll/resize. The popover only exists in the DOM while open
   * (see the `{#if}` below), so the listeners live exactly as long as it does;
   * `use:` actions never run during SSR.
   */
  const popoverPortal: Action<HTMLElement> = (node) => {
    document.body.appendChild(node);
    let frame: number | null = null;
    const bump = (): void => {
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        popoverTick += 1;
      });
    };
    window.addEventListener('scroll', bump, { capture: true, passive: true });
    window.addEventListener('resize', bump);
    return {
      destroy(): void {
        window.removeEventListener('scroll', bump, { capture: true });
        window.removeEventListener('resize', bump);
        if (frame !== null) {
          cancelAnimationFrame(frame);
        }
        node.remove();
      }
    };
  };

  /**
   * Closes the open popover on a click outside both its trigger chip and the
   * popover itself. A click on ANY chip is deliberately treated as "inside" —
   * that click's own handler (`handleChipClick`) already decides the next
   * `openIndex`, and closing here too would race it: this listener runs after
   * the chip's own `onclick` on the same bubbling click event, so without the
   * guard it would immediately re-close a popover a click just opened.
   */
  const handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (openIndex === null || !(target instanceof Node)) {
      return;
    }
    const clickedInsideChip = chipEls.some((chipEl) => chipEl !== null && chipEl.contains(target));
    const clickedInsidePopover = popoverEl !== null && popoverEl.contains(target);
    if (!clickedInsideChip && !clickedInsidePopover) {
      openIndex = null;
    }
  };

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#snippet diffstatBadges(chip: ToolCallChip)}
  {#if typeof chip.added === 'number'}
    <span class="diffstat-pill diffstat-added">
      <Pill text={`+${chip.added}`} />
    </span>
  {/if}
  {#if typeof chip.removed === 'number'}
    <span class="diffstat-pill diffstat-removed">
      <Pill text={`−${chip.removed}`} />
    </span>
  {/if}
{/snippet}

<div
  class="tool-call-log {classes ?? ''}"
  use:growthWatcher={chips.length}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#each chips as chip, index (index)}
    {@const detail = chip.detail}
    {@const hasDetail = typeof detail === 'string' && detail.length > 0}
    {@const hasDiffstat = typeof chip.added === 'number' || typeof chip.removed === 'number'}
    <div class="chip-wrap">
      <button
        class="chip"
        class:error={chip.state === 'error'}
        type="button"
        style:animation-delay={chipDelay(index)}
        aria-expanded={hasDetail ? openIndex === index : null}
        onclick={() => handleChipClick(index, chip)}
        bind:this={chipEls[index]}
        data-pw={typeof testId === 'string' ? `${testId}-chip-${index}` : null}
        testID={typeof testId === 'string' ? `${testId}-chip-${index}` : null}
      >
        {#if chip.state === 'running'}
          <span class="chip-spinner" aria-hidden="true">
            <Loader />
          </span>
        {/if}
        <b class="chip-label">{chip.label}</b>
        {#if typeof chip.meta === 'string' && chip.meta.length > 0}
          <span class="chip-meta" class:mono={chip.mono}>{chip.meta}</span>
        {/if}
        {#if hasDiffstat}
          <span class="diffstat chip-diffstat">
            {@render diffstatBadges(chip)}
          </span>
        {/if}
      </button>
      {#if hasDetail && openIndex === index}
        <div
          class="chip-popover"
          role="dialog"
          aria-label={`${chip.label} details`}
          tabindex="-1"
          style={popoverStyle}
          bind:this={popoverEl}
          bind:clientWidth={popoverWidth}
          bind:clientHeight={popoverHeight}
          use:popoverPortal
          data-pw={typeof testId === 'string' ? `${testId}-popover-${index}` : null}
          testID={typeof testId === 'string' ? `${testId}-popover-${index}` : null}
        >
          <p class="popover-detail" class:mono={chip.mono}>{detail}</p>
          {#if hasDiffstat}
            <span class="diffstat popover-diffstat">
              {@render diffstatBadges(chip)}
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes tool-call-log-fade-up {
    from {
      opacity: 0;
      transform: translateY(9px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .tool-call-log {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--tool-call-log-gap, 8px);
  }

  /* Bespoke <button> markup (Pill's root is a non-interactive <div> and can't carry
     aria-expanded/button semantics — see docs), but its sizing recipe is deliberately
     pulled from Pill's own tokens (line-height, cursor) so it reads as the same family
     of control as the diffstat Pill badges nested inside it. */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--tool-call-log-chip-gap, 6px);
    padding: var(--tool-call-log-chip-padding, 6px 10px);
    background: var(--tool-call-log-chip-background, #fafafa);
    border: var(--tool-call-log-chip-border, 1px solid #e4e4e7);
    border-radius: var(--tool-call-log-chip-radius, 6px);
    font: inherit;
    font-size: var(--tool-call-log-font-size, 0.8125rem);
    line-height: var(--tool-call-log-chip-line-height, 1);
    color: var(--tool-call-log-label-color, #2b2b2b);
    cursor: var(--tool-call-log-chip-cursor, pointer);
    max-width: 100%;
    animation: tool-call-log-fade-up 320ms var(--tool-call-log-ease, cubic-bezier(0.23, 1, 0.32, 1))
      both;
    transition:
      background 150ms ease,
      border-color 150ms ease;
  }
  .chip:hover {
    background: var(--tool-call-log-chip-hover-background, #f1f1f1);
  }
  .chip[aria-expanded='true'] {
    border-color: var(--tool-call-log-chip-open-border-color, #c7c7cc);
  }

  .chip.error {
    color: var(--tool-call-log-error-color, #c93f38);
    border-color: var(--tool-call-log-error-border-color, #f2b8b5);
    background: var(--tool-call-log-error-background, #fdf1f0);
  }
  .chip.error:hover {
    background: var(--tool-call-log-error-hover-background, #fbe6e5);
  }

  .chip-label {
    font-weight: var(--tool-call-log-label-weight, 500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-meta {
    color: var(--tool-call-log-meta-color, #9a9a9a);
    font-size: var(--tool-call-log-meta-font-size, 0.75rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chip-meta.mono {
    font-family: var(--tool-call-log-mono-font, ui-monospace, Menlo, monospace);
  }

  /* Sizes and colors the nested library Loader via CSS custom-property
     inheritance (no :global() needed — Loader is a plain DOM descendant of
     this span, same pattern as ThinkingIndicator's `.avatar`). Loader itself
     ships no literal fallback for --loader-foreground/-foreground-end/
     -background, so all three are set explicitly here rather than left to
     chance. */
  .chip-spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    --loader-width: var(--tool-call-log-spinner-size, 11px);
    --loader-height: var(--tool-call-log-spinner-size, 11px);
    --loader-before-width: 5px;
    --loader-before-height: 5px;
    --loader-after-width: 8px;
    --loader-after-height: 8px;
    --loader-foreground: var(--tool-call-log-spinner-color, #6b6b6b);
    --loader-foreground-end: var(--tool-call-log-spinner-track-color, #dcdcdc);
    --loader-background: var(--tool-call-log-chip-background, #fafafa);
  }

  .diffstat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  .chip-diffstat {
    margin-left: var(--tool-call-log-diffstat-margin, 2px);
  }

  /* Pill customized into the small diffstat badge via its own --pill-* tokens
     (inherited the same way — Pill is a plain descendant of this span). Pill
     defaults `cursor` to `pointer` even when non-interactive, so it is pinned
     back to `default` here: these badges carry no onclick. */
  .diffstat-pill {
    display: inline-flex;
    --pill-padding: var(--tool-call-log-diffstat-padding, 0 4px);
    --pill-border-radius: var(--tool-call-log-diffstat-radius, 4px);
    --pill-font-size: var(--tool-call-log-diffstat-font-size, 0.6875rem);
    --pill-font-family: var(--tool-call-log-mono-font, ui-monospace, Menlo, monospace);
    --pill-line-height: 1;
    --pill-cursor: default;
  }
  .diffstat-added {
    --pill-background: var(--tool-call-log-added-background, #e4f5ee);
    --pill-color: var(--tool-call-log-added-color, #1f7a5f);
  }
  .diffstat-removed {
    --pill-background: var(--tool-call-log-removed-background, #fbeceb);
    --pill-color: var(--tool-call-log-removed-color, #c93f38);
  }

  /* Always portaled to document.body (see `popoverPortal`), so `position:
     fixed` is the baseline rather than a portal-only override — left/top/
     z-index come from the inline `popoverStyle`, computed against the live
     anchor rect. */
  .chip-popover {
    position: fixed;
    z-index: var(--tool-call-log-popover-z-index, 1000);
    display: flex;
    flex-direction: column;
    gap: var(--tool-call-log-popover-gap, 6px);
    min-width: var(--tool-call-log-popover-min-width, 220px);
    max-width: var(--tool-call-log-popover-max-width, 340px);
    padding: var(--tool-call-log-popover-padding, 10px 12px);
    background: var(--tool-call-log-popover-background, #ffffff);
    border: var(--tool-call-log-popover-border, 1px solid #e4e4e7);
    border-radius: var(--tool-call-log-popover-radius, 10px);
    box-shadow: var(--tool-call-log-popover-shadow, 0 10px 30px rgba(0, 0, 0, 0.12));
    animation: tool-call-log-fade-up 200ms var(--tool-call-log-ease, cubic-bezier(0.23, 1, 0.32, 1))
      both;
  }

  .popover-detail {
    margin: 0;
    color: var(--tool-call-log-popover-color, #2b2b2b);
    font-size: var(--tool-call-log-popover-font-size, 0.8125rem);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .popover-detail.mono {
    font-family: var(--tool-call-log-mono-font, ui-monospace, Menlo, monospace);
  }

  @media (prefers-reduced-motion: reduce) {
    .chip,
    .chip-popover {
      animation-duration: 0.001s;
    }
    /* Loader's own spin keyframe lives on its internally-scoped `.loader`
       class, which this file cannot reach with a plain scoped selector —
       :global() is required to disable it, same pattern as `.pill-dismiss
       :global(svg)` elsewhere in the library. Loader ships no
       reduced-motion guard of its own. */
    .chip-spinner :global(.loader) {
      animation: none;
    }
  }
</style>
