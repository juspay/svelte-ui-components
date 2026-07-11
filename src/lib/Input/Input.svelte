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
    min,
    max,
    actionInput = false,
    useTextArea = false,
    autoComplete = 'on',
    inputMode,
    name = '',
    testId = '',
    textTransformers = [],
    textViewPresentation = [],
    onFocus = () => {},
    onFocusout = () => {},
    onBlur = () => {},
    onInput = () => {},
    onPaste = () => {},
    onStateChange = () => {},
    onClick = () => {},
    onKeyDown = () => {},
    classes,
    role,
    ariaExpanded,
    ariaAutocomplete,
    ariaControls,
    ariaActivedescendant,
    leftIcon,
    rightIcon,
    onLeftIconClick,
    onRightIconClick,
    leftIconLabel = 'Leading action',
    rightIconLabel = 'Trailing action',
    mandatory = false,
    forceError = false,
    rows,
    autoResize = false,
    minRows,
    maxRows,
    resize = 'none',
    showCount = false
  }: InputProperties = $props();

  export function focus() {
    try {
      inputElement?.focus();
      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Error focusing or scrolling inputElement:', error);
    }
  }

  export function blur() {
    try {
      inputElement?.blur();
    } catch (error) {
      console.error('Error blurring inputElement:', error);
    }
  }

  export function getInputRef(): HTMLInputElement | HTMLTextAreaElement | null {
    return inputElement;
  }

  let inputElement: HTMLInputElement | HTMLTextAreaElement | null = $state(null);

  let validationState = $derived.by(() => {
    const valueValidation: ValidationState = validateInput(
      value,
      dataType,
      validationPattern,
      inProgressPattern,
      validators
    );
    if (
      valueValidation === 'InProgress' &&
      value.length > 0 &&
      inputElement !== null &&
      inputElement !== document.activeElement
    ) {
      return 'Invalid';
    }
    return valueValidation;
  });

  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    onStateChange(validationState);
  });

  const showErrorMessage = $derived(validationState === 'Invalid');
  // forceError lets consumers drive the error border from server/runtime validation,
  // independent of validationPattern.
  const showError = $derived(showErrorMessage || forceError);
  const hasLeftIcon = $derived(typeof leftIcon === 'function');
  const hasRightIcon = $derived(typeof rightIcon === 'function');

  const charCount = $derived(value?.length ?? 0);
  const effectiveResize = $derived(autoResize ? 'none' : resize);

  // Grow the textarea to fit its content between minRows and maxRows.
  function adjustTextAreaHeight(): void {
    const el = inputElement;
    if (!el || !useTextArea || !autoResize) {
      return;
    }
    el.style.height = 'auto';
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const border = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    const lower = minRows ?? rows ?? 2;
    const minHeight = lower * lineHeight + verticalPadding + border;
    const maxHeight =
      maxRows != null ? maxRows * lineHeight + verticalPadding + border : Number.POSITIVE_INFINITY;
    const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    // Re-run on every value change (and on mount) while auto-resize is enabled.
    void value;
    if (useTextArea && autoResize) {
      adjustTextAreaHeight();
    }
  });

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
        if (existingInput.length === maxLength) {
          inputElement.value = applyTextPresentation(value);
          return;
        }
        /**
         * choose last max length number of digits if length is bigger than max length passed in props
         */
        currentValue = currentValue.substring(numberLength - maxLength);
      }
      currentValue = applyTextPresentation(currentValue);
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
          const finalValue = applyTextPresentation(
            filteredNumber.substring(filteredNumberLength - maxLength)
          );
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

  function applyTextPresentation(currentValue: string): string {
    return textViewPresentation.reduce((prevValue, currIndexFunction) => {
      let newValue = currIndexFunction(prevValue);
      return newValue;
    }, currentValue);
  }

  function _onFocusOut(event: FocusEvent) {
    if (validationState === 'InProgress' && value.length > 0) {
      validationState = 'Invalid';
    }
    onFocusout(event);
    onBlur(event);
  }
</script>

<div class="input-container {classes ?? ''}" class:input-error={showError && !actionInput}>
  {#if typeof label === 'string' && label !== '' && !actionInput}
    <label class="label" for={name}>
      {label}{#if mandatory}<span class="input-mandatory-asterisk" aria-hidden="true">*</span>{/if}
    </label>
  {/if}

  {#snippet fieldElement()}
    {#if useTextArea}
      <textarea
        {value}
        {placeholder}
        autocomplete={autoComplete}
        inputmode={inputMode}
        {name}
        {role}
        aria-expanded={ariaExpanded}
        aria-autocomplete={ariaAutocomplete}
        aria-controls={ariaControls}
        aria-activedescendant={ariaActivedescendant}
        aria-required={mandatory || null}
        required={mandatory || null}
        onfocus={onFocus}
        onfocusout={_onFocusOut}
        oninput={handleOnInput}
        onpaste={handleOnPaste}
        onclick={onClick}
        onkeydown={onKeyDown}
        data-pw={testId}
        class:action-input={actionInput}
        style="--focus-border: {addFocusColor ? 1 : 0}px;"
        style:resize={effectiveResize}
        rows={rows ?? null}
        disabled={disable}
        bind:this={inputElement}
        maxlength={dataType === 'tel' ? null : maxLength}
        minlength={minLength}
      ></textarea>
    {:else}
      <input
        type={dataType}
        {value}
        {placeholder}
        autocomplete={autoComplete}
        inputmode={inputMode}
        {name}
        {role}
        aria-expanded={ariaExpanded}
        aria-autocomplete={ariaAutocomplete}
        aria-controls={ariaControls}
        aria-activedescendant={ariaActivedescendant}
        aria-required={mandatory || null}
        required={mandatory || null}
        onfocus={onFocus}
        onfocusout={_onFocusOut}
        oninput={handleOnInput}
        onpaste={handleOnPaste}
        onclick={onClick}
        onkeydown={onKeyDown}
        data-pw={testId}
        class:action-input={actionInput}
        disabled={disable}
        bind:this={inputElement}
        maxlength={dataType === 'tel' ? null : maxLength}
        minlength={minLength}
        {min}
        {max}
      />
    {/if}
  {/snippet}

  {#if hasLeftIcon || hasRightIcon}
    <div
      class="input-field-wrap"
      class:has-left-icon={hasLeftIcon}
      class:has-right-icon={hasRightIcon}
    >
      {#if hasLeftIcon}
        {#if onLeftIconClick}
          <button
            type="button"
            class="input-icon input-icon-left input-icon-button"
            aria-label={leftIconLabel}
            onclick={onLeftIconClick}
          >
            {@render leftIcon?.()}
          </button>
        {:else}
          <span class="input-icon input-icon-left">{@render leftIcon?.()}</span>
        {/if}
      {/if}
      {@render fieldElement()}
      {#if hasRightIcon}
        {#if onRightIconClick}
          <button
            type="button"
            class="input-icon input-icon-right input-icon-button"
            aria-label={rightIconLabel}
            onclick={onRightIconClick}
          >
            {@render rightIcon?.()}
          </button>
        {:else}
          <span class="input-icon input-icon-right">{@render rightIcon?.()}</span>
        {/if}
      {/if}
    </div>
  {:else}
    {@render fieldElement()}
  {/if}

  {#if onErrorMessage !== '' && showError && !actionInput}
    <div
      class="error-message"
      data-pw={typeof testId === 'string' && testId.length > 0 ? `${testId}-error-message` : null}
    >
      {onErrorMessage}
    </div>
  {/if}
  {#if infoMessage !== '' && !actionInput}
    <div class="info-message">
      {infoMessage}
    </div>
  {/if}
  {#if useTextArea && showCount && !actionInput}
    <div class="input-char-count" class:at-limit={charCount >= maxLength}>
      {charCount}/{maxLength}
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
    font-family: var(--input-font-family, inherit);
    border-radius: var(--input-radius, var(--radius, 4px));
    outline: none;
    padding: var(--input-padding, 16px);
    font-weight: var(--input-font-weight, 500);
    width: var(--input-width, fit-content);
    margin: var(--input-margin, 0);
    appearance: none !important;
    -webkit-appearance: none !important; /* For Safari MWeb */
    box-shadow: var(--input-box-shadow, 0px 1px 8px #2f537733);
    border: var(--input-border, 1px solid transparent);
    resize: none;
    visibility: var(--input-visibility, visible);
    text-align: var(--input-text-align, left);
    color: var(--input-text-color);
  }

  textarea:focus,
  input:focus {
    border: var(--input-focus-border, 1px solid transparent);
  }

  .input-error {
    --input-focus-border: var(
      --input-error-border,
      1px solid var(--input-error-msg-text-color, #fa1405)
    ) !important;
    --input-border: var(
      --input-error-border,
      1px solid var(--input-error-msg-text-color, #fa1405)
    ) !important;
  }

  .action-input {
    border-radius: var(--input-radius, var(--radius, 4px) 0 0 var(--radius, 4px));
    box-shadow: var(--input-box-shadow, 0px 0px 0px #ffffff);
    margin-bottom: 0;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    margin: var(--input-container-margin, 0);
    padding: var(--input-container-padding, 0);
    width: var(--input-container-width, fit-content);
  }

  .label {
    font-weight: var(--input-label-msg-text-weight, 400);
    font-size: var(--input-label-msg-text-size, 12px);
    color: var(--input-label-msg-text-color, #637c95);
    margin: var(--input-label-msg-margin, 0px 0px 6px 0px);
    padding: var(--input-label-msg-padding);
  }

  .input-mandatory-asterisk {
    color: var(--input-mandatory-color, var(--input-error-msg-text-color, #fa1405));
    margin-left: var(--input-mandatory-gap, 2px);
  }

  /* Icon wrapper: only rendered when leftIcon/rightIcon is supplied, so non-icon
     consumers keep the exact prior DOM. The field's bottom margin moves to the
     wrap so the absolutely-positioned icons centre on the field, not the margin. */
  .input-field-wrap {
    position: relative;
    display: block;
    margin: var(--input-margin, 0);
  }

  .input-field-wrap > :global(textarea),
  .input-field-wrap > :global(input) {
    margin: 0 !important;
    width: var(--input-width, 100%);
  }

  .input-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--input-icon-size, 20px);
    height: var(--input-icon-size, 20px);
    color: var(--input-icon-color, inherit);
    pointer-events: none;
  }

  .input-icon-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    pointer-events: auto;
  }

  .input-icon-button:focus-visible {
    outline: var(--input-icon-focus-outline, 2px solid var(--input-focus-border-color, #005fcc));
    outline-offset: var(--input-icon-focus-outline-offset, 2px);
    border-radius: var(--input-icon-focus-radius, var(--radius, 4px));
  }

  .input-icon-left {
    left: var(--input-icon-gap, 12px);
  }

  .input-icon-right {
    right: var(--input-icon-gap, 12px);
  }

  .input-field-wrap.has-left-icon > :global(textarea),
  .input-field-wrap.has-left-icon > :global(input) {
    padding-left: calc(var(--input-icon-size, 20px) + var(--input-icon-gap, 12px) * 2);
  }

  .input-field-wrap.has-right-icon > :global(textarea),
  .input-field-wrap.has-right-icon > :global(input) {
    padding-right: calc(var(--input-icon-size, 20px) + var(--input-icon-gap, 12px) * 2);
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

  .input-char-count {
    align-self: flex-end;
    font-size: var(--input-char-count-size, 12px);
    color: var(--input-char-count-color, #98a2b3);
    margin: var(--input-char-count-margin, 4px 0 0);
    font-variant-numeric: tabular-nums;
  }

  .input-char-count.at-limit {
    color: var(--input-char-count-limit-color, var(--input-error-msg-text-color, #fa1405));
  }

  ::placeholder {
    color: var(--input-placeholder-color);
  }
</style>
