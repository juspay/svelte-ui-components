<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Input from '$lib/Input/Input.svelte';
  import type { InputButtonProperties } from './properties';
  import type { ValidationState } from '$lib/types';
  import type { SvelteComponent } from 'svelte';

  let {
    value = $bindable(''),
    inputProperties,
    rightButtonProperties,
    leftButtonProperties,
    bottomButtonProperties,
    inputEventProperties,
    rightButtonEventProperties,
    leftButtonEventProperties,
    bottomButtonEventProperties,
    leftIcon
  }: InputButtonProperties = $props();

  let validationState = $state<ValidationState>('InProgress');

  let inputRef: SvelteComponent | null = $state(null);

  // Derive enable state for right button
  let isRightButtonEnabled = $derived(validationState === 'Valid');

  function rightButtonClick(event: MouseEvent): void {
    if (validationState === 'Valid') {
      rightButtonEventProperties?.onclick?.(event);
    }
  }

  function bottomButtonClick(event: MouseEvent): void {
    if (validationState === 'Valid') {
      bottomButtonEventProperties?.onclick?.(event);
    }
  }

  function triggerRightClickIfValid(event: KeyboardEvent): void {
    if (event?.key === 'Enter' && validationState === 'Valid') {
      rightButtonEventProperties?.onkeyup?.(event);
    }
  }

  function handleStateChange(state: ValidationState): void {
    validationState = state;
    inputEventProperties?.onStateChange?.(state);
  }

  export function focus() {
    inputRef?.focus();
  }
</script>

<div class="container">
  {#if inputProperties.label && inputProperties.label !== ''}
    <label class="label" for={inputProperties.name}>
      {inputProperties.label}
    </label>
  {/if}

  <div class="input-button-container">
    <div class="input-button {validationState === 'Invalid' ? 'invalid' : 'valid'}">
      {#if leftButtonProperties != null}
        <div class="left-button">
          <Button {...leftButtonProperties} {...leftButtonEventProperties} icon={leftIcon} />
        </div>
      {/if}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="input" onkeyup={triggerRightClickIfValid}>
        <Input
          {...inputProperties}
          bind:value
          bind:this={inputRef}
          onStateChange={handleStateChange}
          actionInput={true}
        />
      </div>
      {#if rightButtonProperties != null}
        <div class="right-button">
          <Button
            {...rightButtonProperties}
            enable={isRightButtonEnabled}
            onclick={rightButtonClick}
          />
        </div>
      {/if}
    </div>
    {#if bottomButtonProperties != null}
      <div class="bottom-button">
        <Button {...bottomButtonProperties} onclick={bottomButtonClick} />
      </div>
    {/if}
  </div>
  {#if inputProperties.onErrorMessage !== '' && validationState === 'Invalid'}
    <div class="error-message">
      {inputProperties.onErrorMessage}
    </div>
  {/if}
  {#if inputProperties.infoMessage !== ''}
    <div class="info-message">
      {inputProperties.infoMessage}
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
  }

  .input-button-container {
    --button-width: 100%;
    --input-border: none;
    --input-focus-border: none;
    --input-box-shadow: none;
    --input-margin: none;
    --input-width: auto;
    height: var(--input-height, fit-content);
    font-size: var(--input-font-size, 16px) !important;
    font-weight: 500;
    margin: var(--input-button-margin);
    border-radius: var(--input-button-radius, 4px);
    border: var(--input-button-container-border);
    background: var(--input-button-container-background);
    padding: var(--input-button-container-padding);
  }

  .input-button {
    display: flex;
    align-items: center;
    border-radius: var(--input-button-radius, 4px);
    border: var(--input-button-border);
    box-shadow: var(--input-button-box-shadow, 0px 1px 8px #2f537733);
    background: var(--input-button-background);
  }
  .input-button-container:focus-within {
    border: var(--input-button-focus-border);
  }
  .input {
    flex: 2;
    min-width: 0px;
  }

  .bottom-button {
    padding: var(--input-bottom-btn-padding, 10px 0px);
    --cursor: var(--bottom-button-cursor);
    --button-color: var(--bottom-button-color);
    --button-text-color: var(--bottom-button-text-color);
    --button-font-family: var(--bottom-button-font-family);
    --button-font-weight: var(--bottom-button-font-weight);
    --button-font-size: var(--bottom-button-font-size);
    --button-height: var(--bottom-button-height, 54px);
    --button-padding: var(--bottom-button-padding);
    --button-border-radius: var(--bottom-button-border-radius);
    --button-width: var(--bottom-button-width);
  }

  .label {
    font-weight: var(--input-label-msg-text-weight, 400);
    font-size: var(--input-label-msg-text-size, 12px);
    color: var(--input-label-msg-text-color, #637c95);
    line-height: var(--input-label-msg-text-line-height);
    margin-bottom: 6px;
  }

  .invalid {
    outline: var(--invalid-outline, 1px solid var(--input-field-error-stroke, #e11900));
  }

  .error-message {
    font-weight: var(--input-error-msg-text-weight, 400);
    font-size: var(--input-error-msg-text-size, 12px);
    color: var(--input-error-msg-text-color, #fa1405);
    margin: var(--input-btn-error-msg-margin, 12px 0px 0px 0px);
  }

  .info-message {
    font-weight: var(--input-info-msg-text-weight, 400);
    font-size: var(--input-info-msg-text-size, 12px);
    color: var(--input-info-msg-text-color, #fa1405);
    margin: var(--input-btn-info-msg-margin, 12px 0px 0px 0px);
  }

  .left-button {
    --button-color: var(--left-button-color);
    --button-text-color: var(--left-button-text-color);
    --button-font-family: var(--left-button-font-family);
    --button-font-weight: var(--left-button-font-weight);
    --button-font-size: var(--left-button-font-size);
    --button-height: var(--left-button-height, 54px);
    --button-padding: var(--left-button-padding);
    --button-border-radius: var(--left-button-border-radius);
    --button-width: var(--left-button-width);
    --cursor: var(--left-button-cursor);
    --opacity: var(--left-button-opacity);
    --button-border: var(--left-button-border);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    --button-content-gap: var(--left-button-content-gap);
    --button-content-flex-direction: var(--left-button-content-flex-direction, row);
  }

  .right-button {
    flex: var(--right-button-flex, 1);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    min-width: var(--right-button-min-width, 0px);
    --button-color: var(--right-button-color);
    --button-text-color: var(--right-button-text-color);
    --button-font-family: var(--right-button-font-family);
    --button-font-weight: var(--right-button-font-weight);
    --button-font-size: var(--right-button-font-size);
    --button-height: var(--right-button-height, 54px);
    --button-padding: var(--right-button-padding);
    --button-border-radius: var(--right-button-border-radius, 0px 4px 4px 0px);
    --button-width: var(--right-button-width, 100%);
    --cursor: var(--right-button-cursor);
    --opacity: var(--right-button-opacity);
    --button-border: var(--right-button-border);
    --button-content-gap: var(--right-button-content-gap);
    --button-visibility: var(--right-button-visibility, visible);
    --button-content-flex-direction: var(--right-button-content-flex-direction, row);
  }
</style>
