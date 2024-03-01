<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let stepIndex: number;
  export let label: string;
  export let icon: string | null;

  const dispatch = createEventDispatcher();

  function handleStepClick() {
    dispatch('handleStepClick', { selectedIndex: stepIndex });
  }
</script>

<div class="step" on:click={handleStepClick} role="button" tabindex="0" on:keydown>
  {#if icon !== null}
    <div class="step-icon-container">
      <img class="step-icon" src={icon} alt="" />
    </div>
  {:else}
    <div class="step-index-container">
      <div class={'step-index-text'}>
        {stepIndex}
      </div>
    </div>
  {/if}
  <div class={'step-text'}>
    {label}
  </div>
  <div class={'separator'} />
</div>

<style>
  .step {
    display: flex;
    flex-direction: var(--step-flex-direction, row);
    align-items: center;
  }

  .step-index-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--step-index-container-height, 30px);
    width: var(--step-index-container-width, 30px);
    border-radius: var(--step-index-container-radius, 50%);
    background-color: var(--step-index-container-background-color, #798fa5cc);
  }

  .separator {
    display: var(--separator-display, block);
    height: var(--separator-height, 1px);
    width: var(--separator-width, 50px);
    margin: var(--separator-margin, 0px 12px 0px 12px);
    background-image: var(
      --separator-background-image,
      repeating-linear-gradient(
        to right,
        var(--separator-background-image-color, #798fa5cc),
        var(--separator-background-image-color, #798fa5cc) 6px,
        transparent 6px,
        transparent 10px
      )
    );
  }

  .step-text {
    margin: var(--step-text-margin, 0px 0px 0px 12px);
    font-size: var(--step-text-font-size, 12px);
    color: var(--step-text-color, #798fa5cc);
  }

  .step-index-text {
    font-size: var(--step-index-font-size, 14px);
    color: var(--step-index-color, white);
  }
</style>
