<script lang="ts">
  import type { StepProperties } from './properties';

  let {
    stepIndex,
    label,
    icon,
    status,
    badge,
    orientation = 'horizontal',
    classes,
    ariaLabel,
    onclick,
    onkeydown
  }: StepProperties = $props();

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

<div
  class={stepClass}
  onclick={handleStepClick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
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
  }

  .step-vertical {
    --step-flex-direction: column;
    align-items: flex-start;
  }

  .step-index-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--step-index-container-height, 30px);
    width: var(--step-index-container-width, 30px);
    border-radius: var(--step-index-container-radius, 50%);
    background-color: var(--step-index-container-background-color, #798fa5cc);
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
