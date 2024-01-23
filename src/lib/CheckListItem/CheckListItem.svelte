<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let text: string;
  export let checked: boolean = false;
  export let clickableCheckboxContainer: boolean = false;

  const dispatch = createEventDispatcher();

  function handleCheckboxClick(e: MouseEvent) {
    if (e.target instanceof HTMLInputElement || clickableCheckboxContainer) {
      checked = !checked;
      dispatch('click');
    }
  }


</script>
<div class="container" on:click={handleCheckboxClick} on:keydown role="button" tabindex="0">
  <input class="checkbox" type="checkbox" bind:checked />
  <span class="text">
    <!-- eslint-disable-next-line -->
    {@html text}
  </span>
</div>

<style>
  .container {
    display: var(--check-list-item-display, flex);
    align-items: var(--check-list-item-align-items, center);
    width: var(--check-list-item-width, 100%);
    padding: var(--check-list-item-padding, 0px);
  }

  .text {
    margin: var(--check-list-item-margin, 0px 0px 0px 8px);
    font-size: var(--check-list-item-text-size, 12px);
    color: var(--check-list-item-text-color);
  }

  input.checkbox {
    accent-color: var(--checkbox-accent-color, #000);
    border: 5px solid red;
    height: var(--checkbox-height, 24px);
    width: var(--checkbox-width, 24px);
    margin: var(--checkbox-margin);
  }
</style>
