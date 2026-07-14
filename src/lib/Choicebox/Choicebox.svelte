<script lang="ts">
  import type { ChoiceboxProperties } from './properties';

  let {
    children,
    selected = $bindable(false),
    mode = 'radio',
    disabled = false,
    testId,
    onclick,
    classes
  }: ChoiceboxProperties = $props();

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
>
  {#if typeof children === 'function'}
    {@render children()}
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
</style>
