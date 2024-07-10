<script lang="ts">
  import { validateInput } from '$lib/utils';
  import { createEventDispatcher, onMount } from 'svelte';
  import { defaultInputProperties, type InputProperties } from './properties';
  import type { ValidationState } from '$lib/types';

  const dispatch = createEventDispatcher();

  export let properties: InputProperties = defaultInputProperties;
  let inputElement: HTMLInputElement | HTMLTextAreaElement;

  $: state = getValidationState(properties) as ValidationState;

  // For making this function reactive, prop was passed as param
  function getValidationState(prop: InputProperties): ValidationState {
    const valueValidation: ValidationState = validateInput(
      prop.value,
      prop.dataType,
      prop.validationPattern,
      prop.inProgressPattern,
      prop.validators
    );
    if (
      valueValidation === 'InProgress' &&
      prop.value.length > 0 &&
      inputElement &&
      inputElement !== document.activeElement
    ) {
      return 'Invalid';
    } else {
      return valueValidation;
    }
  }

  $: showErrorMessage = state === 'Invalid';

  function onInput(event: Event) {
    let currentValue = inputElement.value;
    if (properties.dataType === 'tel' && currentValue.length > 0) {
      /**
       * removes everything except numbers
       */
      currentValue = properties.textTransformers.reduce((prevValue, currIndexFunction) => {
        let newValue = currIndexFunction(prevValue);
        return newValue;
      }, currentValue);
      currentValue = currentValue.replace(/\D+|\D/gm, '');
      const numberLength = currentValue.length;
      /**
       * ignore all entered inputs and return if input is non numeric
       */
      if (numberLength === 0) {
        inputElement.value = properties.value;
        return;
      }
      if (numberLength > properties.maxLength) {
        const existingInput = properties.value;
        /**
         * ignore all entered inputs if current input length is maxed at max length passed in props
         */
        if (existingInput.length == properties.maxLength) {
          inputElement.value = properties.value;
          return;
        }
        /**
         * choose last max length number of digits if length is bigger than max length
         */
        currentValue = currentValue.substring(numberLength - properties.maxLength);
      }
      /**
       * update the DOM
       */
      inputElement.value = currentValue;
    }
    properties.value = currentValue;
    // Adding reactivity
    properties = properties;
    dispatch('input', event);
  }

  /**
   *
   * @param event
   * ENABLED ONLY FOR 'dataType = tel'
   */
  function onPaste(event: ClipboardEvent) {
    if (event.clipboardData) {
      if (properties.dataType === 'tel') {
        let unfilteredNumber = event.clipboardData.getData('text');
        unfilteredNumber = properties.textTransformers.reduce((prevValue, currIndexFunction) => {
          let newValue = currIndexFunction(prevValue);
          return newValue;
        }, unfilteredNumber);
        /**
         * removes everything except numbers
         */
        const filteredNumber = unfilteredNumber.replace(/\D+|\D/gm, '');
        const filteredNumberLength = filteredNumber.length;
        /**
         * pasted text is non numeric
         */
        if (filteredNumber.length === 0) {
          properties = properties;
          event.preventDefault();
        }
        /**
         * user pasted 10+ digit number , overrides all cases
         */
        if (filteredNumber.length > properties.maxLength) {
          /**
           * choose last max length number of digits if length is bigger than max length passed in props
           */
          const finalValue = filteredNumber.substring(filteredNumberLength - properties.maxLength);
          // Adding reactivity
          properties.value = finalValue;
          properties = properties;
          dispatch('paste', event);
          event.preventDefault(); // prevent bubble and let finalValue be entered
        }
        /**
         * if numeric pasted text has length less than max length, bubble to onInput.
         */
      }
    }
  }

  function onFocusOut(event: FocusEvent) {
    if (state === 'InProgress' && properties.value.length > 0) {
      state = 'Invalid';
    }
    dispatch('focusout', event);
  }

  onMount(() => {
    if (properties.focus) {
      inputElement.focus();
    }
    dispatch('stateChange', { state: state });
  });
  $: {
    dispatch('stateChange', { state: state });
  }
</script>

<div class="input-container">
  {#if properties.label && properties.label !== '' && !properties.actionInput}
    <label class="label" for={properties.name}>
      {properties.label}
    </label>
  {/if}

  {#if properties.useTextArea}
    <textarea
      value={properties.value}
      placeholder={properties.placeholder}
      autocomplete={properties.autoComplete}
      name={properties.name}
      on:keydown
      on:keyup
      on:keypress
      on:focus
      on:focusout={onFocusOut}
      on:input={onInput}
      on:paste={onPaste}
      class="
        {properties.actionInput ? 'action-input' : ''}
      "
      style="--focus-border: {properties.addFocusColor ? 1 : 0}px;"
      disabled={properties.disable}
      bind:this={inputElement}
      maxlength={properties.dataType === 'tel' ? undefined : properties.maxLength}
      minlength={properties.minLength}
    />
  {:else}
    <input
      type={properties.dataType}
      value={properties.value}
      placeholder={properties.placeholder}
      autocomplete={properties.autoComplete}
      name={properties.name}
      on:keydown
      on:keyup
      on:keypress
      on:focus
      on:focusout={onFocusOut}
      on:input={onInput}
      on:paste={onPaste}
      data-pw={properties.dataPw}
      class="
      {properties.actionInput ? 'action-input' : ''}
    "
      disabled={properties.disable}
      bind:this={inputElement}
      maxlength={properties.dataType === 'tel' ? undefined : properties.maxLength}
      minlength={properties.minLength}
    />
  {/if}

  {#if properties.message.onError !== '' && showErrorMessage && !properties.actionInput}
    <div class="error-message">
      {properties.message.onError}
    </div>
  {/if}
  {#if properties.message.info !== '' && !properties.actionInput}
    <div class="info-message">
      {properties.message.info}
    </div>
  {/if}
</div>

<style>
  textarea,
  input {
    box-sizing: border-box;
    height: var(--input-height, fit-content);
    background-color: var(--input-background, white);
    font-size: var(--input-font-size, 16px) !important;
    font-family: var(--input-font-family, Euclid Circular A);
    border-radius: var(--input-radius, 4px);
    outline: none;
    padding: var(--input-padding, 16px);
    font-weight: var(--input-font-weight, 500);
    width: var(--input-width, fit-content);
    margin: var(--input-margin, 0px 0px 12px 0px);
    -webkit-appearance: none !important; /* For Safari MWeb */
    box-shadow: var(--input-box-shadow, 0px 1px 8px #2f537733);
    border: var(--input-border, none);
    resize: none;
    visibility: var(--input-visibility, visible);
    text-align: var(--input-text-align, left);
    color: var(--input-text-color);
  }

  textarea:focus,
  input:focus {
    border: var(--input-focus-border);
  }

  .action-input {
    border-radius: var(--input-radius, 4px 0px 0px 4px);
    box-shadow: 0px 0px 0px #ffffff;
    margin-bottom: 0;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    margin: var(--input-container-margin);
  }

  .label {
    font-weight: var(--input-label-msg-text-weight, 400);
    font-size: var(--input-label-msg-text-size, 12px);
    color: var(--input-label-msg-text-color, #637c95);
    margin-bottom: 6px;
  }

  .error-message {
    font-weight: var(--input-error-msg-text-weight, 400);
    font-size: var(--input-error-msg-text-size, 12px);
    color: var(--input-error-msg-text-color, #fa1405);
  }

  .info-message {
    font-weight: var(--input-info-msg-text-weight, 400);
    font-size: var(--input-info-msg-text-size, 12px);
    color: var(--input-info-msg-text-color, #fa1405);
  }

  ::placeholder {
    color: var(--input-placeholder-color);
  }
</style>
