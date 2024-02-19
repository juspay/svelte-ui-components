<script lang="ts">
  import {
    defaultStepperProperties,
    type StepperProperties,
    type StepProperties
  } from './properties';
  import Step from './Step.svelte';

  export let properties: StepperProperties = defaultStepperProperties;

  function getStepProperties(curStep: string, curIndex: number): StepProperties {
    return {
      stepIndex: curIndex + 1,
      stepLabel: curStep,
      showStepLine: curIndex !== properties.steps.length - 1,
      status:
        properties.currentStepIndex === curIndex
          ? 'active'
          : properties.currentStepIndex < curIndex
            ? 'next'
            : 'completed',
      animateClass:
        properties.currentStepIndex === curIndex
          ? 'animate-active'
          : curIndex === properties.currentStepIndex - 1
            ? 'animate-completed'
            : ''
    };
  }
</script>

<div class="container">
  {#each properties.steps as curStep, stepIndex}
    <Step properties={getStepProperties(curStep, stepIndex)} />
  {/each}
</div>

<style>
  .container {
    display: flex;
    flex-direction: var(--stepper-flex-direction, row);
  }
</style>
