<script lang="ts">
  import type { RadioIconProperties } from './properties';

  let {
    selected = false,
    disabled = false,
    size = 16,
    testId,
    classes
  }: RadioIconProperties = $props();
</script>

<span
  class="radio-icon {classes ?? ''}"
  class:radio-icon-selected={selected}
  class:radio-icon-disabled={disabled}
  role="radio"
  aria-checked={selected}
  aria-disabled={disabled || null}
  data-pw={testId}
  style="--radio-icon-size:{size}px"
>
  <span class="radio-icon-dot"></span>
</span>

<style>
  .radio-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--radio-icon-size, 16px);
    height: var(--radio-icon-size, 16px);
    border-radius: 50%;
    border: 2px solid var(--radio-icon-border-color, #9e9e9e);
    background-color: var(--radio-icon-bg-color, #ffffff);
    flex-shrink: 0;
    transition: border-color 0.15s ease;
  }

  .radio-icon-selected {
    border-color: var(--radio-icon-selected-color, #2196f3);
  }

  .radio-icon-disabled {
    opacity: var(--radio-icon-disabled-opacity, 0.4);
    cursor: not-allowed;
  }

  .radio-icon-dot {
    width: 0;
    height: 0;
    border-radius: 50%;
    background-color: var(--radio-icon-dot-color, #2196f3);
    transition:
      width 0.15s ease,
      height 0.15s ease;
  }

  .radio-icon-selected .radio-icon-dot {
    width: calc(var(--radio-icon-size, 16px) * 0.5);
    height: calc(var(--radio-icon-size, 16px) * 0.5);
  }
</style>
