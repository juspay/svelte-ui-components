<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;
  export let text = '';

  const dispatch = createEventDispatcher();

  function handleCheckboxClick(e: MouseEvent): void {
    if (e.target instanceof HTMLInputElement && typeof e.target.checked === 'boolean') {
      checked = e.target.checked;
    }
    dispatch('click', checked);
  }
</script>

<div class="container">
  <div class="text" hidden={text.length === 0}>{text}</div>
  <label class="switch">
    <input class="input-checkbox" type="checkbox" bind:checked={checked} on:click={handleCheckboxClick} />
    <span class="slider round" />
  </label>
</div>

<style>
  .container {
    display: var(--toggle-container-display, flex);
    align-items: var(--toggle-container-align-items, center);
    gap: var(--toggle-container-gap, 8px);
  }

  .text {
    font-size: var(--toggle-text-font-size, 14px);
    font-weight: var(--toggle-text-font-weight, 400);
    color: var(--toggle-text-color, #4a4a4a);
    margin: var(--toggle-text-margin, 0px 8px 0px 0px);
    order: var(--toggle-text-order, 0);
  }

  .switch {
    position: relative;
    display: inline-block;
    width: var(--toggle-switch-width, 46px);
    height: var(--toggle-switch-height, 25px);
  }

  .switch .input-checkbox {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: var(--toggle-slider-top, 0);
    left: var(--toggle-slider-left, 0);
    right: var(--toggle-slider-right, 0);
    bottom: var(--toggle-slider-bottom, 0);
    background-color: var(--slider-unchecked-color, #ccc);
    -webkit-transition: var(--toggle-slider-transition, 0.4s);
    transition: var(--toggle-slider-transition, 0.4s);
  }

  .slider:before {
    position: absolute;
    content: '';
    height: var(--toggle-ball-height, 23px);
    width: var(--toggle-ball-width, 23px);
    left: var(--toggle-slider-before-left, 2px);
    bottom: var(--toggle-slider-before-bottom, 1px);
    top: var(--toggle-slider-before-top, 1px);
    background-color: var(--toggle-slider-before-background-color, white);
    -webkit-transition: var(--toggle-slider-transition, 0.4s);
    transition: var(--toggle-slider-transition, 0.4s);
  }

  .input-checkbox:checked + .slider {
    background-color: var(--slider-checked-color, #2196f3);
  }

  .input-checkbox:focus + .slider {
    box-shadow: 0 0 1px #171717;
  }

  .input-checkbox:checked + .slider:before {
    -webkit-transform: translateX(19px);
    -ms-transform: translateX(19px);
    transform: translateX(19px);
  }

  .slider.round {
    border-radius: var(--slider-border-radius, 23px);
  }

  .slider.round:before {
    border-radius: var(--slider-border-radius-before, 50%);
  }
</style>
