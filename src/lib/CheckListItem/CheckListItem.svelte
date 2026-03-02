<script lang="ts">
  import type { CheckListItemProperties } from './properties';
  import Checkbox from '../Checkbox/Checkbox.svelte';

  let {
    text,
    checked = $bindable(false),
    disabled = false,
    checkboxLabel,
    testId,
    onclick,
    classes
  }: CheckListItemProperties = $props();

  function handleClick(value: boolean): void {
    checked = value;
    onclick?.(checked);
  }
</script>

<div class="container {classes ?? ''}" class:disabled data-pw={testId}>
  <div class="checkbox-wrapper">
    <Checkbox
      text=""
      bind:checked
      {disabled}
      onclick={handleClick}
      {...typeof testId === 'string' ? { testId: `${testId}-checkbox` } : {}}
    />
  </div>
  {#if typeof checkboxLabel === 'function'}
    {@render checkboxLabel()}
  {:else}
    <span class="text" class:checked>{text}</span>
  {/if}
</div>

<style>
  .container {
    display: var(--check-list-item-display, flex);
    align-items: var(--check-list-item-align-items, center);
    width: var(--check-list-item-width, 100%);
    padding: var(--check-list-item-padding);
    gap: var(--check-list-item-gap, 8px);
  }

  .container.disabled {
    opacity: var(--check-list-item-disabled-opacity, 0.4);
    cursor: not-allowed;
  }

  .checkbox-wrapper {
    flex-shrink: 0;
  }

  .text {
    font-size: var(--check-list-item-text-size, 14px);
    color: var(--check-list-item-text-color);
  }

  .text.checked {
    color: var(--check-list-item-checked-text-color);
    font-weight: var(--check-list-item-checked-font-weight);
  }
</style>
