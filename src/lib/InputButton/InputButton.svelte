<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Input from '$lib/Input/Input.svelte';
  import { createEventDispatcher } from 'svelte';
  import { defaultInputButtonProperties, type InputButtonProperties } from './properties';
  import type { ValidationState } from '$lib/types';

  const dispatch = createEventDispatcher();
  export let properties: InputButtonProperties = defaultInputButtonProperties;

  $: state = 'InProgress' as ValidationState;

  $: {
    if (properties.rightButtonProperties != null) {
      properties.rightButtonProperties.enable = state === 'Valid';
      properties = properties;
    }
  }

  function rightButtonClick(): void {
    if (state === 'Valid') {
      dispatch('rightButtonClick', { value: properties.inputProperties.value });
    }
  }

  function leftButtonClick(event: CustomEvent): void {
    event.preventDefault();
    dispatch('leftButtonClick');
  }

  function triggerRightClickIfValid(event: KeyboardEvent): void {
    if (event?.key === 'Enter') {
      rightButtonClick();
    }
  }

  function handleState(event: CustomEvent): void {
    if (event && event?.detail?.state) {
      state = event.detail.state;
    }
    dispatch('stateChange', event);
  }
</script>

{#if properties.inputProperties.label && properties.inputProperties.label !== ''}
  <label class="label" for={properties.inputProperties.name}>
    {properties.inputProperties.label}
  </label>
{/if}

<div class="input-button-container">
  <div class="input-button {state === 'Invalid' ? 'invalid' : 'valid'}">
    {#if properties.leftButtonProperties != null}
      <div class="left-button">
        <Button properties={properties.leftButtonProperties} on:click={leftButtonClick}>
          <slot name="left-icon" slot="icon" />
        </Button>
      </div>
    {/if}
    <div class="input">
      <Input
        properties={properties.inputProperties}
        on:keyup={triggerRightClickIfValid}
        on:stateChange={handleState}
        on:input={(event) => dispatch('input', event)}
        on:focus
        --input-width="auto"
      />
    </div>
    {#if properties.rightButtonProperties != null}
      <div class="button">
        <Button properties={properties.rightButtonProperties} on:click={rightButtonClick} />
      </div>
    {/if}
  </div>
</div>
{#if properties.inputProperties.message.onError !== '' && state === 'Invalid'}
  <div class="error-message">
    {properties.inputProperties.message.onError}
  </div>
{/if}
{#if typeof properties.inputProperties.message.info === 'string' && properties.inputProperties.message.info !== ''}
  <div class="info-message">
    {properties.inputProperties.message.info}
  </div>
{/if}

<style>
  .input-button-container {
    height: var(--input-height, fit-content);
    font-size: var(--input-font-size, 16px) !important;
    font-weight: 500;
    margin: var(--input-button-margin);
    border-radius: var(--input-button-radius, 4px);
    --button-width: 100%;
    --input-border: none;
    --input-focus-border: none;
  }

  .input-button {
    display: flex;
    align-items: center;
    border-radius: var(--input-button-radius, 4px);
    border: var(--input-button-border);
    box-shadow: var(--input-button-box-shadow, 0px 1px 8px #2f537733);
  }
  .input-button-container:focus-within {
    border: var(--input-button-focus-border);
  }
  .input {
    flex: 2;
    min-width: 0px;
  }

  .button {
    flex: 1;
    min-width: 0px;
    --button-height: 54px;
  }

  .label {
    font-weight: var(--input-label-msg-text-weight, 400);
    font-size: var(--input-label-msg-text-size, 12px);
    color: var(--input-label-msg-text-color, #637c95);
    margin-bottom: 6px;
  }

  .invalid {
    outline: 1px solid var(--input-field-error-stroke, #e11900);
  }

  .error-message {
    font-weight: var(--input-error-msg-text-weight, 400);
    font-size: var(--input-error-msg-text-size, 14px);
    color: var(--input-error-msg-text-color, #fa1405);
    margin-top: 12px;
  }

  .info-message {
    font-weight: var(--input-info-msg-text-weight, 400);
    font-size: var(--input-info-msg-text-size, 12px);
    color: var(--input-info-msg-text-color, #fa1405);
    margin-top: 12px;
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
  }
</style>
