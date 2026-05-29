<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { InlineAlertProperties } from './properties';
  import closeSvg from '$lib/assets/close.svg?raw';

  let {
    text,
    tone = 'info',
    icon,
    children,
    dismissible = false,
    visible = $bindable(true),
    testId,
    classes,
    ondismiss
  }: InlineAlertProperties = $props();

  const handleDismiss = (): void => {
    visible = false;
    ondismiss?.();
  };

  const handleDismissKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDismiss();
    }
  };
</script>

{#if visible}
  <div
    class="inline-alert inline-alert-{tone} {classes ?? ''}"
    role={tone === 'error' ? 'alert' : 'status'}
    aria-live={tone === 'error' ? 'assertive' : 'polite'}
    data-pw={typeof testId === 'string' ? testId : null}
    transition:fade={{ duration: 150 }}
  >
    {#if typeof icon === 'function'}
      <div class="inline-alert-icon">
        {@render icon()}
      </div>
    {/if}

    <div class="inline-alert-body">
      {#if typeof children === 'function'}
        {@render children()}
      {:else if typeof text === 'string'}
        {text}
      {/if}
    </div>

    {#if dismissible}
      <button
        class="inline-alert-dismiss"
        type="button"
        aria-label="Dismiss"
        onclick={handleDismiss}
        onkeydown={handleDismissKeydown}
        {...typeof testId === 'string' ? { 'data-pw': `${testId}-dismiss` } : {}}
      >
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html closeSvg}
      </button>
    {/if}
  </div>
{/if}

<style>
  .inline-alert {
    display: flex;
    align-items: var(--inline-alert-align-items, center);
    gap: var(--inline-alert-gap, 8px);
    padding: var(--inline-alert-padding, 10px 12px);
    border-radius: var(--inline-alert-radius, 6px);
    border: var(--inline-alert-border, none);
    width: var(--inline-alert-width, 100%);
    box-sizing: border-box;
  }

  .inline-alert-info {
    background-color: var(--inline-alert-info-background, #e8f0fe);
    color: var(--inline-alert-info-color, #1a56a0);
  }

  .inline-alert-success {
    background-color: var(--inline-alert-success-background, #dcfce7);
    color: var(--inline-alert-success-color, #166534);
  }

  .inline-alert-warning {
    background-color: var(--inline-alert-warning-background, #fef9c3);
    color: var(--inline-alert-warning-color, #854d0e);
  }

  .inline-alert-error {
    background-color: var(--inline-alert-error-background, #fee2e2);
    color: var(--inline-alert-error-color, #991b1b);
  }

  .inline-alert-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--inline-alert-icon-color, currentColor);
  }

  .inline-alert-icon :global(svg) {
    width: var(--inline-alert-icon-size, 16px);
    height: var(--inline-alert-icon-size, 16px);
  }

  .inline-alert-body {
    flex: 1;
  }

  .inline-alert-dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: var(--inline-alert-dismiss-padding, 2px);
    border-radius: var(--inline-alert-dismiss-radius, 4px);
    color: currentColor;
    opacity: var(--inline-alert-dismiss-opacity, 0.7);
  }

  .inline-alert-dismiss:hover {
    opacity: 1;
    background-color: var(--inline-alert-dismiss-hover-background, rgba(0, 0, 0, 0.08));
  }

  .inline-alert-dismiss :global(svg) {
    width: var(--inline-alert-dismiss-size, 14px);
    height: var(--inline-alert-dismiss-size, 14px);
  }
</style>
