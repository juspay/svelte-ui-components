<script lang="ts">
  import type { StepListProperties } from './properties';

  let { steps, testId, classes, stepBody }: StepListProperties = $props();
</script>

<ol class="step-list {classes ?? ''}" data-pw={testId} aria-label="Step list">
  {#each steps as step, index (step.id)}
    <li
      class="step-list-item step-list-item-{step.status ?? 'pending'}"
      data-pw={step.testId}
      aria-current={step.status === 'in-progress' ? 'step' : null}
    >
      <div class="step-list-indicator" aria-hidden="true">
        {#if step.status === 'success'}
          <svg
            class="step-list-indicator-icon"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 8L6.5 11.5L13 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {:else if step.status === 'failure'}
          <svg
            class="step-list-indicator-icon"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        {:else if step.status === 'in-progress'}
          <span class="step-list-indicator-dot step-list-indicator-dot-pulse"></span>
        {:else}
          <span class="step-list-indicator-dot"></span>
        {/if}
      </div>
      <div class="step-list-content">
        <div class="step-list-title">{step.title}</div>
        {#if step.description}
          <div class="step-list-description">{step.description}</div>
        {/if}
        {#if stepBody}
          <div class="step-list-step-body">
            {@render stepBody()}
          </div>
        {/if}
      </div>
      {#if index < steps.length - 1}
        <div class="step-list-connector" aria-hidden="true"></div>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .step-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--step-list-gap, 0px);
  }

  .step-list-item {
    position: relative;
    display: grid;
    grid-template-columns: var(--step-list-indicator-size, 20px) 1fr;
    grid-template-rows: auto auto;
    column-gap: var(--step-list-item-column-gap, 12px);
    align-items: start;
  }

  .step-list-indicator {
    grid-column: 1;
    grid-row: 1;
    width: var(--step-list-indicator-size, 20px);
    height: var(--step-list-indicator-size, 20px);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: var(--step-list-indicator-bg, currentColor);
    color: var(--step-list-indicator-icon-color, #fff);
    position: relative;
    z-index: 1;
  }

  .step-list-item-pending .step-list-indicator {
    background-color: var(--step-list-pending-color, #9ca3af);
  }

  .step-list-item-in-progress .step-list-indicator {
    background-color: var(--step-list-in-progress-color, #3b82f6);
  }

  .step-list-item-success .step-list-indicator {
    background-color: var(--step-list-success-color, #22c55e);
  }

  .step-list-item-failure .step-list-indicator {
    background-color: var(--step-list-failure-color, #ef4444);
  }

  .step-list-item-inactive .step-list-indicator {
    background-color: var(--step-list-inactive-color, #e5e7eb);
  }

  .step-list-indicator-dot {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--step-list-dot-color, #fff);
  }

  .step-list-indicator-dot-pulse {
    animation: step-list-pulse 1.5s ease-in-out infinite;
  }

  @keyframes step-list-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.8);
    }
  }

  .step-list-indicator-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .step-list-content {
    grid-column: 2;
    grid-row: 1;
    padding-bottom: var(--step-list-content-padding-bottom, 16px);
  }

  .step-list-title {
    color: var(--step-list-title-color, inherit);
    font-weight: var(--step-list-title-font-weight, inherit);
  }

  .step-list-description {
    margin-top: var(--step-list-description-margin-top, 4px);
    color: var(--step-list-description-color, #6b7280);
  }

  .step-list-step-body {
    margin-top: var(--step-list-body-margin-top, 8px);
  }

  .step-list-connector {
    grid-column: 1;
    grid-row: 2;
    width: 2px;
    min-height: var(--step-list-connector-min-height, 16px);
    height: 100%;
    background-color: var(--step-list-connector-color, #e5e7eb);
    margin: 0 auto;
    align-self: stretch;
  }
</style>
