<script lang="ts">
  import type { StepProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    stepIndex,
    label,
    icon,
    status,
    badge,
    orientation = 'horizontal',
    classes,
    ariaLabel,
    testId,
    suppressRoleAndTabindex,
    onclick: onclickProp,
    onClick,
    onkeydown
  }: StepProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onclick = $derived(
    resolveDeprecatedProp('Step', 'onClick', 'onclick', onClick, onclickProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onclick);
  });

  const handleStepClick = (): void => {
    onclick?.({ selectedIndex: stepIndex });
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStepClick();
    }
    onkeydown?.(event);
  };

  let isVertical = $derived(orientation === 'vertical');

  let stepClass = $derived(
    ['step', isVertical ? 'step-vertical' : '', classes ?? ''].filter((c) => c.length > 0).join(' ')
  );
</script>

<!-- role and tabindex are suppressed together by suppressRoleAndTabindex, so this
     can never end up non-interactive with a tab stop; matches ListItem's precedent. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- The per-status colour tokens are remapped by Stepper's own `.status-<name>` wrapper.
     A Step used on its own — outside a Stepper — never gets that wrapper, so every status
     rendered identically at the neutral default and the component could not express its
     own state. Carrying the same classes here lets a bare Step theme itself; inside a
     Stepper both set the same custom properties to the same values, so nothing about an
     existing consumer changes. These are `class:` directives rather than an interpolated
     string so the compiler can see the selectors are used and does not prune the rules. -->
<div
  class={stepClass}
  class:status-completed={status === 'completed'}
  class:status-active={status === 'active'}
  class:status-failure={status === 'failure'}
  class:status-in-progress={status === 'in-progress'}
  class:status-muted={status === 'muted'}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  onclick={handleStepClick}
  onkeydown={handleKeydown}
  role={suppressRoleAndTabindex ? null : 'button'}
  tabindex={suppressRoleAndTabindex ? null : 0}
  aria-label={ariaLabel ?? null}
  aria-labelledby={ariaLabel ? null : `step-label-${stepIndex}`}
  aria-current={status === 'active' ? 'step' : null}
>
  {#if typeof icon === 'string' && icon.length > 0}
    <div class="step-icon-container">
      <img class="step-icon" src={icon} alt="" />
    </div>
  {:else if status === 'in-progress'}
    <div class="step-index-container">
      <svg
        class="step-spinner"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          stroke-opacity="0.25"
          stroke-width="3"
        />
        <path
          d="M12 3a9 9 0 0 1 9 9"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </div>
  {:else}
    <div class="step-index-container">
      <div class="step-index-text">
        {stepIndex}
      </div>
    </div>
  {/if}

  <div class="step-text" id="step-label-{stepIndex}">
    {label}
  </div>

  {#if typeof badge === 'function'}
    <div class="step-badge">
      {@render badge()}
    </div>
  {/if}

  <div class="separator"></div>
</div>

<style>
  .step {
    display: flex;
    flex-direction: var(--step-flex-direction, row);
    align-items: center;
    /* Lets a step's own box grow to fill a --step-container-flex share of the
       Stepper row — a prerequisite for the separator below to have any free
       space to grow into. Default 0 keeps a step sized to its content. */
    flex-grow: var(--step-flex-grow, 0);
  }

  .step-vertical {
    --step-flex-direction: column;
    align-items: flex-start;
  }

  /* Mirrors Stepper.svelte's per-status remapping so a bare Step themes itself. Only the
     tokens Step actually renders are set here; the separator is Stepper's to draw. Each
     chain terminates in the same literal Stepper uses, so the two agree by construction. */
  .status-completed {
    --step-text-color: var(--step-text-completed-color, #24aa5a);
    --step-index-container-background-color: var(
      --step-index-container-completed-background-color,
      #24aa5a
    );
    --step-index-container-border: var(--step-index-container-completed-border, none);
  }

  .status-active {
    --step-text-color: var(--step-text-active-color, #2f3841);
    --step-index-container-background-color: var(
      --step-index-container-active-background-color,
      #2f3841
    );
    --step-index-container-border: var(--step-index-container-active-border, none);
  }

  .status-failure {
    --step-text-color: var(--step-text-failure-color, #e53935);
    --step-index-container-background-color: var(
      --step-index-container-failure-background-color,
      var(--stepper-status-failure-color, #e53935)
    );
    --step-index-container-border: var(--step-index-container-failure-border, none);
  }

  .status-in-progress {
    --step-text-color: var(--step-text-in-progress-color, #f59e0b);
    --step-index-container-background-color: var(
      --step-index-container-in-progress-background-color,
      var(--stepper-status-in-progress-color, #f59e0b)
    );
    --step-index-container-border: var(--step-index-container-in-progress-border, none);
  }

  .status-muted {
    --step-text-color: var(--step-text-muted-color, #667080);
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

  /* status-pending sets nothing — it is the neutral default already in .step-index-container. */

  .step-index-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--step-index-container-height, 30px);
    width: var(--step-index-container-width, 30px);
    border-radius: var(--step-index-container-radius, 50%);
    background-color: var(--step-index-container-background-color, #798fa5cc);
    /* No border today, so the fallback is `none` — an existing consumer that sets
       nothing renders byte-identically. Shared with .step-icon-container below so
       a status override (see Stepper.svelte) themes the circle whichever of the
       two mutually-exclusive renders is showing. */
    border: var(--step-index-container-border, none);
    color: var(--step-index-color, white);
    flex-shrink: 0;
  }

  .step-icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--step-index-container-height, 30px);
    width: var(--step-index-container-width, 30px);
    border-radius: var(--step-index-container-radius, 50%);
    background-color: var(--step-index-container-background-color, #798fa5cc);
    border: var(--step-index-container-border, none);
    flex-shrink: 0;
    overflow: hidden;
  }

  .step-icon {
    width: var(--step-icon-size, 18px);
    height: var(--step-icon-size, 18px);
    object-fit: contain;
  }

  .step-spinner {
    width: var(--step-spinner-size, 18px);
    height: var(--step-spinner-size, 18px);
    animation: stepper-spin 0.8s linear infinite;
  }

  @keyframes stepper-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .separator {
    display: var(--stepper-separator-display, var(--separator-display, block));
    height: var(--stepper-separator-height, var(--separator-height, 1px));
    width: var(--stepper-separator-width, var(--separator-width, 50px));
    /* 0 keeps the separator pinned to its width above; set alongside --step-flex-grow
       and --step-container-flex to let it stretch into a card's remaining width. */
    flex-grow: var(--stepper-separator-flex-grow, 0);
    margin: var(--stepper-separator-margin, var(--separator-margin, 0px 12px 0px 12px));
    background-image: var(
      --stepper-separator-background-image,
      var(
        --separator-background-image,
        repeating-linear-gradient(
          to right,
          var(
            --stepper-separator-background-image-color,
            var(--separator-background-image-color, #798fa5cc)
          ),
          var(
              --stepper-separator-background-image-color,
              var(--separator-background-image-color, #798fa5cc)
            )
            6px,
          transparent 6px,
          transparent 10px
        )
      )
    );
  }

  .step-vertical .separator {
    height: var(--stepper-separator-vertical-height, 32px);
    width: var(--stepper-separator-vertical-width, 1px);
    margin: var(--stepper-separator-vertical-margin, 4px 0px 4px 14px);
    background-image: repeating-linear-gradient(
      to bottom,
      var(
        --stepper-separator-background-image-color,
        var(--separator-background-image-color, #798fa5cc)
      ),
      var(
          --stepper-separator-background-image-color,
          var(--separator-background-image-color, #798fa5cc)
        )
        6px,
      transparent 6px,
      transparent 10px
    );
  }

  .step-text {
    margin: var(--step-text-margin, 0px 0px 0px 12px);
    font-size: var(--step-text-font-size, 12px);
    /* No font-weight is set today, so the div inherits the browser default
       `normal` — that is the literal fallback, keeping an existing consumer
       byte-identical. */
    font-weight: var(--step-text-font-weight, normal);
    color: var(--step-text-color, #798fa5cc);
  }

  .step-vertical .step-text {
    margin: var(--step-text-vertical-margin, 4px 0px 0px 0px);
  }

  .step-index-text {
    font-size: var(--step-index-font-size, 14px);
    color: var(--step-index-color, white);
  }

  .step-badge {
    margin: var(--step-badge-margin, 0 0 0 4px);
  }

  .step-vertical .step-badge {
    margin: var(--step-badge-vertical-margin, 4px 0 0 0);
  }
</style>
