<script lang="ts">
  import type { Action } from 'svelte/action';
  import Accordion from '../Accordion/Accordion.svelte';
  import Button from '../Button/Button.svelte';
  import Loader from '../Loader/Loader.svelte';
  import Pill from '../Pill/Pill.svelte';
  import type { ThinkingIndicatorProperties } from './properties';

  let {
    label,
    detail,
    expanded = $bindable(false),
    variant = 'default',
    showElapsed = false,
    onToggle,
    avatar,
    toggleIcon,
    testId,
    toggleTestId,
    detailTestId,
    labelTestId,
    classes,
    rows,
    kind = 'steps',
    busy,
    query,
    moreLabel,
    selectable = false,
    selected = $bindable(null),
    onrowselect,
    onsettled,
    collapseDelayMs = 2600
  }: ThinkingIndicatorProperties = $props();

  // `rows` being present at all (even `[]`) puts the indicator into trace mode: the
  // Accordion body renders the kind-aware trace instead of the `detail` paragraph,
  // and that alone is enough to make the indicator expandable.
  const hasTraceMode = $derived(Array.isArray(rows));
  const traceRows = $derived(rows ?? []);

  // A detail string or a trace is what makes the indicator expandable. Without either
  // there is nothing to reveal, so it renders as a plain live status line instead of a
  // disclosure control. `bare` and `chip` both override that entirely — neither has
  // room (or a documented reason) to expand.
  const isExpandable = $derived(
    variant === 'default' && (hasTraceMode || (typeof detail === 'string' && detail.length > 0))
  );

  // Backward-compatible shimmer rule: without an explicit `busy`, the expandable
  // summary holds still (settled) and every other shape shimmers (live) — exactly
  // today's released behaviour. `chip` is the one exception, defaulting to static:
  // it exists to be a drop-in for ChatToolStatus, which never shimmered, so a
  // caller porting that usage 1:1 shouldn't have to also learn `busy={false}` just
  // to avoid an unexpected shimmer. Passing `busy` takes direct control of the
  // shimmer in every shape, including `bare` and `chip`.
  const labelIsBusy = $derived(busy ?? (variant === 'chip' ? false : !isExpandable));

  // Set once a person clicks the disclosure open/closed — from then on the automatic
  // busy-driven machine below leaves `expanded` alone for the rest of this mount.
  let manuallyToggled = false;

  const handleToggle = (): void => {
    manuallyToggled = true;
    expanded = !expanded;
    onToggle?.();
  };

  // Elapsed counter: ticks while the label is live (see `labelIsBusy`); freezes at its
  // last value once it settles. Resets to 0 each time a fresh busy phase starts.
  let elapsedSeconds = $state(0);
  let hasTicked = $state(false);
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  const startTicking = (): void => {
    elapsedSeconds = 0;
    hasTicked = true;
    if (tickInterval) {
      clearInterval(tickInterval);
    }
    tickInterval = setInterval(() => {
      elapsedSeconds += 1;
    }, 1000);
  };

  const stopTicking = (): void => {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  };

  const elapsedWatcher: Action<HTMLElement, boolean> = (_node, initialShouldTick) => {
    // Reset-and-start happens inside `startTicking` itself, and only when this
    // mount is actually asked to tick. That matters because this same action is
    // mounted on BOTH the status-host and expandable roots, which are separate
    // elements swapped by the `{#if}` above: when a `detail`/`rows`-less status
    // line becomes expandable mid-life, Svelte destroys the status-host node and
    // mounts a fresh expandable one, re-running this action with an initial value
    // that is now `false` (busy has already settled) — skipping the reset here
    // lets `hasTicked`/`elapsedSeconds` carry the frozen final value across that
    // swap instead of wiping it back to 0/false.
    let previous = initialShouldTick;
    if (initialShouldTick) {
      startTicking();
    }
    return {
      update(nowShouldTick: boolean): void {
        if (nowShouldTick !== previous) {
          previous = nowShouldTick;
          if (nowShouldTick) {
            startTicking();
          } else {
            // Freeze, don't hide: stop the interval but leave `hasTicked` set so
            // the expandable branch keeps showing the final elapsed value. The
            // `showElapsed` prop itself (not `hasTicked`) is what lets a host
            // hide the counter outright.
            stopTicking();
          }
        }
      },
      destroy(): void {
        stopTicking();
      }
    };
  };

  // Disclosure machine (the ThinkingTrace settleWatcher pattern, adapted to a plain
  // bindable boolean instead of a tri-state): auto-open while busy, auto-collapse a
  // beat after settling. A manual toggle (handleToggle, above) permanently takes over
  // for the rest of this mount. Only engages once a host passes `busy` at all —
  // omitting it keeps today's released behaviour (manual toggling only, no timers).
  let settledOnce = false;
  let collapseTimer: ReturnType<typeof setTimeout> | null = null;

  const applyBusyChange = (nowBusy: boolean): void => {
    if (nowBusy) {
      settledOnce = false;
      if (collapseTimer) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
      }
      if (!manuallyToggled) {
        expanded = true;
      }
      return;
    }
    if (!settledOnce) {
      settledOnce = true;
      onsettled?.();
      if (collapseDelayMs !== null && !manuallyToggled) {
        collapseTimer = setTimeout(() => {
          if (!manuallyToggled) {
            expanded = false;
          }
        }, collapseDelayMs);
      }
    }
  };

  const busyWatcher: Action<HTMLElement, boolean | null> = (_node, initialBusy) => {
    let previous = initialBusy;
    if (initialBusy === true) {
      expanded = true;
    } else if (initialBusy === false) {
      settledOnce = true;
    }
    return {
      update(nowBusy: boolean | null): void {
        if (nowBusy !== previous) {
          previous = nowBusy;
          if (typeof nowBusy === 'boolean') {
            applyBusyChange(nowBusy);
          }
        }
      },
      destroy(): void {
        if (collapseTimer) {
          clearTimeout(collapseTimer);
        }
      }
    };
  };

  // Trace rows appended in one update stagger relative to the batch, not the list start.
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

  const handleRowSelect = (index: number): void => {
    selected = selected === index ? null : index;
    onrowselect?.(selected);
  };

  let rowsHeight = $state(0);
</script>

{#if isExpandable}
  <div
    class="thinking-indicator expandable {classes ?? ''}"
    class:busy={busy === true}
    use:busyWatcher={busy ?? null}
    use:elapsedWatcher={showElapsed && labelIsBusy}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    <div class="toggle">
      <Button
        onclick={handleToggle}
        ariaExpanded={expanded}
        testId={toggleTestId ?? (testId && `${testId}-toggle`)}
      >
        <span class="status-row">
          {#if avatar || labelIsBusy}
            <span class="avatar">
              {#if avatar}{@render avatar()}{:else}<Loader />{/if}
            </span>
          {/if}
          <span class="label-cluster">
            <span
              class="status-label"
              class:static-label={!labelIsBusy}
              data-pw={labelTestId ?? null}>{label}</span
            >
            <span class="arrow" class:expanded aria-hidden="true">
              {#if toggleIcon}
                {@render toggleIcon()}
              {:else}
                <svg viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
            </span>
          </span>
        </span>
        {#if showElapsed && hasTicked}
          <span
            class="elapsed"
            data-pw={typeof testId === 'string' ? `${testId}-elapsed` : null}
            testID={typeof testId === 'string' ? `${testId}-elapsed` : null}>{elapsedSeconds}s</span
          >
        {/if}
      </Button>
    </div>
    <Accordion expand={expanded}>
      <div class="thinking-indicator-body" inert={!expanded}>
        {#if hasTraceMode}
          {#if kind === 'search' && typeof query === 'string' && query.length > 0}
            <span class="trace-query-wrap">
              <Pill text={query}>
                {#snippet leadingIcon()}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" stroke-linecap="round" />
                  </svg>
                {/snippet}
              </Pill>
            </span>
          {/if}
          <div class="trace-body">
            <span class="trace-connector" style:height="{rowsHeight}px" aria-hidden="true"></span>
            <div
              class="trace-rows"
              use:growthWatcher={traceRows.length}
              bind:clientHeight={rowsHeight}
            >
              {#each traceRows as row, index (index)}
                {#if kind === 'coding' && selectable}
                  <button
                    class="trace-row selectable"
                    class:selected={selected === index}
                    type="button"
                    aria-pressed={selected === index}
                    style:animation-delay={rowDelay(index)}
                    onclick={() => handleRowSelect(index)}
                  >
                    <b class="row-primary">{row.primary}</b>
                    {#if row.secondary}<span class="row-secondary" class:mono={row.mono}
                        >{row.secondary}</span
                      >{/if}
                    {#if typeof row.added === 'number' || typeof row.removed === 'number'}
                      <span class="row-diffstat">
                        {#if typeof row.added === 'number'}<span class="added">+{row.added}</span
                          >{/if}
                        {#if typeof row.removed === 'number'}<span class="removed"
                            >−{row.removed}</span
                          >{/if}
                      </span>
                    {/if}
                  </button>
                {:else if kind === 'search' && typeof row.href === 'string'}
                  <a
                    class="trace-row linked"
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style:animation-delay={rowDelay(index)}
                  >
                    <span class="row-badge" data-tone={(index % 3) + 1} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
                      >
                    </span>
                    <b class="row-primary">{row.primary}</b>
                    {#if row.secondary}<span class="row-secondary">{row.secondary}</span>{/if}
                  </a>
                {:else}
                  <div
                    class="trace-row"
                    class:prose={kind === 'reasoning'}
                    style:animation-delay={rowDelay(index)}
                  >
                    {#if kind === 'steps'}
                      <span class="row-icon" aria-hidden="true">
                        {#if busy && index === traceRows.length - 1}
                          <Loader />
                        {:else}
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.4"
                            stroke-linecap="round"
                            stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
                          >
                        {/if}
                      </span>
                    {:else if kind === 'search'}
                      <span class="row-badge" data-tone={(index % 3) + 1} aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
                        >
                      </span>
                    {/if}
                    {#if kind === 'reasoning'}
                      {row.primary}
                    {:else}
                      <b class="row-primary">{row.primary}</b>
                    {/if}
                    {#if row.secondary}<span class="row-secondary" class:mono={row.mono}
                        >{row.secondary}</span
                      >{/if}
                    {#if typeof row.added === 'number' || typeof row.removed === 'number'}
                      <span class="row-diffstat">
                        {#if typeof row.added === 'number'}<span class="added">+{row.added}</span
                          >{/if}
                        {#if typeof row.removed === 'number'}<span class="removed"
                            >−{row.removed}</span
                          >{/if}
                      </span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
          {#if !busy && typeof moreLabel === 'string' && moreLabel.length > 0}
            <div class="trace-more">{moreLabel}</div>
          {/if}
        {:else}
          <p class="detail" data-pw={detailTestId ?? (testId && `${testId}-detail`) ?? null}>
            {detail}
          </p>
        {/if}
      </div>
    </Accordion>
  </div>
{:else if variant === 'bare'}
  <span
    class="status-label {classes ?? ''}"
    class:static-label={!labelIsBusy}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
    >{#if typeof labelTestId === 'string'}<span data-pw={labelTestId} testID={labelTestId}
        >{label}</span
      >{:else}{label}{/if}</span
  >
{:else if variant === 'chip'}
  <div
    class="thinking-indicator-chip {classes ?? ''}"
    aria-live="polite"
    aria-atomic="true"
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    <span class="chip-icon">
      {#if avatar}{@render avatar()}{:else}<Loader />{/if}
    </span>
    <span class="chip-label" class:static-label={!labelIsBusy} data-pw={labelTestId ?? null}
      >{label}</span
    >
  </div>
{:else}
  <div
    class="thinking-indicator status-host {classes ?? ''}"
    use:elapsedWatcher={showElapsed && labelIsBusy}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    <span class="status-row">
      <span class="avatar">
        {#if avatar}{@render avatar()}{:else}<Loader />{/if}
      </span>
      <span class="status-label" class:static-label={!labelIsBusy} data-pw={labelTestId ?? null}
        >{label}</span
      >
    </span>
    {#if showElapsed}
      <span
        class="elapsed"
        data-pw={typeof testId === 'string' ? `${testId}-elapsed` : null}
        testID={typeof testId === 'string' ? `${testId}-elapsed` : null}>{elapsedSeconds}s</span
      >
    {/if}
  </div>
{/if}

<style>
  @keyframes thinking-indicator-shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }

  @keyframes thinking-indicator-fade-up {
    from {
      opacity: 0;
      transform: translateY(9px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes thinking-indicator-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .thinking-indicator {
    box-sizing: border-box;
    width: 100%;
  }

  .expandable {
    border-bottom: var(--thinking-indicator-border-bottom, 1px solid #e4e4e7);
    padding-block: var(--thinking-indicator-padding-block, 0.5rem);
    margin-bottom: var(--thinking-indicator-margin-bottom, 1rem);
    min-height: 0;
    transition: min-height 400ms
      var(--thinking-indicator-trace-ease, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .expandable.busy {
    min-height: var(--thinking-indicator-trace-busy-min-height, 0px);
  }

  .toggle {
    width: 100%;
    --button-color: transparent;
    --button-border: none;
    --button-box-shadow: none;
    --button-hover-box-shadow: none;
    --button-active-box-shadow: none;
    --button-width: 100%;
    --button-padding: 0;
    --button-justify-content: flex-start;
    --button-text-color: inherit;
    --button-content-gap: var(--thinking-indicator-header-gap, 0.375rem);
  }

  /* A flex ROW host makes the inner status-row hug its content, so the shimmer
     gradient maps to the text's own width rather than the full container. Neither
     form stretches to fill the width — a trailing gap after a short label is real
     empty space, not a reserved box, so nothing pushes the elapsed counter away. */
  .status-host {
    display: flex;
    align-items: center;
    gap: var(--thinking-indicator-header-gap, 0.375rem);
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: var(--thinking-indicator-gap, 0.25rem);
    min-width: 0;
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--thinking-indicator-avatar-size, 1.5rem);
    height: var(--thinking-indicator-avatar-size, 1.5rem);
    --loader-width: var(--thinking-indicator-avatar-loader-size, 1rem);
    --loader-height: var(--thinking-indicator-avatar-loader-size, 1rem);
  }

  /* The chevron lives in the same flex cluster as the label so it hugs the text
     immediately, instead of drifting to the far edge of the toggle button. */
  .label-cluster {
    display: flex;
    align-items: center;
    gap: var(--thinking-indicator-arrow-gap, 0.125rem);
    min-width: 0;
  }

  .status-label {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: left;
    font-size: var(--thinking-indicator-font-size, 0.75rem);
    line-height: var(--thinking-indicator-line-height, 1.25rem);
    color: var(--thinking-indicator-label-color, #858585);
    background: var(
      --thinking-indicator-shimmer-gradient,
      linear-gradient(90deg, #858585 0%, #bebebe 50%, #858585 100%)
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: thinking-indicator-shimmer var(--thinking-indicator-shimmer-duration, 2s) linear
      infinite;
  }

  /* A settled label (no live busy phase) holds still instead of shimmering. */
  .static-label {
    animation: none;
    -webkit-text-fill-color: var(--thinking-indicator-label-color, #858585);
  }

  /* ---- chip variant: a self-contained floating pill (no ancestor supplies
     background/layout, unlike bare) — deliberately not `width: 100%`/box-sizing
     from `.thinking-indicator`, since a pill hugs its content. */
  .thinking-indicator-chip {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: var(--thinking-indicator-chip-gap, 8px);
    width: fit-content;
    padding: var(--thinking-indicator-chip-padding, 8px 14px);
    background: var(--thinking-indicator-chip-background, #ffffff);
    border: var(--thinking-indicator-chip-border, 1px solid #e4e4e7);
    border-radius: var(--thinking-indicator-chip-border-radius, 999px);
    box-shadow: var(--thinking-indicator-chip-box-shadow, 0 6px 20px rgba(0, 0, 0, 0.08));
    max-width: var(--thinking-indicator-chip-max-width, 100%);
  }

  .chip-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--thinking-indicator-chip-icon-color, currentColor);
    --loader-foreground: var(--thinking-indicator-chip-spinner-color, currentColor);
    --loader-foreground-end: var(--thinking-indicator-chip-spinner-color-end, transparent);
    --loader-width: var(--thinking-indicator-chip-spinner-size, 14px);
    --loader-height: var(--thinking-indicator-chip-spinner-size, 14px);
    --loader-before-width: 7px;
    --loader-before-height: 7px;
    --loader-after-width: 11px;
    --loader-after-height: 11px;
    --loader-background: var(--thinking-indicator-chip-background, #ffffff);
  }

  .chip-label {
    flex: 0 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: var(--thinking-indicator-chip-font-size, 0.85rem);
    font-weight: var(--thinking-indicator-chip-font-weight, 500);
    color: var(--thinking-indicator-chip-color, #52525b);
    background: var(
      --thinking-indicator-chip-shimmer-gradient,
      linear-gradient(90deg, #52525b 0%, #a0a0a0 50%, #52525b 100%)
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: thinking-indicator-shimmer var(--thinking-indicator-chip-shimmer-duration, 2s) linear
      infinite;
  }

  /* Chip defaults to a static label (unlike the default/bare variants) since it
     mirrors ChatToolStatus, which never shimmered — pass `busy` explicitly to
     opt in. Higher specificity than the generic `.static-label` rule above, so
     it correctly overrides with the chip's own color token, not the default
     variant's. */
  .chip-label.static-label {
    animation: none;
    -webkit-text-fill-color: var(--thinking-indicator-chip-color, #52525b);
  }

  .arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--thinking-indicator-arrow-size, 1rem);
    height: var(--thinking-indicator-arrow-size, 1rem);
    color: var(--thinking-indicator-arrow-color, #7a7a7a);
    transform: rotate(-90deg);
    transition: var(--thinking-indicator-arrow-transition, transform 0.2s ease-in-out);
  }

  .arrow svg {
    width: 100%;
    height: 100%;
  }

  .arrow.expanded {
    transform: rotate(0deg);
  }

  .detail {
    margin: 0;
    padding-top: var(--thinking-indicator-detail-padding-top, 0.5rem);
    font-size: var(--thinking-indicator-detail-font-size, 0.875rem);
    line-height: var(--thinking-indicator-detail-line-height, 1.5);
    color: var(--thinking-indicator-detail-color, #bebebe);
    text-align: left;
  }

  .elapsed {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    color: var(--thinking-indicator-elapsed-color, #9a9a9a);
    font-size: var(--thinking-indicator-elapsed-font-size, 0.75rem);
  }

  /* ---- Trace body (rows?: ThinkingIndicatorTraceRow[]) ---- */

  /* Wrapper exists only to carry `inert` while the Accordion has it collapsed —
     no box of its own, so it can't disturb the detail/trace layout it wraps. */
  .thinking-indicator-body {
    display: contents;
  }

  .trace-query-wrap {
    display: inline-flex;
    margin: var(--thinking-indicator-trace-query-margin, 10px 0 0);
    --pill-width: auto;
    --pill-justify-content: flex-start;
    --pill-cursor: default;
    --pill-gap: 6px;
    --pill-background: var(--thinking-indicator-trace-query-background, #f1f1f1);
    --pill-color: var(--thinking-indicator-trace-query-color, #6b6b6b);
    --pill-border-radius: var(--thinking-indicator-trace-query-radius, 999px);
    --pill-padding: var(--thinking-indicator-trace-query-padding, 3px 11px);
    --pill-font-size: var(--thinking-indicator-trace-query-font-size, 0.8125rem);
    --pill-font-weight: 400;
  }

  .trace-query-wrap :global(svg) {
    width: 11px;
    height: 11px;
  }

  .trace-body {
    display: flex;
    gap: var(--thinking-indicator-trace-body-gap, 12px);
    padding-top: var(--thinking-indicator-trace-body-padding-top, 10px);
  }

  .trace-connector {
    width: 2px;
    border-radius: 999px;
    background: var(--thinking-indicator-trace-connector-color, #dcdcdc);
    margin-left: 6px;
    flex-shrink: 0;
    transition: height 500ms var(--thinking-indicator-trace-ease, cubic-bezier(0.23, 1, 0.32, 1));
  }

  .trace-rows {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--thinking-indicator-trace-row-gap, 7px);
    align-self: flex-start;
  }

  .trace-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: var(--thinking-indicator-trace-row-font-size, 0.8125rem);
    color: var(--thinking-indicator-trace-row-color, #2b2b2b);
    animation: thinking-indicator-fade-up 320ms
      var(--thinking-indicator-trace-ease, cubic-bezier(0.23, 1, 0.32, 1)) both;
    text-decoration: none;
  }

  .trace-row.prose {
    color: var(--thinking-indicator-trace-prose-color, #6b6b6b);
  }

  .trace-row.selectable {
    border: none;
    background: none;
    font: inherit;
    text-align: left;
    padding: 3px 6px;
    margin: -3px -6px;
    border-radius: var(--thinking-indicator-trace-row-radius, 6px);
    cursor: pointer;
    transition: background 150ms ease;
    width: calc(100% + 12px);
  }

  .trace-row.selectable:hover {
    background: var(--thinking-indicator-trace-row-hover-background, #f4f4f4);
  }

  .trace-row.selectable.selected {
    background: var(--thinking-indicator-trace-row-selected-background, #ececec);
  }

  .trace-row.linked:hover .row-primary {
    text-decoration: underline;
  }

  .row-primary {
    font-weight: var(--thinking-indicator-trace-row-weight, 500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-secondary {
    color: var(--thinking-indicator-trace-secondary-color, #9a9a9a);
    font-size: var(--thinking-indicator-trace-secondary-font-size, 0.75rem);
    white-space: nowrap;
  }

  .row-secondary.mono {
    font-family: var(--thinking-indicator-trace-mono-font, ui-monospace, Menlo, monospace);
  }

  /* Steps kind: a static check icon, or — on the frontier row while busy — the
     library Loader, recoloured/resized to match the row's small icon footprint. */
  .row-icon {
    display: inline-flex;
    align-self: center;
    width: 14px;
    flex-shrink: 0;
    color: var(--thinking-indicator-trace-icon-color, #9a9a9a);
    --loader-width: var(--thinking-indicator-trace-spinner-size, 11px);
    --loader-height: var(--thinking-indicator-trace-spinner-size, 11px);
    --loader-before-width: 5px;
    --loader-before-height: 5px;
    --loader-after-width: 8px;
    --loader-after-height: 8px;
    --loader-foreground: var(--thinking-indicator-trace-spinner-color, #6b6b6b);
    --loader-foreground-end: var(--thinking-indicator-trace-spinner-color-end, transparent);
    --loader-background: var(--thinking-indicator-trace-spinner-track-color, #dcdcdc);
  }

  .row-icon svg {
    width: 12px;
    height: 12px;
  }

  .row-badge {
    width: 15px;
    height: 15px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--thinking-indicator-trace-badge-check-color, #fff);
    flex-shrink: 0;
    align-self: center;
  }

  .row-badge[data-tone='1'] {
    background: var(--thinking-indicator-trace-tone-1, #2f6fec);
  }

  .row-badge[data-tone='2'] {
    background: var(--thinking-indicator-trace-tone-2, #e56d24);
  }

  .row-badge[data-tone='3'] {
    background: var(--thinking-indicator-trace-tone-3, #1f7a5f);
  }

  .row-badge svg {
    width: 9px;
    height: 9px;
  }

  .row-diffstat {
    margin-left: auto;
    font-family: var(--thinking-indicator-trace-mono-font, ui-monospace, Menlo, monospace);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    display: inline-flex;
    gap: 5px;
  }

  .row-diffstat .added {
    color: var(--thinking-indicator-trace-added-color, #1f7a5f);
  }

  .row-diffstat .removed {
    color: var(--thinking-indicator-trace-removed-color, #c93f38);
  }

  .trace-more {
    font-size: var(--thinking-indicator-trace-more-font-size, 0.75rem);
    color: var(--thinking-indicator-trace-more-color, #9a9a9a);
    padding: 6px 0 0 22px;
    animation: thinking-indicator-fade-in 300ms ease both;
  }

  @media (prefers-reduced-motion: reduce) {
    .status-label,
    .chip-label,
    .trace-row,
    .trace-more {
      animation-duration: 0.001s;
    }

    .expandable,
    .trace-connector,
    .arrow {
      transition-duration: 0.001s;
    }

    .status-label {
      animation: none;
      -webkit-text-fill-color: var(--thinking-indicator-label-color, #858585);
    }

    .chip-label {
      animation: none;
      -webkit-text-fill-color: var(--thinking-indicator-chip-color, #52525b);
    }
  }
</style>
