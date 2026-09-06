<script lang="ts">
  import type { SplitButtonProperties } from './properties';
  import type { MenuItem } from '../Menu/properties';
  import Button from '../Button/Button.svelte';
  import Menu from '../Menu/Menu.svelte';
  import chevronDownSmSvg from '$lib/assets/chevron-down-sm.svg?raw';

  let {
    text,
    items,
    disabled = false,
    testId,
    dropdownIcon,
    classes,
    triggerAriaLabel,
    onclick,
    onselect
  }: SplitButtonProperties = $props();

  let menuOpen = $state(false);

  // The dropdown trigger renders a chevron and nothing else, so without a name it is a
  // focusable control that announces as an unnamed button.
  // A blank `triggerAriaLabel` falls back rather than being honoured: `??` only
  // rejects null and undefined, so an empty string would have been passed
  // through as `aria-label=""` and left the trigger unnamed — the very thing
  // this generated fallback exists to prevent.
  let resolvedTriggerAriaLabel = $derived(
    typeof triggerAriaLabel === 'string' && triggerAriaLabel.trim() !== ''
      ? triggerAriaLabel
      : text.length > 0
        ? `More ${text} options`
        : 'More options'
  );

  function handlePrimaryClick(event: MouseEvent): void {
    if (disabled) {
      return;
    }
    onclick?.(event);
  }

  function handleMenuSelect(item: MenuItem): void {
    onselect?.(item);
  }
</script>

<div
  class="split-button {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="split-button-primary">
    <Button {text} onclick={handlePrimaryClick} {disabled} />
  </div>
  <div class="split-button-trigger">
    <Menu
      {items}
      bind:open={menuOpen}
      triggerAriaLabel={resolvedTriggerAriaLabel}
      onselect={handleMenuSelect}
    >
      {#snippet trigger()}
        <span class="split-button-arrow">
          {#if typeof dropdownIcon === 'function'}
            {@render dropdownIcon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html chevronDownSmSvg}
          {/if}
        </span>
      {/snippet}
    </Menu>
  </div>
</div>

<style>
  .split-button {
    display: inline-flex;
    position: relative;
    gap: var(--split-button-gap, 0px);
  }

  .split-button.disabled .split-button-trigger {
    pointer-events: none;
  }

  .split-button-primary {
    --button-color: var(--split-button-primary-background, #3a4550);
    --button-text-color: var(--split-button-primary-color, white);
    --button-padding: var(--split-button-primary-padding, 8px 16px);
    --button-font-size: var(--split-button-primary-font-size, 14px);
    --button-font-weight: var(--split-button-primary-font-weight, 500);
    --button-font-family: var(--split-button-primary-font-family);
    --button-border: var(--split-button-primary-border, none);
    --button-border-radius: var(
      --split-button-primary-border-radius,
      var(--radius, 4px) 0 0 var(--radius, 4px)
    );
    --button-hover-color: var(
      --split-button-primary-hover-background,
      var(--split-button-primary-background, #3a4550)
    );
    --button-hover-text-color: var(
      --split-button-primary-hover-color,
      var(--split-button-primary-color, white)
    );
    --disabled-opacity: var(--split-button-disabled-opacity, 0.4);
    --disabled-cursor: var(--split-button-disabled-cursor, not-allowed);
    display: flex;
  }

  .split-button-trigger {
    --menu-container-position: static;
    --menu-container-display: flex;
    --menu-trigger-focus-outline: none;
    --menu-dropdown-left: 0;
    --menu-min-width: 100%;
    border-left: var(--split-button-trigger-separator, 1px solid rgba(255, 255, 255, 0.3));
    display: flex;
    align-items: stretch;
    background-color: var(--split-button-trigger-background, #3a4550);
    border-radius: var(
      --split-button-trigger-border-radius,
      0 var(--radius, 4px) var(--radius, 4px) 0
    );
    color: var(--split-button-trigger-color, white);
    cursor: pointer;
  }

  .split-button.disabled .split-button-trigger {
    opacity: var(--split-button-disabled-opacity, 0.4);
    cursor: var(--split-button-disabled-cursor, not-allowed);
  }

  .split-button-trigger:hover {
    background-color: var(
      --split-button-trigger-hover-background,
      var(--split-button-trigger-background, #3a4550)
    );
    color: var(--split-button-trigger-hover-color, var(--split-button-trigger-color, white));
  }

  .split-button-trigger :global(.menu-trigger) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--split-button-trigger-padding, 8px);
  }

  .split-button-arrow {
    display: inline-flex;
    width: var(--split-button-arrow-width, 10px);
    height: var(--split-button-arrow-height, 6px);
  }

  .split-button-arrow :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
