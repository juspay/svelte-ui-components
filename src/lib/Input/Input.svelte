<script lang="ts">
  import { validateInput } from '$lib/utils';
  import type { InputProperties } from './properties';
  import type { ValidationState } from '$lib/types';

  let {
    value = $bindable(''),
    placeholder = '',
    dataType = 'text',
    label = '',
    onErrorMessage = '',
    infoMessage = '',
    validators = [],
    disable = false,
    validationPattern = null,
    inProgressPattern = null,
    addFocusColor = false,
    maxLength = 1000,
    minLength = 0,
    actionInput = false,
    useTextArea = false,
    autoComplete = 'on',
    name = '',
    testId = '',
    textTransformers = [],
    onFocusout = () => {},
    onInput = () => {},
    onPaste = () => {},
    onStateChange = () => {},
    onClick = () => {}
  }: InputProperties = $props();

  export function focus() {
    try {
      inputElement?.focus();
      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Error focusing or scrolling inputElement:', error);
    }
  }

  let inputElement: HTMLInputElement | HTMLTextAreaElement | null = $state(null);

  // Use $state instead of $derived because validateInput is now async
  let validationState = $state<ValidationState>('InProgress');

  // Run async validation whenever dependencies change
  $effect(() => {
    // Capture current values to track dependencies
    const currentValue = value;
    const currentDataType = dataType;
    const currentValidationPattern = validationPattern;
    const currentInProgressPattern = inProgressPattern;
    const currentValidators = validators;
    const currentInputElement = inputElement;

    // Run async validation
    validateInput(
      currentValue,
      currentDataType,
      currentValidationPattern,
      currentInProgressPattern,
      currentValidators
    ).then((valueValidation) => {
      // Check if validation result should be overridden to Invalid
      if (
        valueValidation === 'InProgress' &&
        currentValue.length > 0 &&
        currentInputElement &&
        currentInputElement !== document.activeElement
      ) {
        validationState = 'Invalid';
      } else {
        validationState = valueValidation;
      }
    });
  });

  let showErrorMessage = $derived(validationState === 'Invalid');

  function handleOnInput(event: Event) {
    if (inputElement === null) {
      return;
    }

    let currentValue = inputElement.value;
    if (dataType === 'tel' && currentValue.length > 0) {
      currentValue = textTransformers.reduce((prevValue, currIndexFunction) => {
        let newValue = currIndexFunction(prevValue);
        return newValue;
      }, currentValue);
      currentValue = currentValue.replace(/\D+|\D/gm, '');
      const numberLength = currentValue.length;
      if (numberLength === 0) {
        inputElement.value = value;
        return;
      }
      if (numberLength > maxLength) {
        const existingInput = value;
        if (existingInput.length == maxLength) {
          inputElement.value = value;
          return;
        }
        currentValue = currentValue.substring(numberLength - maxLength);
      }
      inputElement.value = currentValue;
    }
    value = inputElement.value;
    onInput(inputElement.value, event);
  }

  /**
   *
   * @param event
   * ENABLED ONLY FOR 'dataType = tel'
   */
  function handleOnPaste(event: ClipboardEvent) {
    if (inputElement === null) {
      return;
    }

    if (event.clipboardData) {
      if (dataType === 'tel') {
        let unfilteredNumber = event.clipboardData.getData('text');
        unfilteredNumber = textTransformers.reduce((prevValue, currIndexFunction) => {
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
          event.preventDefault();
        }
        /**
         * user pasted 10+ digit number , overrides all cases
         */
        if (filteredNumber.length > maxLength) {
          /**
           * choose last max length number of digits if length is bigger than max length passed in props
           */
          const finalValue = filteredNumber.substring(filteredNumberLength - maxLength);
          // Adding reactivity
          value = finalValue;
          onPaste(event);
          event.preventDefault(); // prevent bubble and let finalValue be entered
        }
        /**
         * if numeric pasted text has length less than max length, bubble to onInput.
         */
      }
    }
  }

  $effect(() => {
    onStateChange(validationState);
  });
</script>

<div class="input-container">
  {#if typeof label === 'string' && label !== '' && !actionInput}
    <label class="label" for={name}>
      {label}
    </label>
  {/if}

  {#if useTextArea}
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <textarea
      {value}
      {placeholder}
      autocomplete={autoComplete}
      {name}
      onfocusout={onFocusout}
      oninput={handleOnInput}
      onpaste={handleOnPaste}
      onclick={onClick}
      class:action-input={actionInput}
      style="--focus-border: {addFocusColor ? 1 : 0}px;"
      disabled={disable}
      bind:this={inputElement}
      maxlength={dataType === 'tel' ? undefined : maxLength}
      minlength={minLength}
    />
  {:else}
    <input
      type={dataType}
      {value}
      {placeholder}
      autocomplete={autoComplete}
      {name}
      onfocusout={onFocusout}
      oninput={handleOnInput}
      onpaste={onPaste}
      data-pw={testId}
      class:action-input={actionInput}
      disabled={disable}
      bind:this={inputElement}
      maxlength={dataType === 'tel' ? undefined : maxLength}
      minlength={minLength}
    />
  {/if}

  {#if onErrorMessage !== '' && showErrorMessage && !actionInput}
    <div class="error-message">
      {onErrorMessage}
    </div>
  {/if}
  {#if infoMessage !== '' && !actionInput}
    <div class="info-message">
      {infoMessage}
    </div>
  {/if}
</div>

<style>
  textarea,
  input {
    box-sizing: var(--input-box-sizing, border-box);
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
    appearance: none !important;
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
    padding: var(--input-container-padding);
  }

  .label {
    font-weight: var(--input-label-msg-text-weight, 400);
    font-size: var(--input-label-msg-text-size, 12px);
    color: var(--input-label-msg-text-color, #637c95);
    margin: var(--input-label-msg-margin, 0px 0px 6px 0px);
    padding: var(--input-label-msg-padding);
  }

  .error-message {
    font-weight: var(--input-error-msg-text-weight, 400);
    font-size: var(--input-error-msg-text-size, 12px);
    color: var(--input-error-msg-text-color, #fa1405);
    margin: var(--input-error-msg-margin);
    padding: var(--input-error-msg-padding);
  }

  .info-message {
    font-weight: var(--input-info-msg-text-weight, 400);
    font-size: var(--input-info-msg-text-size, 12px);
    color: var(--input-info-msg-text-color, #fa1405);
    margin: var(--input-info-msg-margin);
    padding: var(--input-info-msg-padding);
  }

  ::placeholder {
    color: var(--input-placeholder-color);
  }
</style>
