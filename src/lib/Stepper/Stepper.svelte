<script lang="ts">
  import type { StepperProperties, StepStatus } from './properties';
  import Step from './Step.svelte';

  let {
    steps,
    currentStepIndex,
    orientation = 'horizontal',
    classes,
    testId,
    onstepclick,
    onhandleStepClick
  }: StepperProperties = $props();

  const resolveStatus = (stepIndex: number, explicitStatus: StepStatus | null): StepStatus => {
    if (explicitStatus !== null) {
      return explicitStatus;
    }
    if (stepIndex < currentStepIndex) {
      return 'completed';
    }
    if (stepIndex === currentStepIndex) {
      return 'active';
    }
    return 'pending';
  };

  // Support the deprecated onhandleStepClick alias — onstepclick takes priority.
  const effectiveStepClick = $derived(onstepclick ?? onhandleStepClick);

  let containerClass = $derived(
    ['container', orientation === 'vertical' ? 'container-vertical' : '', classes ?? '']
      .filter((c) => c.length > 0)
      .join(' ')
  );
</script>

<div
  class={containerClass}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role="list"
>
  {#each steps as currentStep, stepIndex (stepIndex)}
    {@const effectiveStatus = resolveStatus(stepIndex, currentStep.status ?? null)}
    <div
      role="listitem"
      class="step-container status-{effectiveStatus} {effectiveStatus === 'active'
        ? 'active-step'
        : ''} {effectiveStatus === 'completed' ? 'completed-step' : ''}"
    >
      <Step
        onclick={effectiveStepClick}
        label={currentStep.label}
        icon={currentStep.icon}
        stepIndex={stepIndex + 1}
        status={effectiveStatus}
        badge={currentStep.badge}
        {orientation}
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

  .container-vertical {
    --container-flex-direction: column;
    align-items: flex-start;
  }

  .step-container:last-child {
    --stepper-separator-display: none;
  }

  .step-container {
    display: flex;
    align-items: center;
  }

  /* status-completed */
  .status-completed {
    --step-text-color: var(--step-text-completed-color, #24aa5a);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-completed-color,
      #24aa5a
    );
    --step-index-container-background-color: var(
      --step-index-container-completed-background-color,
      #24aa5a
    );
  }

  /* status-active */
  .status-active {
    --step-text-color: var(--step-text-active-color, #2f3841);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-active-color,
      #2f3841
    );
    --step-index-container-background-color: var(
      --step-index-container-active-background-color,
      #2f3841
    );
  }

  /* status-pending: no override — falls through to #798fa5cc grey default in Step.svelte */

  /* status-failure */
  .status-failure {
    --step-text-color: var(--step-text-failure-color, #e53935);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-failure-color,
      #e53935
    );
    --step-index-container-background-color: var(
      --step-index-container-failure-background-color,
      var(--stepper-status-failure-color, #e53935)
    );
  }

  /* status-in-progress */
  .status-in-progress {
    --step-text-color: var(--step-text-in-progress-color, #f59e0b);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-in-progress-color,
      #f59e0b
    );
    --step-index-container-background-color: var(
      --step-index-container-in-progress-background-color,
      var(--stepper-status-in-progress-color, #f59e0b)
    );
  }

  :global([theme='dark']) .status-failure {
    --step-text-color: var(--step-text-failure-color, #ef5350);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-failure-color,
      #ef5350
    );
    --step-index-container-background-color: var(
      --step-index-container-failure-background-color,
      var(--stepper-status-failure-color, #ef5350)
    );
  }

  :global([theme='dark']) .status-in-progress {
    --step-text-color: var(--step-text-in-progress-color, #fbbf24);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-in-progress-color,
      #fbbf24
    );
    --step-index-container-background-color: var(
      --step-index-container-in-progress-background-color,
      var(--stepper-status-in-progress-color, #fbbf24)
    );
  }
</style>
