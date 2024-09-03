<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let text: string;
  export let checked: boolean;

  const dispatch = createEventDispatcher();

  function handleCheckboxClick(e: MouseEvent): void {
    if (e.target instanceof HTMLInputElement && typeof e.target.checked === 'boolean') {
      checked = e.target.checked;
    }
    dispatch('click', checked);
  }
</script>

<div class="container">
  <input type="checkbox" class="checkbox" bind:checked on:click={handleCheckboxClick} />
  {#if $$slots.checkboxLabel}
    <slot name="checkboxLabel" />
  {:else}
    <span class="text" class:checked={checked}>
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
