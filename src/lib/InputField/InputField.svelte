<script lang="ts">
  import Input from '../Input/Input.svelte';
  import Button from '../Button/Button.svelte';
  import type { InputFieldProperties } from './properties';

  let {
    label,
    mandatory = false,
    value = $bindable(''),
    placeholder = '',
    hintText,
    errorText,
    disabled = false,
    type = 'text',
    testId,
    classes,
    trailingIcon,
    ontrailingClick,
    oninput
  }: InputFieldProperties = $props();

  const inputId = testId ? `${testId}-input` : '';

  const handleInput = (inputValue: string) => {
    value = inputValue;
    oninput?.(inputValue);
  };
</script>

<div class="input-field {classes ?? ''}" data-pw={testId}>
  {#if label}
    <label class="input-field-label" for={inputId || null}>
      {label}{#if mandatory}<span class="input-field-asterisk">*</span>{/if}
    </label>
  {/if}

  <div class="input-field-row">
    <Input
      value={value ?? ''}
      {placeholder}
      disable={disabled}
      dataType={type}
      name={inputId}
      testId={inputId}
      onInput={handleInput}
      classes="input-field-inner"
    />
    {#if trailingIcon}
      <Button
        testId={testId ? `${testId}-trailing` : ''}
        onclick={ontrailingClick}
        icon={trailingIcon}
        classes="input-field-trailing"
        ariaLabel="trailing action"
      />
    {/if}
  </div>

  {#if hintText}
    <p class="input-field-hint">{hintText}</p>
  {/if}

  {#if errorText}
    <p class="input-field-error" data-pw={testId ? `${testId}-error` : null} role="alert">
      {errorText}
    </p>
  {/if}
</div>

<style>
  .input-field {
    display: flex;
    flex-direction: column;
    gap: var(--input-field-gap, 4px);
    width: var(--input-field-width, fit-content);
  }

  .input-field-label {
    color: var(--input-field-label-color, #637c95);
    font-size: var(--input-field-label-font-size, 12px);
    font-weight: var(--input-field-label-font-weight, 400);
  }

  .input-field-asterisk {
    color: var(--input-field-asterisk-color, #e53e3e);
    margin-inline-start: 2px;
  }

  .input-field-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
  }

  .input-field-hint {
    color: var(--input-field-hint-color, #637c95);
  }

  .input-field-error {
    color: var(--input-field-error-color, #e53e3e);
  }
</style>
