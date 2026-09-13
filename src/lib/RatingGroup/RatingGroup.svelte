<script lang="ts">
  import type { RatingGroupProperties, RatingGroupStarState } from './properties';
  import starSvg from '$lib/assets/star.svg?raw';

  let {
    value = $bindable(0),
    max = 5,
    disabled = false,
    readonly = false,
    allowHalf = false,
    ariaLabel,
    testId,
    classes,
    star,
    name,
    required = false,
    form,
    onchange
  }: RatingGroupProperties = $props();

  // `max` has to be a finite positive number for a star count to mean anything -- a
  // zero, negative, or non-finite max renders no stars at all instead of a broken or
  // infinite row, mirroring Progress's guard against an unusable range.
  const hasValidMax = $derived(Number.isFinite(max) && max > 0);
  const effectiveMax = $derived(hasValidMax ? max : 0);
  const starCount = $derived(hasValidMax ? Math.max(0, Math.floor(max)) : 0);
  const starIndices = $derived(Array.from({ length: starCount }, (_, index) => index));

  const step = $derived(allowHalf ? 0.5 : 1);

  // Clamps AND steps a raw number into a value this component can actually paint and
  // report: finite, within [0, effectiveMax], and aligned to the configured precision.
  // A non-finite input (NaN, +/-Infinity) becomes 0 rather than propagating into
  // aria-valuenow, and an out-of-range input is clamped rather than wrapped -- pressing
  // ArrowRight past the last star stays on the last star, it does not jump to 0.
  function sanitize(raw: number): number {
    // NaN has no direction to clamp toward, so it collapses to 0. +/-Infinity does have
    // a direction and needs no special case: Math.max/Math.min below already clamp it
    // to the corresponding bound, the same as any other out-of-range finite number.
    if (Number.isNaN(raw)) {
      return 0;
    }
    const clamped = Math.min(effectiveMax, Math.max(0, raw));
    const stepped = allowHalf ? Math.round(clamped * 2) / 2 : Math.round(clamped);
    // Guards against -0, which is finite, in range, and would otherwise render as the
    // (visually identical but semantically wrong) "-0 out of N stars".
    return stepped === 0 ? 0 : stepped;
  }

  const sanitizedValue = $derived(sanitize(value));

  function formatNumber(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  const valueText = $derived(
    `${formatNumber(sanitizedValue)} out of ${formatNumber(effectiveMax)} star${effectiveMax === 1 ? '' : 's'}`
  );

  function starState(index: number): RatingGroupStarState {
    const filled = sanitizedValue - index;
    if (filled >= 1) {
      return 'full';
    }
    if (filled >= 0.5) {
      return 'half';
    }
    return 'empty';
  }

  // Only interaction produces a value, so the result of sanitize() here is always
  // already finite and in range -- the guard is against a no-op (e.g. ArrowRight
  // already at max), not against an invalid result.
  function commit(newValue: number): void {
    const sanitizedNew = sanitize(newValue);
    if (sanitizedNew === sanitizedValue) {
      return;
    }
    value = sanitizedNew;
    onchange?.(sanitizedNew);
  }

  function handleStarClick(event: MouseEvent, index: number): void {
    if (disabled) {
      return;
    }
    // Clicking anywhere in the group focuses it even while readonly -- readonly stays
    // focusable, only the value stops being settable, so focus is unconditional here
    // and the value change below is the part readonly guards.
    root?.focus();
    if (readonly) {
      return;
    }
    const target = event.currentTarget;
    const ratio =
      target instanceof HTMLElement
        ? (() => {
            const rect = target.getBoundingClientRect();
            return rect.width > 0 ? (event.clientX - rect.left) / rect.width : 1;
          })()
        : 1;
    const isHalfClick = allowHalf && ratio < 0.5;
    commit(isHalfClick ? index + 0.5 : index + 1);
  }

  // A tablist-style guard against hijacking browser/OS shortcuts built on the same
  // keys (Ctrl+Home, Shift+ArrowRight) -- mirrors Tabs.svelte's handleKeydown.
  function handleKeydown(event: KeyboardEvent): void {
    if (disabled || readonly) {
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      next = sanitizedValue + step;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      next = sanitizedValue - step;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = effectiveMax;
    } else {
      return;
    }
    event.preventDefault();
    commit(next);
  }

  let root: HTMLDivElement | null = $state(null);

  // The hidden native input is tabindex="-1", so the browser's own "focus the invalid
  // field" step would land on an element the user cannot see or reach. Focus the
  // role="slider" element that carries the group's single tab stop instead -- the same
  // pattern Checkbox.svelte uses for its own hidden control.
  function handleInvalid(e: Event): void {
    e.preventDefault();
    root?.focus();
  }

  // A native number input can't distinguish "explicitly rated 0" from "never touched",
  // so 0 is submitted as empty -- required then blocks submission until a real rating
  // is made, the same reading Checkbox gives an unchecked required box.
  const submittedValue = $derived(sanitizedValue > 0 ? sanitizedValue : null);
</script>

<div
  bind:this={root}
  class="rating-group {classes ?? ''}"
  class:disabled
  class:readonly
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role="slider"
  tabindex={disabled ? -1 : 0}
  aria-valuemin={0}
  aria-valuemax={effectiveMax}
  aria-valuenow={sanitizedValue}
  aria-valuetext={valueText}
  aria-label={ariaLabel ?? 'Rating'}
  aria-disabled={disabled}
  aria-readonly={readonly}
  data-disabled={disabled ? '' : null}
  data-readonly={readonly ? '' : null}
  onkeydown={handleKeydown}
>
  {#each starIndices as index (index)}
    {@const state = starState(index)}
    <span
      class="star"
      aria-hidden="true"
      data-state={state}
      data-pw={typeof testId === 'string' ? `${testId}-star-${index + 1}` : null}
      testID={typeof testId === 'string' ? `${testId}-star-${index + 1}` : null}
      onclick={(event) => handleStarClick(event, index)}
    >
      {#if typeof star === 'function'}
        {@render star({ index, state })}
      {:else}
        <span class="star-empty">
          <!-- eslint-disable svelte/no-at-html-tags -->
          {@html starSvg}
        </span>
        {#if state !== 'empty'}
          <span class="star-fill" style:width={state === 'half' ? '50%' : '100%'}>
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html starSvg}
          </span>
        {/if}
      {/if}
    </span>
  {/each}
  <input
    type="number"
    class="native-input"
    tabindex={-1}
    aria-hidden="true"
    min={0}
    max={hasValidMax ? max : null}
    step={allowHalf ? 0.5 : 1}
    value={submittedValue === null ? '' : submittedValue}
    {disabled}
    {required}
    name={typeof name === 'string' && submittedValue !== null ? name : null}
    form={typeof form === 'string' ? form : null}
    oninvalid={handleInvalid}
    data-pw={typeof testId === 'string' ? `${testId}-native-input` : null}
    testID={typeof testId === 'string' ? `${testId}-native-input` : null}
  />
</div>

<style>
  .rating-group {
    display: var(--rating-group-display, inline-flex);
    align-items: center;
    gap: var(--rating-group-gap, 2px);
    cursor: var(--rating-group-cursor, pointer);
    outline: none;
    border-radius: var(--rating-group-border-radius, var(--radius, 4px));
    width: fit-content;
  }

  .rating-group:focus-visible {
    box-shadow: var(--rating-group-focus-ring, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  .rating-group.disabled {
    opacity: var(--rating-group-disabled-opacity, 0.4);
    cursor: var(--rating-group-disabled-cursor, not-allowed);
  }

  .rating-group.readonly {
    cursor: var(--rating-group-readonly-cursor, default);
  }

  .star {
    position: relative;
    display: inline-flex;
    width: var(--rating-group-star-size, 24px);
    height: var(--rating-group-star-size, 24px);
    flex-shrink: 0;
  }

  .rating-group:not(.disabled):not(.readonly) .star:hover {
    transform: var(--rating-group-star-hover-transform, scale(1.1));
  }

  .star-empty,
  .star-fill {
    position: absolute;
    inset: 0;
    display: flex;
  }

  .star-empty {
    color: var(--rating-group-star-empty-color, #d1d5db);
  }

  .star-empty :global(svg) {
    width: 100%;
    height: 100%;
  }

  .star-fill {
    color: var(--rating-group-star-filled-color, #f5a623);
    overflow: hidden;
  }

  .star-fill :global(svg) {
    width: var(--rating-group-star-size, 24px);
    height: var(--rating-group-star-size, 24px);
    flex-shrink: 0;
  }

  .native-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
</style>
