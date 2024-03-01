<script lang="ts">
  import type { StepperProperties } from './properties';
  import Step from './Step.svelte';

  export let properties: StepperProperties;
</script>

<div class="container">
  {#each properties.steps as currentStep, stepIndex}
    <div
      class:active-step={properties.currentStepIndex === stepIndex}
      class:completed-step={properties.currentStepIndex > stepIndex}
      class="step-container"
    >
      <Step
        on:handleStepClick
        label={currentStep.label}
        icon={currentStep.icon ?? null}
        stepIndex={stepIndex + 1}
      />
    </div>
  {/each}
</div>

<style>
  .container {
    display: flex;
    flex-direction: var(--container-flex-direction, row);
    align-items: center;
  }

  .step-container:last-child {
    --separator-display: none;
  }

  .step-container {
    display: flex;
    align-items: center;
  }

  .active-step {
    --step-text-color: var(--step-text-active-color, #2f3841);
    --separator-background-image-color: var(--separator-background-image-active-color, #2f3841);
    --step-index-container-background-color: var(
      --step-index-container-active-background-color,
      #2f3841
    );
  }

  .completed-step {
    --step-text-color: var(--step-text-completed-color, #24aa5a);
    --separator-background-image-color: var(--separator-background-image-completed-color, #24aa5a);
    --step-index-container-background-color: var(
      --step-index-container-completed-background-color,
      #24aa5a
    );
  }
</style>
