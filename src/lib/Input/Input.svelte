<script lang="ts">
  import { validateInput } from '$lib/utils';
  import type { InputProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
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
    readonly = false,
    spellcheck = null,
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
    id,
    testId = '',
    textTransformers = [],
    textViewPresentation = [],
    onFocus: onFocusProp,
    onfocus,
    onFocusout: onFocusoutProp,
    onfocusout,
    onBlur: onBlurProp,
    onblur,
    onInput: onInputProp,
    oninput,
    onPaste: onPasteProp,
    onpaste,
    onStateChange: onStateChangeProp,
    onstatechange,
    onClick: onClickProp,
    onclick,
    onKeyDown: onKeyDownProp,
    onkeydown,
    classes,
    role,
    ariaLabel,
    ariaExpanded,
    ariaAutocomplete,
    ariaControls,
    ariaActivedescendant,
    leftIcon,
    rightIcon,
    onLeftIconClick: onLeftIconClickProp,
    onlefticonclick,
    onRightIconClick: onRightIconClickProp,
    onrighticonclick,
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

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onBlur = $derived(resolveDeprecatedProp('Input', 'onBlur', 'onblur', onBlurProp, onblur));
  const onClick = $derived(
    resolveDeprecatedProp('Input', 'onClick', 'onclick', onClickProp, onclick)
  );
  const onFocus = $derived(
    resolveDeprecatedProp('Input', 'onFocus', 'onfocus', onFocusProp, onfocus)
  );
  const onFocusout = $derived(
    resolveDeprecatedProp('Input', 'onFocusout', 'onfocusout', onFocusoutProp, onfocusout)
  );
  const onInput = $derived(
    resolveDeprecatedProp('Input', 'onInput', 'oninput', onInputProp, oninput)
  );
  const onKeyDown = $derived(
    resolveDeprecatedProp('Input', 'onKeyDown', 'onkeydown', onKeyDownProp, onkeydown)
  );
  const onPaste = $derived(
    resolveDeprecatedProp('Input', 'onPaste', 'onpaste', onPasteProp, onpaste)
  );

  const onLeftIconClick = $derived(
    resolveDeprecatedProp(
      'Input',
      'onLeftIconClick',
      'onlefticonclick',
      onLeftIconClickProp,
      onlefticonclick
    )
  );
  const onRightIconClick = $derived(
    resolveDeprecatedProp(
      'Input',
      'onRightIconClick',
      'onrighticonclick',
      onRightIconClickProp,
      onrighticonclick
    )
  );
  const onStateChange = $derived(
    resolveDeprecatedProp(
      'Input',
      'onStateChange',
      'onstatechange',
      onStateChangeProp,
      onstatechange
    ) ?? (() => {})
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(
      onBlur,
      onClick,
      onFocus,
      onFocusout,
      onInput,
      onKeyDown,
      onPaste,
      onLeftIconClick,
      onRightIconClick,
      onStateChange
    );
  });

  /* `for` on a <label> resolves against an element's id, never its name. The label
     was emitted with for={name} while the field itself carried only name={name},
     so the association never completed for any caller. Derive the id from name so
     every existing caller that already passes label + name becomes correctly
     labelled with no change on their part; an explicit id wins, for callers who
     need uniqueness across repeated rows or who set no name. */
  const uid = $props.id();
  const effectiveId = $derived(id || (name !== '' ? `${name}-${uid}` : uid));
  const hasVisibleLabel = $derived(typeof label === 'string' && label !== '' && !actionInput);

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
  // The error text has to be reachable FROM the field it describes and announced when it
  // appears. Without both, a screen-reader user submits, hears nothing, and is left on a form
  // that did not move -- the message is on screen and absent from the accessibility tree.
  const errorMessageId = $derived(`${effectiveId}-error`);
  // `onErrorMessage` is `string | null`, so null has to be excluded explicitly: `null !== ''`
  // is true, which would describe the field by an alert element carrying no message.
  const isShowingError = $derived(
    onErrorMessage != null && onErrorMessage !== '' && showError && !actionInput
  );
  const infoMessageId = $derived(`${effectiveId}-info`);
  const isShowingInfo = $derived(infoMessage !== '' && !actionInput);
  // Helper text is part of the field's description, not decoration: a consumer's `infoMessage`
  // ("Enter a percentage between 1 and 100") is exactly the guidance a screen-reader user needs
  // BEFORE they trip an error. Reference both, in reading order, so the field is described by
  // everything visibly attached to it rather than only by its failure.
  const describedBy = $derived(
    [isShowingError ? errorMessageId : null, isShowingInfo ? infoMessageId : null]
      .filter(Boolean)
      .join(' ')
  );
  const hasLeftIcon = $derived(typeof leftIcon === 'function');
  const hasRightIcon = $derived(typeof rightIcon === 'function');

  const charCount = $derived(value?.length ?? 0);
  // Every numeric use below is either tel-only normalisation or the character
  // counter; `null` means "no attribute", not "no ceiling on those paths".
  const effectiveMaxLength = $derived(maxLength ?? 1000);
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
    const rowsCeiling =
      maxRows != null ? maxRows * lineHeight + verticalPadding + border : Number.POSITIVE_INFINITY;
    // --input-max-height is a ceiling too. Reading only maxRows left it at Infinity, so the
    // inline height grew past the CSS clamp and overflowY was set to `hidden` — the box
    // stopped at the right size but its overflow became unreachable instead of scrollable.
    const styleCeiling = parseFloat(styles.maxHeight);
    const maxHeight = Math.min(
      rowsCeiling,
      Number.isFinite(styleCeiling) ? styleCeiling : Number.POSITIVE_INFINITY
    );
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
      if (numberLength > effectiveMaxLength) {
        const existingInput = value;
        if (existingInput.length === effectiveMaxLength) {
          inputElement.value = applyTextPresentation(value);
          return;
        }
        /**
         * choose last max length number of digits if length is bigger than max length passed in props
         */
        currentValue = currentValue.substring(numberLength - effectiveMaxLength);
      }
      currentValue = applyTextPresentation(currentValue);
      inputElement.value = currentValue;
    }
    value = inputElement.value;
    onInput?.(inputElement.value, event);
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

    // Everything below the tel branch is tel-specific digit normalisation, and
    // onPaste was only ever invoked from inside it — so a non-tel field (notably
    // useTextArea) had no way to observe a paste at all. Hand the event over
    // before that branch and return, leaving tel's behaviour byte-identical.
    if (dataType !== 'tel') {
      onPaste?.(event);
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
        if (filteredNumber.length > effectiveMaxLength) {
          /**
           * choose last max length number of digits if length is bigger than max length passed in props
           */
          const finalValue = applyTextPresentation(
            filteredNumber.substring(filteredNumberLength - effectiveMaxLength)
          );
          // Adding reactivity
          value = finalValue;
          onPaste?.(event);
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
    onFocusout?.(event);
    onBlur?.(event);
  }
</script>

<div class="input-container {classes ?? ''}" class:input-error={showError && !actionInput}>
  {#if hasVisibleLabel}
    <label class="label" for={effectiveId}>
      {label}{#if mandatory}<span class="input-mandatory-asterisk" aria-hidden="true">*</span>{/if}
    </label>
  {/if}

  {#snippet fieldElement()}
    {#if useTextArea}
      <textarea
        id={effectiveId}
        {value}
        {placeholder}
        aria-label={hasVisibleLabel ? null : (ariaLabel ?? null)}
        autocomplete={autoComplete}
        inputmode={inputMode}
        {name}
        {role}
        aria-expanded={ariaExpanded}
        aria-autocomplete={ariaAutocomplete}
        aria-controls={ariaControls}
        aria-activedescendant={ariaActivedescendant}
        aria-required={mandatory || null}
        aria-invalid={showError && !actionInput ? 'true' : null}
        aria-describedby={describedBy || null}
        required={mandatory || null}
        onfocus={onFocus}
        onfocusout={_onFocusOut}
        oninput={handleOnInput}
        onpaste={handleOnPaste}
        onclick={onClick}
        onkeydown={onKeyDown}
        data-pw={testId}
        testID={testId}
        class:action-input={actionInput}
        style="--focus-border: {addFocusColor ? 1 : 0}px;"
        style:resize={effectiveResize}
        rows={rows ?? null}
        disabled={disable}
        readonly={readonly || null}
        {spellcheck}
        bind:this={inputElement}
        maxlength={dataType === 'tel' ? null : maxLength}
        minlength={minLength}
      ></textarea>
    {:else}
      <input
        id={effectiveId}
        type={dataType}
        {value}
        {placeholder}
        aria-label={hasVisibleLabel ? null : (ariaLabel ?? null)}
        autocomplete={autoComplete}
        inputmode={inputMode}
        {name}
        {role}
        aria-expanded={ariaExpanded}
        aria-autocomplete={ariaAutocomplete}
        aria-controls={ariaControls}
        aria-activedescendant={ariaActivedescendant}
        aria-required={mandatory || null}
        aria-invalid={showError && !actionInput ? 'true' : null}
        aria-describedby={describedBy || null}
        required={mandatory || null}
        onfocus={onFocus}
        onfocusout={_onFocusOut}
        oninput={handleOnInput}
        onpaste={handleOnPaste}
        onclick={onClick}
        onkeydown={onKeyDown}
        data-pw={testId}
        testID={testId}
        class:action-input={actionInput}
        disabled={disable}
        readonly={readonly || null}
        {spellcheck}
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

  {#if isShowingError}
    <div
      id={errorMessageId}
      role="alert"
      class="error-message"
      data-pw={typeof testId === 'string' && testId.length > 0 ? `${testId}-error-message` : null}
      testID={typeof testId === 'string' && testId.length > 0 ? `${testId}-error-message` : null}
    >
      {onErrorMessage}
    </div>
  {/if}
  {#if isShowingInfo}
    <div
      id={infoMessageId}
      class="info-message"
      data-pw={typeof testId === 'string' && testId.length > 0 ? `${testId}-info-message` : null}
      testID={typeof testId === 'string' && testId.length > 0 ? `${testId}-info-message` : null}
    >
      {infoMessage}
    </div>
  {/if}
  {#if useTextArea && showCount && !actionInput}
    <div class="input-char-count" class:at-limit={charCount >= effectiveMaxLength}>
      {charCount}/{effectiveMaxLength}
    </div>
  {/if}
</div>

<style>
  textarea,
  input {
    box-sizing: var(--input-box-sizing, border-box);
    height: var(--input-height, fit-content);

    /* Both default to the CSS initial value, so a consumer that sets neither is
       byte-identical to before. A textarea that grows with its content needs a
       ceiling before it can scroll, and one used as a paste target needs a floor;
       neither was reachable through the --input-* surface. */
    min-height: var(--input-min-height, auto);
    max-height: var(--input-max-height, none);
    background-color: var(--input-background, white);
    font-size: var(--input-font-size, 16px) !important;
    font-family: var(--input-font-family, inherit);
    border-radius: var(--input-radius, var(--radius, 4px));
    outline: none;
    padding: var(--input-padding, 16px);
    font-weight: var(--input-font-weight, 500);

    /* `normal` is what a textarea/input computes today regardless of any inherited
       value — the UA sheet sets it, and inheritance loses to a UA declaration on the
       element itself. So the default here is byte-identical for existing consumers,
       and this is the only way a consumer can set it at all. */
    line-height: var(--input-line-height, normal);
    width: var(--input-width, fit-content);
    margin: var(--input-margin, 0);
    appearance: none !important;
    -webkit-appearance: none !important; /* For Safari MWeb */
    box-shadow: var(--input-box-shadow, 0px 1px 8px #2f537733);
    border: var(--input-border, 1px solid transparent);
    resize: none;
    visibility: var(--input-visibility, visible);
    text-align: var(--input-text-align, left);
    text-transform: var(--input-text-transform, none);
    color: var(--input-text-color);
  }

  textarea:focus,
  input:focus {
    border: var(--input-focus-border, 1px solid transparent);
  }

  .input-error {
    --input-focus-border: var(
      --input-error-border,
      1px solid var(--input-error-msg-text-color, #c5120a)
    ) !important;
    --input-border: var(
      --input-error-border,
      1px solid var(--input-error-msg-text-color, #c5120a)
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
    color: var(--input-mandatory-color, var(--input-error-msg-text-color, #c5120a));
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
    color: var(--input-left-icon-color, var(--input-icon-color, inherit));
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
    /* #c5120a clears WCAG AA (6.06:1 on white) at this 12px size; the prior #fa1405
       default was only 4.06:1, so the error message itself failed to be legible. */
    color: var(--input-error-msg-text-color, #c5120a);
    margin: var(--input-error-msg-margin);
    padding: var(--input-error-msg-padding);
  }

  .info-message {
    font-weight: var(--input-info-msg-text-weight, 400);
    font-size: var(--input-info-msg-text-size, 12px);
    /* Neutral on purpose -- this used to default to the same red as .error-message,
       so helper text with no error visually read as a failed field (color-alone
       signalling, WCAG 1.4.1). #52525b is the muted-text tone already used for
       ChatToolStatus/ThinkingIndicator elsewhere in this library, at 7.73:1. */
    color: var(--input-info-msg-text-color, #52525b);
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
    color: var(--input-char-count-limit-color, var(--input-error-msg-text-color, #c5120a));
  }

  ::placeholder {
    color: var(--input-placeholder-color);
  }
</style>
