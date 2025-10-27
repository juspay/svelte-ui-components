<script lang="ts">
  import type { CheckListItemProperties } from './properties';

  let {
    text,
    checked = $bindable(false),
    checkboxLabel,
    onclick
  }: CheckListItemProperties = $props();

  function handleCheckboxClick(e: MouseEvent): void {
    if (e.target instanceof HTMLInputElement && typeof e.target.checked === 'boolean') {
      checked = e.target.checked;
    }
    onclick?.(checked);
  }
</script>

<div class="container">
  <input type="checkbox" class="checkbox" bind:checked onclick={handleCheckboxClick} />
  {#if checkboxLabel}
    {@render checkboxLabel?.()}
  {:else}
    <span class="text" class:checked>
      <!-- eslint-disable-next-line -->
      {@html text}
    </span>
  {/if}
</div>

<style>
  .container {
    display: var(--check-list-item-display, flex);
    align-items: var(--check-list-item-align-items, center);
    width: var(--check-list-item-width, 100%);
    padding: var(--check-list-item-padding);
  }

  .text {
    margin: var(--check-list-item-margin, 0px 0px 0px 8px);
    font-size: var(--check-list-item-text-size, 12px);
    color: var(--check-list-item-text-color);
  }

  .text.checked {
    color: var(--check-list-item-checked-text-color);
    font-weight: var(--check-list-item-checked-font-weight);
  }

  input.checkbox {
    accent-color: var(--checkbox-accent-color, #000);
    border: 5px solid red;
    height: var(--checkbox-height, 24px);
    width: var(--checkbox-width, 24px);
    margin: var(--checkbox-margin);
    padding: var(--checkbox-padding);
    border-radius: var(--checkbox-border-radius);
    visibility: var(--checkbox-visibility);
  }
</style>
