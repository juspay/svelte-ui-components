<script lang="ts">
  import type { StepperProperties, StepStatus } from './properties';
  import Step from './Step.svelte';

  let {
    steps,
    currentStepIndex,
    orientation = 'horizontal',
    classes,
    testId,
    suppressRoleAndTabindex,
    suppressContainerTestId,
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

  // Per-step ids always derive from testId, even when the container itself is
  // opted out of claiming it — only the container's own data-pw/testID is suppressed.
  const containerTestId = $derived(
    typeof testId === 'string' && !suppressContainerTestId ? testId : null
  );

  let containerClass = $derived(
    ['container', orientation === 'vertical' ? 'container-vertical' : '', classes ?? '']
      .filter((c) => c.length > 0)
      .join(' ')
  );
</script>

<div class={containerClass} data-pw={containerTestId} testID={containerTestId} role="list">
  {#each steps as currentStep, stepIndex (stepIndex)}
    {@const effectiveStatus = resolveStatus(stepIndex, currentStep.status ?? null)}
    {@const stepTestId =
      currentStep.testId ?? (typeof testId === 'string' ? `${testId}-step-${stepIndex + 1}` : null)}
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
        testId={stepTestId}
        {orientation}
        {suppressRoleAndTabindex}
      />
    </div>
  {/each}
</div>

<style>
  .container {
    display: flex;
    flex-direction: var(--container-flex-direction, row);
    flex-wrap: var(--container-flex-wrap, nowrap);
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
    flex: var(--step-container-flex, 0 1 auto);
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
    /* No border existed for any status before this, so every one of these
       per-status hooks falls back to `none` — byte-identical for a consumer
       that sets nothing. */
    --step-index-container-border: var(--step-index-container-completed-border, none);
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
    --step-index-container-border: var(--step-index-container-active-border, none);
  }

  /* status-pending: no override — falls through to #798fa5cc grey (and no border) default in Step.svelte */

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
    --step-index-container-border: var(--step-index-container-failure-border, none);
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
    --step-index-container-border: var(--step-index-container-in-progress-border, none);
  }

  /* status-muted: a smaller, subtly-tinted marker for a de-emphasized or
     supplementary step (e.g. an informational marker riding alongside a
     primary rail). New opt-in status value — none of the statuses above are
     touched, and a step only reaches these rules by setting status:'muted'
     explicitly (resolveStatus never derives it). Reuses the same
     --step-index-container-height/-width/-background-color, --step-text-color,
     --stepper-separator-background-image-color and --step-index-container-border
     hooks the other statuses already theme through, so a call site can further
     override any of them the same way. */
  .status-muted {
    --step-text-color: var(--step-text-muted-color, #667080);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-muted-color,
      #c9d2db
    );
    --step-index-container-background-color: var(
      --step-index-container-muted-background-color,
      #c9d2db
    );
    /* The circle is pale, so the numeral cannot inherit the white used on every other
       status — that measured 1.53:1. #2f3841 is the same literal the active status
       already uses for text, and reads at 7.79:1 here. */
    --step-index-color: var(--step-index-muted-color, #2f3841);
    --step-index-container-border: var(--step-index-container-muted-border, none);
    --step-index-container-height: var(--step-index-container-muted-height, 20px);
    --step-index-container-width: var(--step-index-container-muted-width, 20px);
    --step-index-font-size: var(--step-index-muted-font-size, 10px);
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
