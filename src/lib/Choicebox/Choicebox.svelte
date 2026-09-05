<script lang="ts">
  import type { ChoiceboxProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';

  let {
    children,
    selected = $bindable(false),
    mode = 'radio',
    disabled = false,
    showIndicator = true,
    testId,
    onclick: onclickProp,
    onClick,
    classes
  }: ChoiceboxProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onclick = $derived(
    resolveDeprecatedProp('Choicebox', 'onClick', 'onclick', onClick, onclickProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onclick);
  });

  function handleClick(): void {
    if (disabled) {
      return;
    }
    if (mode === 'radio' && selected) {
      return;
    }
    selected = !selected;
    onclick?.(selected);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="choicebox {classes ?? ''}"
  class:selected
  class:disabled
  role={mode === 'radio' ? 'radio' : 'checkbox'}
  aria-checked={selected}
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
  onclick={handleClick}
  onkeydown={handleKeyDown}
  data-pw={testId}
  testID={testId}
>
  {#if typeof children === 'function'}
    {@render children()}
  {/if}
  {#if showIndicator}
    <span class="indicator {mode}" class:selected aria-hidden="true">
      {#if mode === 'checkbox' && selected}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span class="indicator-icon">{@html checkmarkSvg}</span>
      {/if}
    </span>
  {/if}
</div>

<style>
  .choicebox {
    display: var(--choicebox-display, flex);
    align-items: var(--choicebox-align-items, center);
    padding: var(--choicebox-padding, 16px);
    border: var(--choicebox-border, 2px solid #d0d0d0);
    border-radius: var(--choicebox-border-radius, var(--radius, 4px));
    background: var(--choicebox-background, #ffffff);
    gap: var(--choicebox-gap, 12px);
    cursor: var(--choicebox-cursor, pointer);
    font-family: var(--choicebox-font-family, inherit);
    transition: var(--choicebox-transition, border-color 0.2s, background 0.2s);
    -webkit-tap-highlight-color: transparent;
  }

  .choicebox:focus-visible {
    outline: none;
    box-shadow: var(--choicebox-focus-ring, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  /* Exclude the selected state from hover: without :not(.selected) this rule
     (specificity 0,3,0) outranks .choicebox.selected (0,2,0), so hovering a
     selected card repaints it with the neutral hover border/fill until the
     cursor leaves. Excluding selected lets .choicebox.selected show through. */
  .choicebox:not(.disabled):not(.selected):hover {
    border-color: var(--choicebox-hover-border-color, #9e9e9e);
    background: var(--choicebox-hover-background, var(--choicebox-background, #ffffff));
  }

  .choicebox.selected {
    border-color: var(--choicebox-selected-border-color, #2196f3);
    background: var(--choicebox-selected-background, var(--choicebox-background, #ffffff));
  }

  .choicebox.disabled {
    opacity: var(--choicebox-disabled-opacity, 0.4);
    cursor: var(--choicebox-disabled-cursor, not-allowed);
  }

  .indicator {
    flex: 0 0 auto;
    order: var(--choicebox-indicator-order, 1);
    margin-inline-start: var(--choicebox-indicator-margin-inline-start, auto);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--choicebox-indicator-size, 20px);
    height: var(--choicebox-indicator-size, 20px);
    border: var(--choicebox-indicator-border, 2px solid #757575);
    background: var(--choicebox-indicator-background, transparent);
    transition: var(--choicebox-indicator-transition, background 0.2s, border-color 0.2s);
  }

  .indicator.radio {
    border-radius: 50%;
  }

  .indicator.checkbox {
    border-radius: var(--choicebox-indicator-border-radius, var(--radius, 4px));
  }

  .indicator.selected {
    border: var(--choicebox-indicator-selected-border, 2px solid #2196f3);
    background: var(--choicebox-indicator-selected-background, #2196f3);
  }

  .indicator.radio.selected {
    box-shadow: inset 0 0 0 var(--choicebox-indicator-dot-inset, 4px)
      var(--choicebox-background, #ffffff);
  }

  .indicator-icon {
    display: flex;
    width: var(--choicebox-indicator-icon-size, 14px);
    height: var(--choicebox-indicator-icon-size, 14px);
    color: var(--choicebox-indicator-icon-color, #ffffff);
  }

  .indicator-icon :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
