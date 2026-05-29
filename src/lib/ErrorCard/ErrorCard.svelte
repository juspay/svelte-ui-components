<script lang="ts">
  import type { ErrorCardProperties } from './properties';

  let {
    title,
    message,
    icon,
    action,
    variant = 'card',
    testId,
    classes
  }: ErrorCardProperties = $props();
</script>

<div class="error-card error-card-{variant} {classes ?? ''}" role="alert" data-pw={testId}>
  {#if typeof icon === 'function'}
    <div class="error-card-icon">
      {@render icon()}
    </div>
  {/if}
  <div class="error-card-body">
    {#if title}
      <div class="error-card-title">{title}</div>
    {/if}
    {#if message}
      <div class="error-card-message">{message}</div>
    {/if}
  </div>
  {#if typeof action === 'function'}
    <div class="error-card-action">
      {@render action()}
    </div>
  {/if}
</div>

<style>
  .error-card {
    display: flex;
    align-items: flex-start;
    gap: var(--error-card-gap, 12px);
    background: var(--error-card-background, transparent);
    border-radius: var(--error-card-radius, 8px);
  }

  .error-card-card {
    border: var(--error-card-border, 1px solid currentColor);
    padding: var(--error-card-padding, 16px);
  }

  .error-card-inline {
    padding: var(--error-card-padding, 8px 0);
  }

  .error-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--error-card-icon-color, currentColor);
  }

  .error-card-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .error-card-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .error-card-title {
    color: var(--error-card-title-color, inherit);
    font-weight: var(--error-card-title-font-weight, 600);
  }

  .error-card-message {
    color: var(--error-card-message-color, inherit);
  }

  .error-card-action {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
</style>
