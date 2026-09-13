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
    onhandlestepclick
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
        onclick={onhandlestepclick}
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

  /* status-completed: #24aa5a measured 2.89:1 as label text on the #fafafa demo
     background and 3.01:1 behind the white step number — the same one-hue,
     two-roles failure as in-progress below. #1a7a44 clears both (5.14:1 text,
     5.37:1 white-on-it) and keeps the dark-mode override two blocks down
     (unchanged, already legible at 5.72:1) from silently regressing now that
     this literal no longer doubles as the dark-theme fallback too. */
  .status-completed {
    --step-text-color: var(--step-text-completed-color, #1a7a44);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-completed-color,
      #1a7a44
    );
    --step-index-container-background-color: var(
      --step-index-container-completed-background-color,
      #1a7a44
    );
    /* No border existed for any status before this, so every one of these
       per-status hooks falls back to `none` — byte-identical for a consumer
       that sets nothing. */
    --step-index-container-border: var(--step-index-container-completed-border, none);
  }

  /* Step.svelte keeps its own copy of every status class (`class:status-completed`
     etc. on its own root <div>) so a bare, Stepper-less <Step> can theme itself —
     see that file's comment. That copy sets the SAME custom properties directly
     on the very element (or, for .step-text/.step-index-container below, the
     parent of the very element) the color actually renders on. A directly
     cascaded value always beats one merely inherited from an ancestor, no matter
     how specific the ancestor's rule is — so Step's copy silently outranked every
     literal set above for a Stepper-wrapped step, and the fix above alone never
     reached the screen (verified by grepping both files: Step.svelte lines
     140-174 duplicate exactly these three custom properties with the old,
     failing literals). These two rules break the tie: :global() lets the
     selector reach past Step's own component scope to .step-text/
     .step-index-container directly, and three chained classes there
     out-specificity Step's own single-class rule on each — while still
     deferring to the identical --step-text-completed-color /
     --step-index-container-completed-background-color hooks both files already
     expose, so a consumer override behaves exactly as it did before this fix. */
  .status-completed :global(.step-text) {
    color: var(--step-text-completed-color, #1a7a44);
  }

  .status-completed :global(.step-index-container),
  .status-completed :global(.step-icon-container) {
    background-color: var(--step-index-container-completed-background-color, #1a7a44);
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

  /* status-pending: previously had no override at all, so it fell through to
     Step.svelte's neutral #798fa5cc default — an alpha-blended blue-grey that
     measured 2.44:1 as label text and 2.55:1 behind the white step number on
     the #fafafa demo background, the same one-hue-fails-both-roles shape as
     in-progress below (alpha compositing only makes it worse). #55627a is an
     opaque step down the same blue-grey family and clears both roles. */
  .status-pending {
    --step-text-color: var(--step-text-pending-color, #55627a);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-pending-color,
      #55627a
    );
    --step-index-container-background-color: var(
      --step-index-container-pending-background-color,
      #55627a
    );
    --step-index-container-border: var(--step-index-container-pending-border, none);
  }

  /* status-failure: #e53935 measured 4.05:1 as label text and 4.23:1 behind the
     white step number on the #fafafa demo background — both just under the
     4.5:1 minimum for this component's 12px/14px (non-large) text. #c62828
     clears both (5.39:1 text, 5.62:1 white-on-it). */
  .status-failure {
    --step-text-color: var(--step-text-failure-color, #c62828);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-failure-color,
      #c62828
    );
    --step-index-container-background-color: var(
      --step-index-container-failure-background-color,
      var(--stepper-status-failure-color, #c62828)
    );
    --step-index-container-border: var(--step-index-container-failure-border, none);
  }

  /* Same Step.svelte own-declaration-beats-inheritance tie as status-completed
     above (Step.svelte lines 158-164 duplicate these with the old #e53935). */
  .status-failure :global(.step-text) {
    color: var(--step-text-failure-color, #c62828);
  }

  .status-failure :global(.step-index-container),
  .status-failure :global(.step-icon-container) {
    background-color: var(
      --step-index-container-failure-background-color,
      var(--stepper-status-failure-color, #c62828)
    );
  }

  /* status-in-progress: the reported defect. #f59e0b measured 2.06:1 as label
     text on the #fafafa demo background and 2.15:1 behind the white step
     number — one hue asked to do both jobs, failing both. #92400e (a darker
     amber) clears both roles (6.79:1 text, 7.09:1 white-on-it). */
  .status-in-progress {
    --step-text-color: var(--step-text-in-progress-color, #92400e);
    --stepper-separator-background-image-color: var(
      --stepper-separator-background-image-in-progress-color,
      #92400e
    );
    --step-index-container-background-color: var(
      --step-index-container-in-progress-background-color,
      var(--stepper-status-in-progress-color, #92400e)
    );
    --step-index-container-border: var(--step-index-container-in-progress-border, none);
  }

  /* Same Step.svelte own-declaration-beats-inheritance tie as status-completed
     above (Step.svelte lines 167-173 duplicate these with the old #f59e0b). */
  .status-in-progress :global(.step-text) {
    color: var(--step-text-in-progress-color, #92400e);
  }

  .status-in-progress :global(.step-index-container),
  .status-in-progress :global(.step-icon-container) {
    background-color: var(
      --step-index-container-in-progress-background-color,
      var(--stepper-status-in-progress-color, #92400e)
    );
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

  /* Stepper's dark colours used to live here, as
     `:global([data-theme='dark']) .status-… :global(.step-text)`. That works in
     the Svelte build, where this stylesheet is in the document and can see
     <html data-theme="dark">, and it is dead in <sui-stepper>: the same
     stylesheet is injected INTO the shadow root, and a selector there cannot
     match an ancestor outside its own tree. Measured, not assumed -- the custom
     element rendered the light literals on a dark page, #92400e in-progress
     label at 1.68:1.

     Every one of those rules resolved the SAME custom property the light rule
     above does, differing only in its fallback literal, so setting that property
     once in the dark token layer produces an identical result through the rule
     that is already there -- and a custom property, unlike a selector, inherits
     across the shadow boundary. See src/lib/styles/theme-dark.css. */
</style>
